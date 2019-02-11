const path = require('path')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/gfl-gramophone/' : '/',
  configureWebpack: {
    resolve: {
      alias: {
        '#': path.resolve(__dirname, './src')
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
