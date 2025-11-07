const puppeteer = require(`puppeteer`)

let browserInstance = null

const getBrowser = async () => {
	if (!browserInstance) {
		browserInstance = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-gpu',
			],
		})
	}
	return browserInstance
}

const closeBrowser = async () => {
	if (browserInstance) {
		await browserInstance.close()
		browserInstance = null
	}
}

const downloadPage = async (url) => {
	const browser = await getBrowser()
	const page = await browser.newPage()

	await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
	await page.setViewport({ width: 1920, height: 1080 })

	await page.goto(url, {
		waitUntil: 'networkidle2',
		timeout: 60000,
	})

	try {
		await page.waitForSelector('article.susd-filter', { timeout: 30000 })
		await page.waitForSelector('article.susd-filter li', { timeout: 30000 })
	} catch (err) {
		console.log(`Warning: Could not find expected selectors: ${err.message}`)
	}

	const html = await page.content()
	await page.close()

	return html
}

const downloadBuffer = async (url) => {
	const browser = await getBrowser()
	const page = await browser.newPage()

	await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

	const response = await page.goto(url, {
		waitUntil: 'networkidle2',
		timeout: 60000,
	})

	if (!response || !response.ok()) {
		throw new Error(`Failed to download ${url}: ${response ? response.status() : 'No response'}`)
	}

	const buffer = await response.buffer()
	await page.close()

	return buffer
}

module.exports = {
	downloadPage,
	downloadBuffer,
	closeBrowser,
}
