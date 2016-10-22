declare module "readline";
declare module "fs";
declare module "net";
declare module "plist";

declare var setTimeout, console, Buffer, process;
declare interface Buffer{
    toString(encoding?: string): string;
    readUInt32LE(offset?: number): number;
}
