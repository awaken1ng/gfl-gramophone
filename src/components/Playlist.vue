<script setup lang="ts">
import playlist from '@/assets/playlist.json'

const flattenedPlaylist = playlist.map(
  (variants, trackIndex) => variants.map((track, variantIndex) => { return { ...track, trackIndex, variantIndex } })
).flat();

const props = defineProps<{
  nowPlaying?: { trackIndex: number, variantIndex: number },
  nowDownloading?: { trackIndex: number, variantIndex: number, progress: number },
  nowDecoding?: { trackIndex: number, variantIndex: number },
}>();

const emit = defineEmits<{
  (event: 'play', trackIndex: number, variantIndex: number): void,
}>();

const isPlaying = (trackIndex: number, variantIndex: number) =>
  props.nowPlaying?.trackIndex === trackIndex
  && props.nowPlaying?.variantIndex === variantIndex;

const isLoading = (trackIndex: number, variantIndex: number) => {
  if (props.nowDownloading) return props.nowDownloading.trackIndex === trackIndex && props.nowDownloading.variantIndex === variantIndex;
  if (props.nowDecoding) return props.nowDecoding.trackIndex === trackIndex && props.nowDecoding.variantIndex === variantIndex;
  return false;
};

const getPlaybackStatusIcon = (trackIndex: number, variantIndex: number) => isPlaying(trackIndex, variantIndex) ? 'play_arrow' : '';

const onPlaylistItemClick = (trackIndex: number, variantIndex: number) => {
  // ignore the event if user clicked on the currently playing item
  if (props.nowPlaying?.trackIndex === trackIndex && props.nowPlaying?.variantIndex == variantIndex) return;

  emit('play', trackIndex, variantIndex);
};

const trackTags = (trackIndex: number, variantIndex: number): string => {
  // HACK: TS does recognize that there are three different variants of the track struct,
  // but now dead set on `tags` field not existing period
  const track = playlist[trackIndex][variantIndex] as { tags?: string | number[] };

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
      v-for="track in flattenedPlaylist"
      :key="`${track.trackIndex}${track.variantIndex}`"
      :class="{ playing: isPlaying(track.trackIndex, track.variantIndex), loading: isLoading(track.trackIndex, track.variantIndex) }"
      @click="onPlaylistItemClick(track.trackIndex, track.variantIndex)"
    >
      <span class="status material-icons">{{ getPlaybackStatusIcon(track.trackIndex, track.variantIndex) }}</span>
      <div class="title">
        <div class="name">{{ track.title }}</div>
        <div class="tags">{{ trackTags(track.trackIndex, track.variantIndex) }}</div>
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
  position: relative;
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
