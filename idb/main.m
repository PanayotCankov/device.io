#import <Foundation/Foundation.h>
#import "MobileDevice.h"

void writeLine(NSString* string) {
    NSFileHandle* stdout = [NSFileHandle fileHandleWithStandardOutput];
    [stdout writeData: [[string stringByAppendingString:@"\n"] dataUsingEncoding: NSNEXTSTEPStringEncoding]];
}

void writeJson(NSDictionary* json) {
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject: json options:NO error: nil];
    NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    writeLine(jsonString);
}

void connected(am_device *device) {
    NSNumber* type = [NSNumber numberWithInt: AMDeviceGetInterfaceType(device)];
    NSString* udid = (__bridge NSString *)(AMDeviceCopyDeviceIdentifier(device));
    AMDeviceConnect(device);
    NSString* name = CFBridgingRelease(AMDeviceCopyValue(device, 0, CFSTR("DeviceName")));
    NSString* model = CFBridgingRelease(AMDeviceCopyValue(device, 0, CFSTR("HardwareModel")));
    writeJson(@{ @"action": @"device.connected", @"udid": udid, @"name": name, @"model": model });
    AMDeviceDisconnect(device);
}

void disconnected(am_device *device) {
    NSNumber* type = [NSNumber numberWithInt: AMDeviceGetInterfaceType(device)];
    NSString* udid = (__bridge NSString *)(AMDeviceCopyDeviceIdentifier(device));
    writeJson(@{ @"action": @"device.disconnected", @"udid": udid });
}

void device(struct am_device_notification_callback_info *info, void *arg) {
    switch (info->msg) {
        case ADNCI_MSG_CONNECTED: return connected(info->dev);
        case ADNCI_MSG_DISCONNECTED: return disconnected(info->dev);
    }
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        AMDSetLogLevel(4);
        struct am_device_notification *notify;
        AMDeviceNotificationSubscribe(&device, 0, 0, NULL, &notify);
        CFRunLoopRun();

    }
    return 0;
}
