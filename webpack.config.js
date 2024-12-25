const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: [
        './src/js/index.js',
        './src/css/style.scss',
    ],
    output: {
        path: path.resolve(__dirname, 'static/dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.(css|scss)$/,
                exclude: /node_modules\/(?!react-datepicker\/dist\/react-datepicker.css).*/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [['autoprefixer']],
                            },
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.njk$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            minimize: true,
                        },
                    },
                    'nunjucks-html-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        hot: true,
        port: 3000,
    },
};
