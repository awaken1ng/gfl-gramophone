<template lang="pug">
  div.control-buttons
    span.previous.material-icons(v-on:click="onNextPrevButtonClick('previous')") skip_previous
    span.play.material-icons(v-on:click="onPlayButtonClick") {{ getPlayButtonIcon() }}
    span.stop.material-icons(v-on:click="onStopButtonClick") stop
    span.next.material-icons(v-on:click="onNextPrevButtonClick('next')") skip_next
    span.loop.material-icons(v-on:click="onLoopButtonClick"
                             v-bind:class="{ active: state.looping }") loop
    volume-slider
</template>

<script>
import VolumeSlider from '#/components/VolumeSlider'
import player from '#/player'
import shared from '#/shared'
import playlist from '#/assets/playlist'
const state = shared.state

export default {
  name: 'control-buttons',
  components: { VolumeSlider },
  data: function () { return { state: shared.state } },
  methods: {
    onPlayButtonClick: function () {
      let playing = state.nowPlaying !== null
      let paused = state.isPaused

      if (playing && !paused) { // playing
        player.pause()
        state.isPaused = true
      } else if (playing && paused) { // paused
        player.resume()
        state.isPaused = false
      } else if (!playing && !paused) { // stopped
        let lastPlayed = (state.lastPlayed || 0)
        shared.methods.playback.start(lastPlayed, 0)
      }
    },
    onNextPrevButtonClick: function (direction) {
      let isPlaying = state.nowPlaying !== null
      let track = (state.nowPlaying || state.lastPlayed || 0)

      if (!isPlaying && state.lastPlayed === null) {
        // if player state is fresh, play the first or the last track
        if (direction === 'next') track = 0
        else if (direction === 'previous') track = playlist.length - 1
      } else {
        if (direction === 'next') {
          // if we are at the end of the playlist, play the first track
          if (track < playlist.length - 1) track += 1
          else track = 0
        } else if (direction === 'previous') {
          // if we are at the start of the playlist, play the last track
          if (track > 0) track -= 1
          else track = playlist.length - 1
        }
      }

      shared.methods.playback.start(track, 0)
    },
    onLoopButtonClick: function () {
      state.looping = !state.looping

      // update the currently playing track
      let nowPlaying = state.nowPlaying
      if (nowPlaying === null) return

      let track = playlist[nowPlaying]
      let sampleRate = shared.sampleRate
      player.set.loop({
        enabled: state.looping,
        start: track.loop.start / sampleRate,
        end: track.loop.end / sampleRate
      })
    },
    onStopButtonClick: function () { shared.methods.playback.stop() },
    getPlayButtonIcon: function (index) {
      let isPlaying = state.nowPlaying !== null
      let isPaused = state.isPaused

      if (!isPlaying && !isPaused) return 'play_arrow' // stopped
      if (isPlaying && isPaused) return 'play_arrow' // paused
      return 'pause'
    }
  }
}
</script>

<style lang="stylus">
@require '~#/shared.styl'

.controls
  display: flex
  .control-buttons
    display: flex // align buttons in a row
    .material-icons
      font-size: $icon-size // adjust the size of the buttons
    .loop.active
      color: $highlight // highlight the loop button when looping is active

@media (max-width: 500px)
  .status-area
    text-align: center
    .controls
      flex-direction: column-reverse // reverse the container so that
                                    // the seekbar is on top of the screen
      align-items: center
      .control-buttons
        padding-top: 0.5rem // put some distance between seekbar and buttons
        .material-icons
          padding: 0 $control-buttons-horizontal-padding // space out the buttons
</style>
