require('loud-rejection/register')

const fs = require('fs')
const path = require('path')

const Koa = require('koa')
const serve = require('koa-static')
const router = require('koa-router')()
const compress = require('koa-compress')
const mount = require('koa-mount')

const denodeify = require('denodeify')
const pageParser = require('susd-page-parser')
const osTmpdir = require('os-tmpdir')
const pMap = require('p-map')

const createDownloader = require('./downloader')

const app = new Koa()

const urlPrefix = 'https://www.shutupandsitdown.com/wp-content/uploads/'
const tmpDir = osTmpdir()

console.log('downloading images to', tmpDir)

const imageDirectories = {
	game: path.join(tmpDir, 'susd-game-img'),
	video: path.join(tmpDir, 'susd-video-img'),
}

const imagePaths = {
	game: 'img/game',
	video: 'img/video',
}

const readFile = denodeify(fs.readFile.bind(fs))

const filesOnDisk = {
	game: './tmp-game-page.html',
	video: './tmp-video-page.html',
}

const data = {
	game: downloadDataAndImages('game'),
	video: downloadDataAndImages('video'),
}

async function downloadDataAndImages(type) {
	const downloader = createDownloader({ outputDirectory: imageDirectories[type], urlPrefix })
	const htmlFileOnDisk = filesOnDisk[type]
	const html = await readFile(htmlFileOnDisk, { encoding: 'utf8' })
	const dataStructure = pageParser(html)

	return pMap(dataStructure, async item => {
		const filename = await downloader(item.imageUrl)
		const newItem = Object.assign(item, {
			imageUrls: {
				'1': path.join(imagePaths[type], '1', filename),
				'2': path.join(imagePaths[type], '2', filename),
			}
		})

		return newItem
	}, { concurrency: 5 })
}

async function fetchCachedDataStructure(type) {
	return data[type]
}

function susdDataMiddleware(dataType) {
	return async function(context, next) {
		context.set('Content-Type', 'application/javascript')
		const dataPromise = fetchCachedDataStructure(dataType)
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
