import glob = require('fast-glob')
import { promises } from 'fs'
import { createHash } from 'crypto'

const { readFile } = promises

import parseFilename from './filename'

export type Action = {
  path: string,
  getContents: () => Promise<string>,
  getMd5: () => Promise<string>
}

export type ActionSet = {
  [name: string]: Action
}

export type Version = {
  version: number, 
  actions: ActionSet, 
  name: string
}

export type AllVersions = {
  [version: number]: Version
}

const getFileContents = async (path: string) => await readFile(path).toString()

const getFileMd5 = async (path: string) => createHash('md5').update(await getFileContents(path)).digest('hex').toString()

const defaultVersion = (version: number, name: string) => ({ version, actions: {}, name } as Version)

export const getMigrations = async (pattern: string) => {
	const entries = await glob(pattern)
	const migrations = entries.reduce((all: AllVersions, path) => {
		const parsed = parseFilename(path)
		if (parsed) {
			const { version, name, action } = parsed
			all[version] = all[version] || defaultVersion(version, name)
			all[version].actions[action] = { 
				path,
				getContents: async () => await getFileContents(path),
				getMd5: async () => await getFileMd5(path)
			} as Action
		}
		return all
	}, {})
  const output: Version[] = Object.keys(migrations).sort().map(k => parseInt(k)).map((ver: number) => migrations[ver])
	return output
}