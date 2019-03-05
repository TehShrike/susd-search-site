const pMap = require(`p-map`)
const pify = require(`pify`)

const download = require(`download`)
const Jimp = require(`jimp`)
const sanitizeFilename = require(`sanitize-filename`)
const S3 = require(`aws-sdk/clients/s3`)

const stat = pify(require(`fs`).stat)
const path = require(`path`)
const resolve = require(`url`).resolve

const urlPrefix = `https://www.shutupandsitdown.com/wp-content/uploads/`

const getImageDimensions = pixelRatio => ({
	width: 320 * pixelRatio,
	height: 240 * pixelRatio,
})

const targetPixelRatios = [
	1,
	2,
	3,
]

const cropNorth = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP

const nonzeroFileExists = path => stat(path).then(stats => !!stats.size).catch(err => false)
const outputRoot = `public/images`

const getAllImagesInBucket = async() => {
	const s3 = new S3({ apiVersion: `2006-03-01`, region: `us-east-1` })

	let NextContinuationToken = undefined
	let results = []

	do {
		const response = await s3.listObjectsV2({
			Bucket: `susdsearch.com`,
			ContinuationToken: NextContinuationToken,
			Prefix: `images/`,
		}).promise()

		NextContinuationToken = response.NextContinuationToken
		results = results.concat(response.Contents)
	} while (NextContinuationToken)

	return results.map(({ Key }) => Key)
}

function resizeAndWriteToDisk({ data, width, height, outputPath }) {
	return Jimp.read(data).then(image => {
		const jimpResizedImage = image.cover(width, height, cropNorth)
			.quality(90)

		const writeImage = pify(jimpResizedImage.write.bind(jimpResizedImage))

		return writeImage(outputPath)
	})
}

const main = async({ imageUrls, downloadFilesAlreadyInS3 = false }) => {
	console.log(
		downloadFilesAlreadyInS3
			? `Downloading files even if they're in S3 already`
			: `Only downloading files that aren't in S3`
	)

	const filesThatShouldntBeCreated = downloadFilesAlreadyInS3
		? new Set()
		: new Set(await getAllImagesInBucket())

	return pMap(
		imageUrls,
		async imageUrl => {
			const filename = sanitizeFilename(imageUrl)
			const downloadOnce = memoify(() => {
				const url = resolve(urlPrefix, imageUrl)
				console.log(`downloading`, url)
				return download(url)
			})

			await pMap(
				targetPixelRatios,
				async pixelRatio => {
					const s3Key = path.join(`images`, pixelRatio.toString(), filename)
					if (filesThatShouldntBeCreated.has(s3Key)) {
						return
					}

					const outputPath = path.join(outputRoot, pixelRatio.toString(), filename)

					const { width, height } = getImageDimensions(pixelRatio)

					if (!(await nonzeroFileExists(outputPath))) {
						const data = await downloadOnce()

						console.log(`creating`, outputPath)

						await resizeAndWriteToDisk({
							data,
							width,
							height,
							outputPath,
						})
					}
				}
			)
		},
		{ concurrency: 2 }
	)
}

module.exports = main

const memoify = fn => {
	let value

	return () => {
		if (!value) {
			value = fn()
		}
		return value
	}
}

// main({
// 	imageUrls: [
// 		...require(`./public/videoData.json`),
// 		...require(`./public/gameData.json`),
// 	].map(({ imageUrl }) => imageUrl),
// }).catch(err => {
// 	console.error(err)
// 	process.exit(1)
// })
