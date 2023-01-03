import Koa from 'koa'
import Router from '@koa/router'
import koaLogger from 'koa-pino-logger'
import mount from 'koa-mount'
import koaServe from 'koa-static'
import logger from '../logger'
import bodyParser from 'koa-bodyparser'

const app = new Koa()
const router = new Router()

router.get('/health', ctx => {
	ctx.status = 200
	ctx.body = 'ok'
})

// router install with helpers
export const get = (...args) => router.get(...args)
export const put = (...args) => router.put(...args)
export const post = (...args) => router.post(...args)
export const patch = (...args) => router.patch(...args)
export const del = (...args) => router.delete(...args)

// static serve optional
export const serve = async (dir, opts) => app.use(koaServe(dir, opts))
export const serveAt = async (dir, path, opts = {}) => {
	const pathApp = new Koa()
	pathApp.use(koaServe(dir, opts))
	const mounted = mount(path, pathApp)
	app.use(mounted)
}

// body parser optional
export const parseBodies = (opts) => app.use(bodyParser(opts))

const healthcheckLogLevel = process.env.HEALTHCHECK_LOG_LEVEL || 'debug'
const getDefaultLogLevel = () => process.env.PINO_LEVEL || process.env.LOG_LEVEL || 'info'
let defaultLogLevel = getDefaultLogLevel()

process.on('SIGUSR1', () => { defaultLogLevel = 'debug' })
process.on('SIGUSR2', () => { defaultLogLevel = getDefaultLogLevel() })

const customLogLevel = res => {
  if(res.log.chindings.split(',"url":"')[1].replace(/\".+/,'') === '/health') {
    return healthcheckLogLevel
  }
  return defaultLogLevel
}

app.use(koaLogger({ logger, customLogLevel }))

export const start = (port = process.env.PORT || 3000) => {
	app
  	.use(router.routes())
  	.use(router.allowedMethods())
		.listen(port)
	logger.info(`Started server on port ${port}`)
}

export default app