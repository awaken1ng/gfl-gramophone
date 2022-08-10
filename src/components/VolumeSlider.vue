<script lang="ts">
import Slider from 'vue-slider-component';
import player from '@/player'
import { defineComponent } from 'vue';

const INTERVAL = 0.01

export default defineComponent({
  components: {
    Slider,
  },
  data() {
    return {
      icon: 'volume_up',
      active: false,
      slider: {
        interval: INTERVAL,
        tooltipFormatter: (value: number) => {
          const percent = value / INTERVAL
          return percent.toFixed(0) + '%'
        }
      }
    }
  },
  computed: {
    volume: {
      get() {
        const volume = localStorage.getItem('volume')
        if (volume) {
          return parseFloat(volume)
        } else {
          return player.volume || 1
        }
      },
      set(value: number) {
        localStorage.setItem('volume', value.toString())
        player.volume = value
        this.icon = this.getVolumeIcon(value)
      }
    }
  },
  methods: {
    toggleDropdown(event: MouseEvent) {
      if (!event || !event.target) return

      const target = event.target as HTMLElement
      if (!target.classList.contains('material-icons')) return

      this.active = !this.active
    },
    getVolumeIcon(volume: number): string {
      // computed volume property is cached and not updated immediately
      const percent = volume / INTERVAL
      if (percent === 0) return 'volume_mute'
      else if (percent < 50) return 'volume_down'
      else return 'volume_up'
    }
  }
});
</script>

<template>
  <div class="volume-slider"
    v-on:click="toggleDropdown"
    v-bind:class="{ active }"
  >
    <span class="material-icons">{{ icon }}</span>
    <Slider
      style="padding: 8px;"
      :min="0"
      :max="1"
      :interval="slider.interval"
      :height="180"
      direction="ttb"
      tooltip="always"
      tooltipPlacement="right"
      :tooltip-formatter="slider.tooltipFormatter"
      v-model="volume"
      v-bind:class="{ active }"
    />
  </div>
</template>

<style>
/* align the volume icon and slider to other icons */
@media (max-width: 500px) {
  .controls .control-buttons {
    padding-right: calc((var(--control-buttons-horizontal-padding) * 2) + var(--icon-size));
  }

  .controls .control-buttons .volume-slider {
    top: 0.5rem
  }
}

.control-buttons {
  /* make space for the volume icon */
  padding-right: var(--icon-size);
  /* position the icon and the slider to the right of the container */
  position: relative;
}

.control-buttons .volume-slider {
  position: absolute;
  top: 0;
  right: 0;
  /* center the icon and the slider */
  display: flex;
  flex-direction: column;
  align-items: center;
  /* toggle visibility by using opacity */
  --transition-time: 100ms;
  transition: var(--transition-time) ease-in-out;
  /* make clicks go through when inactive */
  pointer-events: none;
  /* style the dropdown */
  border-radius: 5px;
}

.control-buttons .volume-slider .vue-slider {
  transition: var(--transition-time) ease-in-out;
  opacity: 0;
}

.control-buttons .volume-slider.active .vue-slider {
  opacity: 1
}

.control-buttons .volume-slider.active {
  pointer-events: unset;
}

.control-buttons .volume-slider .material-icons {
  /* keep the icon clickable when inactive */
  pointer-events: all;
}

.control-buttons .volume-slider.active {
  background-color: #fff;
  box-shadow: 0px 0px 5px var(--focus);
}
</style>
