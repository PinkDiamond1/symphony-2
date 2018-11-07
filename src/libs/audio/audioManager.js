import EventEmitter from 'eventemitter3'
import GPU from 'gpu.js'
import AudioUtils from './audioUtils'

import AudioWorker from '../../workers/audio.worker.js'
import NoteWorker from '../../workers/note.worker.js'

export default class Audio extends EventEmitter {
  constructor (args) {
    super(args)

    this.sampleRate = args.sampleRate
    this.soundDuration = args.soundDuration
    this.noteDuration = args.noteDuration

    this.audioUtils = new AudioUtils({
      sampleRate: this.sampleRate,
      soundDuration: this.soundDuration,
      noteDuration: this.noteDuration
    })

    this.gpu = new GPU()
    this.audioContext = new window.AudioContext()
    this.blockAudioBus = this.audioContext.createGain()
    this.masterBus = this.audioContext.createGain()

    this.compressor = this.audioContext.createDynamicsCompressor()
    this.compressor.threshold.setValueAtTime(-10, this.audioContext.currentTime)
    this.compressor.knee.setValueAtTime(0, this.audioContext.currentTime)
    this.compressor.ratio.setValueAtTime(5, this.audioContext.currentTime)
    this.compressor.attack.setValueAtTime(0, this.audioContext.currentTime)
    this.compressor.release.setValueAtTime(1.0, this.audioContext.currentTime)

    this.biquadFilter = this.audioContext.createBiquadFilter()
    this.biquadFilter.type = 'notch'
    this.biquadFilter.frequency.setValueAtTime(700, this.audioContext.currentTime)
    this.biquadFilter.gain.setValueAtTime(-0.9, this.audioContext.currentTime)
    this.biquadFilter.Q.setValueAtTime(0.1, this.audioContext.currentTime)

    this.highShelf = this.audioContext.createBiquadFilter()
    this.highShelf.type = 'highshelf'
    this.highShelf.gain.setValueAtTime(-10.0, this.audioContext.currentTime)
    this.highShelf.frequency.setValueAtTime(1000, this.audioContext.currentTime)

    // this.lowShelf = this.audioContext.createBiquadFilter()
    // this.lowShelf.type = 'lowshelf'
    // this.lowShelf.frequency.setValueAtTime(250, this.audioContext.currentTime)
    // this.lowShelf.gain.setValueAtTime(6.0, this.audioContext.currentTime)

    const getImpulseBuffer = (audioContext, impulseUrl) => {
      return window.fetch(impulseUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    }

    this.convolver = this.audioContext.createConvolver()
    this.delay = this.audioContext.createDelay(5.0)

    getImpulseBuffer(this.audioContext, './assets/sounds/IR/EchoBridge.wav').then((buffer) => {
      this.convolver.buffer = buffer
      this.blockAudioBus.connect(this.masterBus)
      this.masterBus.connect(this.highShelf)
      this.highShelf.connect(this.biquadFilter)
      this.biquadFilter.connect(this.compressor)
      this.compressor.connect(this.delay)
      this.delay.connect(this.convolver)
      this.convolver.connect(this.audioContext.destination)
    })

    this.notes = {
      27.5000: 'A0',
      29.1352: 'A#0',
      30.8677: 'B0',
      32.7032: 'C1',
      34.6478: 'C#1',
      36.7081: 'D1',
      38.8909: 'D#1',
      41.2034: 'E1',
      43.6535: 'F1',
      46.2493: 'F#1',
      48.9994: 'G1',
      51.9131: 'G#1',
      55.000: 'A1',
      58.2705: 'A#1',
      61.7354: 'B1',
      65.4064: 'C2',
      69.2957: 'C#2',
      73.4162: 'D2',
      77.7817: 'D#2',
      82.4069: 'E2',
      87.3071: 'F2',
      92.4986: 'F#2',
      97.9989: 'G2',
      103.826: 'G#2',
      110.000: 'A2',
      116.541: 'A#2',
      123.471: 'B2',
      130.813: 'C3',
      138.591: 'C#3',
      146.832: 'D3',
      155.563: 'D#3',
      164.814: 'E3',
      174.614: 'F3',
      184.997: 'F#3',
      195.998: 'G3',
      207.652: 'G#3',
      220.000: 'A3',
      233.082: 'A#3',
      246.942: 'B3',
      261.626: 'C4',
      277.183: 'C#4',
      293.665: 'D4',
      311.127: 'D#4',
      329.628: 'E4',
      349.228: 'F4',
      369.994: 'F#4',
      391.995: 'G4',
      415.305: 'G#4',
      440.000: 'A4',
      466.164: 'A#4',
      493.883: 'B4',
      523.251: 'C5',
      554.365: 'C#5',
      587.330: 'D5',
      622.254: 'D#5',
      659.255: 'E5',
      698.456: 'F5',
      739.989: 'F#5',
      783.991: 'G5',
      830.609: 'G#5',
      880.000: 'A5',
      932.328: 'A#5',
      987.767: 'B5',
      1046.50: 'C6',
      1108.73: 'C#6',
      1174.66: 'D6',
      1244.51: 'D#6',
      1318.51: 'E6',
      1396.91: 'F6',
      1479.98: 'F#6',
      1567.98: 'G6',
      1661.22: 'G#6',
      1760.00: 'A6',
      1864.66: 'A#6',
      1975.53: 'B6',
      2093.00: 'C7',
      2217.46: 'C#7',
      2349.32: 'D7',
      2489.02: 'D#7',
      2637.02: 'E7',
      2793.83: 'F7',
      2959.96: 'F#7',
      3135.96: 'G7',
      3322.44: 'G#7',
      3520.00: 'A7',
      3729.31: 'A#7',
      3951.07: 'B7',
      4186.01: 'C8',
      4434.92: 'C#8',
      4698.63: 'D8',
      4978.03: 'D#8',
      5274.04: 'E8',
      5587.65: 'F8',
      5919.91: 'F#8',
      6271.93: 'G8',
      6644.88: 'G#8',
      7040.00: 'A8',
      7458.62: 'A#8',
      7902.13: 'B8'
    }

    this.modes = {
      // 'ionian': [
      //   'C',
      //   'E',
      //   'G'
      // ],
      // 'dorian': [
      //   'F',
      //   'A',
      //   'C'
      // ],
      // 'phrygian': [
      //   'E',
      //   'G',
      //   'B'
      // ],
      // 'lydian': [
      //   'A',
      //   'C',
      //   'E'
      // ],
      // 'mixolydian': [
      //   'G',
      //   'B',
      //   'D'
      // ],
      // 'aeolian': [
      //   'D',
      //   'F',
      //   'A'
      // ],
      // 'locrian': [
      //   'B',
      //   'D',
      //   'F'
      // ]
      'ionian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'B',
        'C'
      ],
      'dorian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'phrygian': [
        'C',
        'C#',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'lydian': [
        'C',
        'D',
        'E',
        'F#',
        'G',
        'A',
        'B',
        'C'
      ],
      'mixolydian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'aeolian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'locrian': [
        'C',
        'C#',
        'D#',
        'F',
        'F#',
        'G#',
        'A#',
        'C'
      ]
    }
    this.buffers = []
    this.noteBuffers = []
    this.gainNodes = []
    this.audioSources = []
    this.noteSources = []
    this.loops = {}

    this.blockAudioData = {}

    this.times = []

    // use OffscreenCanvas if available
    if (typeof window.OffscreenCanvas !== 'undefined') {
      this.offscreenMode = true
    }
  }

