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
import * as actions from './actions.js'
import contracts from './contracts.js'

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
		const config = {
			c: contracts(),
			buckets: {
				avatars: env.BUCKET_DEV_AVATARS,
				components: env.BUCKET_DEV_AVATAR_COMPONENTS,
			},
			discord: {
				token: env.DISCORD_TOKEN,
				app: env.APP_ID,
				guild: env.GUILD_ID,
			},
		}

		let value = 404
		switch (request.method) {
			case 'GET':
				if (path.at(0) === 'avatar') {
					value = await actions.getAvatar(config, path.at(2), path.at(1))
				} else {
					value = await actions.getItem(config, path.at(0), path.at(2), path.at(1))
				}
				return createResponse(value, corsHeaders)
			case 'PUT':
				const body = await request.json()
				if (path.at(0) === 'avatar' && Array.isArray(body)) {
					value = await actions.putAvatar(config, path.at(1), body)
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
