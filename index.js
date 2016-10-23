const fs = require('fs')

const Koa = require('koa')
const serve = require('koa-static')
const router = require('koa-router')()
const app = new Koa()
const denodeify = require('denodeify')
const pageParser = require('susd-page-parser')

const readFile = denodeify(fs.readFile.bind(fs))

async function fetchOstensiblyCachedDataStructure(path) {
	const gamePage = await readFile(path, { encoding: 'utf8' })
	const dataStructure = pageParser(gamePage)
	return dataStructure
}

function susdDataMiddleware(path) {
	return async function(context, next) {
		const dataPromise = fetchOstensiblyCachedDataStructure(path)
		await next()
		context.body = await dataPromise
	}
}

router.get('/game', susdDataMiddleware('./tmp-game-page.html'))
router.get('/video', susdDataMiddleware('./tmp-video-page.html'))

app.use(router.routes())

app.use(serve('./public/'))

module.exports = app
