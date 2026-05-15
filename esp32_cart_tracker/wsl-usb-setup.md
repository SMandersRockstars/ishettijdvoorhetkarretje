
# USB Device Access in WSL2

Guide for attaching a Silicon Labs CP210x USB-to-UART bridge (or similar USB device) to WSL2 on Windows.

## Requirements

- WSL2 (not WSL1)
- [usbipd-win](https://github.com/dorssel/usbipd-win) installed on Windows

Install usbipd-win if needed:
```powershell
winget install usbipd
```

## One-Time Setup

### 1. Bind the device (Windows, run as Administrator)

Find your device's bus ID:
```powershell
usbipd list
```

Bind it (only needed once per device):
```powershell
usbipd bind --busid 2-7
```

### 2. Auto-load the cp210x kernel module (WSL)

The default Microsoft WSL kernel includes the cp210x driver but doesn't load it automatically:
```bash
echo "cp210x" | sudo tee /etc/modules-load.d/cp210x.conf
```

## Every Session

### Attach the device (Windows, run as Administrator)

```powershell
usbipd attach --wsl --busid 2-7
```

This must be re-run each time you reconnect the USB device or restart WSL.

### Verify in WSL

```bash
ls /dev/ttyUSB*
# should show /dev/ttyUSB0
```

If the device doesn't appear, load the module manually:
```bash
sudo modprobe cp210x
```

## Connecting to the Device

```bash
screen /dev/ttyUSB0 115200
# or
minicom -D /dev/ttyUSB0 -b 115200
```

Adjust the baud rate to match your device.

## Permissions

If you get a permission denied error:
```bash
# Temporary fix
sudo chmod 666 /dev/ttyUSB0

# Permanent fix (requires re-login to take effect)
sudo usermod -aG dialout $USER
```

## Troubleshooting

**Device attaches in Windows but `/dev/ttyUSB*` doesn't appear in WSL:**
```bash
dmesg | grep -E "cp210x|ttyUSB|usb 1-1"
sudo modprobe cp210x
```

**Check kernel version (6.6.x Microsoft kernel confirmed working):**
```bash
uname -r
```