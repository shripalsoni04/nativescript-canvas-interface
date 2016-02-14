/**
 * A class to handle canvas image transfer from web-view to native app
 */
class NSCanvasInterface {
    
    /**
     * A map of functionName (a name used to call from native app), and the function handler
     */
    canvasReqHandlers: { [fnName: string]: (...args) => Promise<any> } = {};
	   
    /**
     * Creates new instance of NSCanvasInterface per canvas element.
     */
    constructor(public canvas: HTMLCanvasElement) {
        NSCanvasInterface._canvasInterfaceInstanceMap[canvas.id] = this;
    }
    
    /**
     * A map of canvasId and its NSCanvasInterface instance.
     * 
     * @private
     */
    static _canvasInterfaceInstanceMap: { [canvasId: string]: NSCanvasInterface } = {};
    
    /**
     * Returns NSCanvasInterface instance registered for a canvasId.
     * 
     * @private
     */
    static _getCanvasInstanceById(canvasId: string) {
        return NSCanvasInterface._canvasInterfaceInstanceMap[canvasId];
    }
    
    /**
     * Calls the registered canvas request handler with canvas and context as default parameters. Returns promise.
     * 
     * @private
     */
    static _callCanvasReqHandler(canvasId: string, functionName: string, args: any[]) : Promise<any>{
        var canvasReqHandler;
        var oNSCanvasInterface = NSCanvasInterface._getCanvasInstanceById(canvasId);

        if (!oNSCanvasInterface) {
            throw `No canvas interface instance found for canvas ${canvasId}`;
        }
        
        canvasReqHandler = oNSCanvasInterface.canvasReqHandlers[functionName];
        
        if (canvasReqHandler) {
            return new Promise(function(resolve, reject) {
                var canvas = oNSCanvasInterface.canvas;
                var context = canvas.getContext('2d');
                var retnValue = canvasReqHandler.apply(this, [canvas, context].concat(args));
                if (!retnValue) {
                    retnValue = Promise.resolve();
                } else {
                    if (!retnValue.then) {
                        retnValue = Promise.resolve(retnValue);
                    }
                }
                resolve(retnValue);
            })
        } else {
            throw `Function ${functionName} is not registered with canvas ${canvasId}`;
        }
    }
    
    /**
     * This function is called from plugin's native side code.
     * Coverts base64 encoded image, passed from native app, to HTML Image element and 
     * passes it to the specified function handler. 
     * 
     * @private
     * @param   {string}    canvasId - Value of "id" attribute of the canvas element in web-view.
     * @param   {string}    functionName - Registered name of handler, which sets passed image to canvas.
     * @param   {string}    base64IamgeStr - Base4 encoded image string passed from native app.
     * @param   {any[]}     args - Array of arguments to pass while calling canvas request handler.
     * @returns {Promise<any>}  Returns a promise with value returned by canvas request handler.       
     */
    static _setImage(canvasId: string, functionName: string, base64IamgeStr: string, args: any[]): Promise<any>{
        var image = new Image();
        return new Promise(function(resolve, reject) {
            image.onload = function() {
                try {
                    var retnPromise = NSCanvasInterface._callCanvasReqHandler(canvasId, functionName, [image].concat(args));
                    if (!retnPromise) {
                        throw 'Some Error Occurred while executing _callCanvasReqHandler';
                    }
                    retnPromise.then(function(retnValue) {
                        resolve(retnValue);
                    });
                } catch (e) {
                    reject(e);
                }
            };
            image.src = base64IamgeStr;
        });
    }
    
    /**
     * This function is called from plugin's native side code.
     * Executes the specified function with the passed arguments and generates 
     * base64 encoded image from the canvas context.
     * 
     * @private
     * @param   {string}    canvasId - Value of "id" attribute of the canvas element in web-view.
     * @param   {string}    functionName - Registered name of handler, which preforms canvas manipulation and creates image.
     * @param   {string}    imgFormat - Expected output format of the image.
     * @param   {any[]}     args - Array of arguments to pass while calling canvas request handler.
     * @returns {Promise<<{_strImage: string, data: any}>} Returns promise with base64 encoded image string and any data returned from the canvas request handler..
     */
    static _createImage(canvasId: string, functionName: string, imgFormat: string, args: any[]): Promise<{_strImage: string, data: any}> {
        return new Promise(function(resolve, reject) {
            try {
                var retnPromise = NSCanvasInterface._callCanvasReqHandler(canvasId, functionName, args);
                if (!retnPromise) {
                    throw 'Some Error Occurred while executing _callCanvasReqHandler';
                }
                retnPromise.then(function(data: any) {
                    var oNSCanvasInterface = NSCanvasInterface._getCanvasInstanceById(canvasId);
                    var strImage = oNSCanvasInterface.canvas.toDataURL(imgFormat === 'png' ? 'image/png' : 'image/jpeg');
                    resolve({
                        _strImage: strImage,
                        data: data
                    });
                });
            } catch (e){ 
                reject(e);
            }
        });
    }
}

/**
 * Registering NSCanvasInterface class to global window variable,
 * to make it accessible to native app and web-view code.
 */
window.NSCanvasInterface = NSCanvasInterface;

