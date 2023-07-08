import { getMigrations } from '../migrations'
import { get, start } from '@remotezygote/koa-api-app'
import program from '../program'
import { query } from '@remotezygote/database'
import { Context } from 'koa'

type UIOptions = {
  port?: number | string
}

export const ui = (opts: UIOptions) => {
	// serveAt('./client', '/assets')

	get('/migrations', async (ctx: Context) => {
		const pattern = program.opts().pattern || process.env.MIGRATION_PATTERN
		const migrations = await getMigrations(pattern)
		ctx.body = migrations
	})
	
	get('/log', async (ctx: Context) => {
		const logEntries = await query('select * from migrations.log')
		ctx.body = logEntries
	})
	
	start(opts.port || process.env.PORT || 5858)
}