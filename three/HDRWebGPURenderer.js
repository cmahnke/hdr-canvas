import WebGPU from './WebGPU.js';

import Renderer from 'three/renderers/common/Renderer.js';
import WebGLBackend from 'three/renderers/webgl/WebGLBackend.js';
import HDRWebGPUBackend from './HDRWebGPUBackend.js';

class HDRWebGPURenderer extends Renderer {
  constructor( parameters = {} ) {

		let BackendClass;

		if ( parameters.forceWebGL ) {

			BackendClass = WebGLBackend;

		} else if ( WebGPU.isAvailable() ) {

			BackendClass = HDRWebGPUBackend;

		} else {

			BackendClass = WebGLBackend;

      /* eslint-disable no-console */
			console.warn( 'THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend.' );
      /* eslint-enable no-console */

		}

		const backend = new BackendClass( parameters );

		super( backend, parameters );

		this.isWebGPURenderer = true;

	}

}

export default HDRWebGPURenderer;
