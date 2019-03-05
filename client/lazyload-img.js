const inViewport = require(`in-viewport`)

function nearViewport(node, cb) {
	return inViewport(node, {
		offset: 500,
	}, cb)
}

function noop() {}

module.exports = function lazyLoadDecorator(node, imageUrl) {
	const originalSrc = node.src
	let unwatch = evaluateNode(node, imageUrl)

	function reset() {
		unwatch()
		node.src = originalSrc
	}

	return {
		update: imageUrl => {
			reset()
			unwatch = evaluateNode(node, imageUrl)
		},
		teardown: reset,
	}
}

function evaluateNode(node, lazyLoadImageUrl) {
	if (nearViewport(node)) {
		node.src = lazyLoadImageUrl

		return noop
	} else {
		const watcher = nearViewport(node, () => node.src = lazyLoadImageUrl)

		return () => watcher.dispose()
	}
}
