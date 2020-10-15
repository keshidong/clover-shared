#!/usr/bin/env node

'use strict';

const path = require('path')
const join = require('path').join;
const rollup = require('rollup').rollup;
const babel = require('@rollup/plugin-babel').default;
const debug = require('debug');
const glob = require('glob');

const log = debug('app:log');
const error = debug('app:error');

const optimist = require('optimist')

const devSwPath = optimist.argv.swPath ? join(process.cwd(), optimist.argv.swPath) : join(__dirname, '..', '.next/cache')
// projectUpdateStrategy or pageUpdateStrategy
const isWholeVersionUpdate = optimist.argv.wholeVersionUpdate ? 'true' : 'false'

const jsPath = join(__dirname, '..', 'public/p');
const outPath = process.env.NODE_ENV === 'develepment' ? devSwPath : join(__dirname, '..', 'dist/multipages/p');

const fs = require('fs');
const bundleId = process.env.NODE_ENV === 'develepment' ? 'develepment' : fs.readFileSync(join(__dirname, '..', '.next/BUILD_ID'), 'utf8');
const pages = process.env.NODE_ENV === 'develepment' ? [] : glob.sync('p/**/*.html', { cwd: join(__dirname, '..', 'dist/multipages') })
  .map(filePath => {
    const module = path.parse(filePath)
    return join('/', module.dir, module.name)
  });

process.env.BUILD_ID = bundleId
process.env.STATIC_PAGE = JSON.stringify(pages)
process.env.IS_WHOLE_VERSION_UPDATE = isWholeVersionUpdate

function baseRollup(input, file) {
    return rollup({
        input,
        cache: false,
        plugins: [
            babel({
              babelrc: false,
              presets: [
                ['@babel/env', { modules: false, targets: {
                  "android": "56",
                  "ios": "11"
                } }],
              ],
              "plugins": [
                ["transform-inline-environment-variables", {
                  "include": [
                    "NODE_ENV",
                    "BUILD_ID",
                    "STATIC_PAGE",
                    "IS_WHOLE_VERSION_UPDATE"
                  ]
                }]
              ]
            })
        ]
    })
    .then(bundle => {
        return bundle.write({
            format: 'iife',
            strict: true,
            compact: true,
            file
        });
    })
}

log('Building...');

function run() {
    return Promise.all([
        baseRollup(join(jsPath, 'sw.js'), join(outPath, 'sw.js'), 'sw'),
    ]);
}

run()
    .then(() => {
        log('scripts created...');
    })
    .catch(error);
