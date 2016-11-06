require('loud-rejection/register')

const path = require('path')

const Koa = require('koa')
const serve = require('koa-static')
const router = require('koa-router')()
const compress = require('koa-compress')
const mount = require('koa-mount')

const tmpDir = require('os-tmpdir')()

const createImageDownloader = require('./image-downloader')
const createCache = require('./download-cache')

const app = new Koa()

const imageDirectories = {
	game: path.join(tmpDir, 'susd-game-img'),
	video: path.join(tmpDir, 'susd-video-img')
}

console.log('downloading images to', tmpDir)
const imageUrlPrefix = 'https://www.shutupandsitdown.com/wp-content/uploads/'
const imageDownloaders = {
	game: createImageDownloader({ outputDirectory: imageDirectories.game, urlPrefix: imageUrlPrefix }),
	video: createImageDownloader({ outputDirectory: imageDirectories.video, urlPrefix: imageUrlPrefix }),
}

const imagePaths = {
	game: 'img/game',
	video: 'img/video',
}

const getFromCache = createCache({ imagePaths, imageDownloaders })

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

router.get('/susd-image/:whatever(.*)')

app.use(compress())

app.use(router.routes())

app.use(mount('/' + imagePaths.game, serve(imageDirectories.game)))
app.use(mount('/' + imagePaths.video, serve(imageDirectories.video)))

app.use(serve('./public/'))

module.exports = app
