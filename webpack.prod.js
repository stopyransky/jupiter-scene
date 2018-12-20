/* eslint-disable no-undef */

const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: [
      'babel-polyfill',
      './main.js',
    ]
  },
  output: {
    path: path.resolve(__dirname, './docs'),
    filename: '[name][hash:8].js'
  },
  resolve: {
    extensions: [ 'jsx', '.tsx', '.ts', '.js' ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          { loader: 'awesome-typescript-loader' }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          }
        ]
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].html'
            }
          },
          {
            loader: 'extract-loader'
          },
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src']
            }
          }
        ]
      },
      {
        test: /\.(svg|jpeg|jpg|gif|png|ico)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name][hash:8].[ext]'
            }
          }
        ]
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: [
          {
            loader: 'raw-loader'
          },
          {
            loader: 'glslify-loader'
          }
        ]
      },
      {
        test: /\.(xml|txt|(c|d|t)sv)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'data/[name][hash:8].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([
      'docs/*.*',
      'docs/images',
      'docs/data'
    ], {
      verbose: false
    }),
    new HTMLWebpackPlugin({
      template: './src/index.ejs',
      favicon: './src/favicon.ico',
      title: 'Jupiter Scene',
      minify: true
    }),
    new CompressionPlugin({
      algorithm: 'gzip'
    })
  ]
};
