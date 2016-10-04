#import <Foundation/Foundation.h>
#import "MobileDevice.h"

void writeLine(NSString* string) {
    NSFileHandle* stdout = [NSFileHandle fileHandleWithStandardOutput];
    [stdout writeData: [[string stringByAppendingString:@"\n"] dataUsingEncoding: NSNEXTSTEPStringEncoding]];
}

void device_callback(struct am_device_notification_callback_info *info, void *arg) {
    switch (info->msg) {
        case ADNCI_MSG_CONNECTED: {
            NSError* error;
            NSNumber* type = [NSNumber numberWithInt: AMDeviceGetInterfaceType(info->dev)];
            NSString* udid = (__bridge NSString *)(AMDeviceCopyDeviceIdentifier(info->dev));
            // TODO: Type is USB vs WIFI
            NSDictionary* message = @{ @"action": @"device.connected", @"udid": udid };
            NSData* jsonData = [NSJSONSerialization dataWithJSONObject: message options:NO error:&error];
            NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            writeLine(jsonString);
        }
        break;

        case ADNCI_MSG_DISCONNECTED: {
            NSError* error;
            NSNumber* type = [NSNumber numberWithInt: AMDeviceGetInterfaceType(info->dev)];
            NSString* udid = (__bridge NSString *)(AMDeviceCopyDeviceIdentifier(info->dev));
            // TODO: Type is USB vs WIFI
            NSDictionary* message = @{ @"action": @"device.disconnected", @"udid": udid };
            NSData* jsonData = [NSJSONSerialization dataWithJSONObject: message options:NO error:&error];
            NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            writeLine(jsonString);
        }
        break;

        default:
            NSLog(@"Unknown: %d", info->msg);
            break;
    }
}

@interface InputHandler : NSObject
@end

@implementation InputHandler {
    BOOL finished;
}

- (id) init {
    if ((self = [super init])) {
        NSFileHandle *inHandle = [NSFileHandle fileHandleWithStandardInput];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(stdinDataAvailable) name:NSFileHandleDataAvailableNotification object:inHandle];
        [inHandle waitForDataInBackgroundAndNotify];
    }
    return self;
}

- (BOOL) isFinished {
    return finished;
}

- (void) stdinDataAvailable {
    NSFileHandle *inHandle = [NSFileHandle fileHandleWithStandardInput];
    NSData *data = [inHandle availableData];
    if ([data length] == 0) {
        finished = YES;
        return;
    }

    NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    NSLog(@"Got: %@", text);

    [inHandle waitForDataInBackgroundAndNotify];
}
@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        InputHandler *ih = [[InputHandler alloc] init];
        AMDSetLogLevel(4);
        struct am_device_notification *notify;
        AMDeviceNotificationSubscribe(&device_callback, 0, 0, NULL, &notify);
        CFRunLoopRun();

    }
    return 0;
}
