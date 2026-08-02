// Predge iMessage agent — Linq webhook server.
// Inbound iMessage (Linq `message.received` webhook) -> plan/buy/answer -> reply via Linq.
import express from "express";
import { respondTo } from "./agent.mjs";

const PORT = process.env.PORT || 8080;
const LINQ_BASE = process.env.LINQ_API_BASE_URL || "https://api.linqapp.com/api/partner/v3";

async function linq(path, body, method = "POST") {
  return fetch(`${LINQ_BASE}${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.LINQ_API_TOKEN}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Linq's exact webhook field names can vary by version — read defensively.
function parseEvent(ev) {
  const type = ev?.type ?? ev?.event;
  const chatId = ev?.chat?.id ?? ev?.chat_id ?? ev?.data?.chat?.id ?? ev?.data?.chat_id;
  const text = ev?.message?.text ?? ev?.data?.message?.text ?? ev?.text ?? "";
  return { type, chatId, text };
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ ok: true, brain: !!process.env.OPENAI_API_KEY, linq: !!process.env.LINQ_API_TOKEN }));

app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // ack immediately; work happens async
  const { type, chatId, text } = parseEvent(req.body);
  if (type !== "message.received" || !chatId || !text) return;
  console.log(`📥 [${chatId}] ${text}`);
  try {
    await Promise.allSettled([linq(`/chats/${chatId}/read`), linq(`/chats/${chatId}/typing`)]);
    const { reply } = await respondTo(text);
    await linq(`/chats/${chatId}/messages`, { message: { parts: [{ type: "text", value: reply }] } });
    console.log(`📤 [${chatId}] ${reply}`);
  } catch (e) {
    console.error("handler error:", e);
  } finally {
    try { await linq(`/chats/${chatId}/typing`, null, "DELETE"); } catch { /* ignore */ }
  }
});

app.listen(PORT, () => console.log(`predge-imessage on :${PORT}  (brain=${!!process.env.OPENAI_API_KEY}, linq=${!!process.env.LINQ_API_TOKEN})`));
