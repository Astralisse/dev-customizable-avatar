import items from './items.json' assert { type: 'json' }

const getItemId = (type, id) => {
	const hexTypes = ['addon']
	const loopTypes = ['base']

	if (!(type in items)) return null
	const raw = parseInt(id, hexTypes.includes(type) ? 16 : 10)
	if (Number.isNaN(raw) || raw < 0) return null
	const looped = loopTypes.includes(type) ? raw % Object.keys(items[type]).length : raw
	const itemId = looped.toString()
	if (!(itemId in items[type])) return null
	return itemId
}

export const getItem = async (config, type, id, content) => {
	const itemId = getItemId(type, id)
	if (itemId !== null) {
		if (content === 'image') {
			return { object: await config.buckets.components.get(`${type}-${itemId}.png`) }
		}
		if (content === 'metadata') {
			const item = items[type][itemId]
			return JSON.stringify({
				image: `https://0.dev.astralisse.com/${type}/image/${itemId}.png`,
				name: item.name,
				attributes: Object.entries(item.traits).map((trait) => ({
					trait_type: trait[0],
					value: trait[1],
				})),
			})
		}
	}
	return 404
}

const getAvatarDetails = async (config, id) => {
	const avatarId = parseInt(id)
	if (Number.isNaN(avatarId) || avatarId < 0) return null
	try {
		const owner = await config.c.base.ownerOf(avatarId)
		let data = await (await config.buckets.avatars.get(`${owner}.json`))?.json()
		data ??= { addons: [], role: null }
		return {
			id: avatarId,
			owner,
			data,
		}
	} catch {
		return null
	}
}

const validateAddons = async (config, owner, addons) => {
	if (addons.length === 0) return addons
	const balances = await config.c.addons.balanceOfBatch(Array(addons.length).fill(owner), addons)
	return addons.filter((a, idx) => balances[idx] > 0)
}

const getRole = async (config, owner) => {
	const userIds = {
		'0xc810d010F9FECfa5E330E3C839622298145cceb3': '315927901461676035',
		'0x5aa17e7BA791b61ADe09534029C96684537BA375': '1196365869698265160',
	}
	const roles = ['Dre', 'Mahler', 'Bach']

	if (!(owner in userIds)) return null
	const userId = userIds[owner]
	const fetchParams = {
		headers: {
			Authorization: `Bot ${config.discord.token}`,
			'User-Agent': 'AstralisseTest_1',
		},
	}
	const results = await Promise.all([
		fetch(`https://discord.com/api/v10/guilds/${config.discord.guild}/members/${userId}`, fetchParams),
		fetch(`https://discord.com/api/v10/guilds/${config.discord.guild}`, fetchParams),
	])
	const [member, guild] = await Promise.all(results.map(async (result) => result.json()))
	const guildRoles = guild.roles.reduce((roles, r) => ({ ...roles, [r.id]: r.name }), {})
	const roleNames = member.roles.map((roleId) => guildRoles[roleId])
	for (const role of roles) {
		if (roleNames.includes(role)) return role
	}
	return null
}

const composite = async (img, object) => {
	img.composite(await Jimp.read(await object.arrayBuffer()), 0, 0)
}

const compositeAvatar = async (config, addons, role) => {
	const bucket = config.buckets.components
	const imgBase = await bucket.get('base.png')
	const img = await Jimp.read(await imgBase.arrayBuffer())
	const objects = addons.map((a) => bucket.get(`addon-${a}.png`))
	if (role !== null) objects.push(bucket.get(`role-${role.toLowerCase()}.png`))
	await Promise.all(objects.map(async (object) => composite(img, await object)))
	return await img.getBufferAsync(Jimp.MIME_PNG)
}

const getAvatarMetadata = async (config, details, requestedAddons = null) => {
	let needsUpdate = requestedAddons !== null

	const oldAddons = requestedAddons ?? details.data.addons
	const newAddons = await validateAddons(config, details.owner, oldAddons)
	if (oldAddons.length > newAddons.length) needsUpdate = true
	const oldRole = details.data.role
	const newRole = await getRole(config, details.owner)
	if (oldRole !== newRole) needsUpdate = true

	if (needsUpdate) {
		if (newAddons.length === 0 && newRole === null) {
			await config.buckets.avatars.delete(`${details.owner}.png`)
			await config.buckets.avatars.delete(`${details.owner}.json`)
		} else {
			const avatar = await compositeAvatar(config, newAddons, newRole)
			await config.buckets.avatars.put(`${details.owner}.png`, avatar)
			await config.buckets.avatars.put(
				`${details.owner}.json`,
				JSON.stringify({
					addons: newAddons,
					role: newRole,
				}),
			)
		}
	}

	return JSON.stringify({
		image: `https://0.dev.astralisse.com/avatar/image/${details.id}.png`,
		name: `Character #${details.id}`,
		addons: newAddons,
	})
}

export const getAvatar = async (config, id, content) => {
	const details = await getAvatarDetails(config, id)
	if (details !== null) {
		if (content === 'image') {
			if (details.data.addons.length > 0 || details.data.role !== null) {
				return { object: await config.buckets.avatars.get(`${details.owner}.png`) }
			}
			return { object: await config.buckets.components.get('base.png') }
		}
		if (content === 'metadata') {
			return getAvatarMetadata(config, details)
		}
	}
	return 404
}

export const putAvatar = async (config, id, requestedAddons) => {
	const details = await getAvatarDetails(config, id)
	if (details !== null) {
		return getAvatarMetadata(config, details, requestedAddons)
	}
	return 404
}
