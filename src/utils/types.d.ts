interface HomePageProps {
    setFile: (file: File) => void
    setAudioStream: (stream: MediaStream) => void // void is the return type
    // handleResetAudio: () => void
}

interface FileDisplayProps {
    file: File | null
    audioStream: MediaStream | null
    handleResetAudio: () => void
}

interface TranscribingProps {
    downloding: boolean
}