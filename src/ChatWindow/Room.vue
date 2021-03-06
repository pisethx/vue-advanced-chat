<template>
	<div
		class="vac-col-messages"
		v-show="(isMobile && !showRoomsList) || !isMobile || singleRoom"
	>
		<slot
			v-if="
				(!rooms.length && !loadingRooms) || (!room.roomId && !loadFirstRoom)
			"
			name="no-room-selected"
		>
			<div class="vac-container-center vac-room-empty">
				<div>{{ textMessages.ROOM_EMPTY }}</div>
			</div>
		</slot>
		<div v-else class="vac-room-header vac-app-border-b">
			<slot name="room-header" v-bind="{ room, typingUsers, userStatus }">
				<div class="vac-room-wrapper">
					<div
						v-if="!singleRoom"
						class="vac-svg-button vac-toggle-button"
						:class="{ 'vac-rotate-icon': !showRoomsList && !isMobile }"
						@click="$emit('toggleRoomsList')"
					>
						<slot name="toggle-icon">
							<svg-icon name="toggle" />
						</slot>
					</div>
					<div
						class="vac-info-wrapper"
						:class="{ 'vac-item-clickable': roomInfo }"
						@click="$emit('roomInfo', room)"
					>
						<slot name="room-avatar" v-bind="{ room, isRoomHeader: true }">
							<div
								v-if="room.avatar"
								class="vac-room-avatar"
								:style="{ 'background-image': `url('${room.avatar}')` }"
							></div>
						</slot>
						<slot
							name="room-header-info"
							v-bind="{ room, typingUsers, userStatus }"
						>
							<div class="vac-text-ellipsis">
								<div class="vac-room-name vac-text-ellipsis">
									{{ room.roomName }}
								</div>
								<div v-if="typingUsers" class="vac-room-info vac-text-ellipsis">
									<div class="vac-state-circle vac-state-online mr-3"></div>
									{{ typingUsers }}
								</div>
								<div v-else class="vac-room-info vac-text-ellipsis">
									<div class="vac-state-circle vac-state-online mr-3"></div>
									{{ userStatus }}
								</div>
							</div>
						</slot>
					</div>
					<div v-if="room.roomId" class="d-flex align-center">
						<slot
							name="voice-playback-rate"
							v-bind="{ isVoicePlaying: !!autoplayVoiceMessageId }"
						></slot>
						<div
							class="vac-svg-button vac-room-options"
							v-if="menuActions.length"
							@click="menuOpened = !menuOpened"
						>
							<slot name="menu-icon">
								<svg-icon name="menu" />
							</slot>
						</div>
						<transition name="vac-slide-left" v-if="menuActions.length">
							<div
								v-if="menuOpened"
								v-click-outside="closeMenu"
								class="vac-menu-options"
							>
								<div class="vac-menu-list">
									<div v-for="action in menuActions" :key="action.name">
										<div
											class="vac-menu-item"
											@click="menuActionHandler(action)"
										>
											{{ action.title }}
										</div>
									</div>
								</div>
							</div>
						</transition>
					</div>
				</div>
			</slot>
		</div>
		<div ref="scrollContainer" class="vac-container-scroll">
			<slot name="chat-loader">
				<loader :show="loadingMessages"></loader>
			</slot>
			<div class="vac-messages-container">
				<div :class="{ 'vac-messages-hidden': loadingMessages }">
					<transition name="vac-fade-message">
						<div class="vac-text-started" v-if="showNoMessages">
							<slot name="messages-empty">
								{{ textMessages.MESSAGES_EMPTY }}
							</slot>
						</div>
						<div class="vac-text-started" v-if="showMessagesStarted">
							{{ textMessages.CONVERSATION_STARTED }} {{ messages[0].date }}
						</div>
					</transition>
					<transition name="vac-fade-message">
						<slot
							name="infinite-loading"
							v-bind="{ loadMoreMessages, messages }"
						>
							<infinite-loading
								v-if="messages.length"
								v-show="hasCursor"
								spinner="spiral"
								direction="top"
								@infinite="loadMoreMessages"
							>
								<div slot="spinner">
									<loader :show="true" :infinite="true"></loader>
								</div>
								<div slot="no-results"></div>
								<div slot="no-more"></div>
							</infinite-loading>
						</slot>
					</transition>
					<transition-group name="vac-fade-message">
						<div v-for="(message, i) in messages" :key="message._id">
							<message
								:currentUserId="currentUserId"
								:message="message"
								:index="i"
								:shouldAutoplay="autoplayVoiceMessageId === message._id"
								:voicePlaybackRate="voicePlaybackRate"
								:messages="messages"
								:editedMessage="editedMessage"
								:messageActions="messageActions"
								:roomUsers="room.users"
								:textMessages="textMessages"
								:roomFooterRef="$refs.roomFooter"
								:newMessages="newMessages"
								:showReactionEmojis="showReactionEmojis"
								:showNewMessagesDivider="showNewMessagesDivider"
								:textFormatting="textFormatting"
								:emojisList="emojisList"
								:hideOptions="hideOptions"
								:room="room"
								:mentionRegex="mentionRegex"
								@messageActionHandler="messageActionHandler"
								@openFile="openFile"
								@routeClick="$emit('routeClick', $event)"
								@addNewMessage="addNewMessage"
								@sendMessageReaction="sendMessageReaction"
								@hideOptions="hideOptions = $event"
								@voiceEnded="onVoiceEnded(message)"
								@voiceStarted="onVoiceStarted(message)"
							>
								<template
									v-for="(index, name) in $scopedSlots"
									v-slot:[name]="data"
								>
									<slot :name="name" v-bind="data"></slot>
								</template>
							</message>
						</div>
					</transition-group>
					<slot name="typing" v-bind:scrollToBottom="scrollToBottom"></slot>
				</div>
			</div>
		</div>
		<div v-if="!loadingMessages">
			<transition name="vac-bounce">
				<div class="vac-icon-scroll" v-if="scrollIcon" @click="scrollToBottom">
					<slot name="scroll-icon">
						<svg-icon name="dropdown" param="scroll" />
					</slot>
				</div>
			</transition>
		</div>
		<div
			ref="roomFooter"
			class="vac-room-footer"
			v-if="Object.keys(room).length"
		>
			<transition name="vac-slide-up">
				<div v-if="messageReply" class="vac-reply-container">
					<div class="vac-reply-box">
						<template v-for="(file, idx) in messageReply.file">
							<img
								v-if="isMediaCheck(file)"
								:key="idx"
								:src="file.thumb"
								class="vac-image-reply"
							/>
						</template>
						<div class="vac-reply-info">
							<div class="vac-reply-username">{{ messageReply.username }}</div>
							<div class="vac-reply-content" v-if="messageReply.content">
								<!-- {{ messageReply.content }} -->

								<format-message
									:isRoute="messageReply.isRoute"
									:content="messageReply.content"
									:textFormatting="textFormatting"
									:mentionRegex="mentionRegex"
								>
								</format-message>
							</div>
						</div>
					</div>

					<div class="vac-icon-reply">
						<div class="vac-svg-button" @click="resetMessage">
							<slot name="reply-close-icon">
								<svg-icon name="close-outline" />
							</slot>
						</div>
					</div>
				</div>
			</transition>

			<div class="d-flex flex-column">
				<div
					v-if="imageFile.length || file.length"
					class="d-flex vac-uploaded-file pa-2"
					style="position: relative; overflow-y: scroll"
				>
					<template class="vac-image-container" v-if="imageFile.length">
						<div
							v-for="(img, idx) in imageFile"
							:key="idx"
							style="position: relative"
						>
							<div
								class="vac-svg-button vac-icon-image"
								@click="resetImageFile(idx)"
							>
								<slot name="image-close-icon">
									<svg-icon name="close" param="image" />
								</slot>
							</div>
							<img
								ref="imageFile"
								:src="img"
								@load="onImgLoad(idx)"
								:class="{ 'pr-1': idx !== imageFile.length - 1 }"
								class="image-preview"
							/>
						</div>
					</template>

					<!-- class="vac-file-container"
						:class="{ 'vac-file-container-edit': editedMessage._id }" -->
					<template v-else-if="file.length">
						<div v-for="({ name }, i) in file" :key="i" class="d-flex ma-1">
							<div class="vac-icon-file">
								<slot name="file-icon">
									<svg-icon name="file" />
								</slot>
							</div>
							<!-- <div class="vac-file-message" v-if="file && file.audio">audio</div> -->
							<div class="vac-file-message">{{ name }}</div>
							<div
								class="vac-svg-button vac-icon-remove"
								@click="resetFile(idx)"
							>
								<slot name="file-close-icon">
									<svg-icon name="close" />
								</slot>
							</div>
						</div>
					</template>
				</div>

				<div class="vac-box-footer">
					<div class="vac-icon-textarea-left">
						<div
							v-if="showFiles"
							class="vac-svg-button"
							v-bind:room="room"
							@click="launchFilePicker"
						>
							<slot name="paperclip-icon">
								<svg-icon name="paperclip" />
							</slot>
						</div>
						<input
							v-if="showFiles"
							type="file"
							ref="file"
							@change="onFileChange($event.target.files)"
							multiple
							style="display: none"
						/>
					</div>

					<!-- imageFile.length
							? imageContainerHeight + 8 + 'px'
							: '8px' -->
					<!-- v-show="file.length || imageFile.length" -->

					<textarea
						ref="roomTextarea"
						:placeholder="textMessages.TYPE_MESSAGE"
						class="vac-textarea"
						:class="{
							'vac-textarea-outline': editedMessage._id
						}"
						:style="{
							'min-height': '20px',
							'padding-top': '8px'
						}"
						v-model="message"
						@input="onChangeInput"
						@keydown.esc="resetMessage"
						@keydown.enter.exact.prevent=""
					></textarea>

					<slot
						name="textarea"
						v-bind="{
							textMessages,
							editedMessage,
							message,
							onChangeInput,
							resetMessage
						}"
					></slot>

					<div class="vac-icon-textarea">
						<div
							class="vac-svg-button"
							v-if="editedMessage._id"
							@click="resetMessage"
						>
							<slot name="edit-close-icon">
								<svg-icon name="close-outline" />
							</slot>
						</div>

						<emoji-picker
							v-if="showEmojis && (!file || imageFile)"
							:emojiOpened="emojiOpened"
							:positionTop="true"
							@addEmoji="addEmoji"
							@openEmoji="emojiOpened = $event"
						>
							<template v-slot:emoji-picker-icon>
								<slot name="emoji-picker-icon"></slot>
							</template>
						</emoji-picker>

						<div
							v-if="canRecordAudio"
							class="vac-svg-button"
							@click="recordAudio"
						>
							<slot
								v-if="recorder.state === 'recording'"
								name="microphone-off-icon"
								v-bind:room="room"
							>
								<svg-icon
									name="microphone-off"
									class="vac-icon-microphone-off"
								/>
							</slot>
							<slot
								v-else
								name="microphone-icon"
								v-bind:disabled="!!imageFile.length"
								v-bind:room="room"
							>
								<svg-icon name="microphone" class="vac-icon-microphone" />
							</slot>
						</div>

						<div
							v-if="textareaAction"
							@click="textareaActionHandler"
							class="vac-svg-button"
						>
							<slot name="custom-action-icon">
								<svg-icon name="deleted" />
							</slot>
						</div>

						<div
							v-if="showSendIcon"
							@click="sendMessage"
							class="vac-svg-button"
						>
							<slot
								name="send-icon"
								v-bind:disabled="inputDisabled"
								v-bind:room="room"
							>
								<svg-icon
									name="send"
									:param="inputDisabled ? 'disabled' : ''"
								/>
							</slot>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import AudioRecorder from 'audio-recorder-polyfill'
