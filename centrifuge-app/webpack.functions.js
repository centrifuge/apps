module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      },
      {
        test: /\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties'],
          },
        },
      },
    ],
  },
}
