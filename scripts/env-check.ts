import fs from "fs";
import path from "path";
import dotenv from "dotenv";

function mask(value?: string) {
  if (!value) return "MISSING";
  if (value.length <= 6) return "****";
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
}

function findEnvPath(): string | null {
  const candidates = [".env", ".env.local", "frontend/.env", "backend/.env", "src/.env"];
  for (const rel of candidates) {
    const p = path.resolve(process.cwd(), rel);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

console.log("");
console.log("=== Env Diagnostics ===");
const envPath = findEnvPath();
if (envPath) {
  console.log(`Env file detected: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log("No .env file detected in common locations. Using process env only.");
  dotenv.config();
}

const keys = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "PORT"];
const report: Record<string, string> = {};
for (const k of keys) report[k] = mask(process.env[k]);

console.table(report);

function hintAnthropic(val?: string) { if (!val) return "missing"; return val.length >= 20 ? "length-ok" : "too-short"; }
function hintOpenAI(val?: string) { if (!val) return "missing"; return val.startsWith("sk-") ? "looks-like-sk" : "unknown-format"; }
function hintGroq(val?: string) { if (!val) return "missing"; return val.length >= 20 ? "length-ok" : "too-short"; }

console.log("Hints:");
console.log("  ANTHROPIC_API_KEY:", hintAnthropic(process.env.ANTHROPIC_API_KEY));
console.log("  OPENAI_API_KEY   :", hintOpenAI(process.env.OPENAI_API_KEY));
console.log("  GROQ_API_KEY     :", hintGroq(process.env.GROQ_API_KEY));

console.log("");
console.log("Search tips:");
console.log("  - grep Select-String for ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY in src/");
console.log("  - ensure your loop uses dotenv before reading env");
console.log("");
