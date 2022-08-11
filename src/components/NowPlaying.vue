<script setup lang="ts">
import { ref, watch } from 'vue'
import { playlist } from '@/shared'

const props = defineProps<{
  nowPlaying?: number,
  isPaused: boolean,
  isLoading?: { track: number, progress: number },
  isDecoding?: number,
}>();

const text = ref("");

watch(
  () => props.isLoading?.progress,
  () => {
      const isLoading = props.isLoading;
      if (!isLoading) return;

      const track = playlist[isLoading.track];
      text.value = `Downloading - ${track.title} - ${isLoading.progress}%`;
  }
);

watch(
  () => props.isDecoding,
  (isDecoding) => {
    if (isDecoding === undefined) return;

    const track = playlist[isDecoding];
    text.value = `Decoding - ${track.title}`;
  }
);

watch(
  () => props.nowPlaying,
  (nowPlaying) => {
    if (nowPlaying === undefined) return;

    text.value = playlist[nowPlaying].title;
  }
);
</script>

<template>
  <div
    class="now-playing"
    :class="{
      playing: nowPlaying !== undefined && !isPaused,
      loading: isLoading || isDecoding !== undefined,
    }"
  >
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
