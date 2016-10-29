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

stateRouter.addState({
	name: 'search',
	route: '/search',
	defaultChild: 'results',
	template: require('./search.html'),
	querystringParameters: [ 'search' ],
	defaultParameters: {
		type: 'video',
		search: '',
	},
})

stateRouter.addState({
	name: 'search.results',
	route: '/:type(game|video)',
	template: require('./search-results.html'),
	resolve: (data, { type, search }) => searchTypes[type](search),
	activate: ({ domApi: ractive, parameters, content }) => {
		console.log('search results are', content)
	}
})

stateRouter.evaluateCurrentRoute('main')
