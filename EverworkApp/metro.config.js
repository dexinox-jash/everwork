const { getDefaultConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

// Merge React Native and Expo configs
const config = getDefaultConfig(__dirname);
const expoConfig = getExpoDefaultConfig(__dirname);

module.exports = {
  ...config,
  ...expoConfig,
  resolver: {
    ...config.resolver,
    ...expoConfig.resolver,
    assetExts: [...(config.resolver?.assetExts || []), 'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'],
  },
};
