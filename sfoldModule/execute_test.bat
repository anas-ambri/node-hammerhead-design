
ECHO OFF
REM Set this path to the local path
set node_path="C:\Program Files\nodejs\"
set node_path=%node_path%node.exe
ECHO ON

%node_path% test.js localhost
PAUSE