import FormatMessage from './FormatMessage'
import InfiniteLoading from 'vue-infinite-loading'
import vClickOutside from 'v-click-outside'
import emojis from 'vue-emoji-picker/src/emojis'

import Loader from './Loader'
import Message from './Message'
import SvgIcon from './SvgIcon'
import EmojiPicker from './EmojiPicker'

const { messagesValid } = require('../utils/roomValidation')
const { detectMobile, iOSDevice } = require('../utils/mobileDetection')
import typingText from '../utils/typingText'

export default {
	name: 'room',
	components: {
		FormatMessage,
		InfiniteLoading,
		Loader,
		Message,
		SvgIcon,
		EmojiPicker
	},

	directives: {
		clickOutside: vClickOutside.directive
	},

	props: {
		currentUserId: { type: [String, Number], required: true },
		textMessages: { type: Object, required: true },
		singleRoom: { type: Boolean, required: true },
		showRoomsList: { type: Boolean, required: true },
		isMobile: { type: Boolean, required: true },
		rooms: { type: Array, required: true },
		roomId: { type: [String, Number], required: true },
		loadFirstRoom: { type: Boolean, required: true },
		messages: { type: Array, required: true },
		roomMessage: { type: String },
		messagesLoaded: { type: Boolean, required: true },
		menuActions: { type: Array, required: true },
		messageActions: { type: Array, required: true },
		showSendIcon: { type: Boolean, required: true },
		showFiles: { type: Boolean, required: true },
		showAudio: { type: Boolean, required: true },
		showEmojis: { type: Boolean, required: true },
		showReactionEmojis: { type: Boolean, required: true },
		showNewMessagesDivider: { type: Boolean, required: true },
		autoplayVoiceChat: { type: Boolean, required: true },
		voicePlaybackRate: Number,
		hasCursor: { type: Boolean, required: true },
		textFormatting: { type: Boolean, required: true },
		loadingRooms: { type: Boolean, required: true },
		roomInfo: { type: Function },
		textareaAction: { type: Function },
		mentionRegex: RegExp
	},

	data() {
		return {
			canRecordAudio: true,
			message: '',
			editedMessage: {},
			messageReply: null,
			infiniteState: null,
			loadingMessages: false,
			loadingMoreMessages: false,
			file: [],
			imageFile: [],
			imageDimensions: [],
			menuOpened: false,
			emojiOpened: false,
			emojisList: {},
			hideOptions: true,
			scrollIcon: false,
			newMessages: [],
			recorderStream: {},
			recorder: {},
			recordedChunks: [],

			autoplayVoiceMessageId: null
		}
	},

	mounted() {
		this.newMessages = []

		window.addEventListener('keyup', e => {
			if (e.keyCode === 13 && !e.shiftKey) {
				if (detectMobile()) {
					this.message = this.message + '\n'
					setTimeout(() => this.onChangeInput(), 0)
				} else {
					this.sendMessage()
				}
			}
		})

		this.$refs.scrollContainer.addEventListener('scroll', e => {
			this.hideOptions = true
			setTimeout(() => {
				if (!e.target) return

				const { scrollHeight, clientHeight, scrollTop } = e.target
				const bottomScroll = scrollHeight - clientHeight - scrollTop

				this.scrollIcon = bottomScroll > 1000
			}, 200)
		})

		const emojisTable = Object.keys(emojis).map(key => emojis[key])
		this.emojisList = Object.assign({}, ...emojisTable)
	},

	watch: {
		loadingMessages(val) {
			if (val) this.infiniteState = null
			else this.focusTextarea(true)
		},
		room(newVal, oldVal) {
			if (newVal.roomId && newVal.roomId !== oldVal.roomId) {
				this.loadingMessages = true
				this.scrollIcon = false
				this.resetMessage(true)
				if (this.roomMessage) {
					this.message = this.roomMessage
					setTimeout(() => this.onChangeInput(), 0)
				}
			}
		},
		roomMessage: {
			immediate: true,
			handler(val) {
				if (val) this.message = this.roomMessage
			}
		},
		messages(newVal, oldVal) {
			newVal.forEach(message => {
				if (!messagesValid(message)) {
					throw 'Messages object is not valid! Must contain _id[String, Number], content[String, Number] and sender_id[String, Number]'
				}
			})

			const element = this.$refs.scrollContainer
			if (!element) return

			if (oldVal && newVal && oldVal.length === newVal.length - 1) {
				this.loadingMessages = false

				return setTimeout(() => {
					const options = { top: element.scrollHeight, behavior: 'smooth' }
					element.scrollTo(options)
				}, 50)
			}

			if (this.infiniteState) {
				this.infiniteState.loaded()
				setTimeout(() => (this.loadingMoreMessages = false), 0)
			} else if (newVal.length) {
				setTimeout(() => {
					element.scrollTo({ top: element.scrollHeight })
					this.loadingMessages = false
				}, 0)
			}
		},
		messagesLoaded(val) {
			if (val) this.loadingMessages = false
			if (this.infiniteState) this.infiniteState.complete()
		}
	},

	computed: {
		refRoomTextarea() {
			return this.$scopedSlots.roomTextarea?.() || this.$refs['roomTextarea']
		},
		room() {
			return this.rooms.find(room => room.roomId === this.roomId) || {}
		},
		showNoMessages() {
			return (
				this.room.roomId &&
				!this.messages.length &&
				!this.loadingMessages &&
				!this.loadingRooms
			)
		},
		showMessagesStarted() {
			return this.messages.length && this.messagesLoaded
		},
		inputDisabled() {
			return this.isMessageEmpty()
		},
		typingUsers() {
			return typingText(this.room, this.currentUserId, this.textMessages)
		},
		userStatus() {
			return this.room.online ? this.textMessages.IS_ONLINE : ''
			// if (!this.room.users || this.room.users.length !== 2) return

			// const user = this.room.users.find(u => u._id !== this.currentUserId)

			// if (!user.status) return

			// let text = ''

			// if (user.status.state === 'online') {
			// 	text = this.textMessages.IS_ONLINE
			// } else if (user.status.last_changed) {
			// 	text = this.textMessages.LAST_SEEN + user.status.last_changed
			// }

			// return text
		}
	},

	methods: {
		onVoiceStarted(voiceMessage) {
			if (!this.autoplayVoiceChat) return

			this.autoplayVoiceMessageId = voiceMessage._id
		},
		onVoiceEnded(voiceMessage) {
			if (!this.autoplayVoiceChat) return

			this.autoplayVoiceMessageId = this.messages.find(
				message => message._id > voiceMessage._id && message.file?.[0]?.audio
			)?._id
		},
		onImgLoad(idx) {
			let ref = this.$refs.imageFile[idx]
			let height = ref.height
			if (height < 30) height = 30

			this.imageDimensions[idx] = {
				height: ref.height - 10,
				width: ref.width + 26
			}
		},
		async recordAudio() {
			if (this.recorder.state === 'recording') {
				this.recorder.stop()
			} else {
				this.file = []
				this.recordedChunks = []
				this.recordedChunk = await this.startRecording()
			}
		},
		onRecordingError(e) {
			return Promise.reject(
				e || new Error('Audio Recording is not supported on your device.')
			)
		},
		async initRecorder() {
			window.MediaRecorder = MediaRecorder.isTypeSupported
				? window.MediaRecorder
				: AudioRecorder

			if (navigator.mediaDevices === undefined) {
				navigator.mediaDevices = {}
			}

			if (navigator.mediaDevices.getUserMedia === undefined) {
				navigator.mediaDevices.getUserMedia = function (constraints) {
					var getUserMedia =
						navigator.webkitGetUserMedia || navigator.mozGetUserMedia
					if (!getUserMedia) {
						return Promise.reject(
							new Error('getUserMedia is not implemented in this browser')
						)
					}

					return new Promise(function (resolve, reject) {
						getUserMedia.call(navigator, constraints, resolve, reject)
					})
				}
			}

			const stream = await navigator.mediaDevices
				.getUserMedia({
					audio: true,
					video: false
				})
				.catch(e => {
					this.onRecordingError(e)
					return null
				})

			return stream
		},
		async startRecording() {
			const stream = await this.initRecorder()
			this.canRecordAudio = !!stream

			const MIME_TYPE = {
				webm: 'audio/webm;codecs=opus',
				mp4: 'audio/mp4'
			}

			let mimeType

			if (!MediaRecorder.isTypeSupported) mimeType = null
			else if (MediaRecorder.isTypeSupported(MIME_TYPE.webm))
				mimeType = MIME_TYPE.webm
			else if (MediaRecorder.isTypeSupported(MIME_TYPE.mp4))
				mimeType = MIME_TYPE.mp4

			this.recorder = new MediaRecorder(
				stream,
				mimeType ? { mimeType } : undefined
			)

			this.recorder.ondataavailable = e => this.recordedChunks.push(e.data)
			this.recorder.start()

			const stopped = new Promise((resolve, reject) => {
				this.recorder.onstop = resolve
				this.recorder.onerror = event => {
					return reject(event.name)
				}
			})

			stopped
				.then(async e => {
					stream.getTracks().forEach(track => track.stop())

					const blob = new Blob(this.recordedChunks, { type: mimeType })

					// let duration

					// try {
					// 	duration = await this.getBlobDuration(blob)
					// } catch (e) {
					// 	duration = null
					// }

					this.file.push({
						blob: blob,
						name: 'audio',
						size: blob.size,
						// duration: duration,
						type: blob.type,
						audio: true,
						localUrl: URL.createObjectURL(blob)
					})

					if (this.file?.length) this.sendMessage()
				})
				.catch(e => {})
		},
		getBlobDuration(blob) {
			const tempVideoEl = document.createElement('video')

			const durationP = new Promise(resolve =>
				tempVideoEl.addEventListener('loadedmetadata', () => {
					if (tempVideoEl.duration === Infinity) {
						tempVideoEl.currentTime = Number.MAX_SAFE_INTEGER
						tempVideoEl.ontimeupdate = () => {
							tempVideoEl.ontimeupdate = null
							resolve(tempVideoEl.duration)
							tempVideoEl.currentTime = 0
						}
					} else resolve(tempVideoEl.duration)
				})
			)

			tempVideoEl.src =
				typeof blob === 'string' || blob instanceof String
					? blob
					: window.URL.createObjectURL(blob)

			return durationP
		},
		addNewMessage(message) {
			this.newMessages.push(message)
		},
		resetMessage(disableMobileFocus = null, editFile = null, idx) {
			this.$emit('typingMessage', null)

			if (!isNaN(idx)) {
				this.file.splice(idx, 1)
				this.imageFile.splice(idx, 1)
			} else {
				this.file = []
				this.imageFile = []
			}

			if (editFile) {
				this.file = []
				this.message = ''
				return
			}

			this.resetTextareaSize()
			this.message = ''
			this.editedMessage = {}
			this.messageReply = null
			this.imageDimensions = []
			this.emojiOpened = false
			setTimeout(() => this.focusTextarea(disableMobileFocus), 0)
		},
		resetImageFile(idx) {
			if (!isNaN(idx)) this.imageFile.splice(idx, 1)
			else this.imageFile = []

			this.imageDimensions = []
			this.editedMessage.file = null
			this.file = []
			this.focusTextarea()
			setTimeout(() => this.resizeTextarea(), 0)
		},
		resetFile(idx) {
			if (!isNaN(idx)) this.file.splice(idx, 1)
			else this.file = []

			this.focusTextarea()
			setTimeout(() => this.resizeTextarea(), 0)
		},
		resetTextareaSize() {
			this.$nextTick(() => {
				const el = this.refRoomTextarea ?? this.$refs['roomTextarea']
				if (!el) return
				el.style.height = '20px'
			})
		},
		focusTextarea(disableMobileFocus) {
			if (detectMobile() && disableMobileFocus) return
			if (!this.refRoomTextarea) return
			this.refRoomTextarea.focus()
		},
		isMessageEmpty() {
			return !this.file?.length && !this.message.trim()
		},
		sendMessage() {
			if (!this.file?.length && !this.message.trim()) return

			if (this.editedMessage._id) {
				if (this.editedMessage.content !== this.message || this.file) {
					this.$emit('editMessage', {
						messageId: this.editedMessage._id,
						newContent: this.message.trim(),
						// file: this.file,
						replyMessage: this.messageReply
					})
				}
			} else {
				this.$emit('sendMessage', {
					content: this.message.trim(),
					file: this.file,
					replyMessage: this.messageReply
				})
			}

			this.resetMessage()
		},
		loadMoreMessages(infiniteState) {
			setTimeout(
				() => {
					if (this.loadingMoreMessages) return

					if (this.messagesLoaded || !this.room.roomId) {
						return infiniteState.complete()
					}

					this.infiniteState = infiniteState
					this.$emit('fetchMessages')
					this.loadingMoreMessages = true
				},
				// prevent scroll bouncing issue on iOS devices
				iOSDevice() ? 500 : 0
			)

			// if (this.loadingMoreMessages) return

			// if (this.messagesLoaded || !this.room.roomId) {
			// 	return infiniteState.complete()
			// }

			// this.infiniteState = infiniteState
			// this.$emit('fetchMessages')
			// this.loadingMoreMessages = true
		},
		messageActionHandler({ action, message }) {
			switch (action.name) {
				case 'replyMessage':
					return this.replyMessage(message)
				case 'editMessage':
					return this.editMessage(message)
				case 'deleteMessage':
					return this.$emit('deleteMessage', message)
				default:
					return this.$emit('messageActionHandler', { action, message })
			}
		},
		sendMessageReaction(messageReaction) {
			this.$emit('sendMessageReaction', messageReaction)
		},
		replyMessage(message) {
			this.resetMessage()
			this.messageReply = message
		},
		editMessage(message) {
			this.resetMessage()
			this.editedMessage = { ...message }
			// this.file = message.file
			// if (this.isMediaCheck(this.file)) this.imageFile = message.file.url
			this.message = message.content

			this.$emit('startEditingMessage', this.editedMessage)

			setTimeout(() => this.resizeTextarea(), 0)
		},
		scrollToBottom() {
			const element = this.$refs.scrollContainer
			element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
		},
		onChangeInput() {
			this.resizeTextarea()
			this.$emit('typingMessage', this.message)
		},
		resizeTextarea() {
			this.$nextTick(() => {
				const el = this.refRoomTextarea ?? this.$refs['roomTextarea']

				if (!el) return

				const padding = window
					.getComputedStyle(el, null)
					.getPropertyValue('padding-top')
					.replace('px', '')

				el.style.height = 0
				el.style.height = el.scrollHeight - padding * 2 + 'px'
			})
		},
		addEmoji(emoji) {
			this.message += emoji.icon
			this.focusTextarea(true)
		},
		launchFilePicker() {
			this.$refs.file.value = ''
			this.$refs.file.click()
		},
		getVideoThumbnail(file, seekTo = 0.0) {
			return new Promise((resolve, reject) => {
				// load the file to a video player
				const videoPlayer = document.createElement('video')
				videoPlayer.setAttribute('src', URL.createObjectURL(file))
				videoPlayer.load()
				videoPlayer.addEventListener('error', ex => {
					reject('error when loading video file', ex)
				})
				// load metadata of the video to get video duration and dimensions
				videoPlayer.addEventListener('loadedmetadata', () => {
					// seek to user defined timestamp (in seconds) if possible
					if (videoPlayer.duration < seekTo) {
						reject('video is too short.')
						return
					}
					// delay seeking or else 'seeked' event won't fire on Safari
					setTimeout(() => {
						videoPlayer.currentTime = seekTo
					}, 200)
					// extract video thumbnail once seeking is complete
					videoPlayer.addEventListener('seeked', () => {
						// define a canvas to have the same dimension as the video
						const canvas = document.createElement('canvas')
						canvas.width = videoPlayer.videoWidth
						canvas.height = videoPlayer.videoHeight
						// draw the video frame to canvas
						const ctx = canvas.getContext('2d')
						ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height)
						// return the canvas image as a blob
						ctx.canvas.toBlob(
							blob => {
								resolve(blob)
							},
							'image/jpeg',
							0.75 /* quality */
						)
					})
				})
			})
		},
		createBlobFile(fileObject) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = e => {
					resolve(e.target.result)
				}

				reader.readAsDataURL(fileObject)
			})
		},
		async readAsBlob(fileObj) {
			// const fileURL = URL.createObjectURL(fileObj)
			// const blobFile = await fetch(fileURL).then((res) => res.blob())
			return new Blob([fileObj], { type: fileObj.type })
		},
		async onFileChange(files) {
			this.resetImageFile()
			// const file = files[0]
			for (let file of Object.values(files)) {
				try {
					const blobFile = await this.readAsBlob(file)
					const blob = file.type.startsWith('video/')
						? await this.getVideoThumbnail(file)
						: blobFile
					const fileURL = await this.createBlobFile(blob)

					const formattedFile = {
						blob: blobFile,
						name: file.name,
						size: file.size,
						type: file.type,
						localUrl: fileURL
					}
					this.file.push(formattedFile)

					if (this.isMediaCheck(formattedFile)) this.imageFile.push(fileURL)
				} catch (e) {
					return e
				}
			}
		},
		isMediaCheck(file) {
			if (!file) return false
			const imageTypes = ['png', 'jpg', 'jpeg', 'svg', 'mp4']
			const { type } = file
			return imageTypes.some(t => type.toLowerCase().includes(t))
		},
		openFile({ message, action, idx }) {
			this.$emit('openFile', { message, action, idx })
		},
		menuActionHandler(action) {
			this.closeMenu()
			this.$emit('menuActionHandler', action)
		},
		closeMenu() {
			this.menuOpened = false
		},
		textareaActionHandler() {
			this.$emit('textareaActionHandler', this.message)
		}
	}
}
</script>

