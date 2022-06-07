#!/bin/bash

# Help
if [ "$1" == "-?" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "move-mouse.sh 1..9 [slower|faster]"
exit
fi

# Init
max_speed=60
min_speed=15
step=5

# Get velocity
if(( $((`bc<<<"\`date +%s.%N\` * 1000/1"` - `bc<<<"\`date -r /tmp/pointer +%s.%N\` * 1000/1"`)) > 500)); then
    # if older than 500 ms, it gets defaulted
    if [ "$2" == "faster" ]; then
            x=$(($max_speed-5*$step))
        elif [ "$2" == "slower" ]; then
            x=2
        fi
    else # load from last time
        read -d $'\x04' x < "/tmp/pointer";
#echo $x "jo"
fi


# Change mouse velocity
if [ "$2" == "faster" ]; then
     if (( x > max_speed+step)); then x=$(($x-step)); elif (( x < max_speed)); then x=$(($x+5)); elif (( x < min_speed)); then x=min_speed; fi;
fi
if [ "$2" == "slower" ]; then
    if (( x < min_speed-step)); then x=$(($x+step)); elif (( x > min_speed)); then x=$(($x-5)); elif (( x > max_speed)); then x=max_speed; fi;
fi
echo $x > /tmp/pointer;

# Move pointer

#echo $x $1  # speed direction

if [ "$1" == "1" ]; then xdotool mousemove_relative --sync -- -$x $x; 
elif [ "$1" == "2" ]; then xdotool mousemove_relative --sync 0 $x; 
elif [ "$1" == "3" ]; then xdotool mousemove_relative --sync $x $x;
elif [ "$1" == "4" ]; then xdotool mousemove_relative --sync -- -$x 0;
elif [ "$1" == "6" ]; then xdotool mousemove_relative --sync $x 0;
elif [ "$1" == "7" ]; then xdotool mousemove_relative --sync -- -$x -$x;
elif [ "$1" == "8" ]; then xdotool mousemove_relative --sync -- 0 -$x;
elif [ "$1" == "9" ]; then xdotool mousemove_relative --sync -- $x -$x;
elif [ "$1" == "5" ]; then echo "not defined yet"; fi
