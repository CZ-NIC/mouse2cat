#!/usr/bin/python3
#
# mount_dir.py path
#
# Why this file?
# FUSE systems unmounting (ex: google-ocamulfuse) with "umount" didn't work without sudo for unknown reason. (We can mount them without sudo.)
#
# Mount and unmounts a dir. Does not crash when SMB asks for a password.
import os
import re
import subprocess
import sys

sftp_chroot = "/mnt"  # to what dir is set chroot in case we are using SFTP to access dirs with hang risk. In that case, Krusader does not send sftp://localhost:22/gdrive, but only "/gdrive". Lets try to find it under chroot, "/mnt/gdrive"

# make current path to the fstab form
path = sys.argv[1]

# in the `index` directory, there are symlinks to special places in the remote share
path = path.replace("/mnt/index/", "/mnt/")  # /mnt/index/example -> /mnt/example

# Check if we are inside the mounted dir
inside = False
if not os.path.exists(path) and os.path.exists(sftp_chroot + path):
    path = sftp_chroot + path
if path[-2:] == "..":  # /mnt/example/.. -> /mnt/example/
    path = path[:-2]
    inside = True

try:
    mounted = os.listdir(path) == []
except OSError:  # OSError: Transport endpoint is not connected (SSHFS fell down)
    mounted = False

if mounted:  # dir is empty -> try to mount from fstab
    subprocess.call("notify-send mount " + path, shell=True)
    subprocess.call("mount " + path + " & gnome-terminal -x bash -c 'mount '" + path, shell=True)
else:  # dir is not empty -> try to unmount
    if inside:  # we are in the dir -> it cannot be unmounted
        subprocess.call("notify-send 'leave dir' 'leave dir before unmount " + path + "'", shell=True)
        print("Can't unmount because we're in the dir" + path)
    else:
        subprocess.call("notify-send umount " + path, shell=True)
        subprocess.call("umount " + path + " & fusermount -u " + path, shell=True)
