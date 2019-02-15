<template lang="pug">
  div.progress-bar
    slider.seek-bar(ref="seekbar"
                    v-model="played"
                    v-bind="slider"
                    v-bind:max="Math.ceil(duration)"
                    v-on:callback="onSeek")
    span.played {{ formatMMSS(played) }}
    | /
    span.duration {{ formatMMSS(duration) }}
</template>

<script>
import Slider from 'vue-slider-component'
import player from '#/player'
import shared from '#/shared'

export default {
  name: 'progress-bar',
  components: { Slider },
  data: function () {
    return {
      slider: {
        width: '100%',
        tooltip: false
      },
      player: player // has to be here, otherwise computed values don't get initialized properly
    }
  },
  mounted: function () {
    shared.sliders.seekbar = this.$refs.seekbar
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
    onSeek: function (value) {
      this.player.seek(value)
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

<style lang="stylus">
@require '~#/shared.styl'

.progress-bar
  display: flex
  align-items: center
  width: 100%
  .vue-slider-component .vue-slider-process
    background-color: $highlight
</style>
