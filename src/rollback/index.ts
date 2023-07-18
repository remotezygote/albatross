import { getMigrations } from '../migrations'

export default async (pattern: string) => {
  const all = await getMigrations(pattern)
  console.log(all)
}

// Process
// 1. Get migrations
// 2. Run undo in reverse order until reaching intended migration
