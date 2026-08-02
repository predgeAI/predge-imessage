// Local simulator — exercise the full agent (OpenAI plan -> x402 buy -> OpenAI reply)
// WITHOUT Linq or an iPhone. Prints the reply the agent would text back.
//   npm run simulate "is wallet 0x8dab… smart money?"
import { respondTo, brainEnabled, MODEL } from "./agent.mjs";

const text = process.argv.slice(2).join(" ") || "what's the biggest whale trade on Polymarket right now?";
console.log(`\n📱 inbound iMessage: "${text}"`);
console.log(`   brain: ${brainEnabled() ? `OpenAI ${MODEL}` : "regex fallback (set OPENAI_API_KEY)"}\n`);

const { plan, reply, error } = await respondTo(text);
console.log(`🧠 plan: ${plan.endpoint}${plan.wallet ? ` (${plan.wallet})` : ""} — ${plan.reason}`);
if (error) console.log(`⚠️  ${error}`);
console.log(`\n💬 Predge replies:\n${reply}\n`);
