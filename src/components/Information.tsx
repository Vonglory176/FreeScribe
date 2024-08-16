import React, { useEffect, useRef, useState } from 'react'
import Transcription from './Transcription'
import Translation from './Translation'

const Information: React.FC<InformationProps> = ({ output, finished }) => {
    const [tab, setTab] = useState<'transcription' | 'translation'>('transcription')
    const [translation, setTranslation] = useState<string | null>(null)
    const [translating, setTranslating] = useState<boolean>(false)
    const [toLanguage, setToLanguage] = useState<string>('Select Language')

    const worker = useRef<Worker | null>(null)

    useEffect(() => {
      if (!worker.current) {
        worker.current = new Worker(new URL('../utils/translate.worker.ts', import.meta.url), { type: 'module' })
      }

      const onMessageReceived = async (e: MessageEvent) => {
        // console.log('Message received:', e.data)
  
        switch (e.data.status) {
          case 'initiate':
            console.log('DOWNLOADING')
            break
          case 'progress':
            console.log('LOADING')
            break
          case 'update':
            setTranslation(e.data.output)
            console.log(e.data.output)
            // console.log('RESULT')
            break
          case 'complete':
            // setOutput(e.data.transcription)
            setTranslating(false)
            console.log('DONE')
            break
        }
      }
  
      worker.current.addEventListener('message', onMessageReceived)
  
      return () => {
        worker.current?.removeEventListener('message', onMessageReceived)
      }
    })

    const handleCopy = () => {
      navigator.clipboard.writeText(output.text)
    }

    const handleDownload = () => {
      const element = document.createElement('a')
      const file = new Blob([], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `FreeScribe_${(new Date()).toDateString()}.txt`
      document.body.appendChild(element)
      element.click()
    }

    const handleTranslate = () => {
      if (translating || toLanguage === 'Select Language') return

      setTranslating(true)

      if (worker.current) worker.current.postMessage({
        text: output.map(val => val.text),
        src_lang: 'eng_Latn',
        tgt_lang: toLanguage,
      })
    }

    const textElement = tab === 'transcription' ? output.map(val => val.text) : translation || ''

    useEffect(() => {
      console.log(translation)
    }, [translation])

    useEffect(() => {
      console.log(toLanguage)
    }, [toLanguage])

  return (
    <main className="flex-1 p-4 flex flex-col gap-3 sm:gap-4 text-center justify-center pb-20 max-w-prose w-full mx-auto">
        <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>Your <span className='text-blue-400 bold'>Transcription</span></h1>
    
        <div className="grid grid-cols-2 items-center mx-auto bg-white shadow rounded-full overflow-hidden">
            <button onClick={() => setTab('transcription')} className={'px-4 py-1 font-medium ' + (tab === 'transcription' ? 'bg-blue-400 text-white' : 'text-blue-400 hover:text-blue-600')}>Transcription</button>
            <button onClick={() => setTab('translation')} className={'px-4 py-1 font-medium ' + (tab === 'translation' ? 'bg-blue-400 text-white' : 'text-blue-400 hover:text-blue-600')}>Translation</button>
        </div>

        <div className="my-8 flex flex-col">
          {tab === 'transcription' ?
            <Transcription textElement={textElement} />            
            :
            <Translation toLanguage={toLanguage} textElement={textElement} translating={translating} handleTranslate={handleTranslate} setToLanguage={setToLanguage} />
          }
        </div>

        <div className="flex items-center gap-4 mx-auto text-base">
          <button title="Copy" onClick={handleCopy} className="specialBtn bg-white text-blue-300 hover:text-blue-500 duration-200 p-2 rounded px-2 aspect-square grid place-items-center">
            <i className="fa-solid fa-copy"></i>
          </button>
          <button title="Download" onClick={handleDownload} className="specialBtn bg-white text-blue-300 hover:text-blue-500 duration-200 p-2 rounded px-2 aspect-square grid place-items-center">
          <i className="fa-solid fa-download"></i>
          </button>
        </div>
    </main>
  )
}

export default Information
