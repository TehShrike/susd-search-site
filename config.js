const swich = (map, condition) => (map[condition] || map.defalt)()

module.exports = {
	imageServer: swich({
		development: () => '//localhost:8889/',
		staging: () => '//staging-images.susdsearch.com',
		defalt: () => '//images.susdsearch.com/',
	}, process.env.NODE_ENV)
}
