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

    public async sync(): Promise<void> {
        await this.write("host:transport-any");
        await this.checkAck();

        await this.write("sync:");
        console.log("Sent sync!");
        await this.checkAck();
        console.log("Sync!");

        // read dir
        await this.writeCommandWithArgument("LIST", "sdcard/Download");
        let next: string = "DENT";
        while(next == "DENT" && (next = await this.readAck())) {
            switch (next) {
                case "DENT":
                    let stat = await this.socket.read(16);
                    let mode = stat.readUInt32LE(0);
                    let size = stat.readUInt32LE(4);
                    let mtime = stat.readUInt32LE(8);
                    let namelen = stat.readUInt32LE(12);
                    let name = (await this.socket.read(namelen)).toString();
                    let file = { name, mode, size, mtime };
                    console.log(JSON.stringify(file));
                    break;                    
                case "DONE":
                    await this.socket.read(16);
                    break;
                case "FAIL": throw "Fail";
                default: throw "Unexpected ack: " + next;
            }
        }

        // push file
        await this.writeCommandWithArgument("SEND", `sdcard/Download/test.txt,${0o644}`);

        // await this.checkAck();
        let content = "Hello World!";
        let buffer = new Buffer(8 + content.length);
        buffer.write("DATA", 0, 4);
        buffer.writeUInt32LE(content.length, 4);
        buffer.write(content, 8, content.length);
        await this.socket.write(buffer);

        console.log("Sent file so far!");
        let buffer2 = new Buffer(8);
        buffer2.write("DONE", 0, 4);
        let mtime = Math.floor(Date.now() / 1000);
        console.log("mtime: " + mtime);
        buffer2.writeUInt32LE(mtime, 4);
        await this.socket.write(buffer2);
        console.log("Sent DONE with mtime");

        let ack = await this.readAck();
        switch (ack) {
            case "OKAY":
                console.log("OKAY!");
                await this.socket.read(4);
                break;
            case "FAIL":
                let len = (await this.socket.read(4)).readUInt32LE(0);
                let msg = (await this.socket.read(len)).toString();
                throw msg;
            default: throw "Unexpected " + ack;
        }
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

    private async readAck(): Promise<string> {
        return (await this.socket.read(4)).toString("ascii");
    }

    private async checkAck(): Promise<void> {
        let ack = await this.readAck();
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

    private writeCommandWithArgument(command, argument): Promise<void> {
        let buffer = new Buffer(command.length + 4 + argument.length);
        buffer.write(command, 0, command.length);
        buffer.writeUInt32LE(argument.length, command.length);
        buffer.write(argument, command.length + 4);
        return this.socket.write(buffer);
    }
}
