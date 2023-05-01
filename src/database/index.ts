import type { QueryResult } from 'pg'
import * as pg from 'pg'
import program from '../program'

const { native } = pg
const Pool = (native || pg).Pool

export const connectionString = program.opts().database || process.env.DATABASE_URL
const pool = new Pool({ connectionString })

export const withDatabaseClient = async (func: Function) => {
	try {
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

export const query = pool.query

export const multi = async (text: string) => {
	return await pool.query(text) as QueryResult
}