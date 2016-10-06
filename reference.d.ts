declare var setTimeout, console, require, Buffer;
declare interface Buffer{
    toString(encoding?: string): string;
    readUInt32LE(offset?: number): number;
}