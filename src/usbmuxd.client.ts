import Socket from "./socket";

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

    public async trackDevices(callback: (args: {}) => void): Promise<void> {
        await this.write({
            MessageType: 'Listen',
            ClientVersionString: 'node-usbmux',
            ProgName: 'node-usbmux'
        });
        await this.checkAck();
        let json;
        while(json = await this.read()) {
            console.log(json);
        }
    }

    private async checkAck(): Promise<void> {
        let result = await this.read();
        if (result.MessageType == 'Result') {
            if (result.Number !== 0) {
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
