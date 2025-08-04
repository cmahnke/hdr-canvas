import WebGPUBackend from 'three/src/renderers/webgpu/WebGPUBackend.js';
import { GPUFeatureName, GPUTextureFormat } from 'three/src/renderers/webgpu/utils/WebGPUConstants.js';

/**
 * An HDR-enabled WebGPU backend for three.js, extending the standard `WebGPUBackend`.
 * This class configures the WebGPU context to support High Dynamic Range rendering
 * by setting the output color space to "rec2100-hlg".
 * *You should never have the need to use this!*
 *
 * @class
 * @augments {WebGPUBackend}
 */

class HDRWebGPUBackend extends WebGPUBackend {

  /**
   * Initializes the backend, including requesting a WebGPU device and configuring the context.
   * This method overrides the parent `init` to set a specific HDR color space.
   *
   * @param {import('three/src/renderers/WebGLRenderer.js').WebGLRenderer} renderer - The three.js renderer instance.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  // See https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/webgpu/WebGPUBackend.js#L123
  async init( renderer ) {

		await super.init( renderer );

		//

		const parameters = this.parameters;

		// create the device if it is not passed with parameters

		let device;

		if ( parameters.device === undefined ) {

			const adapterOptions = {
				powerPreference: parameters.powerPreference
			};

			const adapter = await navigator.gpu.requestAdapter( adapterOptions );

			if ( adapter === null ) {

				throw new Error( 'WebGPUBackend: Unable to create WebGPU adapter.' );

			}

			// feature support

			const features = Object.values( GPUFeatureName );

			const supportedFeatures = [];

			for ( const name of features ) {

				if ( adapter.features.has( name ) ) {

					supportedFeatures.push( name );

				}

			}

			const deviceDescriptor = {
				requiredFeatures: supportedFeatures,
				requiredLimits: parameters.requiredLimits
			};

			device = await adapter.requestDevice( deviceDescriptor );

		} else {

			device = parameters.device;

		}

		const context = ( parameters.context !== undefined ) ? parameters.context : renderer.domElement.getContext( 'webgpu' );

		this.device = device;
		this.context = context;

		const alphaMode = parameters.alpha ? 'premultiplied' : 'opaque';

    // See https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use
    /**
     * Configures the WebGPU context with HDR settings.
     * The `colorSpace` is set to `rec2100-hlg` for High Dynamic Range support.
     * @see {@link https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use | WebGPU HDR Explainer}
     */
		this.context.configure( {
			device: this.device,
			format: GPUTextureFormat.BGRA8Unorm,
      //format: GPUTextureFormat.RGBA16Float,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
			alphaMode: alphaMode,
      //colorSpace: "display-p3",
      colorSpace: "rec2100-hlg",
      colorMetadata: { mode:"extended" }
		} );

		this.updateSize();

	}

}

export default HDRWebGPUBackend;
