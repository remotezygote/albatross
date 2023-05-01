import program from './program'

import { install } from './install'
import { ui } from './ui'
import { add } from './add'
import { migrate } from './migrate'

program
	.version('1.0.0')
	.description('The in-database migrator for postgresql')
	.option('-d, --database, --db <database_url>', 'database url to connect to')
	.option('-p, --pattern <migration_pattern>', 'where to find migrations')

const init = async () => {
	program
		.command('install')
		.description('install albatross into a database')
		.action(install)

    program
		.command('ui')
		.option('-p, --port <port>', 'what port to listen on')
		.description('start the ui service')
		.action(ui)

	program
		.command('add [name] [location]')
		.description('add a migration')
		.action(add)

	program
		.command('migrate [version]')
		.description('migrate the database')
		.action(migrate)

	program
		.command('rollback <version>')
		.description('migrate the database')
		.action(() => {})

	program.parse(process.argv)
}

init()