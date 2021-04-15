<template>
	<div :class="{ 'vac-text-ellipsis': singleLine }">
		<div :class="{ 'vac-text-ellipsis': singleLine }" v-if="textFormatting">
			<template v-for="(message, i) in linkifiedMessage">
				<component
					:is="checkType(message, 'url') ? 'a' : 'span'"
					:key="i"
					:class="{
						'px-1': !!message.href,
						'vac-text-ellipsis': singleLine,
						'vac-text-deleted': deleted,
						'vac-text-route': isRoute,
						'vac-text-bold': checkType(message, 'bold'),
						'vac-text-italic': checkType(message, 'italic'),
						'vac-text-strike': checkType(message, 'strike'),
						'vac-text-underline': checkType(message, 'underline'),
						'vac-text-inline-code':
							!singleLine && checkType(message, 'inline-code'),
						'vac-text-multiline-code':
							!singleLine && checkType(message, 'multiline-code')
					}"
					:href="message.href"
					target="_blank"
				>
					<slot v-if="deleted" name="deleted-icon" v-bind="{ deleted }">
						<svg-icon name="deleted" class="vac-icon-deleted" /> </slot
					>{{ message.value.trim() }}</component
				>
			</template>
		</div>
		<div v-else>{{ content.trim() }}</div>
	</div>
</template>

<script>
import SvgIcon from './SvgIcon'

import formatString from '../utils/formatString'

export default {
	name: 'format-message',
	components: { SvgIcon },

	props: {
		content: { type: [String, Number], required: true },
		deleted: { type: Boolean, default: false },
		formatLinks: { type: Boolean, default: true },
		singleLine: { type: Boolean, default: false },
		isRoute: { type: Boolean, default: false },
		textFormatting: { type: Boolean, required: true },
		mentionRegex: RegExp,
		mentionRouteClick: String
	},

	computed: {
		linkifiedMessage() {
			return formatString(this.content, this.formatLinks, {
				mentionRouteClick: this.mentionRouteClick,
				mentionRegex: this.mentionRegex
			})
		}
	},

	methods: {
		checkType(message, type) {
			return message.types.indexOf(type) !== -1
		}
	}
}
</script>

<style>
.vac-text-deleted {
	font-style: italic;
}

.vac-icon-deleted {
	height: 14px;
	width: 14px;
	vertical-align: middle;
	margin: -3px 1px 0 0;
	fill: var(--chat-room-color-message);
}

.vac-text-ellipsis {
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
