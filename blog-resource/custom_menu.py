#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Quicklaunch script
# Allow quick launching of chosen application and commands
#
# Navigation by arrows, keys Home/End or filter by case-insensitive words' beggining.
# Configured in ~/.custom_menu.ini that is automatically created. Pairs key / command are put into the default 'MENU' section or any other arbitrary sections that works as folders.
#
# We recommend setting a system shortcut like to `/home/$USER/custom_menu.py --gui`.
#
# PS:
#  * If command contains the percent character '%', you need to write it doubled.
#  * There might be some problems with arrows, curses might help http://stackoverflow.com/questions/292095/polling-the-keyboard-in-python
#
# --gui for basic GUI interface simulated via gnome-terminal application
#
# Example of use: custom_menu.py --gui
#
import os
import sys
import subprocess

if __name__ == "__main__":
    if "--gui" in sys.argv:        
        # however, its slightly quicker to directly launch the command than to launch it in the terminal
        subprocess.Popen("eval $(xdotool getmouselocation --shell); gnome-terminal --title=Quicklaunch -e " +
                         os.path.abspath(__file__)+" --hide-menubar --geometry=32x30+$X+$Y", shell=True)
        quit()


import configparser
import re
import select
import termios
import time
import tty
from pathlib import Path
from collections import namedtuple

INI_PATH = Path(Path.home(), '.custom_menu.ini')
DEFAULT_SECTION = "MENU"
GO_UP = " <<<"

Item = namedtuple('Item', ["text", "cmd"])


class Terminal:
    def getkey():
        """ read stdin input """
        old_settings = termios.tcgetattr(sys.stdin)
        tty.setraw(sys.stdin.fileno())
        select.select([sys.stdin], [], [], 0)
        answer = sys.stdin.read(1)
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        return answer

    def clear():
        """ clear screen """
        sys.stdout.write("\033c")


class CustomMenu:

    def _launch(self, item):
        if not item.cmd:  # this is the only section
            self.section = item.text if item.text != GO_UP else DEFAULT_SECTION
            self.query = ""
            self.caret['pos'] = 0
        else:  # launch
            Terminal.clear()
            print("Launching", item.text)
            # gnome-terminal title
            sys.stdout.write("\x1b]0;" + item.text + "\x07")
            cmd = item.cmd
            # start_new_session -> keep the process running after the main program ends now
            subprocess.Popen(cmd, shell=True, start_new_session=True)
            exit(0)  # exit immediately so that I can keep writing

    def _parseInput(self):
        key = Terminal.getkey()
        if ord(key) == 27:  # escape sequence
            # I cant distinguish pure Esc from ie arrows
            if self.section != DEFAULT_SECTION:  # if I wrote an arrow before, another two chars are automatically waiting
                print("Hit escape for exit section...")
            else:
                print("Hit escape for exit...")
            key = Terminal.getkey()
            if ord(key) == 27:  # double escape
                if self.section != DEFAULT_SECTION:
                    self.section = DEFAULT_SECTION
                    return
                exit()
            elif ord(key) == 91:  # any arrow
                key = Terminal.getkey()
                if ord(key) == 65:  # arrow up
                    self.caret['pos'] -= 1
                if ord(key) == 66:  # arrow down
                    self.caret['pos'] += 1
            elif ord(key) == 79:  # home/end
                key = Terminal.getkey()
                if ord(key) == 72:  # home
                    self.caret['pos'] = 0
                if ord(key) == 70:  # end
                    self.caret['pos'] = len(self.menu) - 1
            else:
                print("nothing")
        elif (key == '\x08' or key == '\x7f'):  # backspace
            self.caret['pos'] = -1
            self.query = self.query[:-1]
        elif (ord(key) == 13):  # enter launches command at caret
            self._launch(self.menu[self.caret['pos']])
        elif (key == '\x03' or key == '\x04'):  # interrupt  (unfortunately does not work)
            exit()
        elif (49 <= ord(key) <= 57):  # launch command at line number 1-9
            self.query = self.menu[ord(key)-49].text
        else:
            self.caret['pos'] = -1
            self.query += key

    def _loopOption(self, section, option, cmd):
        if option == self.query:  # complete correspondece between the option and the command, nothing to be solved
            self.menu = [Item(option, cmd)]
            return True
        if self.query == "" and section != self.section:
            return

        offset = 0
        for s in self.query.split(" "):
            search = re.search(r"((^|:|\s|\())"+s, option[offset:])
            if search is None:
                return
            else:  # strip the word so that "s r" matches "service restart" and not "reset screen"
                offset = search.span()[1] - 1

        self.menu.append(Item(option, cmd))  # add to options
        # caret was at this position. If selection narrowed, we'd now where to replace it.
        if option == self.caret['text']:
            self.caret['altPos'] = len(self.menu)-1

    def _loop(self):
        while 1:
            Terminal.clear()
            print("\x1B[3m" + (self.query if self.query else " ** " + (self.section if self.section !=
                  DEFAULT_SECTION else "Command") + " **") + "\x1B[23m")  # command written in italic
            self.menu = []  # possible user commands
            # possible caret placement – at the beginning
            self.caret['altPos'] = 0

            # choose sections for menu
            if self.section == DEFAULT_SECTION:
                if not self.query:
                    for section in self.config.sections():
                        if self.section != section:  # omit default section
                            self.menu.append(Item(section, None))
                sections = self.config.sections()
            else:
                sections = [self.section]

            # build menu from section
            for section in sections:
                for (option, cmd) in self.config.items(section):
                    if self._loopOption(section, option, cmd) is True:
                        break

            # append "go section up" navigation
            count = len(self.menu)
            if self.section != DEFAULT_SECTION and not self.query:
                self.menu.append(Item(GO_UP, None))

            # treat caret deviation
            if self.caret['pos'] < 0 or self.caret['pos'] > len(self.menu)-1:
                # place caret to the beginning/end of list
                self.caret['pos'] = self.caret['altPos']

            # print menu
            for i, item in enumerate(self.menu):
                s = '\033[0m'
                if not item.cmd:  # section
                    s += '\033[94m'
                if i == self.caret['pos']:  # caret is at the position
                    self.caret['text'] = item.text
                    s += '\033[1m'  # bold

                s += item.text
                print(s)

            # evaluate chosen option
            if count == 1:  # only 1 option left
                self._launch(self.menu[0])
            else:
                if count < 1:
                    print('\033[0m[nothing]')
                self._parseInput()

    def _create_config_file(self):
        if input(f"Create config file at {INI_PATH}? [Y/n]").lower() in ("y", ""):
            s = f"""[MENU]
hello world=notify-send 'hello world'
            
[preferences]
control panel display=gnome-control-center display
control panel sound=gnome-control-center sound
control panel region=gnome-control-center region

[config files]
edit custom menu options=kate {INI_PATH}
edit bashrc=kate ~/$USER/.bashrc"""
            INI_PATH.write_text(s)

    def __init__(self):
        if not INI_PATH.exists():
            self._create_config_file()

        self.section = DEFAULT_SECTION
        self.query = ""  # user command
        self.caret = {'pos': 0, 'altPos': 0, 'text': ""}  # caret position
        self.config = configparser.ConfigParser()
        self.config.read(INI_PATH)

        self._loop()


if __name__ == "__main__":
    if "--gui" not in sys.argv:
        CustomMenu()
