<template lang="pug">
  div.playlist
    div.item(v-for="(track, index) in playlist"
             v-bind:key="index"
             v-if="!track.hidden"
             v-bind:class="{ playing: isPlaying(index), loading: isLoading(index) }"
             v-on:click="onPlaylistItemClick(index)")
      span.status.material-icons {{ getPlaybackStatusIcon(index) }}
      div.title
        div.name {{ track.title }}
        div.tags {{ track.tags ? typeof track.tags === 'string' ? track.tags : track.tags.join(', ') : '' }}
</template>

<script>
import playlist from '#/assets/playlist.json'
import shared from '#/shared'

export default {
  name: 'playlist',
  data: function () {
    return {
      playlist: playlist,
      state: shared.state
    }
  },
  computed: {
  },
  methods: {
    onPlaylistItemClick: function (index) {
      // ignore the event if user clicked on the currently playing item
      if (this.state.nowPlaying === index) return

      shared.methods.playback.start(index, 0)
    },
    isPlaying: function (index) { return this.state.nowPlaying === index },
    isLoading: function (index) {
      if (this.state.isLoading) return this.state.isLoading.track === index
      if (this.state.isDecoding) return this.state.isDecoding === index
    },
    getPlaybackStatusIcon: function (index) { return this.isPlaying(index) ? 'play_arrow' : '' }
  }
}
</script>

<style lang="stylus">
@require '~#/shared.styl'

.playlist
  & > .item
    display: flex
    min-height: 33px
    align-items: center
    transition: 50ms ease-in-out
    &:first-child
      margin-top: 1rem
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
        color: $subtitle
        font-size: 75%
    &:hover
      background-color: $focus
    &.playing
      background-color: $highlight
    &.loading
      background-color: $highlight
      animation: pulse 3s infinite ease-in-out
      z-index: -1

@keyframes pulse
  0%
    filter: grayscale(100%)
  50%
    filter: grayscale(0%)
  100%
    filter: grayscale(100%)
</style>
