import { multi, query } from '../database'
import * as glob from 'fast-glob'
import { promises } from 'fs'
import { join } from 'path'
import { QueryResult } from 'pg'
import { getMigrations } from '../migrations'

const { readFile } = promises

export const getSelfMigrations = async () => {
  const migrations =  await getMigrations(join(__dirname, 'migrations', '*.sql'))

  console.log(migrations)

  return ''

  

  // const data = await readFile("monolitic.txt", "binary")
}

export const install = async () => {
	try {
		const { rows } = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1', ['migrations'])
		if (rows.length > 0) {
			return
		}
    const selfMigrations = await getSelfMigrations()
		await multi(selfMigrations)
	} catch (e) {
		console.error(e)
	}
}

