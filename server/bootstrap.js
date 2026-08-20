/**
 * Bootstrap script: starts an in-memory MongoDB, seeds it, then starts the
 * Express server on port 5000.  Run with:  node server/bootstrap.js
 */
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { seedUsers } from './seed.js'

async function main() {
  console.log('🚀 Starting in-memory MongoDB...')
  const mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  console.log('✅ In-memory MongoDB ready at', uri)

  // Point the default Mongoose connection at the in-memory instance
  process.env.MONGODB_URI = uri
  process.env.PORT = '5000'
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-123'
  process.env.NODE_ENV = 'development'

  // Disconnect any previous connection so seedUsers() creates a fresh one
  await mongoose.disconnect().catch(() => {})

  // Seed the database
  console.log('\n🌱 Seeding database...')
  await seedUsers()
  console.log('✅ Seed complete')

  // Import and start the Express server (reuses the same Mongoose connection)
  await import('./index.js')
  console.log('\n✅ Backend server running on http://localhost:5000')
}

main().catch((err) => {
  console.error('❌ Bootstrap failed:', err)
  process.exit(1)
})
