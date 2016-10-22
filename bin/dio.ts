#!/usr/bin/env node

"use strict"

import AdbClient from "../src/adb.client";
import UsbmuxdClient from "../src/usbmuxd.client";
import * as readline from "readline";

// (async () => {
//     try {
//         let client = new AdbClient();
//         await client.connect();
//         await client.trackDevices(status => console.log(JSON.stringify(status)));
//     } catch(e) {
//         console.log("AdbClient: " + e);
//     }
// })();

// (async () => {
//     try { 
//         let client = new UsbmuxdClient();
//         await client.connect();
//         await client.trackDevices(status => console.log(JSON.stringify(status)));
//     } catch(e) {
//         console.log("UsbmuxdClient: " + e);
//     }
// })();

(async () => {
    try {
        let adb = new AdbClient();
        await adb.connect();
        await adb.sync();
    } catch(e) {
        console.log("Err: " + e);
    }
})();

// const repl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// let cmd = () => {
//     repl.question('> ', (answer) => {
//         console.log('Handle: ', answer);
        
//         cmd();
//         // At some point repl.close()
//     });
// };
// cmd();
