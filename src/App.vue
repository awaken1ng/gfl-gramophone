<script setup lang="ts">
import { ref, computed, reactive } from '@vue/reactivity';
import ControlButtons from '@/components/ControlButtons.vue';
import NowPlaying from '@/components/NowPlaying.vue';
import Playlist from '@/components/Playlist.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import player from '@/player';
import type { Loop } from '@/player';
import playlist from '@/assets/playlist.json'

const SAMPLE_RATE = 44100;

interface State {
    cache: { [trackIndex: number]: { [variantIndex: number]: AudioBuffer } },
    nowPlaying?: { trackIndex: number, variantIndex: number },
    lastPlayed?: { trackIndex: number, variantIndex: number },
    playedMs: number,
    durationMs: number,
    isPaused: boolean,
    isLooping: boolean,
    nowDownloading?: { trackIndex: number, variantIndex: number, progress: number },
    nowDecoding?: { trackIndex: number, variantIndex: number },
};

const state = reactive<State>({
  cache: {},
  nowPlaying: undefined,
  lastPlayed: undefined,
  playedMs: 0,
  durationMs: 0,
  isPaused: false,
  isLooping: true,
  nowDownloading: undefined,
  nowDecoding: undefined,
});

const isPlaying = computed(() => state.nowPlaying !== undefined);
const playedS = computed(() => Math.round(state.playedMs / 1000));
const durationS = computed(() => Math.round(state.durationMs / 1000));

const volume = ref(parseFloat(localStorage.getItem('volume') || '0.5'));

const startPlayback = (trackIndex: number, variantIndex: number) => {
  const track = playlist[trackIndex][variantIndex];

  const callback = (buffer: AudioBuffer) => {
    // loop ranges are stored in samples, convert to seconds, as required by `AudioBufferSourceNode`
    const loop: Loop = {
      enabled: state.isLooping,
      startS: track.loop.start / SAMPLE_RATE,
      endS: track.loop.end / SAMPLE_RATE,
    };
    const position = state.nowPlaying?.trackIndex === trackIndex ? state.playedMs : 0;
    stopPlayback();
    player.setSource(buffer, loop);
    state.playedMs = position;
    state.durationMs = buffer.length / buffer.sampleRate * 1000; // buffer sample rate isn't guaranteed to be the same as track sample rate
    player.volume = volume.value;
    player.play(position, {
      stop: () => stopPlayback(),
      progress: (played) => state.playedMs = played,
    });
    state.nowPlaying = { trackIndex, variantIndex };
    state.lastPlayed = { trackIndex, variantIndex };
  }

  // pull the track from cache,
  // or download it and cache for future use
  if (state.cache[trackIndex] && state.cache[trackIndex][variantIndex]) {
    callback(state.cache[trackIndex][variantIndex]);
  } else {
    state.nowDownloading = { trackIndex, variantIndex, progress: 0 };
    player.download(
      `bgm/${track.path}`,
      {
        progress: (event) => {
          if (!event.lengthComputable) return;
          const percent = (event.loaded / event.total) * 100;
          if (typeof state.nowDownloading === 'object') state.nowDownloading.progress = parseInt(percent.toFixed(0), 10);
        },
        load: () => {
          state.nowDownloading = undefined;
          state.nowDecoding = { trackIndex, variantIndex };
        },
        decoded: (buffer: AudioBuffer) => {
          state.nowDecoding = undefined;
          if (!state.cache[trackIndex]) state.cache[trackIndex] = {}
          state.cache[trackIndex][variantIndex] = buffer;
          callback(buffer);
        },
        error: () => state.nowDownloading = undefined,
      }
    )
  }
};

const stopPlayback = () => {
  player.stop();
  state.nowPlaying = undefined;
  state.isPaused = false;
  state.playedMs = 0;
  state.durationMs = 0;
};

const onNextPrev = (direction: 'next' | 'prev') => {
  let trackIndex = state.nowPlaying?.trackIndex || state.lastPlayed?.trackIndex || 0;

  if (!isPlaying && !state.lastPlayed) {
    // if player state is fresh, play the first or the last track
    if (direction === 'next') trackIndex = 0;
    else if (direction === 'prev') trackIndex = playlist.length - 1;
  } else {
    if (direction === 'next') {
      // if we are at the end of the playlist, play the first track
      if (trackIndex < playlist.length - 1) trackIndex += 1;
      else trackIndex = 0;
    } else if (direction === 'prev') {
      // if we are at the start of the playlist, play the last track
      if (trackIndex > 0) trackIndex -= 1;
      else trackIndex = playlist.length - 1;
    }
  }

  startPlayback(trackIndex, 0);
}

const onPlay = (trackIndex?: number, variantIndex?: number) => {
  trackIndex ??= state.lastPlayed?.trackIndex || 0;
  variantIndex ??= state.lastPlayed?.variantIndex || 0;
  startPlayback(trackIndex, variantIndex);
}

const onPause = () => {
  player.pause();
  state.isPaused = true;
}

const onResume = () => {
  player.resume();
  state.isPaused = false;
}

const onStop = () => {
  stopPlayback();
}

const onLoopToggle = () => {
  state.isLooping = !state.isLooping;

  // update the currently playing track
  const nowPlaying = state.nowPlaying;
  if (nowPlaying === undefined) return;

  const track = playlist[nowPlaying.trackIndex][nowPlaying.variantIndex];
  player.setLoop({
    enabled: state.isLooping,
    startS: track.loop.start / SAMPLE_RATE,
    endS: track.loop.end / SAMPLE_RATE,
  });
}

const onSeek = (toPositionS: number) => {
  const toPositionMs = toPositionS * 1000;

  if (!state.isPaused) {
    // we're playing, seek to the position
    player.seek(toPositionMs);
  } else {
    // we're paused, unpause and seek to position
    player.resume(toPositionMs);
    state.isPaused = false;
  }
};

const onVolumeChange = (newVolume: number) => {
  localStorage.setItem('volume', newVolume.toString());
  volume.value = newVolume;
  player.volume = newVolume;
}
</script>

<template>
  <div class="status-area">
    <NowPlaying
      :nowPlaying="state.nowPlaying"
      :isPaused="state.isPaused"
      :nowDownloading="state.nowDownloading"
      :nowDecoding="state.nowDecoding"
    />
    <div class="controls">
      <ControlButtons
        :isPlaying="isPlaying"
        :isPaused="state.isPaused"
        :isLooping="state.isLooping"
        :volume="volume"
        @prev="onNextPrev('prev')"
        @play="onPlay"
        @pause="onPause"
        @resume="onResume"
        @stop="onStop"
        @next="onNextPrev('next')"
        @loop="onLoopToggle"
        @volume="onVolumeChange"
      />
      <ProgressBar
        :played="playedS"
        :duration="durationS"
        @seek="onSeek"
      />
    </div>
  </div>
  <Playlist
    :nowPlaying="state.nowPlaying"
    :nowDownloading="state.nowDownloading"
    :nowDecoding="state.nowDecoding"
    @play="onPlay"
  />
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
