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
        await client.trackDevices(status => {
            console.log(status);
            if (status.MessageType == "Attached") {
                (async () => {
                    try {
                        let id = status.DeviceID;
                        console.log("tcp: " + id + " " + 62078);
                        let tcp = new UsbmuxdClient();
                        await tcp.connect();
                        console.log("Connected!");
                        await tcp.connectTo(id, 62078);
                        console.log("tcp done!");
                    } catch(e) {
                        console.log("tcp fail: " + e);
                    }
                })();
            }
        });
    } catch(e) {
        console.log("UsbmuxdClient: " + e);
    }
})();
