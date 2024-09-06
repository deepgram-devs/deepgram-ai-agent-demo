/** @type {import('next').NextConfig} */
const CopyPlugin = require("copy-webpack-plugin");

const wasmPaths = [
  "./node_modules/onnxruntime-web/dist/*.wasm",
  "./node_modules/@ricky0123/vad-web/dist/silero_vad.onnx",
  "./node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
];

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
      new CopyPlugin({
        patterns: wasmPaths.map((p) => ({
          from: p,
          to: "static/chunks/app",
        })),
      })
    );

    // vercel
    config.plugins.push(
      new CopyPlugin({
        patterns: wasmPaths.map((p) => ({
          from: p,
          to: "static/chunks",
        })),
      })
    );

    return config;
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/_next/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
