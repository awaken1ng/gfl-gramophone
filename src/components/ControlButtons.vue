<script setup lang="ts">
import { computed } from '@vue/reactivity';
import VolumeSlider from '@/components/VolumeSlider.vue'

const props = defineProps({
  isPlaying: Boolean,
  isPaused: Boolean,
  isLooping: Boolean,
  volume: {
    type: Number,
    default: 1.0,
  },
});

const emit = defineEmits<{
  (event: 'prev'): void,
  (event: 'play'): void,
  (event: 'pause'): void,
  (event: 'resume'): void,
  (event: 'stop'): void,
  (event: 'next'): void,
  (event: 'loop'): void,
  (event: 'volume', newVolume: number): void,
}>();

const onPlayClick = () => {
  const { isPlaying, isPaused } = props;

  if (isPlaying && !isPaused) emit('pause'); // playing
  else if (isPlaying && isPaused) emit('resume'); // paused
  else emit('play'); // stopped
};

const playButtonIcon = computed(() => {
  const { isPlaying, isPaused } = props;

  if (isPlaying && isPaused) return 'play_arrow'; // paused
  if (!isPlaying) return 'play_arrow'; // stopped
  return 'pause';
});
</script>

<template>
  <div class="control-buttons">
    <span class="previous material-icons" @click="emit('prev')">skip_previous</span>
    <span class="play material-icons" @click="onPlayClick">{{ playButtonIcon }}</span>
    <span class="stop material-icons" @click="emit('stop')">stop</span>
    <span class="next material-icons" @click="emit('next')">skip_next</span>
    <span class="loop material-icons" :class="{ active: isLooping }" @click="emit('loop')">loop</span>
    <VolumeSlider :volume="volume" @change="(v) => emit('volume', v)"/>
  </div>
</template>

<style>
.controls {
  display: flex;
}

.controls .control-buttons {
  /* align buttons in a row */
  display: flex;
}

.controls .control-buttons .material-icons {
  /* adjust the size of the buttons */
  font-size: var(--icon-size);
}

.controls .control-buttons .loop.active {
  /* highlight the loop button when looping is active */
  color: var(--highlight);
}

@media (max-width: 500px) {
  .status-area {
    text-align: center;
  }

  .status-area .controls {
    /* reverse the container so that */
    /* the seekbar is on top of the screen */
    flex-direction: column-reverse;
    align-items: center;
  }

  .status-area .controls .control-buttons {
    /* put some distance between seekbar and buttons */
    padding-top: 0.5rem;
  }

  .status-area .controls .control-buttons .material-icons {
    /* space out the buttons */
    padding: 0 var(--control-buttons-horizontal-padding);
  }
}
</style>
