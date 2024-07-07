import program from './program'

import { install } from './install'
import { ui } from './ui'
import { add } from './add'
import { migrate } from './migrate/index.js'
import { types } from './types'

const init = async () => {
  try {
    program
      .version('1.0.0')
      .description('The in-database migrator for postgresql')
      .option('-p, --pattern <migration_pattern>', 'where to find migrations')

    program
      .command('install')
      .description('install albatross into a database')
      .action(install)

    program
      .command('ui')
      .option('--port <port>', 'what port to listen on')
      .description('start the ui service')
      .action(ui)

    program
      .command('add [name] [location]')
      .description('add a migration')
      .action(add)

    program
      .command('migrate [version]')
      .description('migrate the database')
      .action(version => migrate(version))

    program
      .command('types')
      .description('generate types from the database schema')
      .action(types)

    program
      .command('rollback <version>')
      .description('roll back the database')
      .action(() => {})

    // program.exitOverride()

    program.parse(process.argv)
  } catch (e) {
    console.error('something bad has happened!', (e as Error).message)
    console.error(e)
    throw e
  }
}

try {
  init()
} catch (e) {
  console.error(e)
  process.exit(1)
}
