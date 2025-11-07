const fs = require(`fs`)
const { downloadPage, closeBrowser } = require(`./puppeteer-download.js`)
const pageParser = require(`./page-parser`)
const downloadImages = require(`./download-and-resize-images.js`)

const imageUrlPrefix = `https://www.shutupandsitdown.com/wp-content/uploads/`

const addresses = {
	video: `https://www.shutupandsitdown.com/videos-page/`,
	game: `https://www.shutupandsitdown.com/games-page/`,
}

const stripPrefix = url => url.substring(imageUrlPrefix.length)
const [ ,, argument ] = process.argv

const downloadData = async type => {
	console.log(`Downloading ${type} page from ${addresses[type]}`)
	const html = await downloadPage(addresses[type])
	console.log(`Received HTML, length: ${html.length}`)

	const dataStructure = pageParser(html)
	console.log(`Parsed ${dataStructure.length} ${type} items`)

	return dataStructure.map(item => Object.assign(item, {
		imageUrl: item.imageUrl && stripPrefix(item.imageUrl),
	}))
}

const main = async() => {
	const [ videoData, gameData ] = await Promise.all([
		downloadData(`video`),
		downloadData(`game`),
	])

	fs.writeFileSync(`./public/videoData.json`, JSON.stringify(videoData), { encoding: `utf8` })
	fs.writeFileSync(`./public/gameData.json`, JSON.stringify(gameData), { encoding: `utf8` })

	const imageUrls = [
		...videoData,
		...gameData,
	].map(
		({ imageUrl }) => imageUrl
	).filter(
		imageUrl => imageUrl
	)

	await downloadImages({
		imageUrls,
		downloadFilesAlreadyInS3: argument === `all-images`,
	})
}

main().catch(err => {
	console.error(err)
	process.exit(1)
}).finally(async () => {
	await closeBrowser()
})

