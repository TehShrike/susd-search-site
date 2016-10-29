const sanitizeFilename = require('sanitize-filename')
const denodeify = require('denodeify')
const download = require('download')
const mkdirp = require('mkdirp')
const pathExists = require('path-exists')

const http = require('http')
const fs = require('fs')
const path = require('path')

module.exports = function makeDownloader({ outputDirectory, urlPrefix, skipIfExists = true }) {
	const createOutputDirectory = mkdirp(outputDirectory)

	function stripPrefix(url) {
		return url.substring(urlPrefix.length)
	}

	return async function saveFile(url) {
		await createOutputDirectory

		const outputFilename = sanitizeFilename(stripPrefix(url))
		const outputPath = path.join(path.join(outputDirectory, outputFilename))

		const dontNeedToDownload = skipIfExists && await pathExists(outputPath)
		const needToDownload = !dontNeedToDownload

		if (needToDownload) {
			console.log('downloading', url)
			await download(url).pipe(fs.createWriteStream(outputPath))
			// TODO: make a .gz version of the file
		}

		return outputFilename
	}
}
