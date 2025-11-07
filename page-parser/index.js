const cheerio = require('cheerio')

module.exports = function parseHtml(html) {
	const $ = cheerio.load(html.toString())
	const items = []

	$('article.susd-filter ul.mainul > li').each((index, element) => {
		const e = $(element)
		const tags = classStringToFilterTags(e.attr('class'))
		const imageUrl = e.find('.esg-entry-media > img').first().attr('data-lazysrc')

		const ahref = e.find('.esg-entry-cover a').filter((i, el) => $(el).text()).first()
		const url = ahref.attr('href')
		const title = ahref.text()

		items.push({ url, title, imageUrl, tags })
	})

	return items
}

const tagPrefix = 'filter-'
const alphabetical = /[a-z]/

function classStringToFilterTags(classString) {
	return classString.split(/\s/g)
		.filter(str => str.startsWith(tagPrefix))
		.map(tag => tag.substring(tagPrefix.length))
		.filter(str => alphabetical.test(str) && !str.endsWith('null'))
}
