const level = require('level-mem')
const createCache = require('levelup-cache')
const ms = require('ms')
const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')
const got = require('got')
const pageParser = require('susd-page-parser')
const pMap = require('p-map')

const path = require('path')

const db = level('susd-data', { valueEncoding: 'json' })

const addresses = {
	video: 'https://www.shutupandsitdown.com/videos-page/',
	game: 'https://www.shutupandsitdown.com/games-page/',
}

module.exports = function createDownloadingCache({ imagePaths, imageDownloaders }) {
	const cache = createCache(db, nodeify(downloadDataAndImages), {
		refreshEvery: ms('10 minutes'),
		checkToSeeIfItemsNeedToBeRefreshedEvery: ms('1 minute'),
		ttl: ms('1 week'),
	})

	async function downloadDataAndImages(type) {
		const imageDownloader = imageDownloaders[type]

		console.log('downloading', addresses[type])
		const html = await got(addresses[type]).then(response => response.body)

		const dataStructure = pageParser(html)

		return pMap(dataStructure, async item => {
			const filename = await imageDownloader(item.imageUrl)
			const newItem = Object.assign(item, {
				imageUrls: {
					'1': path.join(imagePaths[type], '1', filename),
					'2': path.join(imagePaths[type], '2', filename),
				}
			})

			return newItem
		}, { concurrency: 5 })
	}

	return denodeify(cache.get)
}
