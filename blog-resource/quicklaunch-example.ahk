#NoTrayIcon
#SingleInstance force

LaunchDir := "c:\Users\ja_robot\AppData\Roaming\Microsoft\Internet Explorer\Quick Launch\numpad\"
VarQuickLaunch:= "" ; default variable window for Win+Ctrl+Numpad0

;VarQuickLaunch - quicklaunch for a variable window
^#Numpad0::WinGetTitle, VarQuickLaunch, A
  return
#Numpad0::ToggleWindow(VarQuickLaunch,"Tip",VarQuickLaunch . "nenalezeno")

;********************
;Numpad programs
;********************                                                           

;browsers
  #Numpad1::ToggleWindow("Mozilla Firefox","Run","h:\QuickLaunch\firefox.lnk")  
  ^#Numpad1::ToggleWindow("Firebug","Tip","Firebug not found")
  #Numpad2::ToggleWindow("Opera","Run","h:\Programy\operausb1151int\opera.exe")
  ^#Numpad2::ToggleWindow("IrfanView","Run",LaunchDir . "i_view32 - Shortcut.lnk")
  #Numpad3::ToggleWindow("Google Chrome","Run","GoogleChromePortableOld\GoogleChromePortable.exe")
  ^#Numpad3::ToggleWindow("Internet Explorer","Run","iexplore.exe")

;programs
  #Numpad4::ToggleWindow("Total Commander","Run","Programy\totalcmd\TOTALCMD.EXE")
  ^#Numpad4::ToggleWindow("NetBeans","Run","h:\QuickLaunch\netbeans - Shortcut.lnk")
  #Numpad5::ToggleWindow("PSPad","Run","Programy\pspad\PSPad.exe")
  #Numpad6::ToggleWindow("Lexicon","Run","h:\QuickLaunch\lexicon.lnk")  
  #Numpad9::ToggleWindow("Process Explorer","Run","h:\Programy\procexp\procexp.exe")
  
;multimedia
  ^#Numpad7::ToggleWindow("VLC media player","Run","h:\QuickLaunch\VLCPortable - Shortcut.lnk" )  
  ^#Numpad8::ToggleWindow("Audacity","Run","h:\QuickLaunch\audacity - Shortcut.lnk" )
  ^#Numpad9::ToggleWindow("Avidemux","Run","h:\QuickLaunch\avidemux.lnk" )
  ^#Numpad5::ToggleWindow("CS 5","Run","h:\QuickLaunch\cs.lnk" )


;*************
;Dalsi klavesy
;*************


CapsLock::RAlt 

!#NumpadAdd::
WinSet, AlwaysOnTop, toggle, A
return

;**************
;Run or raise function
;**************
ToggleWindow(name,action,command) {
SetTitleMatchMode 2
DetectHiddenWindows, off
IfWinExist, %name%
 {
 WinActivateBottom, %name%
 }
else {
 DetectHiddenWindows, on
 IfWinExist, %name%
  {
  WinMinimize
  WinShow
  WinActivate
  }
  else
 	{
	if (action == "Run")
	 {
		Tip(name, command)
		Run %command%
	 }
	if (action == "Send")
		{
		str = %name%`n%command%
		Tip(str)
		Send %command%
		}
   if (action == "Tip") {
	str = %name%`n%command%
		Tip(str)
	}
	if (action == "Func")
		{
		str = (%name%`n%command%)
		Tip(str)
		%command%(name)
		}
	 }
}
return
}

;*********************
; Common functions
;*********************

Tip(sText, sTitle = "Note:", seconds = 2) {
    ToolTip, %sTitle%`n%sText%
    seconds = % 1000 * seconds 
    SetTimer, RemoveToolTip, %seconds%
    
    return
    RemoveToolTip:
      SetTimer, RemoveToolTip, Off
      ToolTip
      return 
}   
