import './style.css'
import * as Transcribe from './libs/transcribe'

const record = document.querySelector<HTMLButtonElement>('.record')!
const stopButton = document.querySelector<HTMLButtonElement>('.stop')!
const transcript = document.querySelector<HTMLElement>('.transcript')!

function writeTranscript(content: string) {
  transcript.innerText += ` ${content}`
}

record.addEventListener('click', () => {
  console.log('recording...')
  Transcribe.startRecording('en-US', writeTranscript)

  record.disabled = true
})

stopButton.addEventListener('click', () => {
  console.log('stop')
  Transcribe.stopRecording()
  record.disabled = false
})
