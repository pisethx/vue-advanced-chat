const linkify = require('linkifyjs')

export default (text, doLinkify, opts = {}) => {
	const json = compileToJSON(text, opts)

	const html = compileToHTML(json)

	const flatten = flattenResult(html)

	const result = [].concat.apply([], flatten)

	markdownResult(result)
	mentionResult(result, { ...opts, doLinkify })

	if (doLinkify) linkifyResult(result)

	return result
}

const type_markdown = {
	bold: '*',
	italic: '_',
	strike: '~',
	underline: '°'
}

const pseudo_markdown = {
	[type_markdown.bold]: {
		end: '\\' + [type_markdown.bold],
		allowed_chars: '.',
		type: 'bold'
	},
	[type_markdown.italic]: {
		end: [type_markdown.italic],
		allowed_chars: '.',
		type: 'italic'
	},
	[type_markdown.strike]: {
		end: [type_markdown.strike],
		allowed_chars: '.',
		type: 'strike'
	},
	[type_markdown.underline]: {
		end: [type_markdown.underline],
		allowed_chars: '.',
		type: 'underline'
	},
	'```': {
		end: '```',
		allowed_chars: '(.|\n)',
		type: 'multiline-code'
	},
	'`': {
		end: '`',
		allowed_chars: '.',
		type: 'inline-code'
	}
	// ':': {
	// 	allowed_chars: '[a-z_]',
	// 	end: ':',
	// 	object: child => <Emojione type={child[0]} />
	// },
	// '@': {
	// 	allowed_chars: '[a-z_.-A-Z0-9]',
	// 	end: ' ',
	// 	object: child => <User data={child} />
	// }
}

function compileToJSON(str, opts = {}) {
	str = str.trim()
	let result = []
	let min_index_of = -1
	let min_index_of_key = null

	let mentionKey = '@{'

	let links = linkify.find(str)

	let mentions = (str.match(opts.mentionRegex) ?? [])
		.map(stripTextFromRegex)
		.filter(m => m.split('|')?.length === 2)
		.map(m => ({
			full: `@{${m}}`,
			id: m.split('|')[0],
			value: m.split('|')[1]
		}))

	let min_index_from_link = false
	let min_index_from_mention = false

	if (links.length > 0) {
		min_index_of = str.indexOf(links[0].value)
		min_index_from_link = true
	}

	if (mentions.length > 0) {
		min_index_of = str.indexOf(mentionKey)
		min_index_from_mention = true
	}

	Object.keys(pseudo_markdown).forEach(starting_value => {
		const io = str.indexOf(starting_value)
		if (io >= 0 && (min_index_of < 0 || io < min_index_of)) {
			min_index_of = io
			min_index_of_key = starting_value
			min_index_from_link = false
		}
	})

	if (min_index_from_mention && min_index_of_key !== -1) {
		let str_left = str.substr(0, min_index_of)
		let str_mention = str.substr(min_index_of, mentions[0].full.length)
		let str_right = str.substr(min_index_of + mentions[0].full.length)
		result.push(str_left)
		result.push(str_mention)
		result = result.concat(compileToJSON(str_right, opts))
		return result
	}

	if (min_index_from_link && min_index_of_key !== -1) {
		let str_left = str.substr(0, min_index_of)
		let str_link = str.substr(min_index_of, links[0].value.length)
		let str_right = str.substr(min_index_of + links[0].value.length)
		result.push(str_left)
		result.push(str_link)
		result = result.concat(compileToJSON(str_right, opts))
		return result
	}

	if (min_index_of_key) {
		let str_left = str.substr(0, min_index_of)
		const char = min_index_of_key
		let str_right = str.substr(min_index_of + char.length)

		const match = str_right.match(
			new RegExp(
				'^(' +
					(pseudo_markdown[char].allowed_chars || '.') +
					'*' +
					(pseudo_markdown[char].end ? '?' : '') +
					')' +
					(pseudo_markdown[char].end
						? '(' + pseudo_markdown[char].end + ')'
						: ''),
				'm'
			)
		)

		if (!match) {
			str_left = str_left + char
			result.push(str_left)
		} else {
			if (str_left) result.push(str_left)

			const object = {
				start: char,
				content: compileToJSON(match[1], opts),
				end: match[2],
				type: pseudo_markdown[char].type
			}
			result.push(object)
			str_right = str_right.substr(match[0].length)
		}
		result = result.concat(compileToJSON(str_right, opts))
		return result
	} else return str ? [str] : []
}

function compileToHTML(json) {
	const result = []

	json.forEach(item => {
		if (typeof item == 'string') {
			result.push({ types: [], value: item })
		} else {
			if (pseudo_markdown[item.start]) {
				result.push(parseContent(item))
			}
		}
	})

	return result
}

function parseContent(item) {
	const result = []

	item.content.forEach(it => {
		if (typeof it == 'string') {
			result.push({
				types: [item.type],
				value: it
			})
		} else {
			it.content.forEach(i => {
				if (typeof i == 'string') {
					result.push({
						types: [it.type].concat([item.type]),
						value: i
					})
				} else {
					result.push({
						types: [i.type].concat([it.type]).concat([item.type]),
						value: parseContent(i)
					})
				}
			})
		}
	})

	return result
}

function flattenResult(array, types = []) {
	const result = []

	array.forEach(arr => {
		if (typeof arr.value == 'string') {
			arr.types = arr.types.concat(types)
			result.push(arr)
		} else {
			arr.forEach(a => {
				if (typeof a.value == 'string') {
					a.types = a.types.concat(types)
					result.push(a)
				} else {
					result.push(flattenResult(a.value, a.types))
				}
			})
		}
	})

	return result
}

function markdownResult(array) {
	for (let i = 0; i < array.length; i) {
		if (array[i - 1]) {
			const isInline =
				array[i].types.indexOf('inline-code') !== -1 &&
				array[i - 1].types.indexOf('inline-code') !== -1

			const isMultiline =
				array[i].types.indexOf('multiline-code') !== -1 &&
				array[i - 1].types.indexOf('multiline-code') !== -1

			if (isInline || isMultiline) {
				let value = array[i].value
				array[i].types.forEach(type => {
					const markdown = type_markdown[type] || ''
					value = markdown + value + markdown
				})

				array[i - 1].value = array[i - 1].value + value

				array.splice(i, 1)
			} else {
				i++
			}
		} else {
			i++
		}
	}
}

function mentionResult(array, opts = {}) {
	array.forEach(arr => {
		const mention = arr.value.match(opts.mentionRegex)?.[0]

		if (mention) {
			const [id, name] = stripTextFromRegex(mention).split('|')

			arr.types = opts.doLinkify ? ['url'].concat(arr.types) : arr.types
			arr.href = 'javascript:void(0);'
			arr.onclick = `EventBus.emit(${id})`
			// arr.href = opts.mentionRouteClick.replace('{id}', id)
			arr.value = `@${name}`
		}
	})
}

function linkifyResult(array) {
	const result = []

	array.forEach(arr => {
		const links = linkify.find(arr.value)

		if (links.length) {
			const spaces = arr.value.replace(links[0].value, '')
			result.push({ types: arr.types, value: spaces })

			arr.types = ['url'].concat(arr.types)
			arr.href = links[0].href
			arr.value = links[0].value
		}

		result.push(arr)
	})

	return result
}

function stripTextFromRegex(text) {
	return text.replace(/@\{|\}/gi, '')
}
