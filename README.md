# Input Tracing for LangChain in Cloudflare Workers

An example Cloudflare Worker that demonstrates integrating Pangea's
[Secure Audit Log][] service into a LangChain app to maintain an audit log of
context and prompts being sent to LLMs.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/pangeacyber/langchain-js-cloudflare-input-tracing)

## Prerequisites

- Node.js v22.
- A [Pangea account][Pangea signup] with Secure Audit Log enabled with the
  AI Audit Log Schema Config.
- A Cloudflare account.

## Setup

```shell
git clone https://github.com/pangeacyber/langchain-js-cloudflare-input-tracing.git
cd langchain-js-cloudflare-input-tracing
npm install
cp .dev.vars.example .dev.vars
```

Fill out the following environment variables in `.dev.vars`:

- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with access to Workers AI.
- `PANGEA_AUDIT_TOKEN`: Pangea Secure Audit Log API token.
- `PANGEA_AUDIT_CONFIG_ID`: Pangea Secure Audit Log configuration ID.

Context is fetched from a Vectorize index, which can be created like so:

```shell
npx wrangler vectorize create langchain-js-cloudflare-input-tracing --dimensions=768 --metric=cosine
```

[Adding documents][insert-vectors] to the index is elided from this sample and
is not strictly necessary to run the app.

## Usage

A local version of the Worker can be started with:

```shell
npm start
```

Then prompts can be sent to the worker via an HTTP POST request like so:

```shell
curl -X POST http://localhost:8787 \
  -H 'Content-Type: application/json' \
  -d '"What is MFA?"'
```

This does not modify the input or output so it's transparent to the LLM and end
user.

Audit logs can be viewed at the [Secure Audit Log Viewer][].

[Pangea signup]: https://pangea.cloud/signup
[Secure Audit Log]: https://pangea.cloud/docs/audit/
[Secure Audit Log Viewer]: https://console.pangea.cloud/service/audit/logs
[insert-vectors]: https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/
