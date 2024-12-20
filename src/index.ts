import {
  CloudflareVectorizeStore,
  CloudflareWorkersAI,
  CloudflareWorkersAIEmbeddings,
} from '@langchain/cloudflare';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';

import { PangeaAuditCallbackHandler } from './tracers/audit';

const prompt = ChatPromptTemplate.fromMessages([
  HumanMessagePromptTemplate.fromTemplate(`You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: {input}
Context: {context}
Answer:`),
]);

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    if (!env.CLOUDFLARE_ACCOUNT_ID) {
      console.warn(
        'Missing `CLOUDFLARE_ACCOUNT_ID` environment variable. LLM call will not work.'
      );
    }

    if (!env.CLOUDFLARE_API_TOKEN) {
      console.warn(
        'Missing `CLOUDFLARE_API_TOKEN` environment variable. LLM call will not work.'
      );
    }

    let input: string | null = null;
    try {
      input = await request.json();
    } catch (_) {
      return Response.json(
        {
          detail: 'Invalid or malformed JSON input.',
        },
        { status: 400 }
      );
    }

    if (typeof input !== 'string') {
      return Response.json(
        {
          detail: 'Input must be a string.',
        },
        { status: 400 }
      );
    }

    const embeddingsModel = new CloudflareWorkersAIEmbeddings({
      binding: env.AI,
    });
    const vectorStore = new CloudflareVectorizeStore(embeddingsModel, {
      index: env.VECTORIZE,
    });
    const retriever = vectorStore.asRetriever();

    const auditCallback = new PangeaAuditCallbackHandler(
      env.PANGEA_AUDIT_TOKEN,
      env.PANGEA_AUDIT_CONFIG_ID,
      env.PANGEA_DOMAIN
    );
    const llm = new CloudflareWorkersAI({
      model: '@cf/meta/llama-2-7b-chat-int8',
      cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
      cloudflareApiToken: env.CLOUDFLARE_API_TOKEN,
    });
    const chain = await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
    });

    try {
      return new Response(
        await chain.invoke(
          { input, context: await retriever.invoke(input) },
          { callbacks: [auditCallback] }
        )
      );
    } catch (_) {
      return Response.json(
        { detail: 'Service is unavailable.' },
        { status: 503 }
      );
    }
  },
} satisfies ExportedHandler<Env>;
