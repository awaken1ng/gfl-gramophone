export interface Loop {
  enabled?: boolean,
  startS: number,
  endS: number,
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
  timeoutId: number,
  // timestamp of monotoic clock on the start of the tick
  timestampMs: number,
  playedMs: number,
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
      timeoutId: 0,
      timestampMs: 0,
      playedMs: 0,
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

    this.source.loop = Boolean(loop.enabled && (loop.startS || loop.endS))
    this.source.loopStart = loop.startS
    this.source.loopEnd = loop.endS
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
   * @param {number} positionMs - At what position start the audio playback
   * @param {object} Object with progress, stop and/or loop callback functions
   */
  public play(positionMs: number, callbacks: PlaybackCallbacks) {
    if (!this.source) return

    console.log(`Starting playback from ${positionMs} ms`)
    // start the playback
    const source = this.source
    if (!source.buffer) return

    // AudioBufferSourceNode requires the position to be in seconds
    source.start(0, positionMs / 1000)

    // start counting seconds on how long the audio been playing
    // send the position to callback every tick
    const progress = this.progress
    progress.callbacks = callbacks
    progress.playedMs = positionMs
    progress.timestampMs = performance.now()

    const loopStartMs = source.loopStart * 1000
    const loopEndMs = source.loopEnd * 1000
    const durationMs = source.buffer.duration * 1000

    const tick = () => {
      // if playback was stopped, stop the timer
      if (!source.buffer) {
        clearTimeout(progress.timeoutId)
        return
      }

      const now = performance.now()
      const delta = now - progress.timestampMs
      progress.playedMs += delta

      if (source.loop && progress.playedMs >= loopEndMs) {
        // wrap around if we passed the loop end
        progress.playedMs = loopStartMs + (progress.playedMs - loopEndMs)
        if (callbacks.loop) callbacks.loop()
      } else if (!source.loop && progress.playedMs >= durationMs) {
        // if we passed the end of the song, stop the counter
        clearTimeout(progress.timeoutId)
        progress.playedMs = 0
        if (callbacks.stop) callbacks.stop()
      }
      if (callbacks.progress) callbacks.progress(progress.playedMs)

      progress.timestampMs = now
      progress.timeoutId = setTimeout(() => tick(), 100)
    }

    tick()
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
    // avoid redefining a new object,
    // otherwise timer will not pick up the timestamp change
    clearTimeout(this.progress.timeoutId)
    this.progress.playedMs = 0
    this.progress.callbacks = undefined
  }

  /**
   * Resume the playback of paused source
   */
  public resume(resumeAtMs?: number) {
    if (!this.source) return

    console.log(`Resuming at ${this.progress.playedMs} ms`)
    // move the source, loop range, callback and position
    const buffer = this.source.buffer
    const loop: Loop = {
      enabled: this.source.loop,
      startS: this.source.loopStart,
      endS: this.source.loopEnd
    }
    const callbacks = this.progress.callbacks
    const volume = this.volume

    if (resumeAtMs === undefined) resumeAtMs = this.progress.playedMs

    // clean up
    this.source = undefined
    this.gain = undefined
    this.progress.playedMs = 0
    this.progress.callbacks = undefined

    // set the source back and resume playback
    this.setSource(buffer as AudioBuffer, loop)
    this.volume = volume
    this.play(resumeAtMs, callbacks as PlaybackCallbacks)
  }

  /**
   * Pause the audio source
   */
  public pause() {
    console.log(`Pausing at ${this.progress.playedMs} ms`)

    // stop the source
    if (this.source) this.source.stop()

    // stop the progress counter
    clearTimeout(this.progress.timeoutId)
  }

  public seek(positionMs: number) {
    if (!this.source) return

    const buffer = this.source.buffer
    if (!buffer) return

    console.log(`Seeking to ${positionMs} ms`)
    const loop: Loop = {
      enabled: this.source.loop,
      startS: this.source.loopStart,
      endS: this.source.loopEnd
    }
    const callbacks = this.progress.callbacks
    const volume = this.volume

    this.stop()
    this.setSource(buffer, loop)
    this.volume = volume
    this.progress.playedMs = positionMs
    this.play(positionMs, callbacks as PlaybackCallbacks)
  }
}

const player = new AudioPlayer()
export default player
