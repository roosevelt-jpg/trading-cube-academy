'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/ui/academy-ui'

type Props = {
  attemptId: string
  moduleId: string
  active: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function QuizProctor({ attemptId, moduleId, active, onReady, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startedRef = useRef(false)
  const [previewReady, setPreviewReady] = useState(false)
  const startTimeRef = useRef<number>(0)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true

    let cancelled = false

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setPreviewReady(true)

        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : ''

        if (mime) {
          const recorder = new MediaRecorder(stream, { mimeType: mime })
          recorderRef.current = recorder
          chunksRef.current = []
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
          }
          recorder.start(5000)
          startTimeRef.current = Date.now()
        }

        onReady()
      } catch {
        onError('Camera and microphone access is required for proctored exams. Enable permissions and reload.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [active, onError, onReady])

  useEffect(() => () => {
    recorderRef.current?.stop()
    stopTracks()
  }, [stopTracks])

  const uploadRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        recorder.stop()
      })
    }
    stopTracks()

    const chunks = chunksRef.current
    if (!chunks.length) {
      const form = new FormData()
      form.append('attemptId', attemptId)
      form.append('moduleId', moduleId)
      form.append('durationSeconds', '0')
      await fetch('/api/quiz/proctoring/upload', { method: 'POST', body: form })
      return
    }

    const blob = new Blob(chunks, { type: chunks[0].type || 'video/webm' })
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
    const form = new FormData()
    form.append('attemptId', attemptId)
    form.append('moduleId', moduleId)
    form.append('durationSeconds', String(durationSeconds))
    form.append('recording', blob, `proctor-${attemptId}.webm`)
    await fetch('/api/quiz/proctoring/upload', { method: 'POST', body: form })
  }, [attemptId, moduleId, stopTracks])

  useEffect(() => {
    ;(window as unknown as { __quizProctorUpload?: () => Promise<void> }).__quizProctorUpload = uploadRecording
    return () => {
      delete (window as unknown as { __quizProctorUpload?: () => Promise<void> }).__quizProctorUpload
    }
  }, [uploadRecording])

  if (!active) return null

  return (
    <Panel className="fixed bottom-24 right-5 z-50 w-44 overflow-hidden border-yellow p-0 shadow-lg">
      <p className="mono bg-[var(--bg-elevated)] px-2 py-1 text-[9px] uppercase tracking-wider text-yellow">Proctoring live</p>
      <video ref={videoRef} className="aspect-video w-full bg-black object-cover" muted playsInline />
      {!previewReady && <p className="muted p-2 text-center text-[10px]">Starting camera…</p>}
    </Panel>
  )
}

export async function uploadQuizProctorRecording() {
  const fn = (window as unknown as { __quizProctorUpload?: () => Promise<void> }).__quizProctorUpload
  if (fn) await fn()
}
