/**
 * Preview bootstrap — used by the Freebuff preview (start-preview.sh).
 *
 * Starts an in-memory MongoDB so the app runs with no external database,
 * seeds demo data on first boot, then starts the Express API on port 5000.
 * In production (Render/Atlas), MONGODB_URI is set and index.js connects as normal.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// The Vite dev server proxies /api to localhost:5000 — keep the backend there.
process.env.PORT = '5000'

const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('school_management')
console.log('🧪 Preview: in-memory MongoDB started')

// Seed demo data only when the database is empty
await mongoose.connect(process.env.MONGODB_URI)
const User = (await import('./models/User.js')).default
const userCount = await User.countDocuments()
if (userCount === 0) {
  console.log('🌱 Preview: seeding demo data...')
  const { seedUsers } = await import('./seed.js')
  await seedUsers()
  console.log('🌱 Preview: seed complete')
} else {
  console.log(`✅ Preview: ${userCount} users already present, skipping seed`)
}
await mongoose.disconnect()

await import('./index.js')
