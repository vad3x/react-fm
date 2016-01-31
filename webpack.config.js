var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
        }, {
            test: /\.module\.less$/,
            loader: ExtractTextPlugin.extract(['css', 'less'])
        }]
    },

    output: {
        library: 'react-fm',
        libraryTarget: 'umd'
    },

    resolve: {
        extensions: ['', '.js', '.jsx']
    },

    node: {
        Buffer: false
    },

    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        new ExtractTextPlugin('index.css', {
            allChunks: true
        })
    ],

    externals: [{
        react: {
            root: 'React',
            commonjs2: 'react',
            commonjs: 'react',
            amd: 'react'
        }
    }]
};
