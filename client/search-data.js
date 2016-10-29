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
		return valuePromise.then(data => {
			return searchString
				? data.filter(result => result.title.toLowerCase().indexOf(searchString.toLowerCase()) > -1)
				: data
		})
	}
}
