import program from '../program/index.ts'
import { dirname, resolve } from 'path'
import { reportError, exitWithErrors } from '../error/index.ts'

import kanel from 'kanel'
import type { Config } from 'kanel'

const { processDatabase } = kanel

const outputDir = () => {
  return resolve(
    '.',
    dirname(
      program.opts().pattern ||
        process.env.MIGRATION_PATTERN ||
        'migrations/*.sql'
    )
  )
}
const config: Config = {
  connection: {
    connectionString:
      program.opts().connectionString || process.env.DATABASE_URL
  },
  outputPath: program.opts().outDir || process.env.OUTPUT_DIR || outputDir()
}

export const types = async (pattern?: string) => {
  try {
    await processDatabase(config)
  } catch (e) {
    reportError(e as Error)
  }
  exitWithErrors()
}
