module.exports = {
  entry: './src/ts/web/playground.ts',

  output: { filename: 'bundle.js' },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },

  devtool: false,

  resolve: {
    extensions: ['.ts', '.js']
  }
}
