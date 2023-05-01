import getMigrations from '../migrations'
import program from '../program'
import { query } from '../database'
import { exit } from 'process'

const getVersionData = async version => ({ version })

const hasRun = async version => {
	console.log('version has run?', version)
	const { rows } = await query('select version from migrations.versions where version = $1', [version])
	console.log(rows, rows.length > 0)
	return rows.length > 0
}

const contentsOf = async action => action ? (await action.getContents()) : null

const runMigration = async (migration, intendedVersion) => {
	console.log(migration)
	const { version, actions, name } = migration
	// check if already run
	const migrationHasRun = await hasRun(version)
	console.log('migration has run?', migrationHasRun)
	const runInfo = {}

	if (!migrationHasRun) {
		// check if hashes match
		const { do: doAction, undo: undoAction, test: testAction } = actions
		const text = 'SELECT migrations.addVersion($1, $2, $3, $4, $5)'
		const values = [version, name, await contentsOf(doAction), await contentsOf(undoAction), await contentsOf(testAction)]

		runInfo['execution'] = await query(text, values)
	}

	return {
		...(await getVersionData(version)),
		...runInfo,
	}
}

export default async version => {
	const pattern = program.opts().pattern || process.env.MIGRATION_PATTERN
	console.log(pattern)
	const migrations = await getMigrations(pattern)
	console.log(migrations)
	for (let migration in migrations) {
		try {
			const output = await runMigration(migrations[migration], version)
			console.log(JSON.stringify(output, null, '  '))
		} catch (e) {
			console.error(e)
			exit(1)
		}
	}
}