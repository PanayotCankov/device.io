#!/usr/bin/env node

declare var console, require, __dirname;
let fs = require("fs");
let path = require("path");
let child_process = require("child_process");
let readline = require("readline");

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
console.log(JSON.stringify({"device.io": config.version}));

let idb = child_process.spawn("bin/idb");
let idbline = readline.createInterface({ input: idb.stdout });
idbline.on("line", line => console.log(line));
