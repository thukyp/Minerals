declare module '@xenova/transformers' {
  export interface PipelineOptions {
    progress_callback?: Function;
    quantized?: boolean;
  }

  export class RawImage {
    static fromURL(url: string): Promise<RawImage>;
  }

  export interface PipelineOutput {
    data: Float32Array | number[];
  }

  export function pipeline(
    task: string,
    model: string,
    options?: PipelineOptions
  ): Promise<any>;
}


