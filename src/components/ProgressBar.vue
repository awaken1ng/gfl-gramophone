<template lang="pug">
  div.progress-bar
    slider.seek-bar(style="padding: 10px; height: 6px"
                    ref="seekbar"
                    v-model="played"
                    v-bind="slider"
                    v-bind:max="Math.ceil(duration)")
    span.played {{ formatMMSS(played) }}
    | /
    span.duration {{ formatMMSS(duration) }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Slider from 'vue-slider-component'
import player from '#/player'
import shared from '#/shared'

@Component({ components: { Slider } })
export default class ProgressBar extends Vue {
  player = player
  slider = {
    width: '100%',
    tooltip: 'none'
  }

  mounted () {
    shared.sliders.seekbar = this.$refs.seekbar as Slider
  }
  get played (): number { return this.player.progress.played || 0 }
  set played (value: number) {
    if (!shared.state.isPaused) {
      // we're playing, seek to the position
      this.player.seek(value)
    } else {
      // we're paused, unpause and seek to position
      this.player.resume(value)
      shared.state.isPaused = false
    }
  }

  get duration () {
    let duration = 0
    if (player.source && player.source.buffer) {
      duration = player.source.buffer.duration
    }
    return duration
  }

  formatMMSS (seconds: number) {
    // format seconds to 'mm:ss'
    seconds = Math.round(seconds)
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secondsFormatted = String(Math.round(seconds % 60)).padStart(2, '0')
    return `${minutes}:${secondsFormatted}`
  }
}
</script>

<style lang="stylus">
@require '~#/shared.styl'

.progress-bar
  display: flex
  align-items: center
  width: 100%
</style>
