const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  webpack: {
    configure: (config) => {
      if (Array.isArray(config.plugins)) {
        config.plugins = config.plugins.filter((plugin) => {
          return !(plugin && plugin.constructor && plugin.constructor.name === 'ESLintWebpackPlugin')
        })
      }

      if (config.optimization && Array.isArray(config.optimization.minimizer)) {
        config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
          if (plugin && plugin.constructor && plugin.constructor.name === 'CssMinimizerPlugin') {
            return new CssMinimizerPlugin({
              parallel: true,
              minimizerOptions: {
                preset: ['default', { calc: false }],
              },
            })
          }
          return plugin
        })
      }
      return config
    },
  },
}
