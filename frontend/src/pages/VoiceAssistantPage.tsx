import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CommonButton } from '../components/ui/CommonButton'
import { processVoice, type VoiceProcessResponse } from '../api/voiceApi'

type ChatMessage = {
  id: string
  role: 'user' | 'bot'
  text: string
  audioUrl?: string
}

function supportsSpeechRecognition() {
  return typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

export function VoiceAssistantPage() {
  const { user, loading: authLoading } = useAuth()

  const [language, setLanguage] = useState<string>(user?.language || 'en')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const recognitionRef = useRef<any>(null)
  const [transcriptText, setTranscriptText] = useState<string | null>(null)
  const transcriptTextRef = useRef<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (user?.language) setLanguage(user.language)
  }, [user?.language])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const audioMime = 'audio/mpeg'

  const startRecognition = () => {
    if (!supportsSpeechRecognition()) return null
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SR()
    rec.lang = language
    rec.interimResults = true
    rec.continuous = false

    let finalTranscript = ''
    rec.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalTranscript += res[0].transcript
        else interim += res[0].transcript
      }
      const merged = (finalTranscript || interim).trim()
      const next = merged ? merged : null
      transcriptTextRef.current = next
      setTranscriptText(next)
    }

    rec.onerror = () => {
      // Best-effort only. Voice assistant will still use audio bytes.
    }

    recognitionRef.current = rec
    rec.start()
    return rec
  }

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // ignore
    } finally {
      recognitionRef.current = null
    }
  }

  const startRecording = async () => {
    setError(null)
    setTranscriptText(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
      const mimeType = mimeCandidates.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
      }

      const rec = startRecognition()
      void rec

      recorder.start()
      setRecording(true)
    } catch (e: any) {
      setError(e?.message || 'Microphone permission denied.')
      setRecording(false)
    }
  }

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    setRecording(false)
    stopRecognition()

    try {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        recorder.stop()
      })
    } catch {
      // ignore
    }

    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' })
    const audioFile = new File([blob], 'voice.webm', { type: blob.type || 'audio/webm' })
    const transcript = (transcriptTextRef.current || transcriptText) || undefined

    const userText = transcript ? transcript : 'Voice input received.'
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText }
    setMessages((m) => [...m, userMsg])

    setLoading(true)
    setError(null)
    try {
      const env = await processVoice({ language, transcript, audioFile })
      const bot: VoiceProcessResponse = env.data as any

      const audioDataUrl = `data:${bot.audio_mime || audioMime};base64,${bot.audio_base64}`
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: bot.text,
        audioUrl: audioDataUrl,
      }
      setMessages((m) => [...m, botMsg])

      // Autoplay response audio for demo experience.
      setTimeout(() => {
        try {
          const a = new Audio(audioDataUrl)
          a.play().catch(() => {
            // ignore autoplay restrictions
          })
        } catch {
          // ignore
        }
      }, 50)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to process voice.')
    } finally {
      setLoading(false)
      mediaRecorderRef.current = null
    }
  }

  const languageLabel = useMemo(() => {
    if (language === 'ta') return 'Tamil'
    if (language === 'hi') return 'Hindi'
    return 'English'
  }, [language])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-xl font-semibold">Voice Assistant</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            Speak your request (Balance/Transactions). Language: <span className="font-medium">{languageLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={recording || loading || authLoading}
          >
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>

          {!recording ? (
            <CommonButton className="bg-violet-600 hover:bg-violet-700" onClick={() => void startRecording()} disabled={loading || authLoading}>
              {loading ? 'Processing...' : 'Start Recording'}
            </CommonButton>
          ) : (
            <CommonButton className="bg-red-600 hover:bg-red-700" onClick={() => void stopRecordingAndSend()} disabled={loading}>
              Stop & Send
            </CommonButton>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-4">
          <div className="h-[420px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Record your voice and I will respond with text + audio.
              </div>
            ) : null}

            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={[
                      'max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm',
                    ].join(' ')}
                  >
                    {msg.text}
                    {msg.role === 'bot' && msg.audioUrl ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-xs underline opacity-90 hover:opacity-100"
                          onClick={() => {
                            try {
                              const a = new Audio(msg.audioUrl!)
                              a.play().catch(() => {})
                            } catch {}
                          }}
                        >
                          Play audio
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading ? <div className="text-sm text-zinc-500">Processing voice...</div> : null}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-medium">How it works</h3>
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 space-y-2">
            <div>1. Microphone audio (or transcript)</div>
            <div>2. Whisper ASR (when transcript missing)</div>
            <div>3. Intent routing (balance / transactions)</div>
            <div>4. MongoDB lookup</div>
            <div>5. Response text + gTTS audio</div>
          </div>
        </div>
      </div>
    </div>
  )
}

