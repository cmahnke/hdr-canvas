import WebGPU from './WebGPU.js';

import Renderer from 'three/src/renderers/common/Renderer.js';
import WebGLBackend from 'three/src/renderers/webgl-fallback/WebGLBackend.js';
import StandardNodeLibrary from 'three/src/renderers/webgpu/nodes/StandardNodeLibrary.js';
import HDRWebGPUBackend from './HDRWebGPUBackend.js';

/**
 * HDR enabled WebGPURenderer.
 *
 * Note: Since three.js r180 a plain `WebGPURenderer` with `outputType: HalfFloatType`
 * already delivers an HDR canvas (`rgba16float` with extended tone mapping). Only use
 * this renderer when you need the `rec2100-hlg` canvas color space (BT.2020 primaries).
 *
 * @class
 * @augments {Renderer}
 * @fires contextrestored
 * @fires contextlost
 * @see {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer | WebGLRenderer}
 * @deprecated Use WebGPURenderer with `outputType: HalfFloatType` unless you need the `rec2100-hlg` color space
 */
class HDRWebGPURenderer extends Renderer {
  /**
   * Creates an instance of HDRWebGPURenderer.
   *
   * @constructor
   * @param {object} [parameters={}] - The parameters for the renderer.
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
		 * The generic default value is overwritten with the
		 * standard node library for type mapping (parity with
		 * `WebGPURenderer`).
		 *
		 * @type {StandardNodeLibrary}
		 */
		this.library = new StandardNodeLibrary();

    /**
     * @type {boolean}
     * @default true
     */
		this.isWebGPURenderer = true;

	}

}

export default HDRWebGPURenderer;
