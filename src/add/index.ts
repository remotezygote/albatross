import { writeFile } from 'fs/promises'
import { join } from 'path'

// import program from '../program'
// import { query } from '../database'

// const getVersionData = async version => ({ version })

// const hasRun = async version => false

// const runMigration = async (migration, intendedVersion) => {
// 	console.log(migration)
// 	const { version, actions, name } = migration
// 	// check if already run
// 	const migrationHasRun = await hasRun(version)
// 	const runInfo = {}
	
// 	if (!migrationHasRun) {
// 		// check if hashes match
// 		const { do: doAction, undo: undoAction, test: testAction } = actions
// 		const text = 'SELECT migrations.addVersion($1, $2, $3, $4, $5)'
// 		const values = [version, name, doAction ? (await doAction.getContents()) : null, undoAction ? (await undoAction.getContents()) : null, testAction ? (await testAction.getContents()) : null]
		
// 		runInfo.execution = await query(text, values)
// 	}
	
// 	return {
// 		...(await getVersionData(version)),
// 		...runInfo,
// 	}
// }

export const add =  async (name: string, location: string, includeTest: boolean = false) => {
	// const pattern = program.opts().migrations || process.env.MIGRATION_PATTERN
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

// SELECT migrations.addVersion(2, 'init', 'test; check one; check two; select 1;', null, null);