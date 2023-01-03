const path = require('path')
const esbuild = require('esbuild')
const aliasPlugin = require('esbuild-plugin-path-alias')
const { onShutdown } = require('node-graceful-shutdown')

const pino = require('pino')

const logger = pino({
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
		},
	},
})

let albatrossStopper

const buildOptions = {
	platform: 'node',
	entryPoints: {
		albatross: './src/index.ts',
	},
	outdir: 'dist',
	bundle: true,
	sourcemap: true,
	external: [
		'redis-fast-driver',
		'pg',
		'pg-native',
		'bufferutil',
		'bullmq',
	],
	plugins: [
		aliasPlugin({
			'@warder/': path.resolve(__dirname, './lib/'),
		})
	],
	watch: {
		async onRebuild(error, result) {
			if (error) logger.error('Rebuild failed:', error)
			else {
				logger.info('Rebuild succeeded')
				const {errors, warnings} = result
				if (warnings.length) {
					warnings.forEach(logger.warn)
				}
				if (errors.length) {
					errors.forEach(logger.error)
				}
				delete require.cache[require.resolve('./dist/albatross.js')]
				try {
					const { default: albatross } = require('./dist/albatross.js')
					if (albatrossStopper) {
						await albatrossStopper()
					}
					albatrossStopper = await albatross()
				} catch (e) {
					logger.error(e)
				}
			}
		},
	},
}

const watch = async () => {
	const result = await esbuild.build(buildOptions)
	try {
		if (albatrossStopper) {
			await albatrossStopper()
		}
		const { default: albatross } = require('./dist/api.js')
		albatrossStopper = await albatross()
		const { errors, warnings } = result
		if (warnings.length) {
			warnings.forEach(logger.warn)
		}
		if (errors.length) {
			errors.forEach(logger.error)
		}
		logger.info('Watching for code changes...')
	} catch (e) {
		if (albatrossStopper) {
			await albatrossStopper()
		}
		logger.error(e)
	}
}

const shutdown = async () => {
	logger.warn('Shutting down...')
	if (albatrossStopper) {
		await albatrossStopper()
	}
}

process.once('SIGUSR2', shutdown)

onShutdown('watch', shutdown)

watch()