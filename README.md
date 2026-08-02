# predge-imessage

**Predge in your iMessage bubble.** Text a question about Polymarket whale trading to a
Linq number and a card-carrying AI agent answers — it plans the query with OpenAI, **buys
the data from Predge over x402** (pays per query), and replies inside iMessage.

Built for the Agentic Commerce Hackathon — **Linq (iMessage Agent)** track. Reuses the
same Predge x402 data + OpenAI brain as the x402-prava-bridge submission.

## Flow

```
iPhone ──iMessage──▶ Linq number ──message.received webhook──▶ predge-imessage
                                                                a) OpenAI tool-calling: what to buy?
                                                                b) x402 buy from Predge (USDC, per query)
                                                                c) OpenAI: write the reply
                                                                d) send back via Linq  ──iMessage──▶ iPhone
```

## Run

```bash
npm install
cp .env.example .env    # fill LINQ_API_TOKEN + OPENAI_API_KEY

# 1) prove the brain + data pipeline with NO iPhone/Linq needed:
npm run simulate "is wallet 0x8dab6cf42d7e4d1cd6cca897b9e12a8cbe6d69e8 smart money?"

# 2) run the webhook server, expose it over HTTPS (ngrok/Railway), point the Linq
#    webhook at https://<host>/webhook, then text the Linq number from your iPhone:
npm run server
```

For a **0-real-money demo** set `PREDGE_BASE=http://localhost:4021` (local Base Sepolia
Predge). Otherwise it buys from prod on Base mainnet (~$0.005/query, real).

## Linq track fit

The agent is a genuine two-way iMessage agent on Linq's Partner API (`message.received`
webhook in, `/chats/{id}/messages` out, with read receipts + typing indicators). What
makes it more than a chatbot: every reply is **paid for on-chain per query** — the agent
buys the Predge data it sends via x402, so it's real agentic commerce living inside an
iMessage thread.

## Env

`LINQ_API_TOKEN`, `LINQ_API_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` (default
`gpt-4o-mini`), `PREDGE_BASE`, `FLOAT_PRIVATE_KEY`, `PORT`. See `.env.example`.
