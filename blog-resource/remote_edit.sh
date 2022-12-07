#!/bin/bash
# You want to edit a remote file (ex: seen in Krusader, mounted by sshfs by a non-privileged remote user) but you would have to sudo before.
# This program asks you for password, copy the file to remote temp, to local temp, opens kate for you, uploads back to remote temp, to the original location and restores chmod and chown.
#
# In Krusader, you may want to add a useraction: `gnome-terminal -- /PATH/remote_edit.sh %aCurrent%`
# 
# This script is not efficient, it creates a ssh connection many times for a simple thing.
# But it uploads the data back to the file and sets it the same metadata and I could not imagine a cleaner way that would not need an installation requirements on the server machine.
#
# Warning: Possible security issue, if hacker has access to your remote user account (but not yet your sudo password),
# they might lurk and interchange data being uploaded back to the remote server.
#
# Possible to-do:
# XX If the password is wrong, we might have known earlier.
# XX Make possible clean-up. If kate gets closed, delete all local temp files? Or shut down the inotifywait process?
# XX handle absolute symlinks /mnt/otrs/etc/apache2/sites-enabled/zzz_otrs.conf -> /opt/otrs/scripts/apache2-httpd.include.conf (should be /mnt/otrs/opt...)


# get the server name according to the program argument and fstab
ABSOLUTE_PATH=`readlink -f "$1"`  # resolve any symlinks on the path, we need `/mnt/server/path` while `server` is in the fstab
FSTAB=$(cat /etc/fstab | grep -e "$(echo $ABSOLUTE_PATH | cut -d "/" -f3)\s" | cut -d$'\t' -f1 ) # john@depo:/var/ (user@server-from-config:/starting-path

SERVER=$(echo $FSTAB | cut -d: -f1)
REMOTE_PATH=$(echo $FSTAB | cut -d: -f2)$(echo $ABSOLUTE_PATH | cut -d "/" -f4-) # starting-dir from fstab /var + relative cwd /mnt/depo/log
TEMP_DIR=/tmp/remote_edit_files
mkdir -p $TEMP_DIR


# create new file but add number if filename already exists
get_unique_file_name() {   
    name=$1
    if [[ -e $name || -L $name ]] ; then
        i=2        
        while [[ -e $name-$i || -L $name-$i ]] ; do
            let i++
        done
        name=$name-$i
    fi        
    touch -- "$name"    
    echo $name
}
generate_random_string() {
    echo $(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
}


TEMP_FILE=$(get_unique_file_name $TEMP_DIR/$(basename $1))  # unique name of the local TEMP_FILE
REMOTE_TEMP=/tmp/$(basename $TEMP_FILE)-$(generate_random_string) # XXX multiple files on a same machine. Maybe REMOTE_TEMP is not needed at all. Notably outside docker.

echo "Editing as remote root: $REMOTE_PATH"

# launch remote command as sudo (and do not bother with typing password if needed)
# you can run single command only
remote_command () {
    CMD=$1
    if [ -z "$PASSWORD" ]; then    
        ssh $SERVER sudo -u root $CMD
    else                           
        echo $PASSWORD | ssh $SERVER sudo -S -u root $CMD 2>/dev/null # 2>>/tmp/log
    fi
}

remote_permission_up () {
    remote_command "chmod $ORIGINAL_UMASK $REMOTE_TEMP"
    remote_command "chown $ORIGNAL_GROUP $REMOTE_TEMP"
}

remote_permission_down () {
    printf "Remote temp: chmod ... "
    remote_command "chmod 600 $REMOTE_TEMP"
    echo "chown ..."
    remote_command "chown $WHOAMI $REMOTE_TEMP"
}

# copy the file to remote temp and check if we need a password
if echo $(ssh $SERVER "sudo cp $REMOTE_PATH $REMOTE_TEMP" 2>&1) | grep -q "sudo: no tty present\|sudo: a terminal is required to read the password"; then
 # we need to have remote sudo password, implicit sudo didn't work
 echo -n "Remote $SERVER sudo password: "
 read -s PASSWORD 
 printf "..." 
 remote_command "cp $REMOTE_PATH $REMOTE_TEMP"  
fi
printf " fetching remote user ... "
WHOAMI=$(ssh $SERVER echo \$\(whoami\)) 
echo "$WHOAMI ..."
remote_permission_down

# check original file attributes
printf "Checking umask ... "
ORIGINAL_UMASK=$(remote_command "stat --format '%a' $REMOTE_PATH")
printf "$ORIGINAL_UMASK ... group ... "
ORIGNAL_GROUP=$(remote_command "stat -c '%U:%G' $REMOTE_PATH")
echo "$ORIGNAL_GROUP"


# copy the file to local
echo "Copying to local temp..."
if ! scp $SERVER:$REMOTE_TEMP $TEMP_FILE; then
    echo "file not found (bad password? absolute symlink?)" > $TEMP_FILE  # XX when absolute symlinks implemented, change
fi
echo scp $SERVER:$REMOTE_TEMP $TEMP_FILE

# start local text file editor
#FILEMTIME_START=`stat -c %Y $TEMP_FILE`
#echo $FILEMTIME_START
#kate $TEMP_FILE --new &  # start in new instance so that process PID would not merge to another kate - that would mean the file editing undetectable exit
#PID=$!
#tail --pid=$PID -f /dev/null
#if [ "$FILEMTIME_START" != `stat -c %Y $TEMP_FILE` ]; then
#    # the file changed and has to be uploaded back
#    scp $TEMP_FILE $SERVER:$REMOTE_TEMP
#
#    # upload the file back to server    
#    remote_command "chmod $ORIGINAL_UMASK $REMOTE_TEMP"
#    remote_command "chown $ORIGNAL_GROUP $REMOTE_TEMP"
#    echo "copying back"
#    remote_command "cp -rf $REMOTE_TEMP $REMOTE_PATH"    
#    #remote_command "chmod $ORIGINAL_UMASK $REMOTE_PATH"
#    #remote_command "chown $ORIGNAL_GROUP $REMOTE_PATH"
#else
#    echo "File not changed."
#fi


# start local text file editor
nohup kate $TEMP_FILE & disown # for some reason, if nohup is missing, Kate gets closed (if not running before) with the script exit and if disown is missing, Kate remains open but inotifywait process will not spawn (I do not know why)
remote_permission_up  # security conncerns: we do not let the file readable by remote unprivileged user longer than needed

upload_loop () {
    trap "" HUP  # continue running upload_loop even after the temporary terminal exits
    while inotifywait -e close_write $TEMP_FILE; do # this loop will break on file inode deletion or replace
        # the file changed and has to be uploaded back    
        remote_permission_down  
        scp $TEMP_FILE $SERVER:$REMOTE_TEMP
        # upload the file back to server    
        remote_permission_up
        echo "Copying back to privileged place"
        remote_command "cp -rf $REMOTE_TEMP $REMOTE_PATH"
        notify-send "Remote editing" "$SERVER:$REMOTE_PATH updated"
        # XX I would like to break the loop if kate exits too (just to have the option, because that would be more secure than letting inotifywait hang indefinetely)
    done
}
upload_loop &
#trap "" HUP # when not present
sleep 1  # when not present, upload_loop sometimes(!) does not have time to initialize (probably) and inotifywait will not spawn
