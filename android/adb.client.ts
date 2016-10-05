declare const require, console;

let net = require("net");

class AdbSocket {
    private closed: boolean;
    private socket = new net.Socket();

    connect(host: string, port: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on("close", () => this.closed = true);
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

    public async checkAck(): Promise<void> {
        let ack = await this.readBytes(4);
        switch(ack) {
            case "OKAY": return;
            case "FAIL": throw "FAIL";
            default: throw `Unexpected ${ack}`;
        }
    }

    public async read(): Promise<string> {
        let lenght = await this.readLength();
        if (lenght === 0) {
            return "";
        } else {
            return await this.readBytes(lenght);
        }
    }

    public readLinesToEnd(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            let lines = "";
            let close = () => {
                this.socket.removeListener("readable", read);
                this.socket.removeListener("close", close);
                read();
                resolve(lines.split("\n").map(l => l.trim()).filter(l => !!l));
            }
            let read = () => {
                let temp;
                while(temp = this.socket.read()) {
                    lines += temp.toString("ascii");
                }
            }
            if (this.closed) {
                read();
                close();
            } else {
                this.socket.on("readable", read);
                this.socket.on("close", close);
            }
        });
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

export default class ADBClient {
    constructor(private host: string = "localhost", private port: number = 5037) {
    }

    public async shellLs(): Promise<string[]> {
        let socket = await this.connect();
        await socket.write("host:transport-any");
        await socket.checkAck();
        await socket.write("shell:ls");
        await socket.checkAck();
        return await socket.readLinesToEnd();
    }

    public async trackDevices(): Promise<void> {
        let socket = await this.connect();
        await socket.write("host:track-devices");
        await socket.checkAck();

        let oldDevices = new Set<string>();
        do {
            let newDevices =
                (await socket.read())
                .split("\n")
                .filter(l => !!l)
                .map(line => {
                    let [id, type] = line.split("\t");
                    return { id, type };
                })
                .filter(device => device.type === "device")
                .reduce((set, device) => set.add(device.id), new Set<string>());
            oldDevices.forEach(device => {
                if (!newDevices.has(device)) {
                    console.log(JSON.stringify({"action": "device.disconnected", "id": device}));
                }
            });
            newDevices.forEach(device => {
                if (!oldDevices.has(device)) {
                    console.log(JSON.stringify({"action": "device.connected", "id": device}));
                }
            });
            oldDevices = newDevices;
        } while(true);
    }

    private async connect(): Promise<AdbSocket> {
        let socket = new AdbSocket();
        await socket.connect(this.host, this.port);
        return socket;
    }
}
