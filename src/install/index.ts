import { query } from '../database'
import { promises } from 'fs'
import { join } from 'path'
import { migrate } from '../migrate'
import debug from 'debug'

const d = debug('albatross:install')

export const getSelfMigrations = async () => {
  await migrate('0', join(__dirname, 'migrations', '*.sql'), 'albatross')
}

export const install = async () => {
	try {
    d('Checking if migrations schema exists')
		const { rows } = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1', ['migrations'])
		if (rows.length > 0) {
      d('Exists, exiting install')
			return
		}
    d('Installing albatross: ', join(__dirname, 'migrations', '*.sql'))
    await migrate('0', join(__dirname, 'migrations', '*.sql'), 'albatross')
	} catch (e) {
    d(e)
		console.error(e)
    throw e
	}
}

