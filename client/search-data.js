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
	const dataPromise = get(source)

	return function search(searchString, filterTags) {
		return dataPromise.then(data => {
			const resultsBeforeTagFiltering = searchString
				? findOrderedResults({ searchString, data })
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

function findOrderedResults({ searchString, data }) {
	const lowercaseSearchString = searchString.toLowerCase()
	const searchTokens = tokenize(lowercaseSearchString)

	return data.map(item => {
		return {
			item,
			score: searchScore({ item, searchTokens, searchString: lowercaseSearchString })
		}
	})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item)
}

function searchScore({ item, searchTokens, searchString }) {
	return titleScore({ item, searchTokens, searchString })
		+ tagScore({ tags: item.tags, searchTokens })
}

function titleScore({ item, searchTokens, searchString }) {
	const lowercaseTitle = item.title.toLowerCase()

	if (contains(lowercaseTitle, searchString)) {
		return 100
	} else {
		const matchingTokens = searchTokens.filter(token => contains(lowercaseTitle, token)).length
		return matchingTokens * 5
	}
}

function tagScore({ tags, searchTokens }) {
	return searchTokens.reduce((totalScore, token) => {
		const matchesToken = tags.some(tag => contains(tag, token))
		return totalScore + (matchesToken ? 1 : 0)
	}, 0)
}

function contains(string, needle) {
	return string.indexOf(needle) !== -1
}

function tokenize(searchString) {
	return searchString.toLowerCase().split(/\s+/)
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
