import { native } from 'pg'
import program from '../program'
import debug from 'debug'

const { Pool } = native

const d = debug('albatross:database')

let openPool
const getPool = () => {
	if (!openPool) {		
    d('connecting: ', program.opts().database || process.env.DATABASE_URL)
    openPool = new Pool({ connectionString: program.opts().database || process.env.DATABASE_URL })
	}
	return openPool
}

export const withDatabaseClient = async (func) => {
	try {
		const pool = getPool()
		const client = await pool.connect()
		try {
			return await func(client)
		} finally {
			client.release()
		}
	} catch(e) {
		console.error(e)
	}
}

export const query = (text, params = [], callback = undefined) => {
	const pool = getPool()
	return pool.query(text, params, callback)
}

export const multi = (text) => {
	const pool = getPool()
	return pool.query(text)
}