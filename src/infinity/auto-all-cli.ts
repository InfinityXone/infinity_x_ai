import dotenv from "dotenv";
dotenv.config();
import { AutoAnalyzer } from "./auto-analyzer.ts";
import { AutoValidator } from "./auto-validator.ts";
import { AutoFixer } from "./auto-fixer.ts";
import { AutoOptimizer } from "./auto-optimizer.ts";
import { AutoEnhancer } from "./auto-enhancer.ts";
import { AutoHealer } from "./auto-healer.ts";
async function run(){
  console.log("\n[Auto-All] Starting autonomous sequence...");
  const analyzer=new AutoAnalyzer();
  const validator=new AutoValidator();
  const fixer=new AutoFixer();
  const optimizer=new AutoOptimizer();
  const enhancer=new AutoEnhancer();
  const healer=new AutoHealer();
  try {
    analyzer.analyzeProject(process.cwd());
    validator.validateProject();
    fixer.autoFixProject();
    optimizer.optimizeProject();
    enhancer.enhanceProject("all");
    healer.checkSystemHealth();
    console.log("\n[Auto-All]  Sequence complete");
  } catch(e){
    console.error("[Auto-All]  Failure:", e.message||e);
    process.exitCode=1;
  }
}
run();
