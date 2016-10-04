#!/usr/bin/env node
"use strict"
declare var console, require, __dirname;
let fs = require("fs");
let path = require("path");

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
console.log(`device.io ${config.version}`);

let net = require("net");
class ADBSession {
    private socket;

    constructor() {
        this.socket = new net.Socket({ readable: true });
    }

    async shell_ls(): Promise<void> {
        let responce;

        await this.connect();
        console.log("< host:transport-any");
        await this.send("host:transport-any");

        responce = await this.read(4);
        console.log("> " + responce);

        await this.send("shell:ls");

        responce = await this.read(4);
        console.log("> " + responce);

        while(responce = await this.read(256)) {
            console.log("> " + responce);
        }
    }

    private connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            this.socket.connect(5037, '127.0.0.1', e => e ? reject(e) : resolve());
            // this.socket.on("data", data => console.log("data! " + data));
        });
    }

    private send(msg: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let len = ("0000" + (+msg.length).toString(16)).substr(-4);
            let formattedMsg = len + msg;
            console.log("Sending: " + formattedMsg);
            this.socket.write(formattedMsg, e => e ? reject(e) : resolve());
        });
    }

    private read(length: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let read = () => {
                let result = this.socket.read(length);
                if (result == null) {
                    this.socket.once("readable", read);
                    // TODO: Subscribe for close and errors and reject.
                } else {
                    resolve(result);
                }
            };
            read();
        });
    }
}

let session = new ADBSession();
session.shell_ls();
