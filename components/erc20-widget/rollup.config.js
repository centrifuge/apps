import babel from "rollup-plugin-babel";
import filesize from "rollup-plugin-filesize";
import resolve from "rollup-plugin-node-resolve";
import progress from "rollup-plugin-progress";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import url from "rollup-plugin-url";
import { DEFAULT_EXTENSIONS } from '@babel/core';

const extensions = [
    ...DEFAULT_EXTENSIONS,
    '.ts',
    '.tsx'
]

export default {
  input: "src/index.ts",
  output: [
    {
      exports: "named",
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true
    },
    {
      exports: "named",
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: true
    }
  ],
  plugins: [

    peerDepsExternal(),
    progress(),
    resolve({
      extensions
    }),
    url({
      include: ["**/*.woff", "**/*.woff2"],
      // setting infinite limit will ensure that the files
      // are always bundled with the code, not copied to /dist
      limit: Infinity
    }),
    babel({
      babelrc: true,
      extensions

    }),
    filesize()
  ]
};


