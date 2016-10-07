import Socket from "../promise/socket";

var plist = require("plist");

export default class UsbmuxdClient {
    private socket: Socket = new Socket();

    public connect(): Promise<void> {
        // TODO: (process.platform === 'win32') ? {port: 27015} : {path: '/var/run/usbmuxd'};
        return this.socket.connect('/var/run/usbmuxd');
    }

    public end(): void {
        this.socket.end();
    }

    public async trackDevices(callback: (args: any) => void): Promise<void> {
        await this.write({
            MessageType: 'Listen',
            ClientVersionString: 'device.io',
            ProgName: 'device.io'
        });
        await this.checkAck();
        let json;
        while(json = await this.read()) {
            callback(json);
        }
    }

    /**
     * TODO: Probably return raw new.Socket, and wrap if necessary in Usbmuxd socket, split the client...
     * For file transfers, connect to 62078 and promote to lockdown socket.
     */
    public async connectTo(id: number, port: number): Promise<void> {
        port = this.htons(port);
        await this.write({
            MessageType: "Connect",
            ClientVersionString: 'device.io',
            ProgName: 'device.io',
            DeviceID: id,
            PortNumber: port
        });
        await this.checkAck();
    }

    /**
     * Converts a little endian 16 bit int number to 16 bit int big endian number.
     */
    private htons(port: number): number {
        return (port & 0xff00) >> 8 | (port & 0x00ff) << 8;
    }

    private async checkAck(): Promise<void> {
        let result = await this.read();
        if (result.MessageType == 'Result') {
            if (result.Number !== 0) {
                console.log(result);
                throw `Error: ${result.Number}`;
            }
        } else {
            throw `Expected {MessageType:'Result',Number:0}, got: ${result}`;
        }
    }

    private async read(): Promise<any> {
        let buffer = await this.socket.read(16);
        let header = {
            length: buffer.readUInt32LE(0)
        };
        let msg = await this.socket.read(header.length - 16);
        return plist.parse(msg.toString());
    }

    private write(payload): Promise<void> {
        let payloadPlist = plist.build(payload);
        console.log("Write: " + payloadPlist);
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

        return this.socket.write(buffer);
    }
}
