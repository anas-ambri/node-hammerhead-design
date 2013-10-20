
ECHO OFF

REM Set this path to the local path

set node_path="C:\Program Files\nodejs\"
set node_path=%node_path%node.exe
ECHO ON

%node_path% C:\Users\zhadowoflight\Desktop\Studies\COEN_7\RIBOSOFT\Repo\HammerTime\src\node_modules\algorithm\test.js localhost
PAUSE