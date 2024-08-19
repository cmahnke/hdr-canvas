import WebGPUBackend from 'three/src/renderers/webgpu/WebGPUBackend.js';
import { GPUFeatureName, GPUTextureFormat } from 'three/src/renderers/webgpu/utils/WebGPUConstants.js';

class HDRWebGPUBackend extends WebGPUBackend {

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
