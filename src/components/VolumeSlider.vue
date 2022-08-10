<script setup lang="ts">
import { ref, computed } from '@vue/reactivity';
import Slider from 'vue-slider-component';

const props = defineProps({
  volume: {
    type: Number,
    default: 1.0,
  },
});

const emit = defineEmits<{
  (event: 'change', newVolume: number): void,
}>();

const active = ref(false);

const toggleDropdown = (event: MouseEvent) => {
  if (!event || !event.target) return;

  const target = event.target as HTMLElement;
  if (!target.classList.contains('material-icons')) return;

  active.value = !active.value;
};

const icon = computed(() => {
  const percent = props.volume / INTERVAL;
  if (percent === 0) return 'volume_mute';
  else if (percent < 50) return 'volume_down';
  else return 'volume_up';
});

const INTERVAL = 0.01;

const tooltipFormatter = (value: number) => {
  const percent = value / INTERVAL;
  return percent.toFixed(0) + '%';
};
</script>

<template>
  <div
    class="volume-slider"
    :class="{ active }"
    @click="toggleDropdown"
  >
    <span class="material-icons">{{ icon }}</span>
    <Slider
      :class="{ active }"
      style="padding: 8px;"
      v-model="volume"
      direction="ttb"
      :height="180"
      :min="0"
      :max="1"
      :interval="INTERVAL"
      tooltip="always"
      tooltip-placement="right"
      :tooltip-formatter="tooltipFormatter"
      @change="(v) => emit('change', v)"
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
