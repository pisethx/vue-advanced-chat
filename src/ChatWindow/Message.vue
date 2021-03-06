<template>
	<div>
		<div v-if="showDate" class="vac-card-info vac-card-date">
			{{ message.date }}
		</div>

		<div v-if="newMessage._id === message._id" class="vac-line-new">
			{{ textMessages.NEW_MESSAGES }}
		</div>

		<div
			v-if="message.system && message.content"
			class="vac-card-info vac-card-system"
		>
			{{ message.content }}
		</div>

		<div
			v-else
			class="vac-message-box d-flex"
			:class="{ 'vac-offset-current': message.sender_id === currentUserId }"
		>
			<slot name="chat-avatar" v-bind="{ message, room }"></slot>
			<div
				class="vac-message-container"
				:class="{
					'vac-message-container-offset': messageOffset
				}"
				@mouseenter="onHoverMessage(message)"
				@mouseleave="onLeaveMessage"
			>
				<div
					ref="imageRef"
					class="vac-message-card"
					:class="{
						'vac-message-highlight': isMessageHover(message),
						'vac-message-current': message.sender_id === currentUserId,
						'vac-message-deleted': message.deleted
					}"
				>
					<slot name="chat-username" v-bind="{ message, room }">
						<div
							v-if="roomUsers.length > 2 && message.sender_id !== currentUserId"
							class="vac-text-username"
							:class="{
								'vac-username-reply': !message.deleted && message.replyMessage
							}"
						>
							<span>{{ message.username }}</span>
						</div>
					</slot>

					<div
						v-if="!message.deleted && message.replyMessage"
						class="vac-reply-message"
					>
						<div class="vac-reply-username">{{ replyUsername }}</div>

						<div class="vac-image-reply-container" v-if="isImageReply">
							<div
								v-for="({ url }, idx) in message.replyMessage.file"
								:key="idx"
								class="vac-message-image vac-message-image-reply"
								:style="{
									'background-image': `url('${url}')`
								}"
							></div>
						</div>

						<div class="vac-reply-content">
							<format-message
								v-if="message.replyMessage && message.replyMessage.content"
								:isRoute="message.isRoute"
								:content="message.replyMessage.content"
								:textFormatting="textFormatting"
								:mentionRegex="mentionRegex"
							>
							</format-message>
						</div>
					</div>

					<div v-if="message.deleted">
						<slot name="deleted-icon">
							<svg-icon name="deleted" class="vac-icon-deleted" />
						</slot>
						<span>{{ textMessages.MESSAGE_DELETED }}</span>
					</div>

					<!-- <slot v-else-if="message.isRoute" name="message" v-bind="{ message }">
					</slot> -->

					<div v-else-if="!message.file.length">
						<format-message
							:isRoute="message.isRoute"
							:content="message.content"
							:textFormatting="textFormatting"
							:mentionRegex="mentionRegex"
						>
							<template v-slot:deleted-icon="data">
								<slot name="deleted-icon" v-bind="data"></slot>
							</template>
						</format-message>

						<slot name="message-content" v-bind="{ message }"></slot>
					</div>

					<div
						v-else-if="
							message.file.length === 1 && checkMediaType(message.file[0])
						"
					>
						<slot
							name="single-image"
							v-bind="{ message, openFile: () => openFile('preview', 0) }"
						></slot>
					</div>

					<div
						v-else
						class="d-flex flex-wrap"
						:class="{ 'flex-row': isImage, 'flex-column': !isImage }"
					>
						<template v-for="(file, idx) in message.file">
							<div
								:key="'media-' + idx"
								class="vac-image-container"
								v-if="checkMediaType(file)"
							>
								<div
									class="vac-message-image"
									@click="openFile('preview', idx)"
									:class="{
										'vac-image-loading':
											isImageLoading(file) &&
											message.sender_id === currentUserId
									}"
									:style="{
										'background-image': `url('${file.thumb}')`,
										'max-height': `${imageResponsive.maxHeight}px`
									}"
								>
									<slot v-bind:file="file" name="video-icon"> </slot>

									<!-- <transition name="vac-fade-image">
											<div class="vac-image-buttons">
												v-if="imageHover && !isImageLoading"
												<div
													class="vac-svg-button vac-button-view"
													@click.stop="openFile('preview', idx)"
												>
													<slot name="eye-icon">
														<svg-icon name="eye" />
													</slot>
												</div>
												<div
													class="vac-svg-button vac-button-download"
													@click.stop="openFile('download', idx)"
												>
													<slot name="document-icon">
														<svg-icon name="document" />
													</slot>
												</div>
											</div>
										</transition> -->
								</div>
							</div>

							<audio-player
								v-else-if="file.audio"
								:src="file.url"
								:shouldAutoplay="shouldAutoplay"
								:voicePlaybackRate="voicePlaybackRate"
								:key="'audio-' + idx"
								@started="$emit('voiceStarted')"
								@ended="$emit('voiceEnded')"
								@update-progress-time="progressTime = $event"
								@hover-audio-progress="hoverAudioProgress = $event"
							>
								<template v-for="(i, name) in $scopedSlots" #[name]="data">
									<slot :name="name" v-bind="data" />
								</template>
							</audio-player>

							<!-- <div
								:key="'audio-' + idx"
								v-else-if="file.audio"
								class="vac-audio-message"
							>
								<div id="vac-player">
									<slot name="audio-player" v-bind="{ file }">
										<audio controls>
											<source :src="file.url" />
										</audio>
									</slot>
								</div>
							</div> -->

							<div :key="'file-' + idx" v-else class="vac-file-message">
								<div
									class="vac-svg-button vac-icon-file"
									@click.stop="openFile('download', idx)"
								>
									<slot name="document-icon">
										<svg-icon name="document" />
									</slot>
								</div>
								<span>{{ file.name }}</span>
							</div>
						</template>
					</div>

					<div
						v-if="!message.deleted && message.file.length && message.content"
					>
						{{ message.content }}
					</div>

					<div
						class="vac-text-timestamp"
						:style="{
							textAlign: message.sender_id === currentUserId ? 'right' : 'left'
						}"
					>
						<div
							class="vac-icon-edited"
							v-if="message.edited && !message.deleted"
						>
							<slot name="pencil-icon">
								<svg-icon name="pencil" />
							</slot>
						</div>
						<span>{{ message.timestamp }}</span>
						<span v-if="isCheckmarkVisible">
							<slot name="checkmark-icon" v-bind="{ message, room }">
								<svg-icon
									:name="message.distributed ? 'double-checkmark' : 'checkmark'"
									:param="message.seen ? 'seen' : ''"
									class="vac-icon-check"
								></svg-icon>
							</slot>
						</span>
					</div>

					<div
						class="vac-options-container"
						:class="{ 'vac-options-image': isImage && !message.replyMessage }"
						:style="{
							width:
								filteredMessageActions.length && showReactionEmojis
									? '70px'
									: '45px'
						}"
					>
						<transition-group name="vac-slide-left">
							<div
								key="1"
								class="vac-blur-container"
								:class="{
									'vac-options-me': message.sender_id === currentUserId
								}"
								v-if="isMessageActions || isMessageReactions"
							></div>

							<div
								ref="actionIcon"
								key="2"
								class="vac-svg-button vac-message-options"
								v-if="isMessageActions"
								@click="openOptions"
							>
								<slot name="dropdown-icon">
									<svg-icon name="dropdown" param="message" />
								</slot>
							</div>

							<emoji-picker
								key="3"
								class="vac-message-reactions"
								:style="{ right: isMessageActions ? '30px' : '5px' }"
								v-if="isMessageReactions"
								v-click-outside="closeEmoji"
								:emojiOpened="emojiOpened"
								:emojiReaction="true"
								:roomFooterRef="roomFooterRef"
								:positionRight="message.sender_id === currentUserId"
								@addEmoji="sendMessageReaction"
								@openEmoji="openEmoji"
							>
								<template v-slot:emoji-picker-icon>
									<slot name="emoji-picker-reaction-icon"></slot>
								</template>
							</emoji-picker>
						</transition-group>
					</div>

					<transition
						:name="
							message.sender_id === currentUserId
								? 'vac-slide-left'
								: 'vac-slide-right'
						"
						v-if="filteredMessageActions.length"
					>
						<div
							ref="menuOptions"
							v-if="optionsOpened"
							v-click-outside="closeOptions"
							class="vac-menu-options"
							:class="{
								'vac-menu-left': message.sender_id !== currentUserId
							}"
							:style="{ top: `${menuOptionsTop}px` }"
						>
							<div class="vac-menu-list">
								<div
									v-for="action in filteredMessageActions"
									:key="action.name"
								>
									<div
										class="vac-menu-item"
										@click="messageActionHandler(action)"
									>
										{{ action.title }}
									</div>
								</div>
							</div>
						</div>
					</transition>
				</div>

				<div v-if="!message.deleted">
					<slot
						name="reaction"
						v-bind="{
							message,
							hover: isMessageActions,
							onHoverMessage,
							onLeaveMessage
						}"
					></slot>
					<slot name="reactions" v-bind="{ message, hover: isMessageActions }">
					</slot>
				</div>

				<transition-group name="vac-slide-left" v-if="!message.deleted">
					<button
						v-for="(reaction, key) in message.reactions"
						v-show="reaction.length"
						:key="key + 0"
						class="vac-button-reaction"
						:class="{
							'vac-reaction-me': reaction.indexOf(currentUserId) !== -1
						}"
						:style="{
							float: message.sender_id === currentUserId ? 'right' : 'left'
						}"
						@click="sendMessageReaction({ name: key }, reaction)"
					>
						{{ getEmojiByName(key) }}<span>{{ reaction.length }}</span>
					</button>
				</transition-group>
			</div>
		</div>
	</div>
