const Fuse = require('fuse.js')

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
	const dataPromise = get(source).then(data => {
		const dataWithTagsAsWords = data.map(data => {
			return Object.assign(data, {
				tagsAsWords: data.tags.map(tag => tag.replace('-', ' ')).join(' ')
			})
		})

		const index = new Fuse(data, {
			threshold: 0.5,
			keys: [{
				name: 'title',
				weight: 0.8,
			}, {
				name: 'tagsAsWords',
				weight: 0.2,
			}]
		})

		return {
			index,
			data
		}
	})

	return function search(searchString, filterTags) {
		return dataPromise.then(({ data, index }) => {
			const resultsBeforeTagFiltering = searchString ? index.search(searchString) : data

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