<style lang="scss"  scoped>
.image-preview {
	width: 100px;
	height: 100px;
	object-fit: cover;
}
.vac-container-center {
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
}

.vac-room-empty {
	font-size: 14px;
	color: #9ca6af;
	font-style: italic;
	line-height: 20px;
	white-space: pre-line;

	div {
		padding: 0 10%;
	}
}

.vac-col-messages {
	position: relative;
	height: 100%;
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-flow: column;
}

.vac-room-header {
	position: absolute;
	display: flex;
	align-items: center;
	height: 64px;
	width: 100%;
	z-index: 7;
	margin-right: 1px;
	background: var(--chat-header-bg-color);
	border-top-right-radius: var(--chat-container-border-radius);
}

.vac-room-wrapper {
	display: flex;
	align-items: center;
	min-width: 0;
	height: 100%;
	width: 100%;
	padding: 0 16px;
}

.vac-info-wrapper {
	display: flex;
	align-items: center;
	min-width: 0;
	width: 100%;
	height: 100%;
}

.vac-toggle-button {
	margin-right: 15px;

	svg {
		height: 26px;
		width: 26px;
	}
}

.vac-rotate-icon {
	transform: rotate(180deg) !important;
}

.vac-room-name {
	font-size: 17px;
	font-weight: 500;
	line-height: 22px;
	color: var(--chat-header-color-name);
}

