const level = require('level-mem')
const createCache = require('levelup-cache')
const ms = require('ms')
const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')
const download = require('download')
const pageParser = require('susd-page-parser')
const pMap = require('p-map')

const path = require('path')

const db = level('susd-data', { valueEncoding: 'json' })

const addresses = {
	video: 'https://www.shutupandsitdown.com/videos-page/',
	game: 'https://www.shutupandsitdown.com/games-page/',
}

module.exports = function createDownloadingCache({ imageUrlPrefix }) {
	function stripPrefix(url) {
		return url.substring(imageUrlPrefix.length)
	}

	const cache = createCache(db, nodeify(async function downloadData(type) {
		console.log('downloading', addresses[type])
		const html = await download(addresses[type])

		const dataStructure = pageParser(html)

		return dataStructure.map(item => {
			return Object.assign(item, {
				imageUrl: stripPrefix(item.imageUrl)
			})
		})
	}), {
		refreshEvery: ms('10 minutes'),
		checkToSeeIfItemsNeedToBeRefreshedEvery: ms('1 minute'),
		ttl: ms('1 week'),
	})

	return denodeify(cache.get)
}
