const path = require('path')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/gfl-gramophone/' : '/',
  configureWebpack: {
    resolve: {
      alias: {
        '#': path.resolve(__dirname, './src')
      }
    },
    performance: {
      assetFilter: function (assetFilename) {
        // ignore asset site warnings:
        // - .map files, default webpack behaviour
        //   https://webpack.js.org/configuration/performance/#performanceassetfilter
        // - .ogg files, they're not bundled and not meant to be
        return !(/\.map|\.ogg$/.test(assetFilename))
      }
    }
  },
  chainWebpack: config => {
    // do not pointlessly copy `public` folder to `dist`
    // when not building for production
    if (process.env.NODE_ENV !== 'production') {
      config.plugins.delete('copy')
    }
  }
}