.vac-room-info {
	font-size: 13px;
	line-height: 18px;
	color: var(--chat-header-color-info);
}

.vac-room-options {
	margin-left: auto;
}

.vac-container-scroll {
	background: var(--chat-content-bg-color);
	flex: 1;
	overflow-y: scroll;
	margin-right: 1px;
	margin-top: 60px;
	-webkit-overflow-scrolling: touch;
}

.vac-messages-container {
	padding: 0 5px 5px;
}

.vac-text-started {
	font-size: 14px;
	color: var(--chat-message-color-started);
	font-style: italic;
	text-align: center;
	margin-top: 30px;
	margin-bottom: 20px;
}

.vac-icon-scroll {
	position: absolute;
	bottom: 80px;
	right: 20px;
	padding: 8px;
	background: var(--chat-bg-scroll-icon);
	border-radius: 50%;
	box-shadow: 0 1px 1px -1px rgba(0, 0, 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14),
		0 1px 2px 0 rgba(0, 0, 0, 0.12);
	display: flex;
	cursor: pointer;
	z-index: 7;

	svg {
		height: 25px;
		width: 25px;
	}
}

.vac-room-footer {
	width: calc(100% - 1px);
	border-bottom-right-radius: 4px;
	z-index: 7;
}

.vac-box-footer {
	display: flex;
	align-items: flex-end;
	position: relative;
	background: var(--chat-footer-bg-color);
	padding: 10px 8px 10px;
}

