import { multi, query } from '../database'
import setupSql from './setup.sql'

export default async () => {
	try {
		const { rows } = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1', ['migrations'])
		if (rows.length > 0) {
			return
		}
		await multi(setupSql)
	} catch (e) {
		console.error(e)
	}
}