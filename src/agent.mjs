// The agent loop, shared by the Linq webhook server and the local simulator:
// plan (OpenAI) -> buy the Predge data (x402) -> compose the reply (OpenAI).
import { brainEnabled, planWithTools, compose, MODEL } from "./brain.mjs";
import { fetchWhales, fetchWallet } from "./predge.mjs";

export { brainEnabled, MODEL };

export async function respondTo(text) {
  const plan = await planWithTools(text);
  let data;
  try {
    data = plan.endpoint === "wallet-history" && plan.wallet
      ? await fetchWallet(plan.wallet)
      : await fetchWhales(5);
  } catch (e) {
    return { plan, error: e.message, reply: `⚠️ couldn't fetch Predge data right now (${e.message}).` };
  }
  const reply = await compose(text, data);
  return { plan, data, reply };
}
