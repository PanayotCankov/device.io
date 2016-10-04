#!/usr/bin/env node

"use strict"

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

class Socket {
    private socket = new net.Socket();

    connect(host: string, port: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on("close", () => {
                console.log("Socket close!");
                // TODO: There may be pending promises to reject!  
            });
            this.socket.connect(port, host, e => e ? reject(e) : resolve());
        });
    }

    public write(msg: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let len = ("0000" + (+msg.length).toString(16)).substr(-4);
            let formattedMsg = len + msg;
            this.socket.write(formattedMsg, e => e ? reject(e) : resolve());
        });
    }

    public async read(): Promise<string> {
        let lenght = await this.readLength();
        if (lenght === 0) {
            return "";
        } else {
            return await this.readBytes(lenght);
        }
    }

    public async checkAck(): Promise<void> {
        let ack = await this.readBytes(4);
        switch(ack) {
            case "OKAY": return;
            case "FAIL": throw "FAIL";
            default: throw `Unexpected ${ack}`;
        }
    }

    private readBytes(length: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let read = () => {
                let result = this.socket.read(length);
                if (result == null) {
                    this.socket.once("readable", read);
                    // TODO: Subscribe for close and errors and reject.
                } else {
                    resolve(result.toString("ascii"));
                }
            };
            read();
        });
    }

    private async readLength(): Promise<number> {
        return parseInt(await this.readBytes(4), 16);
    }
}

async function shell_ls() {
    let socket = new Socket();
    await socket.connect("localhost", 5037);
    await socket.write("host:track-devices");
    await socket.checkAck();
    do {
        let devices = await socket.read();
        console.log("---"); // TODO: diff
        devices.split("\n").filter(l => !!l).forEach(line => {
            let [id, type] = line.split("\t");
            let event = { id, type };
            console.log(JSON.stringify(event));
        });
    } while(true);
}
let promise = shell_ls();
