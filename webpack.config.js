var path = require("path");
var fs = require("fs");
var OS = require("os");
var prependFile = require('prepend-file');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var webpack = require('webpack');
var pkg = require("./package.json");

var rootDir = path.join(__dirname, ".");
var outputDir = path.join(__dirname, "dist");
var outputFilename = 'cli.bundled.js';

module.exports = {
  entry: {
    cli: path.join(__dirname, "src", "cli.js")
  },
  target: 'node',
  node: {
    // For this option, see here: https://github.com/webpack/webpack/issues/1599
    __dirname: false,
    __filename: false
  },
  context: rootDir,
  output: {
    path: outputDir,
    filename: 'tronbox.js'
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.js$/,
      use: "shebang-loader"
    }]
  },
  externals: [
    // If you look at webpack's docs, `externals` doesn't need to be a function.
    // But I never got it to work otherwise, so this is a function because "it works".
    function (context, request, callback) {

      // truffle-config uses the original-require module.
      // Here, we leave it as an external, and use the original-require
      // module that's a dependency of Truffle instead.
      if (/^original-require$/.test(request)) {
        return callback(null, 'commonjs original-require');
      }

      // We want to leave solc as an external dependency as well (for now)
      if (/^solc$/.test(request)) {
        return callback(null, 'commonjs solc');
      }

      // Mocha doesn't seem to bundle well either. This is a stop-gap until
      // I can look into it further.
      if (/^mocha$/.test(request)) {
        return callback(null, 'commonjs mocha');
      }

      if (/^formidable$/.test(request)) {
        return callback(null, 'commonjs formidable');
      }

      callback();
    }
  ],
  plugins: [
    new webpack.DefinePlugin({
      "BUNDLE_VERSION": JSON.stringify(pkg.version)
    }),

    // Put the shebang back on.
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node\n',
      raw: true
    }),

    // TODO Re-add support for Solidity tests
    // new CopyWebpackPlugin([{
    //   from: path.join(__dirname, "src", "lib", "testing", "Assert.sol")
    // }, {
    //   from: path.join(__dirname, "src", "lib", "testing", "SafeSend.sol")
    // }, {
    //   from: path.join(__dirname, "src", "lib", "templates/"),
    //   to: "templates",
    //   flatten: true
    // }, ]),

    new CleanWebpackPlugin(["dist"])
  ],
  resolve: {
    alias: {
      // fsevents is used by chokidar and is an optional requirement
      // It doesn't pack well, and is OS X specific, so let's get rid of it.
      "fsevents": path.join(__dirname, "./nil.js"),
      "ws": path.join(__dirname, "./nil.js"),
      "original-fs": path.join(__dirname, "./nil.js"),
      "scrypt": "js-scrypt",
      "secp256k1": path.join(__dirname, "node_modules", "secp256k1", "elliptic.js")
    }
  },
  stats: {
    warnings: false
  }
}
