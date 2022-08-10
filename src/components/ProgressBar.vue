<script setup lang="ts">
import { ref, computed } from 'vue';
import Slider from 'vue-slider-component';

const seekbar = ref<InstanceType<typeof Slider> | undefined>();

const props = defineProps<{
  played: number,
  duration: number,
}>();

const emit = defineEmits<{
  (event: 'seek', toPosition: number): void
}>();

function formatMMSS(seconds: number) {
  // format seconds to 'mm:ss'
  seconds = Math.round(seconds)
  const minutesFormatted = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secondsFormatted = String(Math.round(seconds % 60)).padStart(2, '0')
  return `${minutesFormatted}:${secondsFormatted}`
}

const playedMMSS = computed(() => formatMMSS(props.played));
const durationMMSS = computed(() => formatMMSS(props.duration));
</script>

<template>
  <div class="progress-bar">
    <Slider
      style="padding: 10px 0; margin: 0 10px; height: 6px;"
      ref="seekbar"
      width="100%"
      tooltip="none"
      v-model="played"
      :max="Math.ceil(duration)"
      @change="(v: number) => emit('seek', v)"
    />
    <span class="played">{{ playedMMSS }}</span>
    /
    <span class="duration">{{ durationMMSS }}</span>
  </div>
</template>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
