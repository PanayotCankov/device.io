declare var setTimeout, console, require, Buffer;
declare interface Buffer{
    toString(encoding?: string): string;
    readUInt32LE(offset?: number): number;
    readUInt32BE(offset?: number): number;
}

declare module "fs";
declare module "plist";