import { getMigrations } from '../migrations/index.ts'

export default async (pattern: string) => {
  const all = await getMigrations(pattern)
  console.log(all)
}
