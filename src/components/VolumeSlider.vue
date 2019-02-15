<template lang="pug">
  div.volume-slider(v-on:click="toggleDropdown"
                    v-bind:class="{ active: active }")
    span.material-icons {{ icon }}
    slider(v-model="volume"
           v-bind="slider"
           v-bind:class="{ active: active }")
</template>

<script>
import Slider from 'vue-slider-component'
import player from '#/player'

export default {
  name: 'volume-slider',
  components: { Slider },
  data: function () {
    let interval = 0.01

    return {
      icon: 'volume_up',
      player: player,
      active: false,
      slider: {
        height: 200,
        width: 4,
        min: 0,
        max: 1,
        realTime: true, // absolute positioning sometimes causes the dot to be misaligned when clicked
        direction: 'vertical',
        reverse: true,
        tooltipDir: 'right',
        interval: interval,
        formatter: function (value) {
          let percent = value / interval
          return percent.toFixed(0) + '%'
        }
      }
    }
  },
  computed: {
    volume: {
      get: function () { return this.getVolume() },
      set: function (value) {
        localStorage.setItem('volume', value)
        player.volume = value
        this.icon = this.getVolumeIcon()
      }
    }
  },
  methods: {
    toggleDropdown: function (event) {
      if (!event.target.classList.contains('material-icons')) return
      this.active = !this.active
    },
    getVolume: function () { return localStorage.getItem('volume') || player.volume || 1 },
    getVolumeIcon: function () {
      // computed volume property is cached and not updated immediately
      let percent = parseInt(this.getVolume() / this.slider.interval)
      if (percent === 0) return 'volume_mute'
      else if (percent < 50) return 'volume_down'
      else return 'volume_up'
    }
  }
}
</script>

<style lang="stylus">
@require '~#/shared.styl'

// align the volume icon and slider to other icons
@media (max-width: 500px)
  .controls
    .control-buttons
      padding-right: 'calc((%s * 2) + %s)' % ($control-buttons-horizontal-padding $icon-size)
      .volume-slider
        top: 0.5rem

.control-buttons
  padding-right: $icon-size // make space for the volume icon
  // position the icon and the slider to the right of the container
  position: relative
  .volume-slider
    position: absolute
    top: 0
    right: 0
    // center the icon and the slider
    display: flex
    flex-direction: column
    align-items: center
    // toggle visibility by using opacity
    transition-time = 100ms
    transition: transition-time ease-in-out
    .vue-slider-component
      transition: transition-time ease-in-out
      opacity: 0
    &.active .vue-slider-component
        opacity: 1
    // make clicks go through when inactive
    pointer-events: none
    &.active
      pointer-events: unset
    & .material-icons
      pointer-events: all // keep the icon clickable when inactive
    // style the dropdown
    border-radius: 5px
    &.active
      background-color: #fff
      box-shadow: 0px 0px 5px $focus
    // recolour the slider
    .vue-slider-component
      .vue-slider-process
        background-color: $highlight
      .vue-slider-tooltip
        background-color: $highlight
        border-color: $highlight
</style>
