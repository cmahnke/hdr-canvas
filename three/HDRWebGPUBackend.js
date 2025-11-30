import WebGPUBackend from 'three/src/renderers/webgpu/WebGPUBackend.js';
import { REVISION, HalfFloatType } from 'three/src/constants.js';

/**
 * An HDR-enabled WebGPU backend for three.js, extending the standard `WebGPUBackend`.
 * This class configures the WebGPU context to support High Dynamic Range rendering
 * by setting the output color space to "rec2100-hlg".
 * **You should never have the need to use this!**
 *
 * @class
 * @augments {WebGPUBackend}
 * @deprecated Use WebGPUBackend instead
 */

class HDRWebGPUBackend extends WebGPUBackend {

  get context() {

    const canvasTarget = this.renderer.getCanvasTarget();
    const canvasData = this.get( canvasTarget );

    let context = canvasData.context;

    if ( context === undefined ) {

      const parameters = this.parameters;

      if ( canvasTarget.isDefaultCanvasTarget === true && parameters.context !== undefined ) {

        context = parameters.context;

      } else {

        context = canvasTarget.domElement.getContext( 'webgpu' );

      }

      // OffscreenCanvas does not have setAttribute, see #22811
      if ( 'setAttribute' in canvasTarget.domElement ) canvasTarget.domElement.setAttribute( 'data-engine', `three.js r${ REVISION } webgpu` );

      const alphaMode = parameters.alpha ? 'premultiplied' : 'opaque';

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const toneMappingMode = parameters.outputType === HalfFloatType ? 'extended' : 'standard';

      // See https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use
      /**
       * Configures the WebGPU context with HDR settings.
       * The `colorSpace` is set to `rec2100-hlg` for High Dynamic Range support.
       * @see {@link https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use | WebGPU HDR Explainer}
       */

      context.configure( {
        device: this.device,
        format: this.utils.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        alphaMode: alphaMode,
        colorSpace: "rec2100-hlg",
        toneMapping: { mode: "extended" }
      } );

      canvasData.context = context;

    }

    return context;

  }

}

export default HDRWebGPUBackend;
