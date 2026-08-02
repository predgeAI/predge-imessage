// Predge data access. The iMessage agent BUYS the data per query over x402 (same float
// wallet the bridge uses) — so it's a card/x402-native agent that pays for what it sends.
// Point PREDGE_BASE at local :4021 (Base Sepolia, 0 real money) for demos, or leave it at
// prod (Base mainnet, ~$0.005/query real).
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";

const PREDGE = process.env.PREDGE_BASE || "https://x402-api-production-266e.up.railway.app";

function floatKey() {
  if (process.env.FLOAT_PRIVATE_KEY) return process.env.FLOAT_PRIVATE_KEY;
  return JSON.parse(readFileSync(join(homedir(), ".predge-x402", "buyer.json"), "utf8")).private_key;
}
let _pay;
function payer() {
  if (_pay) return _pay;
  const c = new x402Client();
  c.register("eip155:*", new ExactEvmScheme(privateKeyToAccount(floatKey())));
  return (_pay = wrapFetchWithPayment(fetch, c));
}
async function getPaid(path) {
  const res = await payer()(`${PREDGE}${path}`, { method: "GET" });
  if (!res.ok) throw new Error(`Predge ${path} → HTTP ${res.status}`);
  return res.json();
}

export const fetchWhales = (limit = 5) => getPaid(`/v1/whales/latest?limit=${limit}`);
export const fetchWallet = (addr) => getPaid(`/v1/wallets/${addr.toLowerCase()}/history`);
