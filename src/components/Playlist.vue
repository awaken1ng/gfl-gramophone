<script lang="ts">
import { defineComponent } from 'vue'
import shared, { playlist } from '@/shared'

export default defineComponent({
  data() {
    return {
      state: shared.state,
      playlist
    }
  },
  methods: {
    onPlaylistItemClick(index: number) {
      // ignore the event if user clicked on the currently playing item
      if (this.state.nowPlaying === index) return

      shared.methods.playback.start(index, 0)
    },
    isPlaying(index: number) {
      return this.state.nowPlaying === index
    },
    isLoading(index: number) {
      if (this.state.isLoading) return this.state.isLoading.track === index
      if (this.state.isDecoding !== undefined) return this.state.isDecoding === index
    },
    getPlaybackStatusIcon(index: number) {
      return this.isPlaying(index) ? 'play_arrow' : ''
    }
  }
})
</script>

<template>
  <div class="playlist">
    <div class="item"
      v-for="(track, index) in playlist"
      v-bind:key="index"
      v-bind:class="{ playing: isPlaying(index), loading: isLoading(index) }"
      v-on:click="onPlaylistItemClick(index)"
    >
      <span class="status material-icons">{{ getPlaybackStatusIcon(index) }}</span>
      <div class="title">
        <div class="name">{{ track.title }}</div>
        <div class="tags">{{ track.tags ? typeof track.tags === 'string' ? track.tags : track.tags.join(', ') : '' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist > .item {
  display: flex;
  min-height: 33px;
  align-items: center;
  transition: 50ms ease-in-out;
}

.playlist > .item:first-child {
    margin-top: 1rem
}

.playlist > .item:not(:last-child) {
  margin-bottom: 2px;
}

.playlist > .item > .status {
  width: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
}

.playlist > .item > .title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.playlist > .item > .title > .tags {
  color: var(--subtitle);
  font-size: 75%
}

.playlist > .item:hover {
  background-color: var(--focus);
}

.playlist > .item.playing {
  background-color: var(--highlight);
}

.playlist > .item.loading {
  background-color: var(--highlight);
  animation: pulse 3s infinite ease-in-out;
  z-index: -1;
}

@keyframes pulse {
  0% {
    filter: grayscale(100%);
  }
  50% {
    filter: grayscale(0%);
  }
  100% {
    filter: grayscale(100%);
  }
}
</style>
