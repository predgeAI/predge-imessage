// OpenAI brain for the iMessage agent. Two jobs: (1) planWithTools — read the user's
// iMessage and decide, via OpenAI function/tool calling, which paid Predge endpoint to
// buy; (2) compose — write a short, iMessage-friendly reply over the bought data.
// Falls back to a regex router + template when OPENAI_API_KEY is unset.
import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
let _c;
const client = () => (process.env.OPENAI_API_KEY ? (_c ??= new OpenAI()) : null);
export const brainEnabled = () => !!client();

const TOOLS = [
  { type: "function", function: {
    name: "buy_whales_latest",
    description: "Buy the newest large whale trades across Polymarket. Use for general 'what's happening / biggest bets' questions with NO specific wallet.",
    parameters: { type: "object", additionalProperties: false,
      properties: { reason: { type: "string" } }, required: ["reason"] } } },
  { type: "function", function: {
    name: "buy_wallet_history",
    description: "Buy one specific wallet's track record. Use when the user names a 0x wallet.",
    parameters: { type: "object", additionalProperties: false,
      properties: { wallet: { type: "string" }, reason: { type: "string" } }, required: ["wallet", "reason"] } } },
];

export async function planWithTools(text) {
  const c = client();
  if (!c) { // regex fallback
    const m = text.match(/0x[0-9a-fA-F]{40}/);
    return m ? { endpoint: "wallet-history", wallet: m[0], reason: "regex: wallet named" }
             : { endpoint: "whales-latest", wallet: null, reason: "regex: no wallet" };
  }
  const r = await c.chat.completions.create({
    model: MODEL, temperature: 0, tools: TOOLS, tool_choice: "required",
    messages: [
      { role: "system", content: "You are the buying planner for a Predge iMessage agent that sells Polymarket whale-trading intelligence. Call exactly one tool to buy the data that answers the user." },
      { role: "user", content: text },
    ],
  });
  const call = r.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return { endpoint: "whales-latest", wallet: null, reason: "default" };
  const a = JSON.parse(call.function.arguments || "{}");
  return { endpoint: call.function.name === "buy_wallet_history" ? "wallet-history" : "whales-latest",
    wallet: a.wallet ?? null, reason: a.reason ?? call.function.name };
}

export async function compose(text, data) {
  const c = client();
  if (!c) return templateReply(data);
  const r = await c.chat.completions.create({
    model: MODEL, temperature: 0.3,
    messages: [
      { role: "system", content: "You are Predge, replying inside an iMessage bubble. Answer the user's question using ONLY the provided Polymarket data. Keep it to 2-3 short lines, texting tone, one emoji max. If the data has outcome_verified, note the win rate is verified and PnL is modelled." },
      { role: "user", content: `User: ${text}\nData (JSON): ${JSON.stringify(data).slice(0, 2000)}` },
    ],
  });
  return r.choices[0].message.content.trim();
}

function templateReply(data) {
  const t = (data?.trades ?? [])[0];
  if (t) return `🐋 newest whale: ${t.wallet?.slice(0, 8)}… (score ${t.wallet_score}) bet $${t.size_usd} ${t.side} on "${t.market_title}".`;
  const s = data?.summary;
  if (s) return `over ${s.window ?? "the window"}: win rate ${Math.round((s.win_rate ?? 0) * 100)}% across ${s.decided_trades ?? 0} decided trades.`;
  return "no Predge data in the window.";
}
