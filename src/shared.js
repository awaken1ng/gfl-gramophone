import player from '#/player'
import playlist from '#/assets/playlist'

const root = 'bgm' // root of audio files

const shared = {
  sampleRate: 44100,
  state: {
    cache: {},
    nowPlaying: null, // track index
    lastPlayed: null, // index of last played track
    looping: true,
    isLoading: false,
    isPaused: false
  },
  sliders: {
    seekbar: null
  },
  methods: {
    playback: {}
  }
}

shared.methods.playback.stop = function () {
  player.stop()
  shared.state.nowPlaying = null
  shared.sliders.seekbar.setIndex(0)
}

shared.methods.playback.start = function (trackIndex, position) {
  if (!position) position = 0

  let track = playlist[trackIndex]
  let url = root + '/' + track.path
  let state = shared.state
  let cache = state.cache
  let stopPlayback = shared.methods.playback.stop

  let callback = function (buffer) {
    // loop ranges are stored in samples, convert to seconds
    let sampleRate = shared.sampleRate
    let loop = {
      enabled: state.looping,
      start: track.loop.start / sampleRate,
      end: track.loop.end / sampleRate
    }
    player.stop()
    player.set.source(buffer, loop)
    player.volume = localStorage.getItem('volume') || 1
    player.play(position, { stop: function () { stopPlayback() } })
    state.nowPlaying = trackIndex
    state.lastPlayed = trackIndex
  }

  // pull the track from cache,
  // or download it and cache for future use
  if (cache[trackIndex]) {
    callback(cache[trackIndex])
  } else {
    state.isLoading = trackIndex
    player.download(url,
      {
        success: function (buffer) {
          state.isLoading = false
          cache[trackIndex] = buffer
          callback(buffer)
        },
        error: function () { state.isLoading = false }
      })
  }
}

export default shared
