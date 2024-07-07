import { getMigrations } from '../migrations/index.ts'
import { get, start } from '@remotezygote/koa-api-app'
import program from '../program/index.ts'
import { query } from '@remotezygote/database'
import { ParameterizedContext } from 'koa'

type UIOptions = {
  port?: number | string
}

export const ui = (opts: UIOptions) => {
  // serveAt('./client', '/assets')

  get('/migrations', async (ctx: ParameterizedContext) => {
    const pattern = program.opts().pattern || process.env.MIGRATION_PATTERN
    const migrations = await getMigrations(pattern)
    ctx.body = migrations
  })

  get('/log', async (ctx: ParameterizedContext) => {
    const logEntries = await query('select * from migrations.log')
    ctx.body = logEntries
  })

  start(opts.port || process.env.PORT || 5858)
}
