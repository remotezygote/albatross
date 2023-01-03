import getMigrations from '../migrations'
import { get, serveAt, start } from '../app'
import program from '../program'
import { query } from '../database'

export default opts => {
	serveAt('./client', '/assets')

	get('/migrations', async ctx => {
		const pattern = program.opts().pattern || process.env.MIGRATION_PATTERN
		const migrations = await getMigrations(pattern)
		ctx.body = JSON.stringify(migrations, null, '  ')
	})
	
	get('/log', async ctx => {
		const logEntries = await query('select * from migrations.log')
		console.log(logEntries)
		ctx.body = logEntries
	})
	
	start(opts.port || process.env.PORT || 5858)
}