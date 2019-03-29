<template lang="pug">
  div.volume-slider(v-on:click="toggleDropdown"
                    v-bind:class="{ active: active }")
    span.material-icons {{ icon }}
    slider(style="padding: 8px"
           v-model="volume"
           v-bind="slider"
           v-bind:class="{ active: active }")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Slider from 'vue-slider-component'
import player from '#/player'

const interval = 0.01

@Component({ components: { Slider } })
export default class VolumeSlider extends Vue {
  icon: string = 'volume_up'
  active: boolean = false
  slider = {
    min: 0,
    max: 1,
    interval,
    height: 180,
    direction: 'ttb',
    tooltip: 'always',
    tooltipPlacement: 'right',
    tooltipFormatter: (value: number) => {
      const percent = value / interval
      return percent.toFixed(0) + '%'
    }
  }

  get volume (): number { return this.getVolume() }
  set volume (value: number) {
    localStorage.setItem('volume', value.toString())
    player.volume = value
    this.icon = this.getVolumeIcon(value)
  }
  toggleDropdown (event: MouseEvent) {
    if (!event || !event.target) return

    const target = event.target as HTMLElement
    if (!target.classList.contains('material-icons')) return

    this.active = !this.active
  }
  getVolume (): number {
    const volume = localStorage.getItem('volume')
    if (volume) {
      return parseFloat(volume)
    } else {
      return player.volume || 1
    }
  }
  getVolumeIcon (volume: number): string {
    // computed volume property is cached and not updated immediately
    const percent = volume / interval
    if (percent === 0) return 'volume_mute'
    else if (percent < 50) return 'volume_down'
    else return 'volume_up'
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
    .vue-slider
      transition: transition-time ease-in-out
      opacity: 0
    &.active .vue-slider
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
</style>
