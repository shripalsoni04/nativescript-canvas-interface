# Nativescript-Canvas-Interface
Nativescript Plugin to perform image manipulation using web-view canvas for Android/iOS. 

## Installation
From the terminal, go to your app's root folder and execute:
```
tns plugin add nativescript-canvas-interface
```

Once the plugin is installed, you need to copy plugin files for webView, into your webView content folder.
e.g.
```
cp -r node_modules/nativescript-canvas-interface/www/ app/www/lib/
```
## Usage
For a quick start, you can check this [Demo App](https://github.com/shripalsoni04/nativescript-canvas-interface-demo) and [Blog Post](http://shripalsoni.com/blog/nativescript-cross-platform-image-manipulation/)

### Inside Native App

Insert a `web-view` somewhere in your page. You can keep it hidden, if you don't want to show the image in web-view.
```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd" loaded="pageLoaded">
....
<web-view id="webView" src="~/www/index.html" visibility="collapse"></web-view>

<!-- Native Image View on which image manipulation is performed -->
<Image id="img" src="~/road-nature.jpg"/> 
....
</Page>
```

Initialize Canvas Interface Plugin in your javascript file.

```javascript
var nsCanvasInterfaceModule = require('nativescript-canvas-interface');
var oNSCanvasInterface;
var imageView;

function pageLoaded(args){
    page = args.object;
    var webView = page.getViewById('webView');
    imageView = page.getViewById('img');
    initCanvasInterface(webView); 
}

function initCanvasInterface(webView: WebView) {
    oNSCanvasInterface = new nsCanvasInterfaceModule.NativescriptCanvasInterface(webView, 'canvasEle'); // 'canvasEle' is the value of "id" attribute of the canvas element in web-view
}
```

Use any [API Method](#native-app-api) of `NativescriptCanvasInterface` Class
```javascript
function setCanvasImage(){
    oNSCanvasInterface.setImage('setCanvasImage', imageView, args).then(function(result){
        // result.data contains any value returned from setCanvasImage function in web-view
    });
}

function createImage(){
    oNSCanvasInterface.createImage('setBrightness', args).then(function(result) {
        imageView.imageSource = result.image;
    });
}
```

If you want to set/create image on load of the page, you need to call all such code once webView is loaded
```javascript
webView.on('loadFinished', (args) => {
    if (!args.error) {
        // call setImage/createImage
    }
});
```

### Inside WebView

Import `nativescript-webview-interface.js`, `nativescript-canvas-interface.js` and `es6-promise.min.js` in your html page from the folder
where you copied www files during installation. <br/>
Add canvas element and give it an id.
```html
<html>
    <head></head>
    <body>
        <canvas id="canvasEle"></canvas>
        <script src="path/to/es6-promise.min.js"></script>
        <script src="path/to/nativescript-webview-interface.js"></script>
        <script src="path/to/nativescript-canvas-interface.js"></script>
        <script src="path/to/your-custom-script.js"></script>        
    </body>
</html>
```

Now, create instance of `NSCanvasInterface` using canvas element. Once the instance is created, we need to register the functions which will
handle requests from native app. 
```javascript
function init() {
    var canvasEle = document.getElementById('canvasEle');
    var oCanvasInterface = new window.NSCanvasInterface(canvasEle);
    registerNSCanvasReqHandlers(oCanvasInterface);    
}

function registerNSCanvasReqHandlers(oCanvasInterface) {
    oCanvasInterface.canvasReqHandlers = {
        setCanvasImage: setCanvasImage,
        setBrightness: setBrightness
    };
}
 
function setCanvasImage(canvas, ctx, image){
    // set image to canvas or do anything you want.
    ctx.drawImage(image, 0, 0, 100, 100);
}

/**
 * Return promise or value or nothing. 
 * Once the promise is reslved or value is returned, the plugin will create an image 
 * from canvas context and pass it to native app.
 */ 
function setBrightness(canvas, ctx, value){
    return Promise(function(resolve, reject){
        // do image manipulation on canvas
        resolve();   
    });
}   
 
init();

```

## API

### Native App API

*Constructor*

#### NativescriptCanvasInterface(webView: WebView, canvasId: String)
We need to create a new instance per web-view canvas element.

##### Parameters
**webView**: Nativescript web-view element.<br/>
**canvasId**: Value of "id" attribute of web-view canvas element.<br/>

*Methods*

#### setImage(functionName: string, image: Image | ImageSource | string, args?: any[], format: string = 'png'): Promise<{data: any}>
Call this method to send image from native app to web-view. The image is automatically converted 
from nativescript ImageView/ImageSource/imagePath to HTML Image element, and that HTML Image is served to the 
registered function in web-view.

##### Parameters
**functionName**: Registered name of the function in web-view, to handle the image sent.<br/>
**image**: Image to send to web-view. Image can be a Nativescript ImageView or ImageSource or a valid Image Path.<br/> 
**args**: (Optional) Any extra argument to pass to function in web-view.<br/>
**format**: (Optional) Format in which we want to send the image to web-view. Possible formats are *jpeg* or *png*. Default value is *png*.<br/>
**returns**:  Promise with any data returned from the function in web-view.<br/>

#### createImage(functionName: string, args?: any[], format: string = 'png'): Promise<{image: ImageSource, data: any}>
Call this method to execute function in web-view, which performs canvas manipulation, and get the manipulated image back.

##### Parameters
**functionName**: Function to be executed in web-view, to create image from canvas.<br/>
**args**: Any extra argument to pass to function in web-view.<br/>
**format**: Expected image format from canvas in web-view. Possible formats are *jpeg* or *png*. Default value is *png*.<br/>
**returns**: Promise with nativescript ImageSource and any data returned from the function in web-view.<br/>

### WebView API (window.NSCanvasInterface Class)

*Constructor*

#### NSCanvasInterface(canvas: HTMLCanvasElement)
Create new instance per canvas element.

*Property*

#### canvasReqHandlers: { [fnName: string]: (...args) => Promise<any> | any }
Register all the functions which handles requests from native app for canvas manipulation.

##### Signature of function which handles setImage API call from native app.
```javascript
function setCanvasImage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement, ...arg: any[]){
    // return nothing or some value or promise
}
```

##### Signature of function which handles createImage API call from native app.
```javascript
function doSomeCanvasManip(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, ...arg: any[]){
    // return nothing or some value or promise
}
```
