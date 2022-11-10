import './style.css'
import * as Transcribe from './libs/transcribe'

const record = document.querySelector<HTMLButtonElement>('.record')!
const stopButton = document.querySelector<HTMLButtonElement>('.stop')!
const transcript = document.querySelector<HTMLElement>('.transcript')!
const soundClips = document.querySelector<HTMLElement>('.sound-clips')!

function writeTranscript(content: string) {
  transcript.innerText += ` ${content}`
}

function handleSuccess(stream: MediaStream) {
  let chunks: Blob[] = []

  const mediaRecorder = new MediaRecorder(stream)
  mediaRecorder.addEventListener('dataavailable', (e) => {
    console.log('data: ', e.data)
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  })

  mediaRecorder.addEventListener('stop', () => {
    console.log('record stop')

    const clipContainer = document.createElement('article')
    const clipLabel = document.createElement('p')
    const audio = document.createElement('audio')
    const deleteButton = document.createElement('button')

    clipContainer.classList.add('clip')
    audio.setAttribute('controls', '')
    deleteButton.innerHTML = 'Delete'
    clipLabel.innerHTML = 'audio-01'

    clipContainer.appendChild(audio)
    clipContainer.appendChild(clipLabel)
    clipContainer.appendChild(deleteButton)
    soundClips.appendChild(clipContainer)

    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
    chunks = []
    const audioURL = window.URL.createObjectURL(blob)
    audio.src = audioURL
  })

  mediaRecorder.start()

  stopButton.addEventListener('click', () => {
    console.log('stop')
    mediaRecorder.stop()

    record.disabled = false
    Transcribe.stopRecording()
  })
}

record.addEventListener('click', () => {
  console.log('recording...')
  Transcribe.startRecording('en-US', writeTranscript)

  navigator.mediaDevices
    .getUserMedia({
      video: false,
      audio: true,
    })
    .then(handleSuccess)

  record.disabled = true
})
