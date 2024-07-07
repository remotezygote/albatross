import { join } from 'path'
import { Version, getMigrations } from '../migrations/index.ts'
import debug from 'debug'
import { query } from '@remotezygote/database'

const d = debug('albatross:install')

const selfMigrationsDir = join(
  __dirname,
  '..',
  'src',
  'install',
  'migrations',
  '*.sql'
)

const hasRun = async (version: number) => {
  d('version has run?', version)
  const { rows } = await query(
    'SELECT version FROM migrations.albatross WHERE version = $1',
    [version]
  )
  d(rows, rows.length > 0)
  return rows.length > 0
}

const getVersion = async () => {
  const { rows: lastVersionRows } = await query(
    'SELECT version FROM migrations.albatross ORDER BY version DESC LIMIT 1'
  )
  return lastVersionRows[0]?.version || 0
}

const existsQuery =
  'SELECT exists(SELECT FROM information_schema.tables WHERE table_schema = $1) as schema_exists, exists(SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2) as table_exists'

const installBase = async () => {
  const { rows } = await query(existsQuery, ['migrations', 'albatross'])
  const { schema_exists, table_exists } = rows[0]

  const notInstalled = !schema_exists || !table_exists

  if (notInstalled) {
    console.log('Installing albatross...')
  }

  if (!schema_exists) {
    await query('CREATE SCHEMA migrations')
    console.log(' ✔ Created schema')
  } else {
    console.log(' - Schema exists')
  }

  if (!table_exists) {
    await query('CREATE TABLE migrations.albatross (version bigint)')
    console.log(' ✔ Created table')
    if (schema_exists) {
      await query('INSERT INTO migrations.albatross (version) VALUES ($1)', [
        '1111111111111'
      ])
      console.log(' ✔ Marked already-run versions as run')
    }
  } else {
    console.log(' - Table exists')
  }

  if (notInstalled) {
    console.log(' ✔ Done!')
  }
}

const runMigration = async (migration: Version) => {
  try {
    const { name, actions, version } = migration
    d('running install migration: ', version, name)
    const { do: doAction } = actions
    const doQuery = await doAction.getContents()
    await query(doQuery)
    await query('INSERT INTO migrations.albatross (version) VALUES ($1)', [
      version
    ])
    d('  done: ', version, name)
  } catch (e) {
    d(e)
    console.error(e)
    throw e
  }
}

export const install = async () => {
  try {
    await installBase()

    const migrations = await getMigrations(selfMigrationsDir)
    d('migrations: ', migrations)

    console.log('Updating albatross...')
    for (let migration in migrations) {
      const thisMigration = migrations[migration]
      const { version, name } = thisMigration
      if (await hasRun(version)) {
        console.log(` - ${version} ${name.replace(/[_-]/g, ' ')}`)
      } else {
        await runMigration(migrations[migration])
        console.log(` ✔ ${version} ${name.replace(/[_-]/g, ' ')}`)
      }
    }
    console.log(' ✔ Done!')

    d('Installed albatross: ', await getVersion())
  } catch (e) {
    d(e)
    console.error(e)
    throw e
  }
}
