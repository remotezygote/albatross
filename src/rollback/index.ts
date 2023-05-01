import { getMigrations } from '../migrations'

export default async (pattern: string) => {
	const all = await getMigrations(pattern)
	console.log(all)
}