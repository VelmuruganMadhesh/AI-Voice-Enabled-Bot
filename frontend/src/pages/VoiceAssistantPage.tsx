import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Volume2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { processVoice, type VoiceProcessResponse } from '../api/voiceApi'
import { CommonButton } from '../components/ui/CommonButton'
import { Modal } from '../components/ui/Modal'
import { SurfaceCard } from '../components/ui/SurfaceCard'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../contexts/AuthContext'

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
  const { user, accessToken, loading: authLoading } = useAuth()
  const { pushToast } = useToast()

  const isAuthenticated = Boolean(accessToken)
  const [language, setLanguage] = useState<string>(user?.language || 'en')
  const [emailInput, setEmailInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [textInput, setTextInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingProtectedTranscript, setPendingProtectedTranscript] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptText, setTranscriptText] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const chunksRef = useRef<Blob[]>([])
  const transcriptTextRef = useRef<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (user?.language) setLanguage(user.language)
  }, [user?.language])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if(messages.length === 0) return
      try{
        const audio = new Audio(messages[messages.length - 1].audioUrl)
        audio.play().catch(() => {})
      }
      catch{
        // ignore
      }
  }, [messages, loading])

  const stopMediaTracks = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
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

  const startRecognition = () => {
    if (!supportsSpeechRecognition()) return
    const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognitionApi()
    recognition.lang = language
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (result.isFinal) finalTranscript += result[0].transcript
        else interimTranscript += result[0].transcript
      }

      const nextText = (finalTranscript || interimTranscript).trim() || null
      transcriptTextRef.current = nextText
      setTranscriptText(nextText)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const resetRecorderState = () => {
    chunksRef.current = []
    transcriptTextRef.current = null
    setTranscriptText(null)
    mediaRecorderRef.current = null
    setRecording(false)
    setProcessing(false)
  }

  const appendBotResponse = (bot: VoiceProcessResponse) => {
    const audioDataUrl = `data:${bot.audio_mime || 'audio/mpeg'};base64,${bot.audio_base64}`
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'bot', text: bot.text, audioUrl: audioDataUrl }])
  }

  const getVoicePayloadBase = () => ({
    language,
    email: isAuthenticated ? undefined : emailInput.trim(),
    unauthenticated: !isAuthenticated,
  })

  const startRecording = async () => {
    setError(null)
    resetRecorderState()
    setModalOpen(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
      const mimeType = mimeCandidates.find((item) => (window as any).MediaRecorder?.isTypeSupported?.(item)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stopMediaTracks()
      }

      mediaRecorderRef.current = recorder
      startRecognition()
      recorder.start()
      setRecording(true)
      pushToast({ tone: 'info', title: 'Listening started' })
    } catch (e: any) {
      setModalOpen(false)
      setError(e?.message || 'Microphone permission denied.')
    }
  }

  const closeRecorder = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {
      // ignore
    }
    stopRecognition()
    stopMediaTracks()
    resetRecorderState()
    setModalOpen(false)
  }

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (!isAuthenticated && !emailInput.trim()) {
      setError('Enter your email so we can find your account before continuing.')
      setModalOpen(false)
      resetRecorderState()
      return
    }

    setRecording(false)
    setProcessing(true)
    stopRecognition()

    try {
      await new Promise<void>((resolve) => {
        const originalOnStop = recorder.onstop
        recorder.onstop = (event) => {
          originalOnStop?.call(recorder, event)
          resolve()
        }
        recorder.stop()
      })
    } catch {
      // ignore
    }

    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' })
    const audioFile = new File([blob], 'voice.webm', { type: blob.type || 'audio/webm' })
    const transcript = transcriptTextRef.current || transcriptText || undefined
    const userText = transcript || 'Voice input received.'

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: userText }])

    setLoading(true)
    setError(null)
    try {
      const env = await processVoice({ ...getVoicePayloadBase(), transcript, audioFile })
      const bot = env.data as VoiceProcessResponse
      appendBotResponse(bot)
      if (bot.requires_password) {
        setPendingProtectedTranscript(bot.transcript || transcript || userText)
        pushToast({ tone: 'info', title: 'Password confirmation required' })
      } else {
        setPendingProtectedTranscript(null)
        setPasswordInput('')
        pushToast({ tone: 'success', title: 'Voice response ready' })
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Failed to process voice.'
      setError(message)
    } finally {
      setLoading(false)
      resetRecorderState()
      setModalOpen(false)
    }
  }

  const submitTextMessage = async () => {
    const trimmedInput = textInput.trim()
    if (!trimmedInput || loading || recording || processing || authLoading) return
    if (!isAuthenticated && !emailInput.trim()) {
      setError('Enter your email so we can find your account before continuing.')
      return
    }

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: trimmedInput }])
    setTextInput('')
    setLoading(true)
    setError(null)

    try {
      const env = await processVoice({ ...getVoicePayloadBase(), transcript: trimmedInput })
      const bot = env.data as VoiceProcessResponse
      appendBotResponse(bot)
      if (bot.requires_password) {
        setPendingProtectedTranscript(bot.transcript || trimmedInput)
        pushToast({ tone: 'info', title: 'Password confirmation required' })
      } else {
        setPendingProtectedTranscript(null)
        setPasswordInput('')
        pushToast({ tone: 'success', title: 'Assistant response ready' })
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Failed to process message.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const submitPasswordConfirmation = async () => {
    const transcript = pendingProtectedTranscript?.trim()
    const password = passwordInput.trim()
    if (!transcript || !password || loading || recording || processing || authLoading) return

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: 'Password provided for confirmation.' }])
    setLoading(true)
    setError(null)

    try {
      const env = await processVoice({ ...getVoicePayloadBase(), transcript, password })
      const bot = env.data as VoiceProcessResponse
      appendBotResponse(bot)
      if (bot.requires_password) {
        pushToast({ tone: 'error', title: 'Password confirmation failed' })
      } else {
        setPendingProtectedTranscript(null)
        setPasswordInput('')
        pushToast({ tone: 'success', title: 'Request confirmed' })
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Failed to confirm password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const languageLabel = useMemo(() => {
    if (language === 'ta') return 'Tamil'
    if (language === 'hi') return 'Hindi'
    return 'English'
  }, [language])

  return (
    <>
      <div className="space-y-6">
        <SurfaceCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Voice Assistant</h1>
              <p className="mt-1 text-sm text-gray-600">
                {isAuthenticated
                  ? 'Process banking requests using voice input and generated replies.'
                  : 'Ask for your account details before login by entering your email and then confirming with your password.'}
              </p>
              {!isAuthenticated ? (
                <p className="mt-2 text-sm text-gray-600">
                  Prefer full account access?{' '}
                  <Link className="font-medium text-blue-600 hover:underline" to="/login">
                    Login here
                  </Link>
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={recording || processing || loading || authLoading}
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
              <CommonButton onClick={() => void startRecording()} disabled={recording || processing || loading || authLoading} leftIcon={<Mic className="h-4 w-4" />}>
                Start Recording
              </CommonButton>
            </div>
          </div>
        </SurfaceCard>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <SurfaceCard>
            {!isAuthenticated ? (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <label htmlFor="voice-assistant-email" className="block text-sm font-medium text-gray-900">
                  Identify your account
                </label>
                <p className="mt-1 text-sm text-gray-700">
                  Enter your registered email so we can check the database and verify your request with your password.
                </p>
                <input
                  id="voice-assistant-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                  disabled={recording || processing || loading || authLoading}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
                <p className="mt-1 text-sm text-gray-600">Language: {languageLabel}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label htmlFor="voice-assistant-text" className="block text-sm font-medium text-gray-900">
                Type your request
              </label>
              <p className="mt-1 text-sm text-gray-600">You can ask by text or use the microphone.</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="voice-assistant-text"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void submitTextMessage()
                    }
                  }}
                  placeholder="Type your banking request here..."
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                  disabled={recording || processing || loading || authLoading}
                />
                <CommonButton onClick={() => void submitTextMessage()} disabled={!textInput.trim() || recording || processing || loading || authLoading}>
                  Send Text
                </CommonButton>
              </div>
            </div>

            {pendingProtectedTranscript ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <label htmlFor="voice-assistant-password" className="block text-sm font-medium text-gray-900">
                  Confirm with password
                </label>
                <p className="mt-1 text-sm text-gray-700">Account details, balance, transaction, and transfer requests need your password before the assistant can continue.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="voice-assistant-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void submitPasswordConfirmation()
                      }
                    }}
                    placeholder="Enter your password"
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                    disabled={recording || processing || loading || authLoading}
                  />
                  <CommonButton onClick={() => void submitPasswordConfirmation()} disabled={!passwordInput.trim() || recording || processing || loading || authLoading}>
                    Confirm
                  </CommonButton>
                </div>
              </div>
            ) : null}

            <div className="mt-4 h-[420px] overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                  No conversations yet. Start speaking or type a request above.
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={['max-w-[85%] rounded-lg px-4 py-3 text-sm', message.role === 'user' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-gray-50 text-gray-900'].join(' ')}>
                        <div>{message.text}</div>
                        {message.audioUrl ? (
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                            onClick={() => {
                              try {
                                const audio = new Audio(message.audioUrl)
                                audio.play().catch(() => {})
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            <Volume2 className="h-4 w-4" />
                            Play audio
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {loading ? <div className="text-sm text-gray-500">Processing your request...</div> : null}
                </>
              )}
              <div ref={chatEndRef} />
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-semibold text-gray-900">Live Transcript</h2>
            <p className="mt-1 text-sm text-gray-600">Speech recognition preview while recording.</p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              {transcriptText || 'Transcript will appear here while recording if speech recognition is supported.'}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeRecorder}>
        <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <button
            type="button"
            className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-100"
            onClick={closeRecorder}
            aria-label="Close voice modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={recording ? { scale: [1, 1.05, 1] } : undefined}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"
            >
              <Mic className="h-6 w-6" />
            </motion.div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{processing ? 'Processing...' : recording ? 'Listening...' : 'Preparing...'}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {processing ? 'Please wait while we process your request.' : 'Speak clearly into your microphone.'}
            </p>
            <div className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {transcriptText || 'Waiting for voice input...'}
            </div>
            <div className="mt-6 flex w-full gap-3">
              <CommonButton className="flex-1" variant="outline" onClick={closeRecorder} disabled={processing}>
                Cancel
              </CommonButton>
              <CommonButton className="flex-1" onClick={() => void stopRecordingAndSend()} disabled={!recording || processing}>
                {processing ? 'Processing...' : 'Stop & Send'}
              </CommonButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
