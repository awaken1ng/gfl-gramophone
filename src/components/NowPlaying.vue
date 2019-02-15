<template lang="pug">
  div.now-playing(v-bind:class="getClass()") {{ text }}
</template>

<script>
import playlist from '#/assets/playlist'
import shared from '#/shared'

export default {
  name: 'now-playing',
  data: function () {
    return {
      playlist: playlist,
      state: shared.state,
      text: ''
    }
  },
  methods: {
    getClass: function () {
      return {
        playing: this.state.nowPlaying !== null && !this.state.isPaused,
        loading: this.state.isLoading || this.state.isDecoding !== false
      }
    }
  },
  watch: {
    'state.isLoading.progress': function (current) {
      if (current) {
        let track = this.playlist[current]
        this.text = `Downloading - ${track.title} - ${current}%`
      }
    },
    'state.isDecoding': function (current) {
      if (current !== false) {
        let track = this.playlist[current]
        this.text = `Decoding - ${track.title}`
      }
    },
    'state.nowPlaying': function (current) {
      if (current !== null) this.text = this.playlist[current].title
    }
  }
}
</script>

<style lang="stylus">
@require '~#/shared.styl'

.status-area
  .now-playing
    display: flex
    flex-direction: column-reverse // align the text to the bottom by reversing the container
    min-height: 22px
    color: $subtitle
    &.playing
      color: unset
    &.loading
      color: $subtitle
</style>
