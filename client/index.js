const StateRouter = require('abstract-state-router')
const Ractive = require('ractive')
const makeRactiveStateRenderer = require('ractive-state-router')

const searchData = require('./search-data')

const renderer = makeRactiveStateRenderer(Ractive)

const stateRouter = StateRouter(renderer, '#container')

Ractive.decorators.selectOnFocus = require('ractive-select-on-focus')

const searchTypes = {
	video: searchData('/video'),
	game: searchData('/game'),
}

stateRouter.addState({
	name: 'main',
	template: require('./main.html'),
	activate: ({ domApi: ractive }) => {
		ractive.find('input').focus()

		ractive.on('search', () => {
			const searchTerm = ractive.get('searchInput')

			stateRouter.go('search', { search: searchTerm, type: 'video' })
		})
	}
})

const externalLink = Ractive.extend({
	isolated: true,
	template: `
<a
	href="{{url}}"
	target="_blank"
	rel="external noopener"
	class="{{class}}"
>
	{{yield}}
</a>
`
})

const searchResultsComponent = Ractive.extend({
	isolated: true,
	template: require('./search-results.html'),
	components: {
		externalLink
	},
	data: () => ({
		results: [],
		naiveDevicePixelRatio: (window.devicePixelRatio > 1 ? 2 : 1),
	}),
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

stateRouter.addState({
	name: 'search',
	route: '/:type(game|video)',
	template: {
		template: require('./search.html'),
		components: {
			searchResults: searchResultsComponent
		},
		data: () => ({
			selectedTags: {}
		})
	},
	querystringParameters: [ 'search', 'type', 'tags' ],
	defaultParameters: {
		type: 'video',
		search: '',
	},
	resolve: (data, { type, search, tags = [] }) => {
		tags = Array.isArray(tags) ? tags : [tags]

		return searchTypes[type](search, tags).then(({results, topTags}) => {
			return {
				results,
				topTags,
				selectedTags: makeTagMap(tags, topTags),
				initialSearchQuery: search,
				searchInput: search,
			}
		})
	},
	activate: ({ domApi: ractive, parameters: { type, search } }) => {
		ractive.find('input.search-query-input').focus()

		ractive.on('search', () => {
			const searchTerm = ractive.get('searchInput')

			stateRouter.go(null, { search: searchTerm, type })
		})

		ractive.on('filterByTags', () => {
			const selectedTags = ractive.get('selectedTags')
			const tags = Object.keys(selectedTags)
				.filter(tag => selectedTags[tag])

			const params = tags.length > 0 ? { type, search, tags } : { type, search }

			stateRouter.go(null, params)
		})
	}
})

stateRouter.evaluateCurrentRoute('main')
