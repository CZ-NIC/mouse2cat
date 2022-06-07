#!/usr/bin/env python3
import json
import subprocess
import sys
from os.path import expanduser
from time import sleep

__doc__ = """Program remembers mouse position and clicks in the place consequently.

Usage:
  click_coordinates.py NUMBER [set]
"""

class ClickCoordinates:

    def __init__(self):
        """ load coordinates """
        self.filename = expanduser("~")+"/click_coordinates.tmp"
        try:
            with open(self.filename, "r") as f:
                self.positions = json.load(f)
        except:
            self.positions = {}

    def help():
        print(__doc__)

    def store(self,pos):
        cmd = """xdotool getmouselocation 2>/dev/null | sed 's/x:\([0-9]\+\)[ \t]y:\([0-9]\+\)[ \t].*/\\1 \\2/'"""
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)
        self.positions[pos] = p.communicate()[0].strip().decode("utf-8")
        with open(self.filename, "w") as f:
            json.dump(self.positions, f)

    def click(self,pos):
        sleep(0.01)  # since Ubuntu 17.10 we have to pause when invoking the cmd by Gnome Extension run-or-raise
        try:
            cmd = "xdotool mousemove " + self.positions[pos] + " click 1 mousemove restore"
        except KeyError:
            print("Position {} not set yet. See help.".format(pos))
            return
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)

if __name__ == '__main__':
    """ Parse cli args """
    try:
        cmd = sys.argv[1]
    except IndexError:
        cmd = ""
    finally:
        if cmd in ["", "--help", "-?", "-h"]:
            help()
            quit()

    if cmd.isdigit():
        if len(sys.argv) > 2 and sys.argv[2] == "set":
            ClickCoordinates().store(cmd)
        else:
            ClickCoordinates().click(cmd)
    else:
        print("Unknown command")
