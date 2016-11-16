const sanitizeFilename = require('sanitize-filename')
const denodeify = require('then-denodeify')
const download = require('download')
const mkdirp = denodeify(require('mkdirp'))
const pMap = require('p-map')
const pFilter = require('p-filter')
const Jimp = require('jimp')

const http = require('http')
const stat = denodeify(require('fs').stat)
const path = require('path')

const defaultSizes = [
	{ identifier: '1', width: 320, height: 240 },
	{ identifier: '2', width: 640, height: 480 },
]

const cropNorth = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP

module.exports = function makeDownloader({ outputDirectory, urlPrefix, skipIfExists = true, sizes = defaultSizes }) {
	const sizesPromise = pMap(sizes, async ({ identifier, width, height }) => {
		const directory = path.join(outputDirectory, identifier)
		await mkdirp(directory)
		return {
			directory,
			identifier,
			width,
			height,
		}
	})


	function stripPrefix(url) {
		return url.substring(urlPrefix.length)
	}

	return async function saveFile(url) {
		const outputFilename = sanitizeFilename(stripPrefix(url))

		const sizes = await sizesPromise
		const imagesThatShouldExist = sizes.map(({ directory, width, height }) => {
			return {
				outputPath: path.join(path.join(directory, outputFilename)),
				width,
				height,
			}
		})

		const imagesThatNeedToBeCreated = await (skipIfExists
			? pFilter(imagesThatShouldExist, ({ outputPath }) => nonzeroFileExists(outputPath).then(exists => !exists))
			: imagesThatShouldExist)

		const needToDownload = imagesThatNeedToBeCreated.length > 0

		if (needToDownload) {

			// const data = await download(url)

			download(url).then(async data => {
				console.log('downloaded', url)
				await pMap(imagesThatNeedToBeCreated, ({ width, height, outputPath }) => {
					return resize({ data, width, height, outputPath })
				})
			})
		}

		return outputFilename
	}
}

function resize({ data, width, height, outputPath }) {
	return Jimp.read(data).then(image => {
		return denodeify(image.cover(width, height, cropNorth).write(outputPath))
	})
}

function nonzeroFileExists(path) {
	return stat(path).then(stats => {
		return !!stats.size
	}).catch(err => {
		return false
	})
}
