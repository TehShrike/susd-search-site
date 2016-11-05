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
			const results = searchString
				? data.filter(result => match(result, lowercaseQuery))
				: data

			return {
				results,
				topTags: topTagsFromResults(results)
			}
		})
	}
}

function match({ title, tags }, query) {
	return title.toLowerCase().indexOf(query) > -1
		|| tags.some(tag => tag.indexOf(query) > -1)
}

function topTagsFromResults(results, number = 10) {
	return topTags(aggregateTags(results), number)
}

function aggregateTags(results) {
	const tagCounts = {}

	results.forEach(({ tags }) => {
		tags.forEach(tag => {
			tagCounts[tag] = (tagCounts[tag] || 0) + 1
		})
	})

	return tagCounts
}

function topTags(tagCounts, number) {
	const tags = Object.keys(tagCounts)

	return tags.sort((a, b) => tagCounts[b] - tagCounts[a])
		.slice(0, number)
		.map(tag => ({
			tag,
			count: tagCounts[tag]
		}))
}
