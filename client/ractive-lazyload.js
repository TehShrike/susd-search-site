const inViewport = require('in-viewport')

function nearViewport(node, cb) {
	return inViewport(node, {
		offset: 200
	}, cb)
}

module.exports = function lazyLoadDecorator(node, imageUrl) {
	if (nearViewport(node)) {
		node.src = imageUrl

		return noopResponse
	} else {
		const watcher = nearViewport(node, () => node.src = imageUrl)

		return {
			teardown: () => watcher.dispose()
		}
	}
}

const noopResponse = {
	teardown: () => {}
}
