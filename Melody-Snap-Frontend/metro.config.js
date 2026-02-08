const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  crypto: require.resolve('expo-crypto'), // 或者 require.resolve('crypto-browserify')
  ...config.resolver.extraNodeModules,
};

module.exports = config;