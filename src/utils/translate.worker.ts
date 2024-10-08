import { pipeline, PipelineType, env } from '@xenova/transformers'
// import { MessageTypes } from './presets'
env.allowLocalModels = false

class MyTranslationPipeline {
    static task: PipelineType = 'translation'
    static model: any = 'Xenova/nllb-200-distilled-600M'
    static instance: any | undefined = undefined

    static async getInstance(progress_callback?: (x: any) => void) {
        if (this.instance === undefined) {
            this.instance = pipeline(this.task, undefined, { progress_callback })
        }

        return this.instance
    }
}

self.addEventListener('message', async (event) => {
    let translator = await MyTranslationPipeline.getInstance(x => {
        self.postMessage(x)
    })

    console.log(event.data)

    let output = await translator(event.data.text, {
        tgt_lang: event.data.tgt_lang,
        src_lang: event.data.src_lang,

        callback_function: (x: any) => {
            self.postMessage({
                status: 'update',
                output: translator.tokenizer.decode(x[0].output_token_ids, { skip_special_tokens: true })
            })
        }
    })

    // console.log('HEHEHHERERE', output)

    self.postMessage({
        status: 'complete',
        output
    })
})