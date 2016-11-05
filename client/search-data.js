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

	return function search(searchString, filterTags) {
		return valuePromise.then(data => {
			const resultsBeforeTagFiltering = searchString
				? data.filter(result => match(result, searchString.toLowerCase()))
				: data

			const results = filterTags.length === 0
				? resultsBeforeTagFiltering
				: containsAllTags({ items: resultsBeforeTagFiltering, filterTags })

			return {
				results,
				topTags: topTagsFromResults(resultsBeforeTagFiltering)
			}
		})
	}
}

function containsAllTags({ items, filterTags }) {
	const filterTagMap = filterTags.reduce((map, tag) => {
		map[tag] = true
		return map
	}, {})

	return items.filter(({ tags }) => {
		return filterTags.every(tag => tags.indexOf(tag) >= 0)
	})
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
