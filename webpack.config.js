module.exports = {
    mode: 'production',
    // mode: 'development',
    devtool: false,
    entry: './PandA_download_all_resource.ts',
    output: {
        path: __dirname,
        filename: './PandA_download_all_resource.js',
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
}