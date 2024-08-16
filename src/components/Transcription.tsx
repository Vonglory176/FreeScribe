import React from 'react'

const Transcription: React.FC<TranscriptionProps> = ({ textElement }) => {
  // const finalText = output.map(val => val.text)
  return (
    <div>
      {textElement || 'No transcription'}
    </div>
  )
}

export default Transcription
