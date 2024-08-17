import { pipeline, PipelineType, env } from '@xenova/transformers'
import { MessageTypes } from './presets'
env.allowLocalModels = false

class MyTranscriptionPipeline {
    static task: PipelineType = 'automatic-speech-recognition'
    static model: any = 'openai/whisper-tiny.en'
    static instance: any = undefined

    static async getInstance(progress_callback = undefined) { // : ((data: any) => void) | undefined = undefined
        if (this.instance === undefined) {
            try {
                this.instance = await pipeline(this.task, undefined, { progress_callback })
            } catch (error) {
                console.error('Error loading pipeline:', error)
                throw error
            }
        }

        return this.instance
    }
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data
    if (type === MessageTypes.INFERENCE_REQUEST) {
        await transcribe(audio)
    }
})

async function transcribe(audio: any) {
    sendLoadingMessage('loading')

    let pipeline

    try {
        pipeline = await MyTranscriptionPipeline.getInstance(load_model_callback as any)
        // console.log('Pipeline instance created:', pipeline)
    } catch (err: any) {
        // console.error('Error loading pipeline:', err)
        sendLoadingMessage('Failed to load pipeline')
        return
    }

    sendLoadingMessage('success')

    const stride_length_s = 5

    const generationTracker = new GenerationTracker(pipeline, stride_length_s)
    await pipeline(audio, {
        top_k: 0,
        do_sample: false,
        chunk_length: 30,
        stride_length_s,
        return_timestamps: true,
        callback_function: generationTracker.callbackFunction.bind(generationTracker),
        chunk_callback: generationTracker.chunkCallback.bind(generationTracker)
    })
    generationTracker.sendFinalResult()
}

async function load_model_callback(data: any) {
    const { status } = data

    // console.log('load_model_callback', data)

    if (status === 'progress') {
        const { file, progress, loaded, total } = data
        sendDownloadingMessage(file, progress, loaded, total)
    }
}

function sendLoadingMessage(status: string) {
    self.postMessage({
        type: MessageTypes.LOADING,
        status
    })
}

async function sendDownloadingMessage(file: any, progress: any, loaded: any, total: any) {
    self.postMessage({
        type: MessageTypes.DOWNLOADING,
        file,
        progress,
        loaded,
        total
    })
}

class GenerationTracker {
    pipeline: any
    stride_length_s: any
    chunks: any[]
    time_precision: any
    processed_chunks: any[]
    callbackFunctionCounter: any

    constructor(pipeline: any, stride_length_s: any) {
        this.pipeline = pipeline
        this.stride_length_s = stride_length_s
        this.chunks = []
        this.time_precision = pipeline?.processor.feature_extractor.config.chunk_length / pipeline.model.config.max_source_positions
        this.processed_chunks = []
        this.callbackFunctionCounter = 0
    }

    sendFinalResult() {
        self.postMessage({ type: MessageTypes.INFERENCE_DONE })
    }

    callbackFunction(beams: any) {
        this.callbackFunctionCounter += 1
        if (this.callbackFunctionCounter % 10 !== 0) {
            return
        }

        const bestBeam = beams[0]
        let text = this.pipeline.tokenizer.decode(bestBeam.output_token_ids, {
            skip_special_tokens: true
        })

        const result = {
            text,
            start: this.getLastChunkTimestamp(),
            end: undefined
        }

        createPartialResultMessage(result)
    }

    chunkCallback(data: any) {
        this.chunks.push(data)
        const [text, { chunks }] = this.pipeline.tokenizer._decode_asr(
            this.chunks,
            {                
                time_precision: this.time_precision,
                return_timestamps: true,
                force_full_sequence: false
            }
        )
        console.log(text)

        this.processed_chunks = chunks.map((chunk: any, index: any) => {
            return this.processChunk(chunk, index)
        })

        createResultMessage(
            this.processed_chunks, false, this.getLastChunkTimestamp() || 0
        )
    }

    getLastChunkTimestamp() {
        if (this.processed_chunks.length === 0) {
            return 0
        }
    }

    processChunk(chunk: any, index: any) {
        const { text, timestamp } = chunk
        const [start, end] = timestamp

        return {
            index,
            text: `${text.trim()}`,
            start: Math.round(start),
            end: Math.round(end) || Math.round(start + 0.9 * this.stride_length_s)
        }

    }
}

function createResultMessage(results: any, isDone: any, completedUntilTimestamp: any) {
    self.postMessage({
        type: MessageTypes.RESULT,
        results,
        isDone,
        completedUntilTimestamp
    })
}

function createPartialResultMessage(result: any) {
    self.postMessage({
        type: MessageTypes.RESULT_PARTIAL,
        result
    })
}





// import {pipeline, PipelineType} from '@xenova/transformers'

