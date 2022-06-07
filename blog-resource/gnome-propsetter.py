#!/usr/bin/env python3
import argparse, pickle, subprocess, sys
from os.path import isfile
__doc__ = """
Set some GNOME3 properties.

Actural config is stored in /tmp/gnome-propsetter.tmp .


XX hardware brightness
* sudo chmod o+w /sys/class/backlight/intel_backlight/brightness
"""

# "Internal Property name" : (gsettings path, gsettings key name, default value)
properties= {"magnifier":("org.gnome.desktop.a11y.magnifier", "mag-factor", 1), 
             "brightness-red":("org.gnome.desktop.a11y.magnifier", "brightness-red", 0),
             "brightness-green":("org.gnome.desktop.a11y.magnifier", "brightness-green", 0), 
             "brightness-blue":("org.gnome.desktop.a11y.magnifier", "brightness-blue", 0)}

               
def get(key, val=None, inc=None, write=False):
    """ property getter/setter 
    
    write – If True, directly call gsettings and change in the system.
    
    """    
    o = list(properties.keys()).index(key)
    if val is not None:
        settings[o] = val        
    elif inc is not None:        
        settings[o] += inc
    else: # getter
        return settings[o]
    
    if write:        
        gsettings(key)

def gsettings(property_name):
    """ write to gsettings """       
    path, key, default = properties[property_name]        
    subprocess.Popen(["gsettings","set", path, key, str(get(property_name))])


if __name__ == '__main__':
    # parse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('-f','--file', help='Tmp file used for storing the properties', default="/tmp/gnome-propsetter.tmp")    
    subparsers = parser.add_subparsers(title='Implemented properties', dest="property")
    magP = subparsers.add_parser('magnifier', help='Magnifier')
    
    brightnessP = subparsers.add_parser('brightness', help='Set brightness level common for RGB or each colour separately')
    brightnessP.add_argument('-r','--red', help='red',  action='store_true')
    brightnessP.add_argument('-g','--green',  action='store_true')
    brightnessP.add_argument('-b','--blue',  action='store_true')
    
    parser.add_argument('---','---', dest="_", action='store_true')
    parser.add_argument('-l','--level', help='Set value level to (float)', type=float)
    parser.add_argument('-s','--step', default=0.15, type=float, help='Step for in/out')
    parser.add_argument('-i','--in', dest='var_in', help='in', action='store_true')
    parser.add_argument('-o','--out', dest='var_out', help='out', action='store_true')
    parser.add_argument('-v','--verbose', action='store_true')
    parser.add_argument('-t','--toggle', help="Toggles between listed values. At the end, place three dashes. Ex: gnome-propsetter.py -v -t 1 5 -.6 --- brightness", nargs="+")
    
    
    
    args = parser.parse_args()                
                    
    # load settings from last time
    filename = "/tmp/gnome-propsetter.tmp"
    mode = "rb+" if isfile(args.file) else "wb"
    file_descriptor = open(args.file, mode)
    try:        
        settings = pickle.load(file_descriptor)                
        if len(settings) < len(properties):
            raise                
    except:
        settings = [1] * len(properties)
        print("Created fresh settings")
    if args.verbose:
        print(args)
        print("Properties:", [x for x in properties.keys()])
        print("Initial settings:", settings)
            
     # properties to be changed
    props = [args.property]        
    if args.property == "brightness":
        props = []
        if args.red:    
            props.append("brightness-red")
        if args.green:
            props.append("brightness-green")
        if args.blue:
            props.append("brightness-blue")
        if not props:
            props = ["brightness-red", "brightness-green", "brightness-blue"]            
        
    # determine number value property
    for p in props:            
        if args.toggle: # get the next value amongst listed
            catched = False
            for val in args.toggle:
                if catched:
                    get(p, float(val))
                    break
                if float(get(p)) == float(val):
                    catched = True                    
            else: # use the first
                get(p, float(args.toggle[0]))
        elif args.var_in:
            get(p, inc=args.step)
        elif args.var_out:
            get(p, inc=-args.step)            
        elif args.level:
            get(p, args.level)
        else:        
            get(p, properties[p][2])
        
        
    # check value within range
    if args.property == "magnifier":
        if get("magnifier") < 1:
            get("magnifier", 1)  
        
    # save value property    
    for p in props:
        gsettings(p)    
                                        
                                        
    # save to file for next time
    file_descriptor.seek(0)
    if args.verbose:
        print("Stored settings:", settings)
    pickle.dump(settings, file_descriptor)
    file_descriptor.truncate() 
    file_descriptor.close()
