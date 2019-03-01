class AudioPlayer {
  constructor () {
    this.context = new (window.AudioContext || window.webkitAudioContext)()

    this.gain = null
    this.source = null
    this.progress = {
      iid: 0, // interval id
      played: 0,
      callbacks: null
    }
    this.set = {
      /**
       * Set audio source
       * @param {AudioBuffer} buffer
       * @param {{start: number, end: number}} loop
       */
      source: function (buffer, loop) {
        console.log('Setting the source to', buffer, loop)
        let gain = this.context.createGain()
        this.gain = gain

        let source = this.context.createBufferSource()
        source.buffer = buffer
        source.connect(gain)
        gain.connect(this.context.destination)
        this.source = source
        if (loop) this.set.loop(loop)
      }.bind(this),
      loop: function (loop) {
        let source = this.source
        if (source && loop) {
          source.loop = Boolean(loop.enabled && (loop.start || loop.end))
          source.loopStart = loop.start
          source.loopEnd = loop.end
        }
      }.bind(this)
    }
  }

  get volume () { if (this.gain) return this.gain.gain.value }
  set volume (value) { if (this.gain) this.gain.gain.value = value }

  /**
   * Download audio from URL and do something with it in callback
   * @param {string} url
   * @param {function(AudioBuffer)} callback
   */
  download (url, callbacks) {
    if (!callbacks || (callbacks && !callbacks.decoded)) throw Error('Decoded callback is missing')

    let player = this
    let request = new XMLHttpRequest()
    if (!callbacks.error) callbacks.error = function (error) { console.error('AudioPlayer.download', error) }

    request.open('GET', url, true)
    request.responseType = 'arraybuffer'
    request.onload = function () {
      if (callbacks.load) callbacks.load()
      player.context.decodeAudioData(request.response)
        .then(callbacks.decoded)
        .catch(callbacks.error)
    }
    if (callbacks.progress) request.onprogress = callbacks.progress
    request.send()
  }

  /**
   *
   * @param {number} position - At what position start the audio playback
   * @param {object} Object with progress, stop and/or loop callback functions
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
      progress.played += 1
      if (source.loop && progress.played >= source.loopEnd) {
        // wrap around if we passed the loop end
        progress.played = source.loopStart + (progress.played - source.loopEnd)
        if (callbacks && callbacks.loop) callbacks.loop()
      } else if (!source.loop && progress.played >= source.buffer.duration) {
        // if we passed the end of the song, stop the counter
        clearInterval(progress.iid)
        progress.iid = 0
        progress.played = 0
        if (callbacks && callbacks.stop) callbacks.stop()
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
      this.gain = null
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
  resume (resumeAt) {
    console.log('Resuming at', this.progress.played)

    // move the source, loop range, callback and position
    let buffer = this.source.buffer
    let loop = {
      enabled: this.source.loop,
      start: this.source.loopStart,
      end: this.source.loopEnd
    }
    let callbacks = this.progress.callbacks
    let volume = this.gain.gain.value

    if (resumeAt === undefined) resumeAt = this.progress.played

    // clean up
    this.source = null
    this.gain = null
    this.progress.played = 0
    this.progress.callbacks = null

    // set the source back and resume playback
    this.set.source(buffer, loop)
    this.volume = volume
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
    let volume = this.gain.gain.value

    this.stop()
    this.set.source(buffer, loop)
    this.volume = volume
    this.progress.played = position
    this.play(position, callbacks)
  }
}

const player = new AudioPlayer()
export default player
