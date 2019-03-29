interface Loop {
  enabled?: boolean,
  start: number,
  end: number
}

interface Callbacks {
  progress?: (event: ProgressEvent) => void, // FIXME clashing name with download and playback
  load?: () => void,
  decoded?: (buffer: AudioBuffer) => void,
  error?: (error?: string) => void,
  loop?: () => void,
  stop?: () => void
}

interface Progress {
  iid: number,
  played: number,
  callbacks: Callbacks | undefined
}

class AudioPlayer {
  context: AudioContext
  source: AudioBufferSourceNode | undefined
  gain: GainNode | undefined
  progress: Progress
  set: {
    source: (buffer: AudioBuffer, loop: Loop) => void
    loop: (loop: Loop) => void
  }

  constructor () {
    this.context = new AudioContext()

    this.source = undefined
    this.gain = undefined
    this.progress = {
      iid: 0, // interval id
      played: 0,
      callbacks: {}
    }
    this.set = {
      /**
       * Set audio source
       * @param {AudioBuffer} buffer
       * @param {{start: number, end: number}} loop
       */
      source: function (this: AudioPlayer, buffer: AudioBuffer, loop: Loop) {
        console.log('Setting the source to', buffer, loop)
        const gain = this.context.createGain()
        this.gain = gain

        const source = this.context.createBufferSource()
        source.buffer = buffer
        source.connect(gain)
        gain.connect(this.context.destination)
        this.source = source
        if (loop) this.set.loop(loop)
      }.bind(this),
      loop: function (this: AudioPlayer, loop: Loop) {
        const source = this.source
        if (source && loop) {
          source.loop = Boolean(loop.enabled && (loop.start || loop.end))
          source.loopStart = loop.start
          source.loopEnd = loop.end
        }
      }.bind(this)
    }
  }

  get volume (): number {
    if (!this.gain) return 1
    return this.gain.gain.value
  }
  set volume (value: number) { if (this.gain) this.gain.gain.value = value }

  /**
   * Download audio from URL and do something with it in callback
   * @param {string} url
   * @param {function(AudioBuffer)} callback
   */
  public download (url: string, callbacks: Callbacks) {
    if (!callbacks || (callbacks && !callbacks.decoded)) throw Error('Decoded callback is missing')

    const self = this
    const request = new XMLHttpRequest()
    if (!callbacks.error) callbacks.error = (error?: string) => { console.error('AudioPlayer.download', error) }

    request.open('GET', url, true)
    request.responseType = 'arraybuffer'
    request.onload = () => {
      if (callbacks.load) callbacks.load()
      self.context.decodeAudioData(request.response)
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
  public play (position: number, callbacks: Callbacks) {
    if (!this.source) return

    console.log('Starting playback from', position)
    // start the playback
    const source = this.source
    if (!source.buffer) return

    source.start(0, position)

    // start counting seconds on how long the audio been playing
    // send the position to callback every second
    const progress = this.progress
    progress.callbacks = callbacks
    progress.played = position
    progress.iid = setInterval(() => {
      if (!source.buffer) {
        clearInterval(progress.iid)
        return
      }

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
      // if (callbacks && callbacks.progress) callbacks.progress(progress.played)
    }, 1000)
  }

  public stop () {
    console.log('Stopping')
    // stop and null the source
    if (this.source) {
      this.source.stop()
      this.source = undefined
      this.gain = undefined
    }

    // stop and reset the progress counter
    if (this.progress.iid) clearInterval(this.progress.iid)
    this.progress = {
      iid: 0,
      played: 0,
      callbacks: undefined
    }
  }

  /**
   * Resume the playback of paused source
   */
  public resume (resumeAt?: number) {
    if (!this.source) return

    console.log('Resuming at', this.progress.played)
    // move the source, loop range, callback and position
    const buffer = this.source.buffer
    const loop = {
      enabled: this.source.loop,
      start: this.source.loopStart,
      end: this.source.loopEnd
    }
    const callbacks = this.progress.callbacks
    let volume = 1
    if (this.gain) volume = this.gain.gain.value

    if (resumeAt === undefined) resumeAt = this.progress.played

    // clean up
    this.source = undefined
    this.gain = undefined
    this.progress.played = 0
    this.progress.callbacks = undefined

    // set the source back and resume playback
    this.set.source(buffer as AudioBuffer, loop)
    this.volume = volume
    this.play(resumeAt, callbacks as Callbacks)
  }

  /**
   * Pause the audio source
   */
  public pause () {
    console.log('Pausing at', this.progress.played)

    // stop the source
    if (this.source) this.source.stop()

    // stop the progress counter
    clearInterval(this.progress.iid)
    this.progress.iid = 0
  }

  public seek (position: number) {
    if (!this.source) return

    const buffer = this.source.buffer
    if (!buffer) return

    console.log('Seeking to', position)
    const loop = {
      enabled: this.source.loop,
      start: this.source.loopStart,
      end: this.source.loopEnd
    }
    const callbacks = this.progress.callbacks
    if (this.gain) {
      const volume = this.gain.gain.value
      this.volume = volume
    }

    this.stop()
    this.set.source(buffer, loop)
    this.progress.played = position
    this.play(position, callbacks as Callbacks)
  }
}

const player = new AudioPlayer()
export default player
