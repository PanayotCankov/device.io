#!/usr/bin/env node

"use strict"

import AdbClient from "../src/adb.client";
import UsbmuxdClient from "../src/usbmuxd.client";

import {LockdownSocket} from "../src/usbmuxd.client";

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
            console.log("Device?");
            console.log(JSON.stringify(status));
            console.log("msg: " + status.MessageType);
            if (status.MessageType === "Attached") {
                (async () => {
                    try {
                        let id = status.DeviceID;
                        let tcp = new UsbmuxdClient();
                        await tcp.connect();
                        let connection = await tcp.connectTo(id, 62078);
                        
                        let lockdown = new LockdownSocket(connection);
                        await lockdown.sendFile();
                        tcp.end();
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