</template>

<script>
import vClickOutside from 'v-click-outside'

import SvgIcon from './SvgIcon'
// import Loader from './Loader'
import EmojiPicker from './EmojiPicker'
import FormatMessage from './FormatMessage'
import AudioPlayer from './AudioPlayer'

export default {
	name: 'message',
	components: { SvgIcon, EmojiPicker, FormatMessage, AudioPlayer },

	directives: {
		clickOutside: vClickOutside.directive
	},

	props: {
		currentUserId: { type: [String, Number], required: true },
		textMessages: { type: Object, required: true },
		index: { type: Number, required: true },
		message: { type: Object, required: true },
		room: { type: Object, required: true },
		messages: { type: Array, required: true },
		editedMessage: { type: Object, required: true },
		roomUsers: { type: Array, default: () => [] },
		messageActions: { type: Array, required: true },
		roomFooterRef: { type: HTMLDivElement },
		newMessages: { type: Array },
		showReactionEmojis: { type: Boolean, required: true },
		showNewMessagesDivider: { type: Boolean, required: true },
		textFormatting: { type: Boolean, required: true },
		emojisList: { type: Object, required: true },
		hideOptions: { type: Boolean, required: true },

		shouldAutoplay: { type: Boolean, required: true },
		voicePlaybackRate: Number,
		mentionRegex: RegExp
	},

	data() {
		return {
			hoverMessageId: null,
			imageLoading: false,
			imageHover: false,
			messageHover: false,
			optionsOpened: false,
			optionsClosing: false,
			menuOptionsTop: 0,
			messageReaction: '',
			newMessage: {},
			emojiOpened: false,
			imageResponsive: '',

			progressTime: '- : -',
			hoverAudioProgress: false
		}
	},

	watch: {
		message: {
			immediate: true,
			handler() {
				this.checkImgLoad()
			}
		},
		newMessages(val) {
			if (!val.length || !this.showNewMessagesDivider) return
			this.newMessage = val.reduce((res, obj) =>
				obj.index < res.index ? obj : res
			)
		},
		emojiOpened(val) {
			if (val) this.optionsOpened = false
		},
		hideOptions(val) {
			if (val) {
				this.closeEmoji()
				this.closeOptions()
			}
		}
	},

	mounted() {
		if (!this.message.seen && this.message.sender_id !== this.currentUserId) {
			this.$emit('addNewMessage', {
				_id: this.message._id,
				index: this.index
			})
		}

		if (!this.$refs.imageRef) return

		this.imageResponsive = {
			maxHeight: this.$refs.imageRef.clientWidth - 18,
			loaderTop: this.$refs.imageRef.clientWidth / 2
		}
	},

	computed: {
		showDate() {
			return (
				this.index > 0 &&
				this.message.date !== this.messages[this.index - 1].date
			)
		},
		messageOffset() {
			return (
				this.index > 0 &&
				this.message.sender_id !== this.messages[this.index - 1].sender_id
			)
		},
		isCheckmarkVisible() {
			return (
				this.message.sender_id === this.currentUserId &&
				!this.message.deleted &&
				(this.message.saved || this.message.distributed || this.message.seen)
			)
		},
		replyUsername() {
			const { sender_id } = this.message.replyMessage
			const replyUser = this.roomUsers.find(user => user._id === sender_id)
			return replyUser ? replyUser.username : ''
		},
		isMessageActions() {
			return (
				this.filteredMessageActions.length &&
				this.messageHover &&
				!this.message.deleted &&
				!this.message.disable_actions
			)
		},
		isMessageReactions() {
			return (
				this.showReactionEmojis &&
				this.messageHover &&
				!this.message.deleted &&
				!this.message.disable_reactions
			)
		},
		filteredMessageActions() {
			return this.message.sender_id === this.currentUserId
				? this.messageActions
				: this.messageActions.filter(message => !message.onlyMe)
		},
		isImage() {
			return this.checkFilter(this.message.file, this.checkMediaType)
		}
	},

	methods: {
		isImageReply() {
			return this.checkFilter(
				this.message.replyMessage.file,
				this.checkMediaType
			)
		},
		isImageLoading(file) {
			return false
			// return file.url.indexOf('blob:http') !== -1 || this.imageLoading
		},
		checkFilter(arr, cb) {
			if (!Array.isArray(arr)) return false
			if (arr.length === 0) return false
			const filteredArrLength = arr.filter(each => cb(each)).length
			if (filteredArrLength === 0) return false

			return filteredArrLength === arr.length
		},
		isMessageHover() {
			return (
				this.editedMessage._id === this.message._id ||
				this.hoverMessageId === this.message._id
			)
		},
		onHoverMessage() {
			this.imageHover = true
			this.messageHover = true
			if (this.canEditMessage()) this.hoverMessageId = this.message._id
		},
		canEditMessage() {
			return !this.message.deleted
		},
		onLeaveMessage() {
			this.imageHover = false
			if (!this.optionsOpened && !this.emojiOpened) this.messageHover = false
			this.hoverMessageId = null
		},
		openFile(action, idx) {
			this.$emit('openFile', { message: this.message, action, idx })
		},
		messageActionHandler(action) {
			this.closeOptions()
			this.messageHover = false
			this.hoverMessageId = null

			setTimeout(() => {
				this.$emit('messageActionHandler', { action, message: this.message })
			}, 300)
		},
		checkImageFile(file) {
			return this.checkMediaType(file)
		},
		checkImageReplyFile(file) {
			return this.checkMediaType(file)
		},
		checkMediaType(file) {
			if (!file) return false

			const imageTypes = ['png', 'jpg', 'jpeg', 'svg', 'mp4']
			const { type } = file
			return imageTypes.some(t => type.toLowerCase().includes(t))
		},
		checkImgLoad() {
			if (!this.isImage) return
			this.imageLoading = true

			this.message.file.map((file, idx) => {
				const image = new Image()
				image.src = file.thumb
				image.addEventListener(
					'load',
					() =>
						idx === this.message.file.length - 1 && (this.imageLoading = false)
				)
			})
		},
		openOptions() {
			if (this.optionsClosing) return

			this.optionsOpened = !this.optionsOpened
			if (!this.optionsOpened) return

			this.$emit('hideOptions', false)

			setTimeout(() => {
				if (
					!this.roomFooterRef ||
					!this.$refs.menuOptions ||
					!this.$refs.actionIcon
				)
					return

				const menuOptionsTop =
					this.$refs.menuOptions.getBoundingClientRect().height

				const actionIconTop = this.$refs.actionIcon.getBoundingClientRect().top
				const roomFooterTop = this.roomFooterRef.getBoundingClientRect().top

				const optionsTopPosition =
					roomFooterTop - actionIconTop > menuOptionsTop + 50

				if (optionsTopPosition) this.menuOptionsTop = 30
				else this.menuOptionsTop = -menuOptionsTop
			}, 0)
		},
		closeOptions() {
			this.optionsOpened = false
			this.optionsClosing = true
			setTimeout(() => (this.optionsClosing = false), 100)

			if (this.hoverMessageId !== this.message._id) this.messageHover = false
		},
		openEmoji() {
			this.emojiOpened = !this.emojiOpened
			this.$emit('hideOptions', false)
		},
		closeEmoji() {
			this.emojiOpened = false
			if (this.hoverMessageId !== this.message._id) this.messageHover = false
		},
		getEmojiByName(emojiName) {
			return this.emojisList[emojiName]
		},
		sendMessageReaction(emoji, reaction) {
			this.$emit('sendMessageReaction', {
				messageId: this.message._id,
				reaction: emoji,
				remove: reaction && reaction.indexOf(this.currentUserId) !== -1
			})
			this.closeEmoji()
			this.messageHover = false
		}
	}
}
</script>

