<script setup lang="ts">
import playlist from '@/assets/playlist.json'

const props = defineProps<{
  nowPlaying?: number,
  isDownloading?: { trackIndex: number, progress: number },
  isDecoding?: number,
}>();

const emit = defineEmits<{
  (event: 'play', trackIndex: number): void,
}>();

const isPlaying = (trackIndex: number) => props.nowPlaying === trackIndex;

const isLoading = (trackIndex: number) => {
  if (props.isDownloading) return props.isDownloading.trackIndex === trackIndex;
  if (props.isDecoding !== undefined) return props.isDecoding === trackIndex;
  return false;
};

const getPlaybackStatusIcon = (trackIndex: number) => isPlaying(trackIndex) ? 'play_arrow' : '';

const onPlaylistItemClick = (trackIndex: number) => {
  // ignore the event if user clicked on the currently playing item
  if (props.nowPlaying === trackIndex) return;

  emit('play', trackIndex);
};

const trackTags = (trackIndex: number): string => {
  const track = playlist[trackIndex];

  if (typeof track.tags === 'string') {
    return track.tags;
  } else { // array
    return track.tags?.join(', ') || '';
  }
};
</script>

<template>
  <div class="playlist">
    <div class="item"
      v-for="(track, index) in playlist"
      :key="index"
      :class="{ playing: isPlaying(index), loading: isLoading(index) }"
      @click="onPlaylistItemClick(index)"
    >
      <span class="status material-icons">{{ getPlaybackStatusIcon(index) }}</span>
      <div class="title">
        <div class="name">{{ track.title }}</div>
        <div class="tags">{{ trackTags(index) }}</div>
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
