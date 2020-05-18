const { parsed: localEnv } = require('dotenv').config()

module.exports = {
  webpack(config, options) {
    // Further custom configuration here
    return {
      ...config,
      node: {
        fs: 'empty',
        child_process: 'empty',
        net: 'empty'
      }
    }
  },
  experimental: {
    exportTrailingSlash: false,
  },
  exportPathMap: async function(
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId },
  ) {

    /** @type {{ addresses?: { 'ROOT_CONTRACT'?: string } }[]} */
    let pools
    try {
      pools = JSON.parse(localEnv.NEXT_PUBLIC_POOLS) || []
    } catch (e) {
      throw new Error(`could not parse JSON in env variable 'NEXT_PUBLIC_POOLS': ${e.message || e}`)
    }

    const roots = pools.filter(pool => pool.addresses && pool.addresses.ROOT_CONTRACT)
      .map(pool => pool.addresses.ROOT_CONTRACT)

    if (roots.length === 0) {
      throw new Error(`expected at least one pool in env variable 'NEXT_PUBLIC_POOLS', found none`)
    }

    /** @type {{ [key: string]: { page: string } }} */
    let generatedPathMap = defaultPathMap;

    for (const rootPathMap of roots.map(root => genPathMapForRoot(root, defaultPathMap))) {
      generatedPathMap = {
        ...generatedPathMap,
        ...rootPathMap,
      }
    }

    console.log('generatedPathMap', generatedPathMap);

    return generatedPathMap;
  },
};

/**
 * Generate the needed paths for the given root
 * @param {string} root
 * @param {{ [key: string]: { page: string } }} defaultPathMap
 * @returns {{ [key: string]: { page: string } }}
 */
function genPathMapForRoot(root, defaultPathMap) {
  /** @type {{ [key: string]: { page: string } }} */
  const pathMap = {}

  for (const path of Object.keys(defaultPathMap)) {
    // skip all paths that do not start with /[root]/
    if (!path.startsWith('/[root]/')) {
      continue
    }

    const rootPath = path.replace('/[root]/', `/${root}/`)

    pathMap[rootPath] = defaultPathMap[path]
  }

  return pathMap
}