<style lang="scss" scoped>
.vac-card-info {
	border-radius: 4px;
	text-align: center;
	margin: 10px auto;
	font-size: 12px;
	padding: 4px;
	display: block;
	overflow-wrap: break-word;
	position: relative;
	white-space: normal;
	box-shadow: 0 1px 1px -1px rgba(0, 0, 0, 0.1),
		0 1px 1px -1px rgba(0, 0, 0, 0.11), 0 1px 2px -1px rgba(0, 0, 0, 0.11);
}

.vac-card-date {
	max-width: 150px;
	font-weight: 500;
	text-transform: uppercase;
	color: var(--chat-message-color-date);
	background: var(--chat-message-bg-color-date);
}

.vac-card-system {
	max-width: 250px;
	padding: 8px 4px;
	color: var(--chat-message-color-system);
	background: var(--chat-message-bg-color-system);
}

.vac-line-new {
	color: var(--chat-message-color-new-messages);
	position: relative;
	text-align: center;
	font-size: 13px;
	padding: 10px 0;
}

.vac-line-new:after,
.vac-line-new:before {
	border-top: 1px solid var(--chat-message-color-new-messages);
	content: '';
	left: 0;
	position: absolute;
	top: 50%;
	width: calc(50% - 60px);
}

.vac-line-new:before {
	left: auto;
	right: 0;
}

