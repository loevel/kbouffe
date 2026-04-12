const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo so shared packages (packages/*) are tracked
config.watchFolders = [monorepoRoot];

// Local node_modules first — this ensures react, react-native etc. always
// resolve to the mobile-merchant's copies, preventing duplicate-module issues
// with other workspaces in the monorepo (e.g. web-dashboard).
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// Required so Metro follows symlinks (used to re-link hoisted packages)
config.resolver.unstable_enableSymlinks = true;

// Force singleton packages to always resolve from the project root.
// Without this, symlinked packages (e.g. react-native → monorepo root) import
// their own copy of react/react-native from the monorepo root, causing a
// "two copies of React" crash (Invalid hook call).
const singletons = [
    'react',
    'react-native',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
];
const singletonPaths = Object.fromEntries(
    singletons.map((pkg) => {
        try {
            return [pkg, require.resolve(pkg, { paths: [projectRoot] })];
        } catch {
            return [pkg, null];
        }
    })
);

// @react-navigation/* exists both in the workspace root and nested inside
// expo-router's own node_modules. expo-router's NavigationContainer provides
// a LinkingContext from its own copy; if @react-navigation/bottom-tabs resolves
// the other copy it gets a different Context object → "Couldn't find a
// LinkingContext context" crash. Force all navigation packages to resolve from
// expo-router's nested node_modules so every package shares the same instance.
const expoRouterRoot = path.resolve(projectRoot, 'node_modules/expo-router');
const navSingletons = [
    '@react-navigation/native',
    '@react-navigation/core',
    '@react-navigation/bottom-tabs',
    '@react-navigation/stack',
    '@react-navigation/elements',
];
const navSingletonPaths = Object.fromEntries(
    navSingletons.map((pkg) => {
        try {
            return [pkg, require.resolve(pkg, { paths: [expoRouterRoot] })];
        } catch {
            // fall through to workspace root if not found nested in expo-router
            try {
                return [pkg, require.resolve(pkg, { paths: [projectRoot] })];
            } catch {
                return [pkg, null];
            }
        }
    })
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    const override = singletonPaths[moduleName] ?? navSingletonPaths[moduleName];
    if (override) {
        return { filePath: override, type: 'sourceFile' };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
