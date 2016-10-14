var net = require("net");

export default class Socket {
    // Check for sufficient properties on socket;
    private state: "init" | "connecting" | "open" | "closed" | "error";
    public socket: any; // TODO: Make private.

    constructor() {
        this.socket = new net.Socket()
        this.state = "init";
        this.socket.on("close", () => this.state = "closed");
        this.socket.on("error", () => this.state = "error");
    }

    public connect(path: string): Promise<void>;
    public connect(host: string, port: number): Promise<void>;
    public connect(hostOrPath: string, port?: number): Promise<void> {
        this.state = "connecting";
        let argsCount = arguments.length;
        return new Promise<void>((resolve, reject) => {
            let error = e => {
                if (e) {
                    this.state = "error";
                    reject(e);
                } else {
                    this.state = "open";
                    resolve();
                }
            };
            switch(argsCount) {
                case 1: return this.socket.connect(hostOrPath, error);
                case 2: return this.socket.connect(port, hostOrPath, error);
                default: throw "Unknown overload, expected either 'path' or 'host and port'."
            }
        });
    }

    public end(): void {
        this.socket.end();
    }

    public write(text: string): Promise<void>;
    public write(buffer: Buffer): Promise<void>;
    public write(payload: string | Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.write(payload, e => e ? reject(e) : resolve());
        });
    }

    public read(length: Number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let read = () => {
                let result = this.socket.read(length);
                if (result) {
                    unsubscribe();
                    resolve(result);
                    return true;
                }
                return false;
            };
            let close = e => {
                if (!read()) {
                    unsubscribe();
                    reject("Socket closed.");
                }
            }
            let error = e => {
                if (!read()) {
                    unsubscribe();
                    reject(e);
                }
            }
            let subscribe = () => {
                this.socket.on("readable", read);
                this.socket.on("close", close);
                this.socket.on("error", error);
            };
            let unsubscribe = () => {
                this.socket.removeListener("readable", read);
                this.socket.removeListener("close", close);
                this.socket.removeListener("error", error);
            };
            subscribe();
            read();
        });
    }

    public readToEnd(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let buffers = [];
            let read = () => {
                let buffer;
                while(buffer = this.socket.read()) {
                    buffers.push(buffer);
                }
            };
            let error = e => {
                unsubscribe();
                reject(e);
            };
            let close = () => {
                unsubscribe();
                read();
                resolve(Buffer.concat(buffers));
            };
            let subscribe = () => {
                this.socket.on("readable", read);
                this.socket.on("error", error);
                this.socket.on("close", close);
            }
            let unsubscribe = () => {
                this.socket.removeListener("readable", read);
                this.socket.removeListener("error", error);
                this.socket.removeListener("close", close);
            }
            read();
            switch(this.state) {
                case "closed": return close();
                case "error": return error("Socket closed.");
                default: return subscribe();
            }
        });
    }
}
