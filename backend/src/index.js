/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import 'jimp'

import * as utils from './utils.js'
import contracts from './contracts.js'
import items from './items.json' assert { type: 'json' }

const getItem = async (bucket, path, hexTypes, loopTypes) => {
	const itemType = path.at(0)
	if (itemType in items) {
		const rawId = hexTypes.includes(itemType) ? utils.convertHex(path.at(2)) : path.at(2)
		const id = loopTypes.includes(itemType) ? rawId % Object.keys(items[itemType]).length : rawId
		if (path.at(1) === 'metadata' && id in items[itemType]) {
			const item = items[itemType][id]
			return JSON.stringify({
				image: `https://0.dev.astralisse.com/${itemType}/image/${id}`,
				name: item.name,
				attributes: Object.entries(item.traits).map((trait) => ({
					trait_type: trait[0],
					value: trait[1],
				})),
			})
		}
		if (path.at(1) === 'image') {
			return { object: await bucket.get(`${itemType}-${id}.png`) }
		}
	}
	return 404
}

const compositeAvatar = async (bucket, baseId, addonIds) => {
	const imgBase = await bucket.get(`base-${baseId}.png`)
	const img = await Jimp.read(await imgBase.arrayBuffer())
	for (const a of addonIds) {
		const imgAddon = await bucket.get(`addon-${a}.png`)
		img.composite(await Jimp.read(await imgAddon.arrayBuffer()), 0, 0)
	}
	return await img.getBufferAsync(Jimp.MIME_PNG)
}

const getAvatar = async (avatarsBucket, componentsBucket, path, requestedAddonIds = null) => {
	const c = contracts()
	const isRequest = requestedAddonIds !== null
	const id = path.at(1)
	let owner
	try {
		owner = await c.base.ownerOf(id)
	} catch {
		return 404
	}

	let addonIds = requestedAddonIds ?? (await (await avatarsBucket.get(`${owner}.json`))?.json()) ?? []
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
		return 404
	}

	if (needsUpdate) {
		const avatar = await compositeAvatar(componentsBucket, id, addonIds)
		const object = await avatarsBucket.put(`${owner}.png`, avatar)
		await avatarsBucket.put(`${owner}.json`, JSON.stringify(addonIds))
		return { object, body: avatar }
	}

	return { object: await avatarsBucket.get(`${owner}.png`) }
}

const createResponse = (value, headers = {}) => {
	if (Number.isInteger(value)) {
		return utils.makeEmpty(value, headers)
	}
	if (typeof value === 'string') {
		return utils.makeJSON(value, headers)
	}
	return utils.makeObject(value.object, value.body ?? null, headers)
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const path = url.pathname.slice(1).split('/')
		const corsHeaders = env.ALLOWED_ORIGINS.includes(request.headers.get('Origin'))
			? { 'Access-Control-Allow-Origin': request.headers.get('Origin') }
			: {}

		let value = 404
		switch (request.method) {
			case 'GET':
				if (path.at(0) === 'avatar') {
					value = await getAvatar(env.BUCKET_DEV_AVATARS, env.BUCKET_DEV_AVATAR_COMPONENTS, path)
				} else {
					value = await getItem(env.BUCKET_DEV_AVATAR_COMPONENTS, path, ['addon'], ['base'])
				}
				return createResponse(value, corsHeaders)
			case 'PUT':
				const body = await request.json()
				if (path.at(0) === 'avatar' && Array.isArray(body)) {
					value = await getAvatar(env.BUCKET_DEV_AVATARS, env.BUCKET_DEV_AVATAR_COMPONENTS, path, body)
				}
				return createResponse(value, corsHeaders)
			case 'OPTIONS':
				return utils.makeEmpty(204, {
					...corsHeaders,
					'Access-Control-Allow-Methods': 'OPTIONS, GET, PUT',
					'Access-Control-Max-Age': '86400',
					'Access-Control-Allow-Headers': 'Content-Type',
				})
			default:
				return utils.makeEmpty(405, {
					Allow: 'OPTIONS, GET, PUT',
				})
		}
	},
}
