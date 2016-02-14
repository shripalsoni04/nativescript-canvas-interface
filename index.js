var image_1 = require('ui/image');
var image_source_1 = require('image-source');
var webViewInterface = require('nativescript-webview-interface');
/**
 * Class to handle canvas data communication betweeen native app and webView.
 */
var NativescriptCanvasInterface = (function () {
    /**
     * Creates unique instance of nativescript canvas interface per canvas.
     *
     * @param   {WebView}   webView - Instance of nativescript web-view which contains canvas element.
     * @param   {string}    canvasId - "id" field of canvas element in web-view.
     */
    function NativescriptCanvasInterface(webView, canvasId) {
        this.webView = webView;
        this.canvasId = canvasId;
        this._webViewInterface = new webViewInterface.WebViewInterface(this.webView);
    }
    Object.defineProperty(NativescriptCanvasInterface.prototype, "webViewInterface", {
        /**
         * Returns instance of WebViewinterface class, registered with the web-view.
         */
        get: function () {
            return this._webViewInterface;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns instance of Nativescript Image, by executing specified function in web-view.
     *
     * @param   {string}    functionName - Function to be executed in web-view, to create image from canvas.
     * @param   {any[]}     args - Any extra argument to pass to function in web-view.
     * @param   {string}    format - Expected image format from canvas in web-view. (jpeg|png)
     * @returns {Promise<image: Image, data: any>} Returns promise with nativescript Image view and any data returned from the function in web-view.
     */
    NativescriptCanvasInterface.prototype.createImage = function (functionName, args, format) {
        if (format === void 0) { format = 'png'; }
        return this._callJSFunction('NSCanvasInterface._createImage', [this.canvasId, functionName, format, args]);
    };
    /**
     * Sends base64 encoded image to web-view after converting it from Image|ImageSource|Image Path.
     *
     * @param   {string}    functionName - Function to be executed in web-view, to handle the image sent.
     * @param   {Image|ImageSource|string}  image - Image to sent to web-view.
     * @param   {any[]}     args - Any extra argument to pass to function in web-view.
     * @param   {string}    format - Format in which we want to send the image in web-view. (jpeg|png)
     * @returns {Promise<{data: any}>}  Returns promise with any data returned from the function in web-view.
     */
    NativescriptCanvasInterface.prototype.setImage = function (functionName, image, args, format) {
        if (format === void 0) { format = 'png'; }
        var retnPromise;
        var _a = this._resolveImageSourceAndFormat(image, format), imageSource = _a.imageSource, format = _a.format;
        if (!imageSource) {
            return Promise.reject('Please provide Image, ImageSource object or Valid Image Path');
        }
        var base64ImageStr = this._getBase64StrFromImageSource(imageSource, format);
        return this._callJSFunction('NSCanvasInterface._setImage', [this.canvasId, functionName, base64ImageStr].concat(args || []));
    };
    /**
     * Returns instance of ImageSource and format based on the parameters passed.
     *
     * @private
     */
    NativescriptCanvasInterface.prototype._resolveImageSourceAndFormat = function (image, format) {
        var imageSource;
        if (image && typeof image === 'string' && image.trim().length > 0) {
            imageSource = image_source_1.fromFile(image);
            format = format || image.substring(image.lastIndexOf('.') + 1, image.length);
        }
        if (typeof image === 'object') {
            if (image instanceof image_1.Image) {
                imageSource = image.imageSource;
            }
            if (image instanceof image_source_1.ImageSource) {
                imageSource = image;
            }
        }
        return { imageSource: imageSource, format: format };
    };
    /**
     * Calls the specified JS function in web-view using webViewInterface instance.
     *
     * @private
     */
    NativescriptCanvasInterface.prototype._callJSFunction = function (functionName, args) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.webViewInterface.callJSFunction(functionName, args, function (response) {
                var result;
                if (response) {
                    result = {
                        image: response._strImage ? _this._getImageSourceFromBase64Str(response._strImage) : null,
                        data: response.data || null
                    };
                }
                resolve(result);
            }, function (error) {
                reject(error);
            });
        });
    };
    /**
     * Encodes ImageSource instance to base64 encoded image string, in the
     * specified format, to send it to web-view.
     *
     * @private
     */
    NativescriptCanvasInterface.prototype._getBase64StrFromImageSource = function (imageSource, format) {
        var base64ImageStr;
        if (format === 'jpeg' || format === 'jpg') {
            base64ImageStr = 'data:image/jpeg;base64,' + imageSource.toBase64String('jpeg');
        }
        else {
            base64ImageStr = 'data:image/png;base64,' + imageSource.toBase64String('png');
        }
        return base64ImageStr;
    };
    /**
     * Converts base64 encoded image string coming from web-view to ImageSource instance and returns it.
     *
     * @private
     */
    NativescriptCanvasInterface.prototype._getImageSourceFromBase64Str = function (base64ImageStr) {
        var str = base64ImageStr.split(",")[1];
        return image_source_1.fromBase64(str);
    };
    return NativescriptCanvasInterface;
})();
exports.NativescriptCanvasInterface = NativescriptCanvasInterface;
