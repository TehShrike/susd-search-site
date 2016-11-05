const StateRouter = require('abstract-state-router')
const Ractive = require('ractive')
const makeRactiveStateRenderer = require('ractive-state-router')

const searchData = require('./search-data')

const renderer = makeRactiveStateRenderer(Ractive)

const stateRouter = StateRouter(renderer, '#container')

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

			stateRouter.go('search', { search: searchTerm, type: 'video'})
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

stateRouter.addState({
	name: 'search',
	route: '/search',
	defaultChild: 'results',
	template: require('./search.html'),
	querystringParameters: [ 'search', 'type' ],
	defaultParameters: {
		type: 'video',
		search: '',
	},
	resolve: (data, { type, search }) => {
		return searchTypes[type](search).then(({results, topTags}) => {
			return {
				results,
				topTags,
				naiveDevicePixelRatio: (window.devicePixelRatio > 1 ? 2 : 1),
			}
		})
	},
	activate: ({ domApi: ractive }) => {
		ractive.find('input.search-query-input').focus()

		ractive.on('search', () => {
			const searchTerm = ractive.get('searchInput')

			stateRouter.go(null, { search: searchTerm }, { inherit: true })
		})
	}
})

stateRouter.addState({
	name: 'search.results',
	route: '/:type(game|video)',
	template: {
		template: require('./search-results.html'),
		components: {
			externalLink
		}
	},
	activate: ({ domApi: ractive, parameters, content }) => {

	}
})

stateRouter.evaluateCurrentRoute('main')
