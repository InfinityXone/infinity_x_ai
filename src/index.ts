import JARVIS from './jarvis/core.js';

async function main() {
  const jarvis = new JARVIS();
  await jarvis.initialize();
  
  console.log('🚀 JARVIS system ready!');
  console.log(jarvis.getStatus());
}

main().catch(console.error);
