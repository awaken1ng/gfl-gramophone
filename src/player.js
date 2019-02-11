class AudioPlayer {
  constructor () {
    this.context = new (window.AudioContext || window.webkitAudioContext)()

    this.source = null
    this.progress = {
      iid: 0, // interval id
      played: 0,
      callbacks: null
    }
  }

  /**
   * Download audio from URL and do something with it in callback
   * @param {string} url
   * @param {function(AudioBuffer)} callback
   */
  download (url, successCallback, errorCallback) {
    let player = this
    let request = new XMLHttpRequest()
    if (!errorCallback) errorCallback = function (error) { console.error('AudioPlayer.downloadAudio', error) }

    request.open('GET', url, true)
    request.responseType = 'arraybuffer'
    request.onload = function () {
      player.context.decodeAudioData(request.response)
        .then(successCallback)
        .catch(errorCallback)
    }
    request.send()
  }

  /**
   * Set audio source
   * @param {AudioBuffer} buffer
   * @param {{start: number, end: number}} loop
   */
  set (buffer, loop) {
    console.log('Setting the source to', buffer, loop)
    let source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.context.destination)
    this.source = source
    this.setLoop(loop)
  }
  setLoop (loop) {
    let source = this.source
    if (source && loop) {
      source.loop = Boolean(loop.enabled && (loop.start || loop.end))
      source.loopStart = loop.start
      source.loopEnd = loop.end
    }
  }

  /**
   *
   * @param {number} position - At what position start the audio playback
   * @param {function(number)} progressCallback
   */
  play (position, callbacks) {
    console.log('Starting playback from', position)
    // start the playback
    let source = this.source
    source.start(0, position)

    // start counting seconds on how long the audio been playing
    // send the position to callback every second
    let progress = this.progress
    progress.callbacks = callbacks
    progress.played = position
    progress.iid = setInterval(function () {
      if (source.loop && progress.played >= source.loopEnd) {
        // wrap around if we passed the loop end
        progress.played = source.loopStart
        if (callbacks && callbacks.loop) callbacks.loop()
      } else if (!source.loop && progress.played >= source.buffer.duration) {
        // if we passed the end of the song, stop the counter
        clearInterval(progress.iid)
        progress.iid = 0
        progress.played = 0
        if (callbacks && callbacks.stop) callbacks.stop()
      } else {
        progress.played += 1
      }
      if (callbacks && callbacks.progress) callbacks.progress(progress.played)
    }, 1000)
  }

  stop () {
    console.log('Stopping')
    // stop and null the source
    if (this.source) {
      this.source.stop()
      this.source = null
    }

    // stop and reset the progress counter
    if (this.progress.iid) clearInterval(this.progress.iid)
    this.progress = {
      iid: 0,
      played: 0,
      callbacks: null
    }
  }

  /**
   * Resume the playback of paused source
   */
  resume () {
    console.log('Resuming to', this.progress.played)

    // move the source, loop range, callback and position
    let buffer = this.source.buffer
    let loop = {
      enabled: this.source.loop,
      start: this.source.loopStart,
      end: this.source.loopEnd
    }
    let callbacks = this.progress.callbacks
    let resumeAt = this.progress.played

    // clean up
    this.source = null
    this.progress.played = 0
    this.progress.callbacks = null

    // set the source back and resume playback
    this.set(buffer, loop)
    this.play(resumeAt, callbacks)
  }

  /**
   * Pause the audio source
   */
  pause () {
    console.log('Pausing at', this.progress.played)

    // stop the source
    this.source.stop()

    // stop the progress counter
    clearInterval(this.progress.iid)
    this.progress.iid = 0
  }

  seek (position) {
    if (!this.source) return

    console.log('Seeking to', position)
    let buffer = this.source.buffer
    let loop = {
      enabled: this.source.loop,
      start: this.source.loopStart,
      end: this.source.loopEnd
    }
    let callbacks = this.progress.callbacks

    this.stop()
    this.set(buffer, loop)
    this.progress.played = position
    this.play(position, callbacks)
  }
}

let player = new AudioPlayer()
export default player
