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
  requires_password?: boolean
}

export async function processVoice(payload: {
  language: string
  transcript?: string
  password?: string
  audioFile?: File
  email?: string
  unauthenticated?: boolean
}) {
  const form = new FormData()
  form.append('language', payload.language)
  if (payload.transcript) form.append('transcript', payload.transcript)
  if (payload.password) form.append('password', payload.password)
  if (payload.audioFile) form.append('audio', payload.audioFile)
  if (payload.email) form.append('email', payload.email)

  const endpoint = payload.unauthenticated ? '/api/voice/public-process' : '/api/voice/process'

  const res = await http.post<ApiEnvelope<VoiceProcessResponse>>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

