const nodePath = require('path');

module.exports = function (api) {
    api.cache(true);

    const appRoot = nodePath.resolve(__dirname, 'app');

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Fix monorepo: babel-preset-expo can't find expo-router from root node_modules,
            // so its built-in plugin never loads. We inline the EXPO_ROUTER_APP_ROOT transform here.
            [function expoRouterAppRootFix({ types: t }) {
                return {
                    visitor: {
                        MemberExpression(astPath, state) {
                            const { node } = astPath;
                            if (!t.isMemberExpression(node.object)) return;
                            if (!t.isIdentifier(node.object.object, { name: 'process' })) return;
                            if (!t.isIdentifier(node.object.property, { name: 'env' })) return;

                            const key = astPath.toComputedKey();
                            if (!t.isStringLiteral(key)) return;

                            if (key.value === 'EXPO_ROUTER_APP_ROOT') {
                                const filename = state.filename || state.file?.opts?.filename;
                                if (filename) {
                                    const rel = nodePath.relative(nodePath.dirname(filename), appRoot);
                                    astPath.replaceWith(t.stringLiteral(rel));
                                }
                            } else if (key.value === 'EXPO_ROUTER_ABS_APP_ROOT') {
                                astPath.replaceWith(t.stringLiteral(appRoot));
                            } else if (key.value === 'EXPO_ROUTER_IMPORT_MODE') {
                                astPath.replaceWith(t.stringLiteral('sync'));
                            }
                        },
                    },
                };
            }],
        ],
    };
};
