<script setup lang="ts">
import { ref, computed } from '@vue/reactivity';
import ControlButtons from '@/components/ControlButtons.vue';
import NowPlaying from '@/components/NowPlaying.vue';
import Playlist from '@/components/Playlist.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import player from '@/player';
import shared, { playlist } from '@/shared'

const state = ref(shared.state);

const volume = ref(parseFloat(localStorage.getItem('volume') || "1"));

const isPlaying = computed(() => state.value.nowPlaying !== undefined);

const onNextPrev = (direction: 'next' | 'prev') => {
  const isPlaying = state.value.nowPlaying !== undefined
  let track = (state.value.nowPlaying || state.value.lastPlayed || 0)

  if (!isPlaying && state.value.lastPlayed === null) {
    // if player state is fresh, play the first or the last track
    if (direction === 'next') track = 0
    else if (direction === 'prev') track = playlist.length - 1
  } else {
    if (direction === 'next') {
      // if we are at the end of the playlist, play the first track
      if (track < playlist.length - 1) track += 1
      else track = 0
    } else if (direction === 'prev') {
      // if we are at the start of the playlist, play the last track
      if (track > 0) track -= 1
      else track = playlist.length - 1
    }
  }

  shared.methods.playback.start(track, 0)
}

const onPlay = () => {
  const lastPlayed = (state.value.lastPlayed || 0);
  shared.methods.playback.start(lastPlayed, 0);
}

const onPause = () => {
  player.pause();
  state.value.isPaused = true;
}

const onResume = () => {
  player.resume();
  state.value.isPaused = false;
}

const onStop = () => {
  shared.methods.playback.stop();
}

const onLoop = () => {
  state.value.looping = !state.value.looping

  // update the currently playing track
  const nowPlaying = state.value.nowPlaying
  if (nowPlaying === undefined) return

  const track = playlist[nowPlaying]
  const sampleRate = shared.sampleRate
  player.setLoop({
    enabled: state.value.looping,
    start: track.loop.start / sampleRate,
    end: track.loop.end / sampleRate
  })
}

const onSeek = (toPosition: number) => {
  if (!state.value.isPaused) {
    // we're playing, seek to the position
    player.seek(toPosition);
  } else {
    // we're paused, unpause and seek to position
    player.resume(toPosition);
    state.value.isPaused = false;
  }
};

const onVolumeChange = (newVolume: number) => {
  localStorage.setItem('volume', newVolume.toString());
  volume.value = newVolume;
}
</script>

<template>
  <div class="status-area">
    <NowPlaying
      :now-playing="state.nowPlaying"
      :is-paused="state.isPaused"
      :is-loading="state.isLoading"
      :is-decoding="state.isDecoding"
    />
    <div class="controls">
      <ControlButtons
        :is-playing="isPlaying"
        :is-paused="state.isPaused"
        :is-looping="state.looping"
        :volume="volume"
        @prev="onNextPrev('prev')"
        @play="onPlay"
        @pause="onPause"
        @resume="onResume"
        @stop="onStop"
        @next="onNextPrev('next')"
        @loop="onLoop"
        @volume="onVolumeChange"
      />
      <ProgressBar
        :played="state.played"
        :duration="state.duration"
        @seek="onSeek"
      />
    </div>
  </div>
  <Playlist/>
  <div class="footer">
    <p>Girls' Frontline is Copyright SUNBORN Network Technology Co., Ltd.</p>
    <p>All music is property of SUNBORN Network Technology Co., Ltd. or it's respective owner.</p>
  </div>
</template>

<style>
:root {
  --subtitle: #636363;
  --focus: #cccccc;
  --highlight-r: 246;
  --highlight-g: 164;
  --highlight-b: 0;
  --highlight: rgb(246, 164, 0);
  --icon-size: 32px;
  --control-buttons-horizontal-padding: 0.5rem;
}

.status-area {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background-color: white;
}

/* recolour the slider */
.vue-slider .vue-slider-process {
  background-color: var(--highlight);
}

.vue-slider .vue-slider-dot-tooltip-inner {
  background-color: var(--highlight);
  border-color: var(--highlight);
}
.vue-slider .vue-slider-dot-handle-focus {
  box-shadow: 0px 0px 1px 2px rgba(var(--highlight-r), var(--highlight-g), var(--highlight-b), 0.36);
}

.footer {
  color: var(--subtitle);
  margin-top: 3rem;
  font-size: 75%;
  text-align: center;
}

.footer p {
  margin: 0;
}
</style>
