const CopyPlugin = require("copy-webpack-plugin");

const wasmPaths = [
  "./node_modules/onnxruntime-web/dist/ort-wasm.wasm",
  "./node_modules/onnxruntime-web/dist/ort-wasm-threaded.wasm",
  "./node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm",
  "./node_modules/onnxruntime-web/dist/ort-wasm-simd.jsep.wasm",
  "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
  "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
  "./node_modules/onnxruntime-web/dist/ort-training-wasm-simd.wasm",
  "./node_modules/@ricky0123/vad-web/dist/silero_vad.onnx",
  "./node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js"
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    config.plugins.push(
      new CopyPlugin({ patterns: wasmPaths.map(p => ({ from: p, to: "static/chunks/app" })) })
    );

    // vercel
    config.plugins.push(
      new CopyPlugin({ patterns: wasmPaths.map(p => ({ from: p, to: "static/chunks" })) })
    );

    return config;
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
