import glob from 'fast-glob'
import { promises } from 'fs'
import { createHash } from 'crypto'

const { readFile } = promises

import parseFilename from './filename'

const getFileContents = async path => await readFile(path)

const getFileMd5 = async path => createHash('md5').update(await getFileContents(path)).digest('hex').toString()

const getMigrations = async pattern => {
	const entries = await glob(pattern)
	const migrations = entries.reduce((all, path) => {
		const parsed = parseFilename(path)
		if (parsed) {
			const { version, name, action } = parsed
			all[version] = all[version] || { version, actions: {}, name }
			all[version].actions[action] = { 
				path,
				getContents: async () => await getFileContents(path),
				getMd5: async () => await getFileMd5(path)
			}
		}
		return all
	}, {})
	return Object.keys(migrations).sort().map(ver => migrations[ver])
}

export default getMigrations