import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...[pluginJs.configs.recommended, ...tseslint.configs.recommended].map((conf) => ({
    ...conf,
    files: ["src/**/*.ts"]
  })),
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "no-warning-comments": ["warn", {}],
      "@typescript-eslint/no-unused-vars": ["warn"]
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        GPU: "readonly",
        GPUAdapter: "readonly",
        GPUAdapterInfo: "readonly",
        GPUBindGroup: "readonly",
        GPUBindGroupLayout: "readonly",
        GPUBuffer: "readonly",
        GPUCanvasContext: "readonly",
        GPUCommandBuffer: "readonly",
        GPUCommandEncoder: "readonly",
        GPUCompilationInfo: "readonly",
        GPUCompilationMessage: "readonly",
        GPUComputePassEncoder: "readonly",
        GPUComputePipeline: "readonly",
        GPUDevice: "readonly",
        GPUDeviceLostInfo: "readonly",
        GPUError: "readonly",
        GPUExternalTexture: "readonly",
        GPUInternalError: "readonly",
        GPUOutOfMemoryError: "readonly",
        GPUPipelineError: "readonly",
        GPUPipelineLayout: "readonly",
        GPUQuerySet: "readonly",
        GPUQueue: "readonly",
        GPURenderBundle: "readonly",
        GPURenderBundleEncoder: "readonly",
        GPURenderPassEncoder: "readonly",
        GPURenderPipeline: "readonly",
        GPUSampler: "readonly",
        GPUShaderModule: "readonly",
        GPUSupportedLimits: "readonly",
        GPUTexture: "readonly",
        GPUTextureView: "readonly",
        GPUUncapturedErrorEvent: "readonly",
        GPUValidationError: "readonly",
        GPUBufferUsage: "readonly",
        GPUColorWrite: "readonly",
        GPUMapMode: "readonly",
        GPUShaderStage: "readonly",
        GPUTextureUsage: "readonly",
        GPUBufferBindingType: "readonly",
        GPUTextureFormat: "readonly",
        GPUBlendFactor: "readonly",
        GPUBlendOperation: "readonly",
        FrameRequestCallback: "readonly",
        GPURenderPassDescriptor: "readonly",
        GPUStoreOp: "readonly",
        GPULoadOp: "readonly",
        GPUCanvasAlphaMode: "readonly",
        GPUBindGroupEntry: "readonly",
        GPUBufferBinding: "readonly",
        GPUIndexFormat: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
      "no-warning-comments": ["warn", {}],
      "no-irregular-whitespace": ["warn", {}],
      "no-console": ["warn", {}],
      "no-undef": ["warn", {}]
    }
  },
  {
    ignores: ["dist/", "build", ".eslintrc.mjs", "tests/"]
  }
];
