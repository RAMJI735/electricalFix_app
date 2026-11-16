const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Limit workers to prevent WASM/Node out-of-memory errors on Windows during native bundling
config.maxWorkers = 2;

// Optimize bundle size for production
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: false,
    mangle: { toplevel: false },
    output: { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    toplevel: false,
    compress: { reduce_funcs: false },
  },
};

module.exports = withNativewind(config, { inlineRem: 16 });