.vac-reply-container {
	display: flex;
	padding: 10px 10px 0 10px;
	background: var(--chat-content-bg-color);
	align-items: center;
	max-width: 100%;

	.vac-reply-box {
		width: 100%;
		background: var(--chat-footer-bg-color-reply);
		border-radius: 4px;
		padding: 8px 10px;
		display: flex;
		flex-wrap: wrap;
	}

	.vac-reply-info {
		overflow: hidden;
	}

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

	.vac-icon-reply {
		margin-left: 10px;

		svg {
			height: 20px;
			width: 20px;
		}
	}

	.vac-image-reply {
		height: 70px;
		width: 70px;
		object-fit: cover;
		margin: 4px;
	}
}

.vac-textarea {
	height: 20px;
	width: 100%;
	line-height: 20px;
	overflow: hidden;
	outline: 0;
	resize: none;
	border-radius: 20px;
	padding: 8px 16px;
	box-sizing: content-box;
	font-size: 16px;
	background: var(--chat-bg-color-input);
	color: var(--chat-color);
	caret-color: var(--chat-color-caret);
	border: var(--chat-border-style-input);

	&::placeholder {
		color: var(--chat-color-placeholder);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.vac-textarea-outline {
	border: 1px solid var(--chat-border-color-input-selected);
	box-shadow: inset 0px 0px 0px 1px var(--chat-border-color-input-selected);
}

.vac-icon-textarea-left {
	display: flex;
	align-items: center;
	margin: 0 5px;

	svg,
	.vac-wrapper {
		margin: 0 7px;
	}
}

.vac-icon-textarea {
	display: flex;
	align-items: center;
	margin: 0 0 0 5px;

	svg,
	.vac-wrapper {
		margin: 0 7px;
	}
}

.vac-icon-microphone {
	fill: var(--chat-icon-color-microphone);
}

.vac-icon-microphone-off {
	animation: vac-scaling 0.8s ease-in-out infinite alternate;
}

@keyframes vac-scaling {
	0% {
		transform: scale(1);
	}
	100% {
		transform: scale(1.2);
	}
}

.vac-image-container {
	display: flex;
	overflow-y: scroll;
	/* position: absolute; */
	max-width: 100%;
	/* left: 74px;
	top: 18px; */
}

.vac-image-file {
	display: flex;
	justify-content: center;
	/* flex-direction: column; */

	img {
		border-radius: 15px;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.vac-icon-image {
	position: absolute;
	top: 6px;
	left: 6px;
	z-index: 7;

	svg {
		height: 20px;
		width: 20px;
		border-radius: 50%;
	}

	&:before {
		content: ' ';
		position: absolute;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
		z-index: -1;
	}
}

.vac-file-container {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	width: calc(100% - 110px);
	min-height: 20px;
	margin-top: 6px;
	padding: 12px 0;
	box-sizing: content-box;
	background: var(--chat-bg-color-input);
	border: var(--chat-border-style-input);
	border-radius: 20px;
}

.vac-file-container-edit {
	width: calc(100% - 109px);
}

.vac-file-message {
	max-width: calc(100% - 75px);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.vac-icon-file {
	display: flex;
	margin: 0 10px;
	/* margin: 0 8px 0 15px; */
}

.vac-icon-remove {
	margin-left: 8px;

	svg {
		height: 18px;
		width: 18px;
	}
}

.vac-send-disabled,
.vac-send-disabled svg {
	cursor: none !important;
	pointer-events: none !important;
	transform: none !important;
}

.vac-messages-hidden {
	opacity: 0;
}

@media only screen and (max-width: 768px) {
	.vac-room-header {
		height: 50px;

		.vac-room-wrapper {
			padding: 0 10px;
		}

		.vac-room-name {
			font-size: 16px;
			line-height: 22px;
		}

		.vac-room-info {
			font-size: 12px;
			line-height: 16px;
		}

		.vac-room-avatar {
			height: 37px;
			width: 37px;
			min-height: 37px;
			min-width: 37px;
		}
	}

	.vac-container-scroll {
		margin-top: 50px;
	}

	.vac-box-footer {
		border-top: var(--chat-border-style-input);
		padding: 7px 2px 7px 7px;
	}

	.vac-text-started {
		margin-top: 20px;
	}

	.vac-textarea {
		padding: 7px;
		line-height: 18px;
		margin-top: 0px;
		width: 99%;

		&::placeholder {
			color: transparent;
		}
	}

	.vac-icon-textarea-left {
		margin: 0px 5px 0 0;

		svg,
		.wrapper {
			margin: 0 5px;
		}
	}

	.vac-icon-textarea {
		margin: 0px 0 0 5px;

		svg,
		.wrapper {
			margin: 0 5px;
		}
	}

	.vac-image-container {
		/* top: 10px;
		left: 64px; */
	}

	.vac-image-file img {
		transform: scale(0.97);
	}

	.vac-room-footer {
		width: 100%;
	}

	.vac-file-container {
		padding: 7px 0;

		.icon-file {
			margin-left: 10px;
		}
	}

	.vac-reply-container {
		padding: 5px 8px;
	}

	.vac-icon-scroll {
		bottom: 70px;
	}
}
</style>
