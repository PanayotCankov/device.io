#ifndef MobileDevice_h
#define MobileDevice_h

#include <CoreFoundation/CoreFoundation.h>

#define ADNCI_MSG_CONNECTED     1
#define ADNCI_MSG_DISCONNECTED  2
#define ADNCI_MSG_UNKNOWN       3

typedef unsigned int usbmux_error_t;
typedef unsigned int service_conn_t;

// AMD - Apple Mobile Device
void AMDSetLogLevel(int level);

typedef struct am_device {
    unsigned char unknown0[16];
    unsigned int device_id;
    unsigned int product_id;
    char *serial;
    unsigned int unknown1;
    unsigned char unknown2[4];
    unsigned int lockdown_conn;
    unsigned char unknown3[8];
} __attribute__ ((packed)) am_device;
typedef struct am_device * AMDeviceRef;

int AMDeviceGetInterfaceType(struct am_device *device);

typedef struct am_device_notification_callback_info {
    struct am_device *dev;
    unsigned int msg;
} __attribute__ ((packed)) am_device_notification_callback_info;

typedef void(*am_device_notification_callback)(struct am_device_notification_callback_info *, void* arg);

typedef struct am_device_notification {
    unsigned int unknown0;
    unsigned int unknown1;
    unsigned int unknown2;
    am_device_notification_callback callback;
    unsigned int unknown3;
} __attribute__ ((packed)) am_device_notification;

mach_error_t AMDeviceNotificationSubscribe(
    am_device_notification_callback callback,
    unsigned int unused0,
    unsigned int unused1,
    void* /* unsigned int */ dn_unknown3,
    struct am_device_notification **notification);

CFStringRef AMDeviceCopyDeviceIdentifier(struct am_device *device);

mach_error_t AMDeviceConnect(struct am_device *device);
CFStringRef AMDeviceCopyValue(struct am_device *device, unsigned int, CFStringRef cfstring);
int AMDeviceIsPaired(struct am_device *device);
mach_error_t AMDeviceValidatePairing(struct am_device *device);
mach_error_t AMDeviceStartSession(struct am_device *device);
mach_error_t AMDeviceStopSession(struct am_device *device);
mach_error_t AMDeviceDisconnect(struct am_device *device);
mach_error_t AMDeviceStartHouseArrestService(struct am_device *device, CFStringRef identifier, void *unknown, service_conn_t *handle, unsigned int *what);

// AFC - Apple File Connection
typedef unsigned int afc_error_t;

typedef struct afc_connection {
    unsigned int handle;
    unsigned int unknown0;
    unsigned char unknown1;
    unsigned char padding[3];
    unsigned int unknown2;
    unsigned int unknown3;
    unsigned int unknown4;
    unsigned int fs_block_size;
    unsigned int sock_block_size;
    unsigned int io_timeout;
    void *afc_lock;
    unsigned int context;
} __attribute__ ((packed)) afc_connection;

afc_error_t AFCConnectionOpen(service_conn_t handle, unsigned int io_timeout, struct afc_connection **conn);
afc_error_t AFCConnectionClose(afc_connection *conn);

typedef unsigned long long afc_file_ref;

#define AFC_FILE_MODE_READ       1
#define AFC_FILE_MODE_WRITE      3

afc_error_t AFCFileRefOpen(afc_connection *conn, const char *path, unsigned long long mode, afc_file_ref *ref);
afc_error_t AFCFileRefSeek(afc_connection *conn, afc_file_ref ref, unsigned long long offset1, unsigned long long offset2);
afc_error_t AFCFileRefRead(afc_connection *conn, afc_file_ref ref, void *buf, size_t *len);
afc_error_t AFCFileRefSetFileSize(afc_connection *conn, afc_file_ref ref, unsigned long long offset);
afc_error_t AFCFileRefWrite(afc_connection *conn, afc_file_ref ref, const void *buf, size_t len);
afc_error_t AFCFileRefClose(afc_connection *conn, afc_file_ref ref);

afc_error_t AFCDirectoryRead(afc_connection *conn, struct afc_directory *dir, char **dirent);
afc_error_t AFCDirectoryClose(afc_connection *conn, struct afc_directory *dir);
afc_error_t AFCDirectoryCreate(afc_connection *conn, const char *dirname);
afc_error_t AFCRemovePath(afc_connection *conn, const char *dirname);
afc_error_t AFCRenamePath(afc_connection *conn, const char *from, const char *to);
afc_error_t AFCLinkPath(afc_connection *conn, long long int linktype, const char *target, const char *linkname);

#endif /* MobileDevice_h */

