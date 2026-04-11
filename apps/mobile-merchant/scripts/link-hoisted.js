/**
 * Recreates symlinks for packages that npm hoists to the monorepo root.
 * These packages need to also appear in the local node_modules so that
 * tools like expo/metro-config can find them relative to the project root.
 *
 * Run automatically via `postinstall` in package.json.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname; // apps/mobile-merchant/scripts
const localModules = path.resolve(projectRoot, '..', 'node_modules');
const rootModules = path.resolve(projectRoot, '..', '..', '..', 'node_modules');

const packagesToLink = [
    'react-native',
    'expo',
    'expo-modules-core',
    'expo-asset',
    'expo-file-system',
    'expo-font',
    'expo-image',
    'expo-constants',
    'expo-linking',
    'expo-splash-screen',
    'expo-status-bar',
    'expo-symbols',
    'expo-system-ui',
    'expo-web-browser',
    'expo-haptics',
    'react-native-gesture-handler',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-web',
    'react-native-worklets',
];

for (const pkg of packagesToLink) {
    const localPath = path.join(localModules, pkg);
    const rootPath = path.join(rootModules, pkg);

    if (!fs.existsSync(localPath) && fs.existsSync(rootPath)) {
        fs.symlinkSync(rootPath, localPath, 'dir');
        console.log(`Linked: ${pkg}`);
    }
}
