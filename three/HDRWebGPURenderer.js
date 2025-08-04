import WebGPU from './WebGPU.js';

import Renderer from 'three/src/renderers/common/Renderer.js';
import WebGLBackend from 'three/src/renderers/webgl-fallback/WebGLBackend.js';
import HDRWebGPUBackend from './HDRWebGPUBackend.js';

/**
 * HDR enabled WebGPURenderer.
 *
 * @class
 * @augments {Renderer}
 * @fires contextrestored
 * @fires contextlost
 * @see {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer | WebGLRenderer}
 */
class HDRWebGPURenderer extends Renderer {
  /**
   * Creates an instance of HDRWebGPURenderer.
   *
   * @constructor
   * @param {object} [parameters={}] - The parameters for the renderer.
   * @param {boolean} [parameters.forceWebGL=false] - Forces the use of the WebGL backend even if WebGPU is available.
   */
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

    /**
     * @type {boolean}
     * @default true
     */
		this.isWebGPURenderer = true;

	}

}

export default HDRWebGPURenderer;
