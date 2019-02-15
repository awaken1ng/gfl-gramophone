<template lang="pug">
  div#app
    div.controls
      control-buttons
      progress-bar
    playlist
    div.footer
      p Girls' Frontline is Copyright SUNBORN Network Technology Co., Ltd.
      p All music and names owned and trademarked by SUNBORN Network Technology Co., Ltd. are property of SUNBORN Network Technology Co., Ltd.
</template>

<script>
import ControlButtons from '#/components/ControlButtons'
import ProgressBar from '#/components/ProgressBar'
import Playlist from '#/components/Playlist'

export default {
  name: 'app',
  components: { ControlButtons, ProgressBar, Playlist }
}
</script>

<style lang="stylus">
@import '~material-icons/iconfont/material-icons.css'

.material-icons
  display: flex
  user-select: none

@media (max-width: 500px)
  body
    margin: 0 0.5rem 0.5rem 0.5rem

@media (min-width: 500px)
  body
    margin: 0 15% 4% 15%

#app
  font-family: 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

.controls
  position: sticky
  top: 0
  display: flex
  align-items: center
  background-color: white

.footer
  color: $subtitle
  margin-top: 3rem
  font-size: 75%
  text-align: center
  p
    margin: 0
</style>
