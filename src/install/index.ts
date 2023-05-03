import { query } from '../database'
import { promises } from 'fs'
import { join } from 'path'
import { migrate } from '../migrate'

export const getSelfMigrations = async () => {
  await migrate('0', join(__dirname, 'migrations', '*.sql'), 'albatross')
}

export const install = async () => {
	try {
		const { rows } = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1', ['migrations'])
		if (rows.length > 0) {
			return
		}
    await migrate('0', join(__dirname, 'migrations', '*.sql'), 'albatross')
	} catch (e) {
		console.error(e)
	}
}