.vac-message-box {
	display: flex;
	align-items: center;
	flex: 0 0 50%;
	max-width: 50%;
	justify-content: flex-start;
	line-height: 1.4;
}

.vac-message-container {
	position: relative;
	padding: 2px 10px;
	align-items: end;
	min-width: 100px;
	box-sizing: content-box;
}

.vac-message-container-offset {
	margin-top: 10px;
}

.vac-offset-current {
	margin-left: 50%;
	justify-content: flex-end;
}

.vac-message-card {
	background: var(--chat-message-bg-color);
	color: var(--chat-message-color);
	border-radius: 8px;
	font-size: 14px;
	padding: 6px 9px 3px;
	white-space: pre-wrap;
	max-width: 100%;
	-webkit-transition-property: box-shadow, opacity;
	transition-property: box-shadow, opacity;
	transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
	will-change: box-shadow;
	box-shadow: 0 1px 1px -1px rgba(0, 0, 0, 0.1),
		0 1px 1px -1px rgba(0, 0, 0, 0.11), 0 1px 2px -1px rgba(0, 0, 0, 0.11);
}

.vac-message-highlight {
	box-shadow: 0 1px 2px -1px rgba(0, 0, 0, 0.1),
		0 1px 2px -1px rgba(0, 0, 0, 0.11), 0 1px 5px -1px rgba(0, 0, 0, 0.11);
}

