#!/usr/bin/env node

declare var console, require, __dirname;
let fs = require("fs");
let path = require("path");

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
console.log(`device.io ${config.version}`);
