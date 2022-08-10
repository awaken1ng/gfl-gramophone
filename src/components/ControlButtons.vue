<script lang="ts">
import { defineComponent } from 'vue'
import VolumeSlider from '@/components/VolumeSlider.vue'
import player from '@/player'
import shared, { playlist } from '@/shared'

const state = shared.state

export default defineComponent({
  components: {
    VolumeSlider
  },
  data() {
    return {
      state: shared.state
    }
  },
  methods: {
    onPlayButtonClick () {
      const playing = state.nowPlaying !== undefined
      const paused = state.isPaused

      if (playing && !paused) { // playing
        player.pause()
        state.isPaused = true
      } else if (playing && paused) { // paused
        player.resume()
        state.isPaused = false
      } else if (!playing && !paused) { // stopped
        const lastPlayed = (state.lastPlayed || 0)
        shared.methods.playback.start(lastPlayed, 0)
      }
    },
    onNextPrevButtonClick (direction: string) {
      const isPlaying = state.nowPlaying !== undefined
      let track = (state.nowPlaying || state.lastPlayed || 0)

      if (!isPlaying && state.lastPlayed === null) {
        // if player state is fresh, play the first or the last track
        if (direction === 'next') track = 0
        else if (direction === 'previous') track = playlist.length - 1
      } else {
        if (direction === 'next') {
          // if we are at the end of the playlist, play the first track
          if (track < playlist.length - 1) track += 1
          else track = 0
        } else if (direction === 'previous') {
          // if we are at the start of the playlist, play the last track
          if (track > 0) track -= 1
          else track = playlist.length - 1
        }
      }

      shared.methods.playback.start(track, 0)
    },
    onLoopButtonClick () {
      state.looping = !state.looping

      // update the currently playing track
      const nowPlaying = state.nowPlaying
      if (nowPlaying === undefined) return

      const track = playlist[nowPlaying]
      const sampleRate = shared.sampleRate
      player.setLoop({
        enabled: state.looping,
        start: track.loop.start / sampleRate,
        end: track.loop.end / sampleRate
      })
    },
    onStopButtonClick () {
      shared.methods.playback.stop()
    },
    getPlayButtonIcon () {
      const isPlaying = state.nowPlaying !== undefined
      const isPaused = state.isPaused

      if (!isPlaying && !isPaused) return 'play_arrow' // stopped
      if (isPlaying && isPaused) return 'play_arrow' // paused
      return 'pause'
    },
  }
});
</script>

<template>
  <div class="control-buttons">
    <span class="previous material-icons" v-on:click="onNextPrevButtonClick('previous')">skip_previous</span>
    <span class="play material-icons" v-on:click="onPlayButtonClick">{{ getPlayButtonIcon() }}</span>
    <span class="stop material-icons" v-on:click="onStopButtonClick">stop</span>
    <span class="next material-icons" v-on:click="onNextPrevButtonClick('next')">skip_next</span>
    <span class="loop material-icons"
      v-on:click="onLoopButtonClick"
      v-bind:class="{ active: state.looping }"
    >
      loop
    </span>

    <VolumeSlider/>
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
