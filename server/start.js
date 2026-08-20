import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function start() {
  console.log('🚀 Starting server...');
  
  // Check if we should seed (only on first deploy)
  const shouldSeed = process.env.SEED_DB === 'true';
  
  if (shouldSeed) {
    console.log('🌱 Seeding database...');
    try {
      await execAsync('node seed.js');
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.log('⚠️ Seed skipped or already done:', error.message);
    }
  }
  
  // Start the main server
  console.log('🎯 Starting Express server...');
  await import('./index.js');
}

start().catch(console.error);
