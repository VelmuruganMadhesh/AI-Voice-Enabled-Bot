import { http } from './http'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export type VoiceProcessResponse = {
  text: string
  audio_base64: string
  audio_mime: string
  detected_intent?: string | null
  transcript?: string | null
}

export async function processVoice(payload: {
  language: string
  transcript?: string
  audioFile?: File
}) {
  const form = new FormData()
  form.append('language', payload.language)
  if (payload.transcript) form.append('transcript', payload.transcript)
  if (payload.audioFile) form.append('audio', payload.audioFile)

  const res = await http.post<ApiEnvelope<VoiceProcessResponse>>('/api/voice/process', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

