<script lang="ts">
import { defineComponent } from 'vue'
import NowPlaying from '@/components/NowPlaying.vue';
import ControlButtons from '@/components/ControlButtons.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import Playlist from '@/components/Playlist.vue';
import shared from '@/shared';
import player from '@/player';

export default defineComponent({
  components: {
    NowPlaying,
    ControlButtons,
    ProgressBar,
    Playlist,
  },
  data() {
    return {
      state: shared.state,
    }
  },
  methods: {
    onSeek(toPosition: number) {
      if (!shared.state.isPaused) {
        // we're playing, seek to the position
        player.seek(toPosition)
      } else {
        // we're paused, unpause and seek to position
        player.resume(toPosition)
        this.state.isPaused = false
      }
    }
  }
})
</script>

<template>
  <div class="status-area">
    <NowPlaying/>
    <div class="controls">
      <ControlButtons/>
      <ProgressBar :played="state.played" :duration="state.duration" @seek="onSeek"/>
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
