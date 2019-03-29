<template lang="pug">
  div.now-playing(v-bind:class="getClass()") {{ text }}
</template>

<script lang="ts">
import { Watch, Component, Vue } from 'vue-property-decorator'
import shared, { playlist } from '#/shared'

@Component
export default class NowPlaying extends Vue {
  state = shared.state
  text = ''

  getClass () {
    return {
      playing: this.state.nowPlaying !== undefined && !this.state.isPaused,
      loading: this.state.isLoading || this.state.isDecoding !== undefined
    }
  }

  @Watch('state.isLoading.progress')
  onLoading (current: number) {
    const isLoading = this.state.isLoading
    if (!current || !isLoading) return

    const track = playlist[isLoading.track]
    this.text = `Downloading - ${track.title} - ${current}%`
  }

  @Watch('state.isDecoding')
  onDecoding (current: number | undefined) {
    if (current === undefined) return

    const track = playlist[current]
    this.text = `Decoding - ${track.title}`
  }

  @Watch('state.nowPlaying')
  onNowPlayingChange (current: number | undefined) {
    if (current === undefined) return

    this.text = playlist[current].title
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
