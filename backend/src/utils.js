export const makeEmpty = (status = 200, headers = {}) => {
	return new Response(null, { status, headers })
}

export const makeJSON = (str, headers = {}) => {
	return new Response(str, {
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	})
}

export const makeObject = (object, body = null, headers = {}) => {
	const metaHeaders = new Headers()
	object.writeHttpMetadata(metaHeaders)
	metaHeaders.set('etag', object.httpEtag)
	return new Response(body ?? object.body, {
		headers: {
			...metaHeaders,
			...headers,
		},
	})
}
