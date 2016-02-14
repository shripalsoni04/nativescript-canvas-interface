/**
 * This postinstall hook copies nativescript-webview-interface.js from 
 * nativescirpt-webview-interface plugin's www directory to nativescript-canvas-inteface
 * plugin's www directory.
 */
var fs = require('fs');
var path = require('path');
var webViewInterfacePath1 = path.join('node_modules', 'nativescript-webview-interface', 'www');
var webViewInterfacePath2 = path.join('..', 'nativescript-webview-interface', 'www');
var webViewInterfaceFileName = 'nativescript-webview-interface.js';
var destFilePath = path.join('./','www', webViewInterfaceFileName);

var isPath1Exists = fs.existsSync(webViewInterfacePath1);
var fileToCopy = path.join(isPath1Exists ? webViewInterfacePath1 : webViewInterfacePath2, webViewInterfaceFileName);   
fs.createReadStream(fileToCopy).pipe(fs.createWriteStream(destFilePath));


