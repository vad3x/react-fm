var babelJest = require('babel-jest');

module.exports = {
    process: function(src, filename) {
        if (filename.indexOf('node_modules') === -1) {
            if (filename.match(/\.js?$/)) {
                return babelJest.process(src, filename);
            }

            return '';
        }

        return src;
    }
};
