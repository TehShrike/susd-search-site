const fs = require(`fs`)
const download = require(`download`)
const pageParser = require(`susd-page-parser`)
const downloadImages = require(`./download-and-resize-images.js`)

const imageUrlPrefix = `https://www.shutupandsitdown.com/wp-content/uploads/`

const addresses = {
	video: `https://www.shutupandsitdown.com/videos-page/`,
	game: `https://www.shutupandsitdown.com/games-page/`,
}

const stripPrefix = url => url.substring(imageUrlPrefix.length)


const downloadData = async type => {
	const html = await download(addresses[type])

	const dataStructure = pageParser(html)

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
	].map(({ imageUrl }) => imageUrl)

	await downloadImages({
		imageUrls,
	})
}

main()

