import { query, withDatabaseClient } from '@remotezygote/database'
import debug from 'debug'

import { getMigrations, Version } from '../migrations'
import program from '../program'
import { install } from '../install'
import { reportError, errors, exitWithErrors } from '../error'

import { Client } from 'pg'
import { NoticeMessage } from 'pg-protocol/dist/messages'

const d = debug('albatross:migrate')

const getVersionData = async (version: number) => ({ version })

export type RunInfo = {
  execution?: any
}

const hasRun = async (version: number) => {
  d('version has run?', version)
  const { rows } = await query(
    'select version from migrations.versions where version = $1',
    [version]
  )
  d(rows, rows.length > 0)
  return rows.length > 0
}

export const runMigration = async (
  migration: Version,
  intendedVersion: number
) => {
  d('migration: ', migration)
  const { version, actions, name } = migration
  // check if already run
  const migrationHasRun = await hasRun(version)
  d('migration has run?', migrationHasRun)
  const runInfo: RunInfo = {}
  let success = true

  if (!migrationHasRun) {
    // check if hashes match
    const { do: doAction, undo: undoAction, test: testAction } = actions
    const text = `SELECT migrations.addVersion($1, $2, $3, $4, $5)`
    const values = [
      version,
      name,
      doAction ? await doAction.getContents() : null,
      undoAction ? await undoAction.getContents() : null,
      testAction ? await testAction.getContents() : null
    ]
    const messages: string[] = []
    await withDatabaseClient(async (client: Client) => {
      const onNotice = (msg: NoticeMessage) =>
        msg.message && messages.push(msg.message)
      const onError = (err: Error) => {
        console.error('something bad has happened!', err.message)
        success = false
      }
      try {
        client.on('notice', onNotice)
        client.on('error', onError)
        runInfo['execution'] = await client.query(text, values)
      } catch (err) {
        console.debug('something bad has happened!', (err as Error).message)
        success = false
      } finally {
        client.off('notice', onNotice)
        client.off('error', onError)
      }
    })
    console.log(
      ` ${success ? '✔' : '✘'} ${version} ${name.replace(/[_-]/g, ' ')}`
    )
    messages.forEach(msg => console.log(msg))
  } else {
    console.log(` - ${version} ${name.replace(/[_-]/g, ' ')}`)
  }

  return {
    ...(await getVersionData(version)),
    ...runInfo,
    success
  }
}

export const migrate = async (
  target: string,
  pattern: string | undefined = program.opts().pattern ||
    process.env.MIGRATION_PATTERN ||
    'migrations/*.sql',
  update: boolean = true
) => {
  if (update) {
    await install()
  }
  console.log('Running migrations...')
  d('pattern: ', pattern)
  const version = parseInt(target || '0', 10)
  d('version target: ', version)
  const migrations = await getMigrations(pattern)
  d('migrations: ', migrations)
  for (let migration in migrations) {
    const thisMigration = migrations[migration]
    if (!errors.length) {
      try {
        d('running migration: ', thisMigration.version, thisMigration.name)
        const output = await runMigration(thisMigration, version)
        if (!output.success) {
          console.log(' ✘ Error!')
          process.exit(1)
        }
        d('output: ', JSON.stringify(output, null, '  '))
      } catch (e) {
        d(e)
        reportError(e as Error)
      }
    } else {
      d(
        'skipped migration due to errors: ',
        thisMigration.version,
        thisMigration.name
      )
    }
  }
  exitWithErrors()
}
