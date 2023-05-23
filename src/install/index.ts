import { multi, query } from '../database'
import setupSql from './setup.sql'
import debug from 'debug'

const d = debug('install')

export default async () => {
	try {
    d('Checking if migrations schema exists')
		const { rows } = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1', ['migrations'])
		if (rows.length > 0) {
      d('Exists, exiting install')
			return
		}
    d('Installing migrations schema')
    d(setupSql)
		await multi(setupSql)
	} catch (e) {
    d(e)
		console.error(e)
    throw e
	}
}