import { AutoAnalyzer } from "../src/infinity/auto-analyzer.ts";
console.log("Starting project analysis...");
const analyzer = new AutoAnalyzer();
await analyzer.analyzeProject(process.cwd());
console.log("Analysis complete");
