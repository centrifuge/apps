const path = require('path');
var DeclarationBundlerPlugin = require('declaration-bundler-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: "source-map",
  entry: './src/Tinlake.ts',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".js"]
  },
  output: {
    filename: 'Tinlake.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'tinlake',
    libraryTarget: 'umd',
    // The following is a workaround, see https://github.com/markdalgleish/static-site-generator-webpack-plugin/issues/130
    globalObject: 'this',
  },
  module: {
    rules: [
      { test: /\.(json|abi)$/, loader: 'json-loader', type: 'javascript/auto' },
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.ts$/, loader: "ts-loader" },
    ]
  },
//   plugins: [
//     new DeclarationBundlerPlugin({
//         moduleName:'some.path.moduleName',
//         out:'./builds/bundle.d.ts',
//     }),

// new UglifyJsPlugin({
//   cache: true,
//   parallel: true,
//   sourceMap: true,
// }),
//   ]
};
