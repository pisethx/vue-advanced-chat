<template>
	<div>
		<div class="vac-audio-player">
			<div class="vac-svg-button mr-2" @click="playback">
				<slot v-if="isPlaying" name="audio-pause-icon">
					<svg-icon name="audio-pause" />
				</slot>
				<slot v-else name="audio-play-icon">
					<svg-icon name="audio-play" />
				</slot>
			</div>
			<div class="d-flex flex-column">
				<div class="mt-1">
					<audio-control
						:percentage="progress"
						@change-linehead="onUpdateProgress"
						@hover-audio-progress="$emit('hover-audio-progress', $event)"
					/>

					<audio :id="playerUniqId" :src="audioSource" />
				</div>

				<div
					class="vac-progress-time d-flex align-center justify-space-between"
				>
					<div>{{ progressTime }}</div>
					<div>{{ duration }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import SvgIcon from './SvgIcon'
import AudioControl from './AudioControl'
export default {
	name: 'AudioPlayer',
	components: {
		SvgIcon,
		AudioControl
	},

	props: {
		src: { type: String, default: null },
		voicePlaybackRate: Number,
		shouldAutoplay: Boolean
	},
	data() {
		return {
			isAutoplaying: false,
			isPlaying: false,
			duration: this.convertTimeMMSS(0),
			playedTime: this.convertTimeMMSS(0),
			progress: 0,
			progressTime: this.convertTimeMMSS(0)
		}
	},
	computed: {
		playerUniqId() {
			return `audio-player${this._uid}`
		},
		audioSource() {
			if (this.src) return this.src
			this.resetProgress()
			return null
		}
	},
	mounted() {
		this.player = document.getElementById(this.playerUniqId)
		this.setPlaybackRate(this.voicePlaybackRate)

		this.player.addEventListener('ended', () => {
			this.isPlaying = false

			if (this.isAutoplaying) this.$emit('ended')
		})
		this.player.addEventListener('loadeddata', () => {
			this.resetProgress()
			this.duration = this.convertTimeMMSS(this.player.duration)
			this.updateProgressTime()
		})
		this.player.addEventListener('timeupdate', this.onTimeUpdate)
	},
	watch: {
		voicePlaybackRate: {
			handler: function (newValue) {
				this.setPlaybackRate(newValue)
			}
		},
		shouldAutoplay: {
			immediate: true,
			handler: function (newValue, oldValue) {
				if (!newValue && oldValue) {
					this.resetProgress()
					this.isAutoplaying = false

					return
				}

				if (newValue && !this.isPlaying && !this.isAutoplaying) {
					this.resetProgress()
					setTimeout(this.playVoice)
				}
			}
		}
	},
	methods: {
		playVoice() {
			this.player.play()
			this.isAutoplaying = true
			this.isPlaying = true
		},
		pauseVoice() {
			this.player.pause()
			this.isPlaying = false
		},
		setPlaybackRate(rate = 1) {
			if (!this.player) return
			const playbackRate = typeof rate === 'number' && rate > 0 ? rate : 1

			this.player.playbackRate = playbackRate
		},
		convertTimeMMSS(seconds) {
			const sec =
				typeof seconds === 'number' && seconds !== Infinity ? seconds : 0
			return new Date(sec * 1000).toISOString().substr(14, 5)
		},
		playback() {
			if (!this.audioSource) return

			if (this.isPlaying) this.pauseVoice()
			else {
				this.$emit('started')
				setTimeout(() => {
					this.playVoice()
				})
			}
		},
		resetProgress() {
			if (this.isPlaying) this.player.pause()
			if (this.player) this.player.currentTime = 0
			this.playedTime = this.convertTimeMMSS(0)
			this.progress = 0
			this.isPlaying = false
			this.updateProgressTime()
		},
		onTimeUpdate() {
			this.playedTime = this.convertTimeMMSS(this.player.currentTime)
			this.progress = (this.player.currentTime / this.player.duration) * 100
			this.updateProgressTime()
		},
		onUpdateProgress(pos) {
			if (pos) this.player.currentTime = pos * this.player.duration
		},
		updateProgressTime() {
			this.progressTime =
				this.progress > 1 ? this.playedTime : this.convertTimeMMSS(0)
		}
	}
}
</script>

<style lang="scss">
.vac-audio-player {
	display: flex;
	margin: 6px 0 0px;
	.vac-svg-button {
		max-width: 18px;
		margin-left: 7px;
	}
}

.vac-progress-time {
	float: left;
	margin: 8px 4px 0px 8px;
	color: var(--chat-color);
	font-size: 11px;
}

@media only screen and (max-width: 768px) {
	.vac-audio-player {
		margin: 8px 0 0px;
		.vac-svg-button {
			max-width: 16px;
			margin-left: 5px;
		}
	}

	.vac-progress-time {
		margin: 5px 4px 0px 8px;
	}
}
</style>