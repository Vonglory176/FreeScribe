import React, { useEffect, useRef, useState } from 'react'

const HomePage: React.FC<HomePageProps> = ({setFile, setAudioStream}) => { {/* , handleResetAudio */}
  const [recordingStatus, setRecordingStatus] = useState<boolean>(false) // <'recording' | 'stopped'>('stopped')
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [duration, setDuration] = useState<number>(0)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const mimeType = 'audio/webm'


  // Start Recording
  const startRecording = async () => {
    console.log('Starting recording...')

    let tempStream: MediaStream | string = ''    
    try {

      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })

      tempStream = streamData // .stream.toURL()

    } 
    catch (error) {
      console.error('Error starting recording:', error)
      return
    }
    setRecordingStatus(true)

    // Creating new MediaRecorder using the stream
    const media = new MediaRecorder(tempStream, { mimeType }) // {type: mimeType} Change to blob like below ???
    mediaRecorder.current = media

    mediaRecorder.current.start()
    
    let localAudioChunks: Blob[] = []    
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === 'undefined') return
      if (event.data.size === 0) return
      localAudioChunks.push(event.data)
    }
    setAudioChunks(localAudioChunks)
  }


  // Stop Recording
  const stopRecording = async () => {
    console.log('Stopping recording...')

    setRecordingStatus(false)
    mediaRecorder.current?.stop()

    if (mediaRecorder.current) mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, {type: mimeType})
      setAudioStream(audioBlob as unknown as MediaStream)
      setAudioChunks([])
      setDuration(0)
    }
  }


  // Duration Timer
  useEffect(() => {
    if (!recordingStatus) return

    const interval = setInterval(() => {
      setDuration(curr => curr + 1)
    }, 1000)

    return () => clearInterval(interval)
  }) // , [recordingStatus, duration]


  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tempFile = e.target.files?.[0]
    if (tempFile) setFile(tempFile)
    // else resetAudio()
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-3 sm:gap-4 text-center justify-center pb-20">
        <h1 className='font-semibold text-5xl sm:text-6xl md:text-7xl'>Free<span className='text-blue-400 bold'>Scribe</span></h1>
        <h3 className='font-medium'>Record <span 
        className='text-blue-400'>&rarr;</span> Transcribe <span
        className='text-blue-400'>&rarr;</span> Translate</h3>

        {/* Record button */}
        <button 
          className='flex items-center text-base justify-between gap-4 mx-auto w-72 max-w-full my-4 specialBtn px-4 py-2 rounded-xl'
          onClick={recordingStatus ? stopRecording : startRecording}
        >
          <p className='text-blue-400'>{recordingStatus ? 'Stop Recording' : 'Record'}</p>

          <div className="flex items-center gap-2">
            {duration > 0 && <p className='text-sm my-auto'>{duration}s</p>}
            <i className={'fa-solid fa-microphone duration-200 my-auto' + (recordingStatus ? ' text-rose-400' : '')}></i>
          </div>

        </button>

        {/* Upload input */}
        <p className='text-base'>Or <label className='text-blue-400 cursor-pointer hover:text-blue-600 duration-200' htmlFor="Upload"><input onChange={handleFileChange} className='hidden' type="file" id="Upload" accept=".mp3, .wav" />upload</label> an mp3 file</p>
    
        <p className='italic text-slate-400'>Free now free forever</p>
    </main>
  )
}

export default HomePage
