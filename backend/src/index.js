/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import * as utils from './utils.js'
import contracts from './contracts.js'
import items from './items.json' assert { type: 'json' }

const getItem = async (bucket, path, hexTypes) => {
	const itemType = path.at(0)
	if (itemType in items) {
		const id = hexTypes.includes(itemType) ? utils.convertHex(path.at(2)) : path.at(2)
		if (path.at(1) === 'metadata' && id in items[itemType]) {
			const item = items[itemType][id]
			return utils.makeJSON({
				image: `https://0.dev.astralisse.com/${itemType}/image/${id}`,
				name: item.name,
				attributes: Object.entries(item.traits).map((trait) => ({
					trait_type: trait[0],
					value: trait[1],
				})),
			})
		}
		if (path.at(1) === 'image') {
			return await utils.getObject(bucket, `${itemType}-${id}.png`)
		}
	}
	return utils.make404()
}

const getAvatar = async (avatarsBucket, componentsBucket, path, requestedAddonIds = null) => {
	const c = contracts()
	const isRequest = requestedAddonIds !== null
	const id = path.at(1)
	const owner = await c.base.ownerOf(id)

	let addonIds = requestedAddonIds ?? (await (await avatarsBucket.get(`${owner}.json`)).json()) ?? []
	let needsUpdate = isRequest
	if (addonIds.length > 0) {
		const balances = await c.addons.balanceOfBatch(Array(addonIds.length).fill(owner), addonIds)
		if (balances.some((b) => b === 0)) {
			addonIds = addonIds.filter((a, idx) => balances[idx] > 0)
			needsUpdate = true
		}
	}

	if (addonIds.length === 0) {
		if (needsUpdate) {
			await avatarsBucket.delete(`${owner}.png`)
			await avatarsBucket.delete(`${owner}.json`)
		}
		return utils.makeJSON(null)
	}

	// TODO: update the avatar if needsUpdate

	return await utils.getObject(avatarsBucket, `${owner}.png`)
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const path = url.pathname.slice(1).split('/')

		switch (request.method) {
			case 'GET':
				if (path.at(0) === 'avatar') {
					return await getAvatar(env.BUCKET_DEV_AVATARS, env.BUCKET_DEV_AVATAR_COMPONENTS, path)
				}
				return await getItem(env.BUCKET_DEV_AVATAR_COMPONENTS, path, ['addon'])
			case 'PUT':
				const body = await request.json()
				if (path.at(0) === 'avatar' && Array.isArray(body)) {
					return await getAvatar(env.BUCKET_DEV_AVATARS, env.BUCKET_DEV_AVATAR_COMPONENTS, path, body)
				}
				return utils.make404()
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'GET, PUT',
					},
				})
		}
	},
}
