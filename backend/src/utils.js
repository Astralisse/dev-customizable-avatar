export const make404 = () => {
	return new Response('Not Found', { status: 404 })
}

export const makeJSON = (value) => {
	return new Response(JSON.stringify(value), {
		headers: {
			'Content-Type': 'application/json',
		},
	})
}

export const makeObject = (object, body = null) => {
	const headers = new Headers()
	object.writeHttpMetadata(headers)
	headers.set('etag', object.httpEtag)
	return new Response(body ?? object.body, { headers })
}

export const getObject = async (bucket, name) => {
	const object = await bucket.get(name)
	if (object === null) {
		return make404()
	}
	return makeObject(object)
}

export const convertHex = (hex) => {
	return parseInt(hex, 16).toString()
}
