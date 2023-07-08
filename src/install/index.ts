import { join } from 'path'
import { migrate } from '../migrate'
import debug from 'debug'

const d = debug('albatross:install')

const selfMigrationsDir = join('.', 'migrations', '*.sql')

export const getSelfMigrations = async () => {
  await migrate('0', selfMigrationsDir, 'albatross')
}

export const install = async () => {
	try {
    d('Installing albatross: ', selfMigrationsDir)
    await migrate('0', selfMigrationsDir, 'albatross')
	} catch (e) {
    d(e)
		console.error(e)
    throw e
	}
}

