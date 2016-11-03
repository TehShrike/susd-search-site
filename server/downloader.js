const sanitizeFilename = require('sanitize-filename')
const denodeify = require('denodeify')
const download = require('download')
const mkdirp = denodeify(require('mkdirp'))
const pathExists = require('path-exists')
const sharp = require('sharp')
const pMap = require('p-map')
const pFilter = require('p-filter')

const http = require('http')
const fs = require('fs')
const path = require('path')

const defaultSizes = [
	{ identifier: '1', width: 320, height: 240 },
	{ identifier: '2', width: 640, height: 480 },
]

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
			? pFilter(imagesThatShouldExist, ({ outputPath }) => pathExists(outputPath).then(exists => !exists))
			: imagesThatShouldExist)

		const needToDownload = imagesThatNeedToBeCreated.length > 0

		if (needToDownload) {
			console.log('downloading', url)
			const data = await download(url)

			await pMap(imagesThatNeedToBeCreated, ({ width, height, outputPath }) => {
				return resizeStream({ data, width, height, outputPath })
			})
		}

		return outputFilename
	}
}

function resizeStream({ data, width, height, outputPath }) {
	return sharp(data)
		.resize(width, height)
		.crop(sharp.gravity.north)
		.toFile(outputPath)
}
