#!/usr/bin/env node

"use strict"

import ADBClient from "../android/adb.client";

declare var console, require, __dirname;
let fs = require("fs");
let path = require("path");
let child_process = require("child_process");
let readline = require("readline");
let net = require("net");

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
console.log(JSON.stringify({"device.io": config.version}));

let idb = child_process.spawn(path.join(__dirname, "idb"));
let idbline = readline.createInterface({ input: idb.stdout });
idbline.on("line", line => console.log(line));

let adb = new ADBClient("localhost", 5037);
(async function() {
    // let ls = await adb.shellLs();
    // console.log("adb shell ls:");
    // console.log(ls);
    await adb.trackDevices();
})();
