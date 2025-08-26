const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support with proper platform ordering
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper asset resolution
config.resolver.assetExts.push('mp3', 'm4a', 'wav');

// Ensure web compatibility
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;