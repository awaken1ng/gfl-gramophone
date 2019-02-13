<template lang="pug">
  div#app
    div.controls
      div.control-buttons
        span.previous.material-icons(v-on:click="onNextPrevButtonClick('previous')") skip_previous
        span.play.material-icons(v-on:click="onPlayButtonClick") {{ getPlayButtonIcon() }}
        span.stop.material-icons(v-on:click="stopPlayback") stop
        span.next.material-icons(v-on:click="onNextPrevButtonClick('next')") skip_next
        span.loop.material-icons(v-on:click="onLoopButtonClick"
                                v-bind:class="{ active: state.looping }") loop
      div.progress-bar
        vue-slider.seek-bar(tooltip="false"
                            width="100%"
                            ref="seekbar"
                            v-model="played"
                            v-bind:max="Math.ceil(duration)"
                            v-bind:processStyle="{ backgroundColor: '#ffaa00' }"
                            v-on:callback="onSeek")
        span.played {{ formatMMSS(played) }}
        | /
        span.duration {{ formatMMSS(duration) }}
    div.playlist
      div.item(v-for="(track, index) in playlist"
               v-bind:key="index"
               v-bind:class="{ playing: isPlaying(index), loading: isLoading(index) }"
               v-on:click="onPlaylistItemClick(index)")
        span.status.material-icons {{ getPlaybackStatusIcon(index) }}
        div.title
          div.name {{ track.title }}
          div.tags {{ track.tags ? typeof track.tags === 'string' ? track.tags : track.tags.join(', ') : '' }}
    div.footer
      p Girls' Frontline is Copyright SUNBORN Network Technology Co., Ltd.
      p All music and names owned and trademarked by SUNBORN Network Technology Co., Ltd. are property of SUNBORN Network Technology Co., Ltd.
</template>

<script>
import vueSlider from 'vue-slider-component'
import playlist from '#/assets/playlist.json'
import player from '#/player'

const sampleRate = 44100