.vac-message-current {
	background: var(--chat-message-bg-color-me) !important;
}

.vac-message-deleted {
	color: var(--chat-message-color-deleted) !important;
	font-size: 13px !important;
	font-style: italic !important;
	background: var(--chat-message-bg-color-deleted) !important;
}

.vac-icon-deleted {
	height: 14px;
	width: 14px;
	vertical-align: middle;
	margin: -2px 2px 0 0;
	fill: var(--chat-message-color-deleted);
}

.vac-image-container {
	margin: 2px;
	flex-wrap: wrap;
}

.vac-image-reply-container {
	display: flex;
	width: 70px;
}

.vac-message-image {
	position: relative;
	background-color: var(--chat-message-bg-color-image) !important;
	background-size: cover !important;
	background-position: center center !important;
	background-repeat: no-repeat !important;
	height: 150px;
	width: 150px;
	max-width: 100%;
	border-radius: 4px;
	margin: 4px auto 5px;
	transition: 0.4s filter linear;
}

.vac-message-image-reply {
	height: 70px;
	width: 70px;
	margin: 4px auto 3px;
}

.vac-image-loading {
	filter: blur(3px);
}

.vac-reply-message {
	background: var(--chat-message-bg-color-reply);
	border-radius: 4px;
	margin: -1px -5px 8px;
	padding: 8px 10px;

	.vac-reply-username {
		color: var(--chat-message-color-reply-username);
		font-size: 12px;
		line-height: 15px;
		margin-bottom: 2px;
	}

	.vac-reply-content {
		font-size: 12px;
		color: var(--chat-message-color-reply-content);
	}
}

