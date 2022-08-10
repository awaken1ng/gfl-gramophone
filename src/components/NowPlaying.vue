<script lang="ts">
import { defineComponent } from 'vue'
import shared, { playlist } from '@/shared'

export default defineComponent({
  data() {
    return {
      state: shared.state,
      text: "",
    }
  },
  methods: {
    getClass() {
      return {
        playing: this.state.nowPlaying !== undefined && !this.state.isPaused,
        loading: this.state.isLoading || this.state.isDecoding !== undefined
      }
    }
  },
  watch: {
    'state.isLoading.progress'(current: number) {
      const isLoading = this.state.isLoading
      if (!current || !isLoading) return

      const track = playlist[isLoading.track]
      this.text = `Downloading - ${track.title} - ${current}%`
    },
    'state.isDecoding'(current?: number) {
      if (current === undefined) return

      const track = playlist[current]
      this.text = `Decoding - ${track.title}`
    },
    'state.nowPlaying'(current?: number) {
      if (current === undefined) return

      this.text = playlist[current].title
    }
  }
});
</script>

<template>
  <div class="now-playing" v-bind:class="getClass()">
    {{ text }}
  </div>
</template>

<style scoped>
.now-playing {
  display: flex;
  /* align the text to the bottom by reversing the container */
  flex-direction: column-reverse;
  min-height: 22px;
  color: var(--subtitle);
}

.now-playing.playing {
    color: unset
}

.now-playing.loading {
  color: var(--subtitle);
}
</style>
