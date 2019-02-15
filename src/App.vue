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

<script>
import ControlButtons from '#/components/ControlButtons'
import ProgressBar from '#/components/ProgressBar'
import Playlist from '#/components/Playlist'
import NowPlaying from '#/components/NowPlaying'

export default {
  name: 'app',
  components: { ControlButtons, ProgressBar, Playlist, NowPlaying }
}
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
      padding-top: 4%

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

.footer
  color: $subtitle
  margin-top: 3rem
  font-size: 75%
  text-align: center
  p
    margin: 0
</style>
