import path from 'path'
import type { Config } from 'payload/config'
import type { Configuration as WebpackConfig } from 'webpack'

const mockModulePath = path.resolve(__dirname, './../mocks/emptyObject')

export const extendWebpackConfig =
  (config: Config): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  webpackConfig => {
    const existingWebpackConfig =
      typeof config.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig

    return {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        cache: false,
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          [path.resolve(__dirname, './firebaseNotifications')]: mockModulePath,
          [path.resolve(__dirname, './firebase')]: mockModulePath,
        },
        fallback: {
          ...(existingWebpackConfig.resolve?.fallback ? existingWebpackConfig.resolve.fallback : {}),
          stream: false,
          crypto: false,
          tls: false,
          fs: false,
          zlib: false,
          os: false,
          child_process: false,
          net: false,
        }
      },
    }
  }