import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { TranscribeStreamingClient } from '@aws-sdk/client-transcribe-streaming'
import MicrophoneStream from 'microphone-stream'
import { StartStreamTranscriptionCommand } from '@aws-sdk/client-transcribe-streaming'
import { Buffer } from 'buffer'
import * as awsID from './awsID'

const SAMPLE_RATE = 44100
let microphoneStream: MicrophoneStream
let transcribeClient: TranscribeStreamingClient

export async function startRecording(
  language: string,
  callback: (content: string) => void
): Promise<void> {
  if (!language) {
    return
  }
  if (microphoneStream || transcribeClient) {
    stopRecording()
  }
  createTranscribeClient()
  createMicrophoneStream()
  await startStreaming(language, callback)
}

export function stopRecording() {
  if (microphoneStream) {
    microphoneStream.stop()
    microphoneStream.destroy()
  }
  if (transcribeClient) {
    transcribeClient.destroy()
  }
}

function createTranscribeClient() {
  transcribeClient = new TranscribeStreamingClient({
    region: awsID.REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: awsID.REGION }),
      identityPoolId: awsID.IDENTITY_POOL_ID,
    }),
  })
}

async function createMicrophoneStream() {
  microphoneStream = new MicrophoneStream()

  microphoneStream.setStream(
    await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
  )
}

async function startStreaming(
  language: string,
  callback: (content: string) => void
) {
  console.log('start streaming...')

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: language,
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: SAMPLE_RATE,
    AudioStream: getAudioStream(),
  })

  const data = await transcribeClient.send(command)

  for await (const event of data?.TranscriptResultStream ?? []) {
    for (const result of event.TranscriptEvent?.Transcript?.Results ?? []) {
      if (result.IsPartial === false) {
        const [alternativeResult] = result.Alternatives ?? []
        const items = alternativeResult.Items ?? []
        const noOfResults = items.length
        for (let i = 0; i < noOfResults; i++) {
          const content = items[i].Content ?? '' + ' '

          console.log(content)
          callback(content)
        }
      }
    }
  }
}

async function* getAudioStream() {
  for await (const chunk of microphoneStream) {
    if (chunk.length <= SAMPLE_RATE) {
      yield {
        AudioEvent: {
          AudioChunk: encodePCMChunk(chunk),
        },
      }
    }
  }
}

function encodePCMChunk(chunk: Buffer) {
  const input = MicrophoneStream.toRaw(chunk)
  let offset = 0
  const buffer = new ArrayBuffer(input.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return Buffer.from(buffer)
}
