import {WebView} from 'ui/web-view';
import {topmost} from 'ui/frame';
import {Image} from 'ui/image';
import {fromBase64, ImageSource, fromFile} from 'image-source';
var webViewInterface = require('nativescript-webview-interface');

/**
 * Response format for createImage and setImage api.
 */
interface CanvasResponse{
    image: ImageSource; 
    data: any;
}

/**
 * Class to handle canvas data communication betweeen native app and webView.
 */
export class NativescriptCanvasInterface {
    
    /**
     * WebViewInterface instance, which handles bi-directional communication between
     * native and webView.
     */
    private _webViewInterface;
    
    /**
     * Creates unique instance of nativescript canvas interface per canvas.
     * 
     * @param   {WebView}   webView - Instance of nativescript web-view which contains canvas element.
     * @param   {string}    canvasId - "id" field of canvas element in web-view.  
     */
    constructor(public webView: WebView, public canvasId: string) {
        this._webViewInterface = new webViewInterface.WebViewInterface(this.webView);
    }
    
    /**
     * Returns instance of WebViewinterface class, registered with the web-view. 
     */
    get webViewInterface() {
        return this._webViewInterface;
    }
    
    /**
     * Returns instance of Nativescript Image, by executing specified function in web-view.  
     * 
     * @param   {string}    functionName - Function to be executed in web-view, to create image from canvas.
     * @param   {any[]}     args - Any extra argument to pass to function in web-view.
     * @param   {string}    format - Expected image format from canvas in web-view. (jpeg|png)
     * @returns {Promise<image: Image, data: any>} Returns promise with nativescript Image view and any data returned from the function in web-view.
     */
    createImage(functionName: string, args?: any[], format: string = 'png'): Promise<CanvasResponse>{
        return this._callJSFunction('NSCanvasInterface._createImage', [this.canvasId, functionName, format, args]);
    }
    
    /**
     * Sends base64 encoded image to web-view after converting it from Image|ImageSource|Image Path.
     * 
     * @param   {string}    functionName - Function to be executed in web-view, to handle the image sent.
     * @param   {Image|ImageSource|string}  image - Image to sent to web-view.
     * @param   {any[]}     args - Any extra argument to pass to function in web-view.
     * @param   {string}    format - Format in which we want to send the image in web-view. (jpeg|png)
     * @returns {Promise<{data: any}>}  Returns promise with any data returned from the function in web-view. 
     */
    setImage(functionName: string, image: Image | ImageSource | string, args?: any[], format: string = 'png'): Promise<CanvasResponse>{
        var retnPromise;
        var {imageSource, format} = this._resolveImageSourceAndFormat(image, format);

        if (!imageSource) {
            return Promise.reject('Please provide Image, ImageSource object or Valid Image Path');
        }
        
        var base64ImageStr = this._getBase64StrFromImageSource(imageSource, format);
        return this._callJSFunction('NSCanvasInterface._setImage', [this.canvasId, functionName, base64ImageStr].concat(args || []));
    }
    
    /**
     * Returns instance of ImageSource and format based on the parameters passed.
     * 
     * @private
     */
    _resolveImageSourceAndFormat(image: Image | ImageSource | string, format?: string) {
        var imageSource;

        if (image && typeof image === 'string' && image.trim().length > 0) {
            imageSource = fromFile(image);
            format = format || <string>image.substring(image.lastIndexOf('.') + 1, image.length);
        }

        if (typeof image === 'object') {
            if (image instanceof Image) {
                imageSource = image.imageSource;
            }
            if (image instanceof ImageSource) {
                imageSource = image;
            }
        }
        return { imageSource, format };
    }
    
    /**
     * Calls the specified JS function in web-view using webViewInterface instance.
     * 
     * @private
     */
    _callJSFunction(functionName: string, args: any[]) {
        return new Promise((resolve, reject) => {
            this.webViewInterface.callJSFunction(functionName, args, (response: { _strImage: string, data: any }) => {
                var result;
                if (response) {
                    result = {
                        image: response._strImage ? this._getImageSourceFromBase64Str(response._strImage) : null,
                        data: response.data || null
                    }
                }
                resolve(result);
            }, (error) => {
                reject(error);
            });
        });
    }
    
    /**
     * Encodes ImageSource instance to base64 encoded image string, in the 
     * specified format, to send it to web-view.
     * 
     * @private
     */
    _getBase64StrFromImageSource(imageSource: ImageSource, format?: string){
        var base64ImageStr;
        if (format === 'jpeg' || format === 'jpg') {
            base64ImageStr = 'data:image/jpeg;base64,' + imageSource.toBase64String('jpeg');
        } else {
            base64ImageStr = 'data:image/png;base64,' + imageSource.toBase64String('png');
        }
        return base64ImageStr;
    }
    
    /**
     * Converts base64 encoded image string coming from web-view to ImageSource instance and returns it.
     * 
     * @private
     */
    _getImageSourceFromBase64Str(base64ImageStr) {
        var str = base64ImageStr.split(",")[1];
        return fromBase64(str);
    }
}