require('dotenv').config()
require('ts-node').register({ project: './tsconfig.json', compilerOptions: { module: 'CommonJS' }, files: true })

module.exports = {
  webpack(config) {
    // Further custom configuration here
    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
          },
        ],
      },
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          child_process: false,
          net: false,
        },
      },
    }
  },
  experimental: {
    exportTrailingSlash: false,
  },
}
