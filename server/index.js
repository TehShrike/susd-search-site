require('loud-rejection/register')

const Koa = require('koa')
const serve = require('koa-static')
const router = require('koa-router')()
const compress = require('koa-compress')
const conditionalGet = require('koa-conditional-get')

const createCache = require('./download-cache')

const app = new Koa()

const getFromCache = createCache({
	imageUrlPrefix: 'https://www.shutupandsitdown.com/wp-content/uploads/',
})

getFromCache('game')
getFromCache('video')

router.get('/:dataType(game|video)', async(context, next) => {
	const { dataType } = context.params

	context.set('Content-Type', 'application/javascript')
	context.set('Cache-Control', 'public, must-revalidate')

	const { dataPromise, lastModified } = getFromCache(dataType)

	context.set('Last-Modified', lastModified.toUTCString())

	if (context.stale) {
		await next()
		context.body = await dataPromise
	}
})

app.use(conditionalGet())

app.use(compress())

app.use(router.routes())

app.use(serve('./public/'))

module.exports = app
