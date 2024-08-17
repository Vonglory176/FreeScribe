import { useState, useRef, useEffect } from "react"
import Header from "./components/Header"
import HomePage from "./components/HomePage"
import FileDisplay from "./components/FileDisplay"
import Information from "./components/Information"
import Transcribing from "./components/Transcribing"
import { MessageTypes } from "./utils/presets"

// VIDEO --> https://youtu.be/82PXenL4MGg?t=18123

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [output, setOutput] = useState<{ text: string }[] | null>(null)
  // const [downloading, setDownloading] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [finished, setFinished] = useState<boolean>(false)

  const isAudioAvailable = file || audioStream

  const handleResetAudio = () => {
    setFile(null)
    setAudioStream(null)
  }

  const worker = useRef<Worker | null>(null)

  useEffect(() => {
    // console.log(import.meta.url)
    if (!worker.current) {
      worker.current = new Worker(new URL('./utils/whisper.worker.ts', import.meta.url), { type: 'module' })
    }

    const onMessageReceived = async (e: MessageEvent) => {
      // console.log('Message received:', e.data)

      switch (e.data.type) {
        case 'DOWNLOADING':
          // setDownloading(true)
          console.log('DOWNLOADING')
          break
        case 'LOADING':
          setLoading(true)
          console.log('LOADING')
          break
        case 'RESULT':
          setOutput(e.data.results)
          // console.log('RESULT')
          break
        case 'INFERENCE DONE':
          // setOutput(e.data.transcription)
          setFinished(true)
          console.log('DONE')
          break
      }
    }

    worker.current.addEventListener('message', onMessageReceived)

    return () => {
      worker.current?.removeEventListener('message', onMessageReceived)
    }
  }, [worker])

  const readAudioFrom = async (file: any) => { // File | MediaStream
    const samplingRate = 16000
    const audioCTX = new AudioContext({sampleRate: samplingRate})
    const response = await file.arrayBuffer()
    const decoded = await audioCTX.decodeAudioData(response)
    const audio = decoded.getChannelData(0)
    return audio
  }
  
  const handleFormSubmission = async () => { {/* e: React.FormEvent<HTMLFormElement> */}
    if (!file && !audioStream) return

    let audio = await readAudioFrom(file ? file : audioStream)
    const model_name = `openai/whisper-tiny.com`

    // console.log(audio)

    if (worker.current) worker.current.postMessage({
      type: MessageTypes.INFERENCE_REQUEST,
      audio,
      model_name,
    })
  }

  return (
    <div className="flex flex-col max-w-[1000px] mx-auto w-full">
      <section className="min-h-screen flex flex-col">

        <Header />

        {
          output ? <Information output={output} finished={finished} />
          
          : loading ? <Transcribing downloding={loading} /> 
          
          : isAudioAvailable ? <FileDisplay file={file} audioStream={audioStream} handleResetAudio={handleResetAudio} handleFormSubmission={handleFormSubmission} />

          : <HomePage setFile={setFile} setAudioStream={setAudioStream} /> // handleResetAudio={handleResetAudio}
        }

        <footer className='flex justify-center items-center p-2'>
          <p>&copy; Skyler 2024</p>
        </footer>

      </section>
    </div>
  )
}

export default App