export default {
  name: 'app',
  components: { vueSlider },
  data: function () {
    return {
      player: player,
      root: playlist.root, // root of audio files
      playlist: playlist.playlist,
      cache: {}, // cache of decoded audio data
      state: {
        nowPlaying: null, // track index
        lastPlayed: null, // index of last played track
        looping: true,
        isLoading: false,
        isPaused: false
      }
    }
  },
  computed: {
    played: {
      get: function () {
        let played = (this.player.progress.played || 0)
        return played
      },
      set: function (_) {}
    },
    duration: function () {
      let player = this.player
      let duration = 0
      if (player.source && player.source.buffer) {
        duration = player.source.buffer.duration
      }
      return duration
    }
  },
  methods: {
    // events
    onPlayButtonClick: function () {
      let playing = this.state.nowPlaying !== null
      let paused = this.state.isPaused

      if (playing && !paused) {
        this.player.pause()
        this.state.isPaused = true
      } else if (playing && paused) {
        this.player.resume()
        this.state.isPaused = false
      } else if (!playing && !paused) {
        let lastPlayed = (this.state.lastPlayed || 0)
        this.startPlayback(lastPlayed, 0)
      }
    },
    onNextPrevButtonClick: function (direction) {
      let isPlaying = this.state.nowPlaying !== null
      let track = (this.state.nowPlaying || this.state.lastPlayed || 0)

      if (!isPlaying && this.state.lastPlayed === null) {
        // if player state is fresh, play the first or the last track
        if (direction === 'next') {
          track = 0
        } else if (direction === 'previous') {
          track = this.playlist.length - 1
        }
      } else {
        if (direction === 'next') {
          // if we are at the end of the playlist, play the first track
          if (track < this.playlist.length - 1) {
            track += 1
          } else {
            track = 0
          }
        } else if (direction === 'previous') {
          // if we are at the start of the playlist, play the last track
          if (track > 0) {
            track -= 1
          } else {
            track = this.playlist.length - 1
          }
        }
      }

      this.startPlayback(track, 0)
    },
    onLoopButtonClick: function () {
      this.state.looping = !this.state.looping

      // update the currently playing track
      let nowPlaying = this.state.nowPlaying
      if (nowPlaying !== null) {
        let track = this.playlist[nowPlaying]
        this.player.setLoop({
          enabled: this.state.looping,
          start: track.loop.start / sampleRate,
          end: track.loop.end / sampleRate
        })
      }
    },
    onSeek: function (value) {
      this.player.seek(value)
    },
    onPlaylistItemClick: function (index) {
      // ignore the event if user clicked on the currently playing item
      if (this.state.nowPlaying === index) return
      this.startPlayback(index, 0)
    },

    // playback control
    startPlayback: function (trackIndex, position) {
      if (!position) position = 0

      let track = this.playlist[trackIndex]
      let url = this.root + '/' + track.path
      let player = this.player
      let state = this.state
      let cache = this.cache
      let stopPlayback = this.stopPlayback

      let callback = function (buffer) {
        // loop ranges are stored in samples, convert to seconds
        let loop = {
          enabled: state.looping,
          start: track.loop.start / sampleRate,
          end: track.loop.end / sampleRate
        }
        player.stop()
        player.set(buffer, loop)
        player.play(position, { stop: function () { stopPlayback() } })
        state.nowPlaying = trackIndex
        state.lastPlayed = trackIndex
      }

      // pull the track from cache,
      // or download it and cache for future use
      if (cache[trackIndex]) {
        callback(cache[trackIndex])
      } else {
        let onSuccess = function (buffer) {
          state.isLoading = false
          cache[trackIndex] = buffer
          callback(buffer)
        }
        let onError = function () { state.isLoading = false }
        state.isLoading = trackIndex
        player.download(url, onSuccess, onError)
      }
    },
    stopPlayback: function () {
      this.player.stop()
      this.state.nowPlaying = null
      this.$refs.seekbar.setIndex(0)
    },

    // utility
    isPlaying: function (index) { return this.state.nowPlaying === index },
    isLoading: function (index) { return this.state.isLoading === index },
    getPlaybackStatusIcon: function (index) { return this.isPlaying(index) ? 'play_arrow' : '' },
    getPlayButtonIcon: function (index) {
      let isPlaying = this.state.nowPlaying !== null
      let isPaused = this.state.isPaused

      if (!isPlaying && !isPaused) return 'play_arrow'
      if (isPlaying && isPaused) return 'play_arrow'
      return 'pause'
    },
    sliderStyle: function () {
      return { 'backgroundColor': '#f05b72' }
    },
    formatMMSS: function (seconds) {
      // format seconds to 'mm:ss'
      seconds = Math.round(seconds)
      let minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
      seconds = String(Math.round(seconds % 60)).padStart(2, '0')
      return `${minutes}:${seconds}`
    }
  }
}
</script>

<style lang="sass">
$material-icons-font-path: '~material-icons/iconfont/'
@import '~material-icons/iconfont/material-icons.scss'

.material-icons
  display: flex
  user-select: none

$subtitle: #888888
$focus: #cccccc
$highlight: #ffaa00

@media (max-width: 500px)
  body
    margin: 0 0.5rem 0.5rem 0.5rem
  .controls
    flex-direction: column
    padding-top: 0.5rem

@media (min-width: 500px)
  body
    margin: 0 15% 4% 15%
  .controls
    padding-top: 4%

#app
  font-family: 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

.controls
  position: sticky
  top: 0
  padding-bottom: 1rem
  display: flex
  align-items: center
  background-color: white
  .control-buttons
    display: flex
    .loop.active
      color: $highlight
  .progress-bar
    display: flex
    align-items: center
    width: 100%

.playlist
  & > .item
    display: flex
    min-height: 33px
    padding-top: 1px
    align-items: center
    transition: 50ms ease-in-out
    &:not(:last-child)
      margin-bottom: 2px
    & > .status
      width: 30px
      height: 30px
      justify-content: center
      align-items: center
    & > .title
      display: flex
      flex-direction: column
      align-items: flex-start
      & > .tags
        color: #636363
        font-size: 75%
    &:hover
      background-color: $focus
    &.playing
      background-color: $highlight
    &.loading
      background-color: $highlight
      animation: pulse 3s infinite ease-in-out

.footer
  margin-top: 3rem
  font-size: 75%
  color: $subtitle
  p
    margin: 0

@keyframes pulse
  0%
    filter: grayscale(100%)
  50%
    filter: grayscale(0%)
  100%
    filter: grayscale(100%)
</style>
