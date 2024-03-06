import program from './program'

import { install } from './install'
import { ui } from './ui'
import { add } from './add'
import { migrate } from './migrate/index.js'

program
  .version('1.0.0')
  .description('The in-database migrator for postgresql')
  .option('-p, --pattern <migration_pattern>', 'where to find migrations')

const init = async () => {
  try {
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
      .action(version => migrate(version))

    program
      .command('rollback <version>')
      .description('migrate the database')
      .action(() => {})

    program.parse(process.argv)
  } catch (e) {
    console.error(e)
    throw e
  }
}

init()
