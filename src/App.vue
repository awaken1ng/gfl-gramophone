<script setup lang="ts">
import { ref, computed, reactive } from '@vue/reactivity';
import ControlButtons from '@/components/ControlButtons.vue';
import NowPlaying from '@/components/NowPlaying.vue';
import Playlist from '@/components/Playlist.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import player from '@/player';
import playlist from '@/assets/playlist.json'

const SAMPLE_RATE = 44100;

interface State {
    cache: {[index: number]: AudioBuffer},
    nowPlayingTrackIndex?: number,
    lastPlayedTrackIndex?: number,
    played: number,
    duration: number,
    isPaused: boolean,
    isLooping: boolean,
    nowDownloadingTrack?: { trackIndex: number, progress: number },
    nowDecodingTrackIndex?: number,
};

const state = reactive<State>({
  cache: {},
  nowPlayingTrackIndex: undefined,
  lastPlayedTrackIndex: undefined,
  played: 0,
  duration: 0,
  isPaused: false,
  isLooping: true,
  nowDownloadingTrack: undefined,
  nowDecodingTrackIndex: undefined,
});

const isPlaying = computed(() => state.nowPlayingTrackIndex !== undefined);

const volume = ref(parseFloat(localStorage.getItem('volume') || '0.5'));

const startPlayback = (trackIndex: number, position: number) => {
  if (!position) position = 0;

  const track = playlist[trackIndex];
  const url = 'bgm/' + track.path;
  const volume = localStorage.getItem('volume') || '1';

  const callback = (buffer: AudioBuffer) => {
    // loop ranges are stored in samples, convert to seconds
    const loop = {
      enabled: state.isLooping,
      start: track.loop.start / SAMPLE_RATE,
      end: track.loop.end / SAMPLE_RATE,
    };
    stopPlayback();
    player.setSource(buffer, loop);
    state.played = 0;
    state.duration = buffer.duration;
    player.volume = parseFloat(volume);
    player.play(position, {
      stop: () => stopPlayback(),
      progress: (played) => state.played = played,
    });
    state.nowPlayingTrackIndex = trackIndex;
    state.lastPlayedTrackIndex = trackIndex;
  }

  // pull the track from cache,
  // or download it and cache for future use
  if (state.cache[trackIndex]) {
    callback(state.cache[trackIndex]);
  } else {
    state.nowDownloadingTrack = { trackIndex: trackIndex, progress: 0 };
    player.download(
      url,
      {
        progress: (event) => {
          if (!event.lengthComputable) return;
          const percent = (event.loaded / event.total) * 100;
          if (typeof state.nowDownloadingTrack === 'object') state.nowDownloadingTrack.progress = parseInt(percent.toFixed(0), 10);
        },
        load: () => {
          state.nowDownloadingTrack = undefined;
          state.nowDecodingTrackIndex = trackIndex;
        },
        decoded: (buffer: AudioBuffer) => {
          state.nowDecodingTrackIndex = undefined;
          state.cache[trackIndex] = buffer;
          callback(buffer);
        },
        error: () => state.nowDownloadingTrack = undefined,
      }
    )
  }
};

const stopPlayback = () => {
  player.stop();
  state.nowPlayingTrackIndex = undefined;
  state.isPaused = false;
  state.played = 0;
  state.duration = 0;
};

const onNextPrev = (direction: 'next' | 'prev') => {
  const isPlaying = state.nowPlayingTrackIndex !== undefined;
  let track = (state.nowPlayingTrackIndex || state.lastPlayedTrackIndex || 0)

  if (!isPlaying && state.lastPlayedTrackIndex === undefined) {
    // if player state is fresh, play the first or the last track
    if (direction === 'next') track = 0;
    else if (direction === 'prev') track = playlist.length - 1;
  } else {
    if (direction === 'next') {
      // if we are at the end of the playlist, play the first track
      if (track < playlist.length - 1) track += 1;
      else track = 0;
    } else if (direction === 'prev') {
      // if we are at the start of the playlist, play the last track
      if (track > 0) track -= 1;
      else track = playlist.length - 1;
    }
  }

  startPlayback(track, 0);
}

const onPlay = (trackIndex?: number) => {
  if (trackIndex === undefined) trackIndex = state.lastPlayedTrackIndex || 0;
  startPlayback(trackIndex, 0);
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
  const nowPlaying = state.nowPlayingTrackIndex;
  if (nowPlaying === undefined) return;

  const track = playlist[nowPlaying];
  player.setLoop({
    enabled: state.isLooping,
    start: track.loop.start / SAMPLE_RATE,
    end: track.loop.end / SAMPLE_RATE,
  });
}

const onSeek = (toPosition: number) => {
  if (!state.isPaused) {
    // we're playing, seek to the position
    player.seek(toPosition);
  } else {
    // we're paused, unpause and seek to position
    player.resume(toPosition);
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
      :nowPlaying="state.nowPlayingTrackIndex"
      :isPaused="state.isPaused"
      :isDownloading="state.nowDownloadingTrack"
      :isDecoding="state.nowDecodingTrackIndex"
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
        :played="state.played"
        :duration="state.duration"
        @seek="onSeek"
      />
    </div>
  </div>
  <Playlist
    :nowPlaying="state.nowPlayingTrackIndex"
    :isDownloading="state.nowDownloadingTrack"
    :isDecoding="state.nowDecodingTrackIndex"
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
