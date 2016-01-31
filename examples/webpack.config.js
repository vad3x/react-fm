var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'inline-source-map',

    entry: fs.readdirSync(__dirname).reduce(
        (entries, dir) => {
            if (fs.statSync(path.join(__dirname, dir)).isDirectory()) {
                entries[dir] = path.join(__dirname, dir, 'app.js');
            }

            return entries;
        }, {}),

    output: {
        path: `${__dirname}/__build__`,
        filename: '[name].js',
        chunkFilename: '[id].chunk.js',
        publicPath: '/__build__/'
    },

    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
        }, {
            test: /\.css$/,
            loader: 'style!css'
        }, {
            test: /\.module\.less$/,
            loaders: [
                'style-loader',
                'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!less'
            ]
        }]
    },

    resolve: {
        alias: {
            'react-fm': path.join(__dirname, '..', 'src')
        }
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin('shared.js'),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
};
