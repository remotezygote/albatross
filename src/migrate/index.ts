import { getMigrations, Version } from '../migrations'
import program from '../program'
import { query } from '../database'
import { exit } from 'process'
import debug from 'debug'

const d = debug('albatross:migrate')

const getVersionData = async (version: number) => ({ version })

export type RunInfo = {
  execution?: any
}

const hasRun = async (version: number, schema: string = 'migrations') => {
	d('version has run?', version)
	const { rows } = await query('select version from $1.versions where version = $2', [schema, version])
	d(rows, rows.length > 0)
	return rows.length > 0
}

export const runMigration = async (migration: Version, intendedVersion: number, schema: string = 'migrations') => {
	d('migration: ', migration)
	const { version, actions, name } = migration
	// check if already run
	const migrationHasRun = await hasRun(version, schema)
	d('migration has run?', migrationHasRun)
	const runInfo: RunInfo = {}

	if (!migrationHasRun) {
		// check if hashes match
		const { do: doAction, undo: undoAction, test: testAction } = actions
		const text = 'SELECT $1.addVersion(schema, $1, $2, $3, $4, $5)'
		const values = [version, name, doAction ? (await doAction.getContents()) : null, undoAction ? (await undoAction.getContents()) : null, testAction ? (await testAction.getContents()) : null]

		runInfo['execution'] = await query(text, values)
	}

	return {
		...(await getVersionData(version)),
		...runInfo,
	}
}

export const migrate = async (target: string, pattern: string = program.opts().pattern || process.env.MIGRATION_PATTERN, schema: string = 'migrations') => {
	d('pattern: ', pattern)
  const version = parseInt(target)
	d('version target: ', version)
	const migrations = await getMigrations(pattern)
	d('migrations: ', migrations)
	for (let migration in migrations) {
		try {
      const thisMigration = migrations[migration]
      d('running migration: ', thisMigration.version, thisMigration.name)
			const output = await runMigration(thisMigration, version, schema)
			d('output: ', JSON.stringify(output, null, '  '))
		} catch (e) {
      d(e)
			console.error(e)
      throw e
		}
	}
}