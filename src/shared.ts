import Slider from 'vue-slider-component'
import player from '#/player'

export interface Playlist {
  [index: number]: {
    title: string,
    tags?: string | string[],
    path: string,
    loop: {
      start: number,
      end: number
    }
  },
  length: number
}

interface Shared {
  sampleRate: number,
  state: {
    cache: {[index: number]: AudioBuffer},
    nowPlaying: number | undefined,
    lastPlayed: number | null,
    looping: boolean,
    isLoading: { track: number, progress: number } | undefined,
    isDecoding: number | undefined,
    isPaused: boolean
  },
  sliders: {
    seekbar: Slider | undefined
  },
  methods: {
    playback: {
      start: (trackIndex: number, position: number) => void,
      stop: () => void
    }
  }
}

const root = 'bgm' // root of audio files
export const playlist = require('#/assets/playlist.json') as Playlist // tslint:disable-line no-var-requires

const shared: Shared = {
  sampleRate: 44100,
  state: {
    cache: {},
    nowPlaying: undefined, // track index
    lastPlayed: null, // index of last played track
    looping: true,
    isLoading: undefined,
    isDecoding: undefined,
    isPaused: false
  },
  sliders: {
    seekbar: undefined
  },
  methods: {
    playback: {
      stop: () => {}, // tslint:disable-line:no-empty
      start: (trackIndex: number, position: number) => {} // tslint:disable-line:no-empty
    }
  }
}

shared.methods.playback.stop = () => {
  player.stop()
  shared.state.nowPlaying = undefined
  shared.state.isPaused = false
  if (shared.sliders.seekbar) shared.sliders.seekbar.setIndex(0)
}

shared.methods.playback.start = (trackIndex: number, position: number) => {
  if (!position) position = 0

  const track = playlist[trackIndex]
  const url = root + '/' + track.path
  const state = shared.state
  const cache = state.cache
  const stopPlayback = shared.methods.playback.stop
  const volume = localStorage.getItem('volume') || '1'

  const callback = (buffer: AudioBuffer) => {
    // loop ranges are stored in samples, convert to seconds
    const sampleRate = shared.sampleRate
    const loop = {
      enabled: state.looping,
      start: track.loop.start / sampleRate,
      end: track.loop.end / sampleRate
    }
    shared.methods.playback.stop()
    player.set.source(buffer, loop)
    player.volume = parseFloat(volume)
    player.play(position, { stop: () => { stopPlayback() } })
    state.nowPlaying = trackIndex
    state.lastPlayed = trackIndex
  }

  // pull the track from cache,
  // or download it and cache for future use
  if (cache[trackIndex]) {
    callback(cache[trackIndex])
  } else {
    state.isLoading = { track: trackIndex, progress: 0 }
    player.download(url,
      {
        progress: (event) => {
          if (!event.lengthComputable) return
          const percent = (event.loaded / event.total) * 100
          if (typeof state.isLoading === 'object') state.isLoading.progress = parseInt(percent.toFixed(0), 10)
        },
        load: () => {
          state.isLoading = undefined
          state.isDecoding = trackIndex
        },
        decoded: (buffer: AudioBuffer) => {
          state.isDecoding = undefined
          cache[trackIndex] = buffer
          callback(buffer)
        },
        error: () => { state.isLoading = undefined }
      })
  }
}

export default shared
