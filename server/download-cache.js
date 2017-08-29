const level = require('level-mem')
const createCache = require('levelup-cache')
const ms = require('ms')
const nodeify = require('then-nodeify')
const denodeify = require('then-denodeify')
const download = require('download')
const pageParser = require('susd-page-parser')

const db = level('susd-data', { valueEncoding: 'json' })

const addresses = {
	video: 'https://www.shutupandsitdown.com/videos-page/',
	game: 'https://www.shutupandsitdown.com/games-page/',
}

module.exports = function createDownloadingCache({ imageUrlPrefix }) {
	function stripPrefix(url) {
		return url.substring(imageUrlPrefix.length)
	}

	const lastModified = {}

	const cache = createCache(db, nodeify(async function downloadData(type) {
		console.log('downloading', addresses[type])
		const html = await download(addresses[type])

		const dataStructure = pageParser(html)

		return dataStructure.map(item => {
			return Object.assign(item, {
				imageUrl: item.imageUrl && stripPrefix(item.imageUrl),
			})
		})
	}), {
		refreshEvery: ms('30 minutes'),
		checkToSeeIfItemsNeedToBeRefreshedEvery: ms('1 minute'),
		ttl: ms('1 week'),
		comparison: (previous, current) => !previous || previous.length !== current.length,
	})

	cache.on('change', type => {
		lastModified[type] = new Date()
	})

	const getAsync = denodeify(cache.get)

	return type => {
		const dataPromise = getAsync(type)

		return {
			dataPromise,
			lastModified: lastModified[type] || new Date(),
		}
	}
}
