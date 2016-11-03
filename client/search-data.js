function get(url) {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()
		request.addEventListener('load', () => resolve(JSON.parse(request.responseText)))
		request.addEventListener('error', reject)
		request.addEventListener('abort', reject)
		request.open('GET', url)
		request.send()
	})
}


module.exports = function searchData(source) {
	const valuePromise = get(source)

	return function search(searchString, cb) {
		if (!searchString) {
			return valuePromise
		}

		const lowercaseQuery = searchString.toLowerCase()

		return valuePromise.then(data => {
			return searchString
				? data.filter(result => match(result, lowercaseQuery))
				: data
		})
	}
}

function match({ title, tags }, query) {
	return title.toLowerCase().indexOf(query) > -1
		|| tags.some(tag => tag.indexOf(query) > -1)
}
