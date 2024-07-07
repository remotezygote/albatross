import { generate, Config } from 'zapatos/generate'

import program from '../program'
import { dirname, resolve } from 'path'
import { reportError, exitWithErrors } from '../error'

interface ZapOptions {
  pattern?: string
}
type LocalZapCfg = (options: ZapOptions) => Config

const zapCfg: LocalZapCfg = options => {
  return {
    outDir: resolve(
      '.',
      dirname(
        program.opts().pattern ||
          process.env.MIGRATION_PATTERN ||
          'migrations/*.sql'
      )
    ),
    db: { connectionString: process.env.DATABASE_URL }
  }
}

export const types = async (pattern?: string) => {
  try {
    return await generate(zapCfg({ pattern }))
  } catch (e) {
    reportError(e as Error)
  }
  exitWithErrors()
}
