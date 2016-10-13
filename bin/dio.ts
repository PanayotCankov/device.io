#!/usr/bin/env node

"use strict"

import AdbClient from "../src/adb.client";
import UsbmuxdClient from "../src/usbmuxd.client";

(async () => {
    try {
        let client = new AdbClient();
        await client.connect();
        await client.trackDevices(status => console.log(JSON.stringify(status)));
    } catch(e) {
        console.log("AdbClient: " + e);
    }
})();

(async () => {
    try { 
        let client = new UsbmuxdClient();
        await client.connect();
        await client.trackDevices(status => console.log(JSON.stringify(status)));
    } catch(e) {
        console.log("UsbmuxdClient: " + e);
    }
})();
