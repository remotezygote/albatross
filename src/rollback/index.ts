import migrations from '../migrations'

export default async pattern => {
	const all = await migrations(pattern)
	console.log(all)
}