import Socket from "./socket";

export default class AdbClient {
    private socket: Socket = new Socket();

    public connect(host: string = "localhost", port: number = 5037): Promise<void> {
        return this.socket.connect(host, port);
    }

    public end(): void {
        this.socket.end();
    }

    public trackDevices(callback: (status: { id: string, type: string }) => void): void {
        (async () => {
            await this.write("host:track-devices");
            await this.checkAck();

            let oldDevices = new Map<string, string>();
            do {
                let newSet = new Set();
                (await this.readLines()).forEach(line => {
                    let [id, type] = line.split("\t");
                    newSet.add(id);
                    if (oldDevices.has(id)) {
                        if (oldDevices.get(id) == type) {
                        } else {
                            callback({id, type});
                        }
                    } else {
                        callback({id, type});
                        oldDevices.set(id, type);
                    }
                });
                oldDevices.forEach((type, id) => {
                    if (!newSet.has(id)) {
                        callback({id, type: "disconnected"});
                    }
                })
            } while(true);
        })();
    }

    public async shellLs(): Promise<string[]> {
        await this.write("host:transport-any");
        await this.checkAck();
        await this.write("shell:ls");
        await this.checkAck();
        return await this.readLinesToEnd();
    }

    private async read(): Promise<string> {
        let lenght = await this.readLength();
        if (lenght === 0) {
            return "";
        } else {
            let buffer = await this.socket.read(lenght);
            return buffer.toString("ascii");
        }
    }

    private async readLines(): Promise<string[]> {
        let result = await this.read();
        let lines = result.split("\n");
        lines = lines.slice(0, lines.length - 1);
        return lines;
    }

    private async readLinesToEnd(): Promise<string[]> {
        let buffer = await this.socket.readToEnd();
        let lines: string[] = buffer.toString("ascii").split("\n").map(s => s.trim());
        lines = lines.slice(0, lines.length - 1);
        return lines;
    }

    private async readLength(): Promise<number> {
        return parseInt((await this.socket.read(4)).toString("ascii"), 16);
    }

    private async checkAck(): Promise<void> {
        let ack = (await this.socket.read(4)).toString("ascii");
        switch(ack) {
            case "OKAY": return;
            case "FAIL": throw "FAIL";
            default: throw `Unexpected ${ack}.`;
        }
    }

    private write(message: string): Promise<void> {
        return this.socket.write(this.format(message));
    }

    private format(message: string): string {
        let len = ("0000" + (+message.length).toString(16)).substr(-4);
        return len + message;
    }
}
