import * as zg from 'zapatos/generate'
import program from '../program'
import { dirname, resolve } from 'path'

type LocalZapCfg = (pattern?: string) => zg.Config

const zapCfg: LocalZapCfg = (
  pattern: string | undefined = program.opts().pattern ||
    process.env.MIGRATION_PATTERN ||
    'migrations/*.sql'
) => ({
  outDir: resolve('.', dirname(pattern)),
  db: { connectionString: process.env.DATABASE_URL }
})

export const generateTypes = async (pattern?: string) => {
  return await zg.generate(zapCfg(pattern))
}
