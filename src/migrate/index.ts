import getMigrations from '../migrations'
import program from '../program'
import { query } from '../database'
import { exit } from 'process'
import debug from 'debug'

const d = debug('albatross:migrate')

const getVersionData = async version => ({ version })

const hasRun = async version => {
	d('version has run?', version)
	const { rows } = await query('select version from migrations.versions where version = $1', [version])
	d('has run?', rows.length > 0)
	return rows.length > 0
}

const runMigration = async (migration, intendedVersion) => {
	d(migration)
	const { version, actions, name } = migration
	// check if already run
	const migrationHasRun = await hasRun(version)
	d('migration has run?', migrationHasRun)
	const runInfo = {}

	if (!migrationHasRun) {
		// check if hashes match
		const { do: doAction, undo: undoAction, test: testAction } = actions
		const text = 'SELECT migrations.addVersion($1, $2, $3, $4, $5)'
		const values = [version, name, doAction ? (await doAction.getContents()) : null, undoAction ? (await undoAction.getContents()) : null, testAction ? (await testAction.getContents()) : null]

		runInfo['execution'] = await query(text, values)
	}

	return {
		...(await getVersionData(version)),
		...runInfo,
	}
}

export default async version => {
	const pattern = program.opts().pattern || process.env.MIGRATION_PATTERN
	d('pattern: ', pattern)
	const migrations = await getMigrations(pattern)
	d('migrations: ', migrations)
	for (let migration in migrations) {
		try {
      d('running migration: ', migrations[migration].version, migrations[migration].name)
			await runMigration(migrations[migration], version)
		} catch (e) {
      d(e)
			console.error(e)
      throw e
		}
	}
}