  startAudio (blockData, arrayBuffers) {
    console.time('fillBuffer')

    let lArray = this.buffers[blockData.height].getChannelData(0)
    let rArray = this.buffers[blockData.height].getChannelData(1)
    for (let index = 0; index < arrayBuffers.lArray.length; index++) {
      lArray[index] = arrayBuffers.lArray[index]
      rArray[index] = arrayBuffers.rArray[index]
    }
    console.timeEnd('fillBuffer')

    this.audioSources[blockData.height] = this.audioContext.createBufferSource()
    this.audioSources[blockData.height].buffer = this.buffers[blockData.height]

    this.gainNodes[blockData.height] = this.audioContext.createGain()

    this.audioSources[blockData.height].connect(this.gainNodes[blockData.height])

    this.gainNodes[blockData.height].connect(this.blockAudioBus)

    this.audioSources[blockData.height].loop = true

    this.loops[blockData.height] = () => {
      setTimeout(function () {
        this.emit('loopend', blockData)
        this.loops[blockData.height](blockData)
      }.bind(this), this.soundDuration * 1000)
    }

    this.loops[blockData.height](blockData)

    this.audioSources[blockData.height].start()
  }

  generate (blockData) {
    this.buffers[blockData.height] = this.audioContext.createBuffer(2, this.sampleRate * this.soundDuration, this.sampleRate)

    if (this.offscreenMode) {
      const audioWorker = new AudioWorker()
      audioWorker.onmessage = async ({ data }) => {
        if (typeof data.lArray !== 'undefined') {
          this.blockAudioData[blockData.height] = data.blockAudio

          return this.startAudio(blockData, data)
        }
        audioWorker.terminate()
      }

      audioWorker.postMessage({
        cmd: 'get',
        blockData: blockData,
        modes: this.modes,
        notes: this.notes,
        sampleRate: this.sampleRate,
        soundDuration: this.soundDuration
      })
    } else {
      const sineBank = this.gpu.createKernel(this.audioUtils.sineBank, {loopMaxIterations: 1500}).setOutput([this.sampleRate * this.soundDuration])
      sineBank.addNativeFunction('custom_smoothstep', this.audioUtils.customSmoothstep)
      sineBank.addNativeFunction('custom_step', this.audioUtils.customStep)
      sineBank.addNativeFunction('custom_random', this.audioUtils.customRandom)

      const blockAudio = this.audioUtils.generateBlockAudio(blockData, this.modes, this.notes)

      console.time('sineBank')
      let sineArray = sineBank(blockAudio.frequencies, blockAudio.txTimes, blockAudio.spent, blockAudio.health, blockAudio.frequencies.length, this.sampleRate)
      console.timeEnd('sineBank')

      let arrayBuffers = this.audioUtils.fillBuffer(sineArray)

      return this.startAudio(blockData, arrayBuffers)
    }
  }

