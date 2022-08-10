interface Loop {
  enabled?: boolean,
  start: number,
  end: number
}

interface DownloadCallbacks {
  progress?: (event: ProgressEvent) => void
  load?: () => void,
  decoded?: (buffer: AudioBuffer) => void,
  error?: (error?: string) => void,
}

interface PlaybackCallbacks {
  progress?: (played: number) => void
  loop?: () => void,
  stop?: () => void
}

interface Progress {
  iid: number,
  played: number,
  callbacks: PlaybackCallbacks | undefined
}

class AudioPlayer {
  context: AudioContext
  source: AudioBufferSourceNode | undefined
  gain: GainNode | undefined
  progress: Progress

  constructor() {
    this.context = new AudioContext()

    this.source = undefined
    this.gain = undefined
    this.progress = {
      iid: 0, // interval id
      played: 0,
      callbacks: {}
    }
  }

  /**
   * Set audio source
   * @param {AudioBuffer} buffer
   * @param {{start: number, end: number}} loop
   */
  public setSource(buffer: AudioBuffer, loop?: Loop) {
    console.log('Setting the source to', buffer, loop)
    this.gain = this.context.createGain()

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.gain)
    this.gain.connect(this.context.destination)
    this.source = source
    if (loop) this.setLoop(loop)
  }

  public setLoop(loop: Loop) {
    if (!this.source) return

    this.source.loop = Boolean(loop.enabled && (loop.start || loop.end))
    this.source.loopStart = loop.start
    this.source.loopEnd = loop.end
  }

  public get volume(): number {
    if (!this.gain) return 1
    return this.gain.gain.value
  }
  public set volume(value: number) { if (this.gain) this.gain.gain.value = value }

  /**
   * Download audio from URL and do something with it in callback
   * @param {string} url
   * @param {function(AudioBuffer)} callback
   */
  public download(url: string, callbacks: DownloadCallbacks) {
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
  public play(position: number, callbacks: PlaybackCallbacks) {
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
      if (callbacks && callbacks.progress) callbacks.progress(progress.played)
    }, 1000)
  }

  public stop() {
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
  public resume(resumeAt?: number) {
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
    const volume = this.volume

    if (resumeAt === undefined) resumeAt = this.progress.played

    // clean up
    this.source = undefined
    this.gain = undefined
    this.progress.played = 0
    this.progress.callbacks = undefined

    // set the source back and resume playback
    this.setSource(buffer as AudioBuffer, loop)
    this.volume = volume
    this.play(resumeAt, callbacks as PlaybackCallbacks)
  }

  /**
   * Pause the audio source
   */
  public pause() {
    console.log('Pausing at', this.progress.played)

    // stop the source
    if (this.source) this.source.stop()

    // stop the progress counter
    clearInterval(this.progress.iid)
    this.progress.iid = 0
  }

  public seek(position: number) {
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
    const volume = this.volume

    this.stop()
    this.setSource(buffer, loop)
    this.volume = volume
    this.progress.played = position
    this.play(position, callbacks as PlaybackCallbacks)
  }
}

const player = new AudioPlayer()
export default player
