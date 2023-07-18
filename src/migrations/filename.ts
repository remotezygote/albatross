import { basename } from 'path'

const filename = (path: string) => {
	const filename = basename(path, '.sql')
	const parts = filename.split('.')
	if (parts.length === 3) {
		const [version, name, action] = parts
		return {
			version: parseInt(version, 10),
			name,
			action,
		}
	}
	console.warn(`could not parse file name: ${path}`)
	return false
}

export default filename