const babel = require('rollup-plugin-babel')
const commonJs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')

module.exports = config => {
  config.set({
    autoWatch: false,
    browsers: [ 'ChromeHeadless' ],
    colors: true,
    concurrency: Infinity,
    files: [
      { pattern: 'src/**/*.js', included: false },
      'tests/**/*.js'
    ],
    frameworks: [ 'mocha', 'chai' ],
    logLevel: config.LOG_INFO,
    mochaReporter: {
      showDiff: true
    },
    port: 9876,
    preprocessors: {
      'src/**/*.js': [ 'rollup' ],
      'tests/**/*.js': [ 'rollup' ]
    },
    reporters: [ 'mocha' ],
    rollupPreprocessor: {
      exports: 'named',
      format: 'iife',
      moduleName: 'wilderness',
      plugins: [
        babel({
          exclude: 'node_modules/**',
          plugins: [ 'transform-object-rest-spread', 'external-helpers' ],
          presets: [[ 'es2015', { 'modules': false } ]]
        }),
        commonJs(),
        resolve({ module: true }),
        replace({ '__DEV__': true })
      ],
      sourceMap: 'inline'
    }
  })
}
