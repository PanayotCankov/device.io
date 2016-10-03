#!/usr/bin/env node

declare var console, require, __dirname;
let fs = require("fs");
let path = require("path");

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
console.log(`device.io ${config.version}`);

// Android LS:
let net = require("net");
let client = new net.Socket();

client.connect(5037, '127.0.0.1', () => {
    function send_to_adb(msg: string) {
        let len = ("0000" + (+msg.length).toString(16)).substr(-4);
        console.log(len + msg);
        client.write(len + msg);
    }

    console.log("Connected to ADB");

    // send_to_adb("host:version");
    send_to_adb("host:transport-any");
    send_to_adb("shell:ls");
});

client.on('data', function(data) {
    console.log('Received: ' + data);
});

client.on('close', function() {
    console.log('Connection closed');
});