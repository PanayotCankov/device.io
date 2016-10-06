#!/usr/bin/env node

"use strict"

import AdbClient from "../android/adb.client";
import UsbmuxdClient from "../ios/usbmuxd.client";

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
