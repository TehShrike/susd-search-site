const StateRouter = require('abstract-state-router')
const makeSvelteStateRenderer = require('svelte-state-renderer')

const searchData = require('./search-data')
const sendAnalyticsBasedOnStateChanges = require('./google-analytics')

const renderer = makeSvelteStateRenderer({
	data: require('../config')
})

const stateRouter = StateRouter(renderer, document.getElementById('container'))

sendAnalyticsBasedOnStateChanges(stateRouter)

const searchTypes = {
	video: searchData('/video'),
	game: searchData('/game'),
}

stateRouter.addState({
	name: 'about',
	route: '/about',
	template: require('./about.html'),
})

function makeTagMap(selectedTags, topTags) {
	const selectedTagsMap = {}
	topTags.map(({ tag }) => {
		selectedTagsMap[tag] = false
	})
	selectedTags.forEach(tag => {
		selectedTagsMap[tag] = true
	})
	return selectedTagsMap
}

function makeSureAllTagsAreInTop(selectedTags, topTags) {
	const topTagSet = new Set(topTags.map(({ tag }) => tag))
	const tagsNotInMapAlready = selectedTags.filter(tag => !topTagSet.has(tag)).map(tag => ({
		tag,
		count: null
	}))

	return [
		...tagsNotInMapAlready,
		...topTags
	]
}

stateRouter.addState({
	name: 'search',
	route: '/:type(game|video)',
	template: require('./search.html'),
	querystringParameters: [ 'search', 'type', 'tags' ],
	defaultParameters: {
		type: 'video',
	},
	resolve: (data, { type, search = '', tags = [] }) => {
		tags = Array.isArray(tags) ? tags : [ tags ]

		return searchTypes[type](search, tags).then(({ results, topTags }) => {
			console.log(results)
			return {
				allResults: results,
				results: results.slice(0, 10),
				topTags: makeSureAllTagsAreInTop(tags, topTags),
				selectedTags: makeTagMap(tags, topTags),
				initialSearchQuery: search,
				searchInput: search,
				currentType: type,
			}
		})
	}
})

stateRouter.addState({
	name: 'notFound',
	route: '(.*)',
	template: require('./not-found.html')
})

stateRouter.evaluateCurrentRoute('search', { type: 'video' })
