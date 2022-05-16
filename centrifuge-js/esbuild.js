const esbuild = require('esbuild')
const pkg = require('./package.json')

const watch = process.argv[2] === 'watch'

Promise.all([
  esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: pkg.module,
    bundle: true,
    sourcemap: true,
    watch: watch
      ? {
          onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else console.log('watch build succeeded:', result)
          },
        }
      : undefined,
    external: Object.keys(pkg.dependencies),
    format: 'esm',
    target: ['es6'],
  }),
  esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: pkg.main,
    bundle: true,
    sourcemap: true,
    watch,
    external: Object.keys(pkg.dependencies),
    platform: 'node',
    target: ['node14'],
  }),
]).catch(() => process.exit(1))
