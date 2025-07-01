import { BaseTracer, type Run } from 'langchain/callbacks';
import { AuditService, PangeaConfig } from 'pangea-node-sdk';

/**
 * Tracer that creates an event in Pangea's Secure Audit Log when input for an
 * LLM is received.
 */
export class PangeaAuditCallbackHandler extends BaseTracer {
  name = 'pangea_audit_callback_handler';
  awaitHandlers = true;

  private client;

  constructor(
    token: string,
    configId?: string,
    domain = 'aws.us.pangea.cloud'
  ) {
    super();

    this.client = new AuditService(
      token,
      new PangeaConfig({ domain }),
      undefined,
      configId
    );
  }

  protected override persistRun(_run: Run): Promise<void> {
    return Promise.resolve();
  }

  override async onLLMStart(run: Run): Promise<void> {
    if (!run.inputs?.prompts) {
      return;
    }

    await this.client.logBulk([
      {
        trace_id: run.trace_id!,
        type: 'llm/start',
        start_time: new Date(run.start_time!),
        tools: {
          invocation_params: run.extra?.invocation_params,
        },
        input: run.inputs.prompts.join('\n'),
      },
    ]);
  }
}