// enum MessageTypes {
//     INFERENCE_REQUEST = 'INFERENCE_REQUEST',
//     RESULT = 'RESULT',
//     RESULT_PARTIAL = 'RESULT_PARTIAL',
//     DOWNLOADING = 'DOWNLOADING',
//     LOADING = 'LOADING',
//     INFERENCE_DONE = 'INFERENCE_DONE'
// }

// class MyTranscriptionPipeline {
//     static task: PipelineType = 'automatic-speech-recognition'
//     static model = 'openai/whisper-tiny.en'
//     static instance: any = null

//     static async getInstance(progress_callback: ((data: any) => void) | undefined = undefined) {
//         if (this.instance === null) {
//             this.instance = await pipeline(this.task, undefined, {progress_callback}) // null
//         }

//         return this.instance
//     }
// }

// self.addEventListener('message', async (event) => {
//     const {type, audio} = event.data
//     if (type === MessageTypes.INFERENCE_REQUEST) {
//         await transcribe(audio)
//     }
// })

// const transcribe = async (audio: string) => {
//     sendLoadingMessage('Loading')

//     let pipeline

//     try {
//         pipeline = await MyTranscriptionPipeline.getInstance(load_model_callback)
//     } 
//     catch (error) {
//         console.error(error)
//     }

//     if (!pipeline) {
//         sendLoadingMessage('Failed to load pipeline')
//         return
//     }

//     sendLoadingMessage('Success')

//     const stride_length_s = 5

//     const generationTracker = new GenerationTracker(pipeline, stride_length_s)
//     await pipeline.audio(audio, {
//         top_k: 0,
//         do_sample: false,
//         chunk_length: 30,
//         stride_length_s,
//         return_timestamps: true,
//         callback_function: generationTracker.callbackFunction.bind(generationTracker),
//         chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
//     })

//     generationTracker.sendFinalResult()
// }

// const load_model_callback = (data: any) => {
//     const {status} = data
//     if (status === 'progress') {
//         const {file, progress, loaded, total} = data
//         sendDownloadingMessage(file, progress, loaded, total)
//     }
// }

// function sendLoadingMessage(status: string) {
//     self.postMessage({
//         type: MessageTypes.LOADING,
//         status
//     })
// }

// const sendDownloadingMessage = async (file: string, progress: number, loaded: number, total: number) => {
//     self.postMessage({
//         type: MessageTypes.DOWNLOADING,
//         file,
//         progress,
//         loaded,
//         total
//     })
// }

// class GenerationTracker {
//     pipeline: any
//     stride_length_s: number
//     chunks: any[]
//     time_precision: number
//     processed_chunks: any[]
//     callbackFunctionCounter: number

//     constructor(pipeline: any, stride_length_s: number) {
//         this.pipeline = pipeline
//         this.stride_length_s = stride_length_s
//         this.chunks = []
//         this.time_precision = pipeline?.processer.feature_extractor.config.chunk_length / pipeline.model.config.max_source_positions
//         this.processed_chunks = []
//         this.callbackFunctionCounter = 0
//     }

//     sendFinalResult() {
//         self.postMessage({type: MessageTypes.INFERENCE_DONE})
//     }

//     callbackFunction(beams: any) {
//         this.callbackFunctionCounter += 1
//         if (this.callbackFunctionCounter % 10 !== 0) return

//         const bestBeam = beams[0]
//         let text = this.pipeline.tokenizer.decode(bestBeam.output_token_ids, {skip_special_tokens: true})

//         const result = {
//             text,
//             start: this.getLastChunkTimestamp(),
//             end: undefined
//         }

//         createPartialResultMessage(result)
//     }

//     chunkCallback(data: any) {
//         this.chunks.push(data)
//         const [text, { chunks }] = this.pipeline.tokenizer._decode_asr( this.chunks,
//             {
//                 time_precision: this.time_precision,
//                 return_timestamps: true,
//                 forece_full_sequence: false
//             }
//         )

//         this.processed_chunks = chunks.map((chunk: any, index: number) => {
//             // return this.processed_chunks(chunk, index)
//             return this.processChunk(chunk, index)
//         })

//         createResultMessage(
//             this.processed_chunks, false, this.getLastChunkTimestamp() || 0
//         )
//     }

//     getLastChunkTimestamp() {
//         if (this.processed_chunks.length === 0) return 0
//     }

//     processChunk(chunk: any, index: number) {
//         const { text, timestamp } = chunk
//         const { start, end } = timestamp

//         return {
//             index,
//             text: `${text.trim()}`,
//             start: Math.round(start),
//             end: Math.round(end) || Math.round(start + 0.9 * this.stride_length_s)
//         }
//     }
// }

// const createResultMessage = (results: any, isDone: boolean, completedUntilTimestamp: number) => {
//     self.postMessage({
//         type: MessageTypes.RESULT,
//         results,
//         isDone,
//         completedUntilTimestamp
//     })
// }

// const createPartialResultMessage = (result: any) => {
//     self.postMessage({
//         type: MessageTypes.RESULT_PARTIAL,
//         result
//     })
// }