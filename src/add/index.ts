import { writeFile } from 'fs/promises'
import { join } from 'path'

export const add =  async (name: string, location: string = '.', includeTest: boolean = false) => {
	if (!name) {
		throw new Error('No name given')
	}
	if (!location) {
		throw new Error('No location given')
	}
	const version = `${Date.now()}`
	console.log(`add migration ${name} at ${location} (version: ${version})`)
	await writeFile(join(location, 'migrations', `${version}.${name}.do.sql`), '')
	await writeFile(join(location, 'migrations', `${version}.${name}.undo.sql`), '')
  includeTest && await writeFile(join(location, 'migrations', `${version}.${name}.test.sql`), '')
}