.vac-text-username {
	font-size: 13px;
	color: var(--chat-message-color-username);
	margin-bottom: 2px;
}

.vac-username-reply {
	margin-bottom: 5px;
}

.vac-text-timestamp {
	font-size: 10px;
	color: var(--chat-message-color-timestamp);
}

.selector:not(*:root),
#vac-player {
	width: 250px;
	overflow: hidden;
	border-top-right-radius: 1em;
	border-bottom-right-radius: 2.5em 1em;

	audio {
		height: 40px;

		&::-webkit-media-controls-panel {
			height: 40px;
		}

		&::-webkit-media-controls-mute-button {
			display: none;
		}

		&::-webkit-media-controls-timeline {
			min-width: 103px;
			max-width: 142px;
		}

		&:focus {
			outline: none;
		}
	}
}

.vac-audio-message {
	margin-top: 3px;
}

.vac-file-message {
	display: flex;
	align-items: center;
	margin-top: 3px;

	span {
		max-width: 100%;
	}

	.vac-icon-file svg {
		margin-right: 5px;
	}
}

.vac-icon-edited {
	-webkit-box-align: center;
	align-items: center;
	display: -webkit-inline-box;
	display: inline-flex;
	justify-content: center;
	letter-spacing: normal;
	line-height: 1;
	text-indent: 0;
	vertical-align: middle;
	margin: 0 4px 2px;

	svg {
		height: 12px;
		width: 12px;
	}
}

.vac-options-container {
	margin-right: 10px;
	/* position: absolute;
	top: 2px;
	right: 10px;
	height: 40px;
	width: 70px;
	overflow: hidden;
	z-index: 1;
	border-top-right-radius: 8px; */
}