  playNote (blockData, txID) {
    if (typeof this.blockAudioData[blockData.height] === 'undefined') {
      return
    }

    if (this.offscreenMode) {
      const noteWorker = new NoteWorker()
      noteWorker.onmessage = async ({ data }) => {
        if (typeof data.lArray !== 'undefined') {
          return this.startNote(blockData, data)
        }
        noteWorker.terminate()
      }

      noteWorker.postMessage({
        cmd: 'get',
        blockAudioData: this.blockAudioData[blockData.height],
        txID: txID,
        sampleRate: this.sampleRate,
        soundDuration: this.soundDuration,
        noteDuration: this.noteDuration
      })
    }
  }

  stopNotes () {
    this.blockAudioBus.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 3)

    this.noteSources.forEach((source) => {
      source.stop()
    })

    this.noteSources = []
    this.noteBuffers = []
  }

  startNote (blockData, arrayBuffers) {
    this.stopNotes()

    this.noteBuffers[blockData.height] = this.audioContext.createBuffer(2, this.sampleRate * this.noteDuration, this.sampleRate)

    const buffer = this.noteBuffers[blockData.height]

    console.time('fillBuffer')

    let lArray = buffer.getChannelData(0)
    let rArray = buffer.getChannelData(1)
    for (let index = 0; index < arrayBuffers.lArray.length; index++) {
      lArray[index] = arrayBuffers.lArray[index]
      rArray[index] = arrayBuffers.rArray[index]
    }
    console.timeEnd('fillBuffer')

    this.noteSources[blockData.height] = this.audioContext.createBufferSource()

    let noteSource = this.noteSources[blockData.height]

    noteSource.buffer = buffer

    const gainNode = this.audioContext.createGain()

    this.blockAudioBus.gain.setTargetAtTime(0.1, this.audioContext.currentTime, 1)

    noteSource.connect(gainNode)

    gainNode.connect(this.masterBus)

    noteSource.loop = true

    noteSource.start()
  }
}