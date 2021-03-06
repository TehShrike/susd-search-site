const StateRouter = require(`abstract-state-router`)
const Ractive = require(`ractive`)
const makeRactiveStateRenderer = require(`ractive-state-router`)
const lazyloadDecorator = require(`./lazyload-img.js`)

const searchData = require(`./search-data`)
const makeActiveDecorator = require(`ractive-state-router/active-decorator`)

const renderer = makeRactiveStateRenderer(Ractive)

const stateRouter = StateRouter(renderer, `#container`)

Ractive.DEBUG = process.env.NODE_ENV === `development`
Ractive.decorators.selectOnFocus = require(`ractive-select-on-focus`)

const searchTypes = {
	video: searchData(`./videoData.json`),
	game: searchData(`./gameData.json`),
}

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
`,
})

const activeDecorator = makeActiveDecorator(stateRouter)

const menuComponent = Ractive.extend({
	isolated: true,
	twoway: false,
	decorators: {
		active: activeDecorator,
	},
	template: require(`./menu.html`),
})

stateRouter.addState({
	name: `about`,
	route: `/about`,
	template: {
		template: require(`./about.html`),
		components: {
			menu: menuComponent,
		},
	},
})

const searchResultsComponent = Ractive.extend({
	isolated: true,
	template: require(`./search-results.html`),
	components: {
		externalLink,
	},
	decorators: {
		lazy: lazyloadDecorator,
	},
	data: () => ({
		results: [],
		pixelRatio: Math.min(Math.ceil(window.devicePixelRatio), 3),
		sanitizeFilename: require(`sanitize-filename`),
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

function makeSureAllTagsAreInTop(selectedTags, topTags) {
	const topTagSet = new Set(topTags.map(({ tag }) => tag))
	const tagsNotInMapAlready = selectedTags.filter(tag => !topTagSet.has(tag)).map(tag => ({
		tag,
		count: null,
	}))

	return [
		...tagsNotInMapAlready,
		...topTags,
	]
}

stateRouter.addState({
	name: `search`,
	route: `/:type(game|video)`,
	template: {
		template: require(`./search.html`),
		components: {
			searchResults: searchResultsComponent,
			menu: menuComponent,
		},
		data: () => ({
			selectedTags: {},
		}),
	},
	querystringParameters: [ `search`, `type`, `tags` ],
	defaultParameters: {
		type: `video`,
	},
	resolve: (data, { type, search = ``, tags = [] }) => {
		tags = Array.isArray(tags) ? tags : [ tags ]

		return searchTypes[type](search, tags).then(({ results, topTags }) => ({
			allResults: results,
			results: results.slice(0, 10),
			topTags: makeSureAllTagsAreInTop(tags, topTags),
			selectedTags: makeTagMap(tags, topTags),
			initialSearchQuery: search,
			searchInput: search,
			currentType: type,
		}))
	},
	activate: ({ domApi: ractive, parameters: { type, search }, content: { allResults } }) => {
		ractive.find(`input.search-query-input`).focus()

		ractive.on(`search`, () => {
			const searchTerm = ractive.get(`searchInput`)

			stateRouter.go(null, { search: searchTerm, type })
		})

		ractive.on(`filterByTags`, () => {
			const selectedTags = ractive.get(`selectedTags`)
			const tags = Object.keys(selectedTags)
				.filter(tag => selectedTags[tag])

			const params = tags.length > 0 ? { type, tags } : { type }

			if (search) {
				params.search = search
			}

			stateRouter.go(null, params)
		})

		setTimeout(() => {
			ractive.splice(`results`, 10, 0, ...allResults.slice(10))
		}, 50)
	},
})

stateRouter.addState({
	name: `notFound`,
	route: `(.*)`,
	template: {
		template: `
			<div class="header flex vertical-center">
				<menu></menu>
			</div>
			<div class="flex horizontal-center">
				<h1>Not Found</h1>
			</div>
		`,
		components: {
			searchResults: searchResultsComponent,
			menu: menuComponent,
		},
	},
})

stateRouter.evaluateCurrentRoute(`search`, { type: `video` })
