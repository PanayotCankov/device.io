//
//  InputHandler.m
//  idb
//
//  Created by Panayot Cankov on 10/18/16.
//  Copyright © 2016 Telerik A D. All rights reserved.
//

#import "InputHandler.h"

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
