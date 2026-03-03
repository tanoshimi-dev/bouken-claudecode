const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../../..');

const mobileModules = path.resolve(__dirname, 'node_modules');

// Modules that must resolve to a single copy to avoid duplicate instances
const singletonModules = {
  react: path.resolve(mobileModules, 'react'),
  'react-native': path.resolve(mobileModules, 'react-native'),
  'react/jsx-runtime': path.resolve(mobileModules, 'react/jsx-runtime'),
  'react/jsx-dev-runtime': path.resolve(mobileModules, 'react/jsx-dev-runtime'),
};

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    unstable_enableSymlinks: true,
    nodeModulesPaths: [
      mobileModules,
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: false,
    resolveRequest: (context, moduleName, platform) => {
      // Force singleton modules to resolve from the mobile project's node_modules
      if (singletonModules[moduleName]) {
        return {
          type: 'sourceFile',
          filePath: require.resolve(moduleName, { paths: [mobileModules] }),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
