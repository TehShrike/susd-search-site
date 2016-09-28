const http = require('http')
const fs = require('fs')

const parseHtml = require('susd-page-parser')
const ecstatic = require('ecstatic')

const videoPageData = parseHtml(fs.readFileSync('./tmp-video-page.html'))
const gamePageData = parseHtml(fs.readFileSync('./tmp-game-page.html'))

const development = true

function getVideoPageData(cb) {
	cb(null, videoPageData)
}
function getGamePageData(cb) {
	cb(null, gamePageData)
}

const htmlIndex = fs.readFileSync('./index.html', { encoding: 'utf8' })

const staticServer = ecstatic({ root: __dirname + '/client/static' })

module.exports = function createServer() {
	return http.createServer((req, res) => {
		if (get(req, '/video')) {

		} else if (get(req, '/')) {

		} else {
			staticServer(req, res)
		}
	})
}

function get(req, route) {
	return req.type === 'GET' && req.url === route
}

function renderSearchPage(data) {

}

function pageGetterFactory(development) {
	if (development) {
		return function getPageFromDisk(cb) {

		}
	} else {
		throw new Error('implement')
	}
}

