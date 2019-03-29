<template lang="pug">
  div#app
    div.status-area
      now-playing
      div.controls
        control-buttons
        progress-bar
    playlist
    div.footer
      p Girls' Frontline is Copyright SUNBORN Network Technology Co., Ltd.
      p All music is property of SUNBORN Network Technology Co., Ltd. or it's respective owner.
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ControlButtons from '#/components/ControlButtons.vue'
import ProgressBar from '#/components/ProgressBar.vue'
import Playlist from '#/components/Playlist.vue'
import NowPlaying from '#/components/NowPlaying.vue'
import 'vue-slider-component/theme/default.css'

@Component({ components: { ControlButtons, ProgressBar, Playlist, NowPlaying } })
export default class App extends Vue {}
</script>

<style lang="stylus">
@import '~material-icons/iconfont/material-icons.css'
@require '~#/shared.styl'

.material-icons
  display: flex
  user-select: none

@media (max-width: 500px)
  body
    margin: 0 0.5rem 0.5rem 0.5rem
    #app > div:first-child
      padding-top: 0.5rem

@media (min-width: 500px)
  body
    margin: 0 15% 4% 15%
    #app > div:first-child
      padding-top: 1%

#app
  font-family: 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

.status-area
  position: sticky
  top: 0
  display: flex
  flex-direction: column
  background-color: white

// recolour the slider
.vue-slider
  .vue-slider-process
    background-color: $highlight
  .vue-slider-dot-tooltip-inner
    background-color: $highlight
    border-color: $highlight

.footer
  color: $subtitle
  margin-top: 3rem
  font-size: 75%
  text-align: center
  p
    margin: 0
</style>
