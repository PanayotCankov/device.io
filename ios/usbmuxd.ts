
declare const require, console, process;
declare var Buffer;
declare type Buffer = any;

let net = require("net");
let plist = require("plist");

console.log("usbmuxd");

var address = (process.platform === 'win32') ? {port: 27015} : {path: '/var/run/usbmuxd'};

class Usbmuxd {
    private socket = new net.Socket();

    constructor() {}

    public async listen() {
        await this.connect();
        await this.write({
            MessageType: 'Listen',
            ClientVersionString: 'node-usbmux',
            ProgName: 'node-usbmux'
        });

        let json;
        while(json = await this.read()) {
            console.log(json);
        }
    }

    private connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on("close", () => console.log("closed!"));
            this.socket.connect(address, e => e ? reject(e) : resolve());
        });
    }

    private write(payload): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let payloadPlist = plist.build(payload);

            let payloadBuffer = new Buffer(payloadPlist);

            let header = {
                length: payloadBuffer.length + 16,
                version: 1,
                request: 8,
                tag: 1
            };
            let headerBuffer = new Buffer(16);
            headerBuffer.fill(0);
            headerBuffer.writeUInt32LE(header.length, 0);
            headerBuffer.writeUInt32LE(header.version, 4);
            headerBuffer.writeUInt32LE(header.request, 8);
            headerBuffer.writeUInt32LE(header.tag, 12);

            let buffer = Buffer.concat([headerBuffer, payloadBuffer]);

            this.socket.write(buffer, e => e ? reject(e) : resolve());
        });
    }

    private async read(): Promise<any> {
        let buffer = await this.readBytes(16);
        let header = {
            length: buffer.readUInt32LE(0)
        };
        let msg = await this.readBytes(header.length - 16);
        return plist.parse(msg.toString());
    }

    // TODO: Make promise based base class for sockets and share.
    private readBytes(length: number): Promise<Buffer> {
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

let usbmuxd = new Usbmuxd();
usbmuxd.listen()