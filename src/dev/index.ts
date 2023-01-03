import getMigrations from '../migrations'
import { get, start } from '../app'
import program from '../program'

const dev = opts => {
		// watch files by pattern
		// remigrate as needed based on changes
	get('/migrations', async ctx => {
		const pattern = program.opts().migrations || process.env.MIGRATION_PATTERN
		const migrations = await getMigrations(pattern)
		ctx.body = migrations
	})
	
	start(opts.port || process.env.PORT || 5959)
}

export default dev