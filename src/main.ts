import './style.css'

const record = document.querySelector<HTMLButtonElement>('.record')!
const stopButton = document.querySelector<HTMLButtonElement>('.stop')!
const soundClips = document.querySelector<HTMLElement>('.sound-clips')!

function onSuccess(stream: MediaStream) {
  const options = { mimeType: 'audio/webm' }
  const mediaRecorder = new MediaRecorder(stream, options)
  let chunks: Blob[] = []

  record.addEventListener('click', () => {
    mediaRecorder.start()

    console.log(mediaRecorder.state)
    console.log('recorder started')
    record.style.background = 'red'
    record.style.color = 'black'
  })

  stopButton.addEventListener('click', () => {
    mediaRecorder.stop()
    console.log(mediaRecorder.state)
    console.log('recorder stopped')
    record.style.background = ''
    record.style.color = ''
  })

  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  })

  mediaRecorder.addEventListener('stop', () => {
    console.log('data available after MediaRecorder.stop() called.')

    const clipName = prompt(
      'Enter a name for your sound clip?',
      'My unnamed clip'
    )

    const clipContainer = document.createElement('article')
    const clipLabel = document.createElement('p')
    const audio = document.createElement('audio')
    const deleteButton = document.createElement('button')

    clipContainer.classList.add('clip')
    audio.setAttribute('controls', '')
    deleteButton.textContent = 'Delete'
    deleteButton.className = 'delete'

    if (clipName === null) {
      clipLabel.textContent = 'My unnamed clip'
    } else {
      clipLabel.textContent = clipName
    }

    clipContainer.appendChild(audio)
    clipContainer.appendChild(clipLabel)
    clipContainer.appendChild(deleteButton)
    soundClips.appendChild(clipContainer)

    audio.controls = true
    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
    chunks = []
    const audioURL = window.URL.createObjectURL(blob)
    audio.src = audioURL
    console.log('recorder stopped')

    deleteButton.addEventListener('click', (e) => {
      ;(e.target as HTMLButtonElement).closest('.clip')?.remove?.()
    })
  })
}

function onError(err: any) {
  console.error(`The following getUserMedia error occurred: ${err}`)
}

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.')
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then(onSuccess)
    .catch(onError)
} else {
  console.log('getUserMedia not supported on your browser!')
}
