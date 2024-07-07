import { writeFile } from 'fs/promises'
import { join } from 'path'

import { reportError, errors } from '../error'
import { blue, green, rainbow, random, red, trap, yellow } from 'colors'

export const add = async (
  name: string,
  location: string = '.',
  includeTest: boolean = false
) => {
  if (!name) {
    reportError(new Error('No name given'))
  }
  if (!location) {
    reportError(new Error('No location given'))
  }
  if (errors.length) {
    console.error('Errors found')
    errors.forEach(e => console.error(` - ${e.message}`))
    return
  }
  const version = `${Date.now()}`
  const doFile = join(location, 'migrations', `${version}.${name}.do.sql`)
  const undoFile = join(location, 'migrations', `${version}.${name}.undo.sql`)
  const testFile = join(location, 'migrations', `${version}.${name}.test.sql`)

  await writeFile(doFile, '')
  await writeFile(undoFile, '')

  includeTest && (await writeFile(testFile, ''))

  console.log(`
added migration ${green(version)}.${blue(name)} at:

      do: ${green(doFile)}
    undo: ${red(undoFile)}${
      includeTest ? `\n    test: ${yellow(testFile)}` : ''
    }
`)
}
