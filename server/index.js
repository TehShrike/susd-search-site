require(`loud-rejection/register`)

const polkadot = require(`polkadot`)
const middleware = require(`polkadot-middleware`)
const router = require(`polkadot-router`)

const fs = require(`fs`)
const path = require(`path`)

const relative = relativePath => path.join(__dirname, relativePath)

const HEADERS = {
	contentType: `Content-Type`,
	cacheControl: `Cache-Control`,
	lastModified: `Last-Modified`,
}

const CONTENT_TYPES = {
	html: `text/html; charset=utf-8`,
	png: `image/png`,
	svg: `image/svg+xml`,
	jpg: `image/jpeg`,
	txt: `text/plain; charset=utf-8`,
	css: `text/css`,
	js: `application/javascript`,
	xml: `application/xml`,
	json: `application/json`,
	ico: `image/x-icon`,
}

const createCache = require(`./download-cache`)

const getFromCache = createCache({
	imageUrlPrefix: `https://www.shutupandsitdown.com/wp-content/uploads/`,
})

getFromCache(`game`)
getFromCache(`video`)

module.exports = () => middleware(
	polkadot,
	handleErrors,
	cacheControlHeaders,
	noFuckingAroundNow,
	router({
		GET: {
			'/robots.txt': () => process.env.UP_STAGE === `production` ? `` : `User-agent: *\nDisallow: /\n`,
			'/': servePath(relative(`../public/index.html`)),
			'/:dataType(game|video)': async(req, res) => {
				const { dataType } = req.params

				res.setHeader(HEADERS.contentType, CONTENT_TYPES.js)
				const { dataPromise, lastModified } = getFromCache(dataType)

				res.setHeader(HEADERS.lastModified, lastModified.toUTCString())

				return dataPromise
			},
			'/*': figureOutFilePathAndThen(relative(`../public`), servePath),
		},
		HEAD: {
			'/robots.txt': () => ``,
			'/': statusAndHeaderForFile(relative(`../public/index.html`)),
			'/:dataType(game|video)': async(req, res) => {
				const { dataType } = req.params

				res.setHeader(HEADERS.contentType, CONTENT_TYPES.js)
				const { lastModified } = getFromCache(dataType)

				res.setHeader(HEADERS.lastModified, lastModified.toUTCString())
			},
			'/*': figureOutFilePathAndThen(relative(`../public`), statusAndHeaderForFile),
		},
	}, (req, res) => {
		res.statusCode = 405
		res.setHeader(HEADERS.contentType, CONTENT_TYPES.txt)
		return `¯\\_(ツ)_/¯`
	})
)

const handleErrors = next => async(req, res) => {
	try {
		return await next(req, res)
	} catch (err) {
		res.statusCode = 500

		return err.message || err
	}
}

const MAX_AGE_SECONDS = 60 * 60
const cacheControlHeaders = next => async(req, res) => {
	const body = await next(req, res)

	res.setHeader(HEADERS.cacheControl, `public, max-age=` + MAX_AGE_SECONDS)

	return body
}

const noFuckingAroundNow = next => (req, res) => {
	if (req.path.split(`/`).some(chunk => chunk === `..`)) {
		console.log(`Detected some fucking around`)
		res.statusCode = 404
		return
	}

	return next(req, res)
}

const fileExists = path => new Promise((resolve, reject) => {
	fs.access(path, fs.constants.R_OK, err => {
		const readable = !err
		resolve(readable)
	})
})

const statusAndHeaderForFile = path => async(req, res) => {
	if (!await fileExists(path)) {
		res.statusCode = 404
		res.setHeader(HEADERS.contentType, CONTENT_TYPES.txt)
		return ``
	} else {
		const contentType = CONTENT_TYPES[getExtension(path)] || null

		contentType && res.setHeader(HEADERS.contentType, contentType)
	}
}

const servePath = path => async(req, res) => {
	await statusAndHeaderForFile(path)(req, res)

	if (res.statusCode === 404) {
		return `File not found`
	}

	return fs.createReadStream(path)
}

const figureOutFilePathAndThen = (root, fn) => (req, res) => {
	const requestPath = req.path
	const filePath = path.join(root, requestPath)

	return fn(filePath)(req, res)
}

const getExtension = inputPath => {
	const ext = path.extname(inputPath)

	return ext
		? ext.slice(1)
		: null
}
