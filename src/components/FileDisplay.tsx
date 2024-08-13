import React from 'react'

const FileDisplay: React.FC<FileDisplayProps> = ({file, audioStream, handleResetAudio}) => {
  return (
    <main className="flex-1 p-4 flex flex-col gap-3 sm:gap-4 text-center justify-center pb-20 w-72 sm:w-96 max-w-full mx-auto">
        
        <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl'>Your <span className='text-blue-400 bold'>File</span></h1>
        
        <div className="flex flex-col text-left my-4">
            <h3 className='font-semibold'>Name</h3>
            <p>{file ? file?.name : "Custom Audio"}</p>
        </div>

        <div className="flex items-center justify-between gap-4">

            {/* Reset button */}
            <button onClick={handleResetAudio} className='flex items-center gap-2 text-slate-400 hover:text-blue-600 duration-200'>
                <p>Reset</p>
                <i className='fa-solid fa-rotate-right'></i>
            </button>

            {/* Transcribe button */}
            <button className='flex items-center gap-2 specialBtn p-3 rounded-lg text-blue-400 font-medium'>
                <p>Transcribe</p>
                <i className='fa-solid fa-pen-nib'></i>
            </button>

        </div>

    </main>
  )
}

export default FileDisplay
