<script setup lang="ts">
import { ref, watch } from 'vue'
import playlist from '@/assets/playlist.json'

const props = defineProps<{
  nowPlaying?: { trackIndex: number, variantIndex: number },
  isPaused: boolean,
  nowDownloading?: { trackIndex: number, variantIndex: number, progress: number },
  nowDecoding?: { trackIndex: number, variantIndex: number },
}>();

const text = ref("");

watch(
  () => props.nowDownloading?.progress,
  () => {
      const isLoading = props.nowDownloading;
      if (!isLoading) return;

      const { trackIndex, variantIndex, progress } = isLoading;
      const track = playlist[trackIndex][variantIndex];
      text.value = `Downloading - ${track.title} - ${progress}%`;
  }
);

watch(
  () => props.nowDecoding,
  (isDecoding) => {
    if (isDecoding === undefined) return;
    const { trackIndex, variantIndex } = isDecoding;

    const track = playlist[trackIndex][variantIndex];
    text.value = `Decoding - ${track.title}`;
  }
);

watch(
  () => props.nowPlaying,
  (nowPlaying) => {
    if (nowPlaying === undefined) return;
    const { trackIndex, variantIndex } = nowPlaying;

    text.value = playlist[trackIndex][variantIndex].title;
  }
);
</script>

<template>
  <div
    class="now-playing"
    :class="{
      playing: nowPlaying !== undefined && !isPaused,
      loading: nowDownloading || nowDecoding !== undefined,
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
