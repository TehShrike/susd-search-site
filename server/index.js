require('loud-rejection/register')

const path = require('path')

const Koa = require('koa')
const serve = require('koa-static')
const router = require('koa-router')()
const compress = require('koa-compress')
const mount = require('koa-mount')

const tmpDir = require('os-tmpdir')()

const createCache = require('./download-cache')

const app = new Koa()

const getFromCache = createCache({
	imageUrlPrefix: 'https://www.shutupandsitdown.com/wp-content/uploads/'
})

getFromCache('game')
getFromCache('video')

function susdDataMiddleware(dataType) {
	return async function(context, next) {
		context.set('Content-Type', 'application/javascript')
		const dataPromise = getFromCache(dataType)
		await next()
		context.body = await dataPromise
	}
}

router.get('/game', susdDataMiddleware('game'))
router.get('/video', susdDataMiddleware('video'))

app.use(compress())

app.use(router.routes())

app.use(serve('./public/'))

module.exports = app
