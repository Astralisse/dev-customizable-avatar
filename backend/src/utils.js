export const make404 = () => {
	return new Response('Not Found', { status: 404 })
}

export const makeJSON = (value) => {
	return new Response(JSON.stringify(value), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

export const getObject = async (bucket, name) => {
	const object = await bucket.get(name)
	if (object === null) {
		return make404()
	}
	const headers = new Headers()
	object.writeHttpMetadata(headers)
	headers.set('etag', object.httpEtag)
	return new Response(object.body, { headers })
}
