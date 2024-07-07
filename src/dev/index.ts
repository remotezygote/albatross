import { getMigrations } from '../migrations/index.ts'
import { get, start } from '@remotezygote/koa-api-app'
import program from '../program/index.ts'
import { Context } from 'koa'

type UIOptions = {
  port?: number | string
}

const dev = (opts: UIOptions) => {
  // watch files by pattern
  // remigrate as needed based on changes
  get('/migrations', async (ctx: Context) => {
    const pattern = program.opts().migrations || process.env.MIGRATION_PATTERN
    const migrations = await getMigrations(pattern)
    ctx.body = migrations
  })

  start(opts.port || process.env.PORT || 5959)
}

export default dev