.vac-blur-container {
	/* position: absolute; */
	height: 100%;
	width: 100%;
	/* left: 8px; */
	/* bottom: 10px; */
	/* background: var(--chat-message-bg-color); */
	/* filter: blur(3px); */
	/* border-bottom-left-radius: 8px; */
}

.vac-options-me {
	background: var(--chat-message-bg-color-me);
}

.vac-options-image .vac-blur-container {
	background: rgba(255, 255, 255, 0.6);
	border-bottom-left-radius: 15px;
}

.vac-image-buttons {
	position: absolute;
	width: 100%;
	height: 100%;
	border-radius: 4px;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0) 55%,
		rgba(0, 0, 0, 0.02) 60%,
		rgba(0, 0, 0, 0.05) 65%,
		rgba(0, 0, 0, 0.1) 70%,
		rgba(0, 0, 0, 0.2) 75%,
		rgba(0, 0, 0, 0.3) 80%,
		rgba(0, 0, 0, 0.5) 85%,
		rgba(0, 0, 0, 0.6) 90%,
		rgba(0, 0, 0, 0.7) 95%,
		rgba(0, 0, 0, 0.8) 100%
	);

	svg {
		height: 26px;
		width: 26px;
	}

	.vac-button-view,
	.vac-button-download {
		position: absolute;
		bottom: 6px;
		left: 7px;
	}

	:first-child {
		left: 40px;
	}

	.vac-button-view {
		max-width: 18px;
		bottom: 8px;
	}
}

.vac-message-options {
	/* background: var(--chat-icon-bg-dropdown-message);
	border-radius: 50%; */
	background: none;
	position: absolute;
	top: 5px;
	right: 7px;

	svg {
		height: 17px;
		width: 17px;
		padding: 5px;
		margin: -5px;
	}
}

.vac-message-reactions {
	position: absolute;
	top: 6px;
	right: 30px;
}

.vac-menu-options {
	right: 15px;
}

.vac-menu-left {
	right: -118px;
}

.vac-icon-check {
	height: 14px;
	width: 14px;
	vertical-align: middle;
	margin: -3px -3px 0 3px;
}

.vac-button-reaction {
	display: inline-flex;
	align-items: center;
	border: var(--chat-message-border-style-reaction);
	outline: none;
	background: var(--chat-message-bg-color-reaction);
	border-radius: 4px;
	margin: 4px 2px 0;
	transition: 0.3s;
	padding: 0 5px;
	font-size: 18px;
	line-height: 23px;

	span {
		font-size: 11px;
		font-weight: 500;
		min-width: 7px;
		color: var(--chat-message-color-reaction-counter);
	}

	&:hover {
		border: var(--chat-message-border-style-reaction-hover);
		background: var(--chat-message-bg-color-reaction-hover);
		cursor: pointer;
	}
}

.vac-reaction-me {
	border: var(--chat-message-border-style-reaction-me);
	background: var(--chat-message-bg-color-reaction-me);

	span {
		color: var(--chat-message-color-reaction-counter-me);
	}

	&:hover {
		border: var(--chat-message-border-style-reaction-hover-me);
		background: var(--chat-message-bg-color-reaction-hover-me);
	}
}

@media only screen and (max-width: 1200px) {
	.vac-message-box {
		flex: 0 0 70%;
		max-width: 70%;
	}

	.vac-offset-current {
		margin-left: 30%;
	}
}

@media only screen and (max-width: 768px) {
	.vac-message-image {
		width: 100px;
		height: 100px;
	}
	.vac-message-container {
		padding: 2px 3px 1px;
	}

	.vac-message-container-offset {
		margin-top: 10px;
	}

	.vac-message-box {
		flex: 0 0 90%;
		max-width: 90%;
	}

	.vac-offset-current {
		margin-left: 10%;
	}

	.vac-options-container {
		right: 3px;
	}

	.vac-menu-left {
		right: -50px;
	}

	.vac-message-options {
		top: 2px;
		right: 2px;
	}
}
</style>
