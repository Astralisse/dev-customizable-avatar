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
import items from './items.json' assert { type: 'json' }

const getItem = async (bucket, path, hexTypes) => {
	const itemType = path.at(0)
	if (itemType in items) {
		const id = hexTypes.includes(itemType) ? parseInt(path.at(2), 16).toString() : path.at(2)
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

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const path = url.pathname.slice(1).split('/')

		switch (request.method) {
			case 'GET':
				return await getItem(env.BUCKET_DEV_AVATAR_COMPONENTS, path, ['addon'])
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'GET, PUT, DELETE'
					}
				})
		}
	},
}
