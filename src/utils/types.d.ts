interface HomePageProps {
    setFile: (file: File) => void
    setAudioStream: (stream: MediaStream) => void // void is the return type
    // handleResetAudio: () => void
}

interface FileDisplayProps {
    file: File | null
    audioStream: MediaStream | null
    handleResetAudio: () => void
    handleFormSubmission: () => void
}

interface TranscribingProps {
    downloding: boolean
}

interface InformationProps {
    output: { text: string }[],
    finished: boolean
}

interface TranscriptionProps {
    textElement: string | string[]
}

interface TranslationProps {
    textElement: string
    toLanguage: string
    translating: boolean
    handleTranslate: () => void
    setToLanguage: (toLanguage: string) => void
}