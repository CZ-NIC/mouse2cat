# Add this to your .bashrc.
# Make folder /mnt/server1 . When this folder is mounted to the server1, starting terminal there will start it on the remote server.
# Example: Starting terminal at /mnt/depo/var/www/html/ will get you at depo:/var/www/html/ , not at localhost:/mnt/depo/var/www/html/
# Requirement: https://github.com/CZ-NIC/pz installable by `pip install pz` (because I don't like parsing complex strings in bash).

# If we are in the a folder in /mnt, open terminal directly on the remote server.
# (If the user has no access, try to sudo there.)
if [ "$(pwd | cut -d "/" -f2)" == "mnt" ]; then    
    # dir /mnt/depo/var
    # get server from fstab
    SERVER=$(realpath . | pz 's = s.split("/")[2:]; s = s[1] if s[0] == "index" else s[0]') # pip3 install pz
    FSTAB=$(cat /etc/fstab  | grep -e "/mnt/$SERVER\s" | cut -d$'\t' -f1 ) # user@depo:/var/ (user@server-from-config:/starting-path
    DIR=$(echo $FSTAB | cut -d: -f2)$(realpath . | cut -d "/" -f4-) # starting-dir from fstab /var + relative cwd /mnt/depo/log
        
    
    ssh "$(echo $FSTAB | cut -d: -f1)" -t "cd $DIR ; if ! [[ -r \"$DIR\" ]] ; then sudo su -c 'cd $DIR ; bash'; fi; bash" ;
    # ssh depo                         -t "cd /var/log;   if ! [[ -r "/var/log" ]] can't we read /var?    ; then sudo su -c 'cd /var/log'; bash; fi; bash
    
    unset SERVER
    unset FSTAB
    unset DIR
fi
