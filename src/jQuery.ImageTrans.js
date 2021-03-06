; (function ($) {
  var funcBind = function (fun, thisp) {
    var slice = Array.prototype.slice;
    var args = slice.call (arguments, 2);
    return function () {
      return fun.apply (thisp, args.concat (slice.call (arguments)));
    }
  }
  var ImageTrans = function (container, options) {
    this._initialize (container, options);
    this._initMode ();
    if (this._support) {
      this._initContainer ();
      this._init ();
    } else {// mode is not supported
      this.onError ("not support");
    }
  };
  ImageTrans.prototype = {
    // Initialize the program
    _initialize: function (container, options) {
      var container = this._container = $ (container) [0];
      this._clientWidth = container.clientWidth; // Transform the width of the region
      this._clientHeight = container.clientHeight; // Transform the height of the area
      this._img = new Image (); // picture object
      this._style = {}; // backup style
      this._x = this._y = 1; // horizontal / vertical transform parameters
      this._radian = 0; // Rotate the transform parameter
      this._support = false; / / whether to support the transformation
      this._init = this._load = this._show = this._dispose = function () {};

      var opt = this._setOptions (options);

      this._zoom = opt.zoom;

      this.onPreLoad = opt.onPreLoad;
      this.onLoad = opt.onLoad;
      this.onError = opt.onError;

      this._LOAD = funcBind (function () {
        this.onLoad ();
        this._load ();
        this.reset ();
        this._img.style.visibility = "visible";
      }, this);
      $ (this) .trigger ("z_init");
    },
    // Set the default property
    _setOptions: function (options) {
      this.options = {// default value
        mode: "css3 | filter | canvas",
        zoom: .1, // zoom ratio
        onPreLoad: function () {}, // execute before the image is loaded
        onLoad: function () {}, // Execute the image after loading
        onError: function (err) {} // Executed on error
      };
      return $ .extend (this.options, options || {});
    },
    // mode setting
    _initMode: function () {
      var modes = ImageTrans.modes;
      this._support = this.options.mode.toLowerCase (). split ("|"). some (function (mode) {
        mode = modes [mode];
        if (mode && mode.support) {
          mode.init && (this._init = mode.init); // Initialize the execution program
          mode.load && (this._load = mode.load); / / Load the image executive program
          mode.show && (this._show = mode.show); // Transform the display program
          mode.dispose && (this._dispose = mode.dispose); // destroy the program
          // extended transform method
          var that = this;
          $ .each (ImageTrans.transforms, function (name, transform) {

            that [name] = function () {
              transform.apply (that, [] .slice.call (arguments));
              that._show ();
            }
          }, that);
          return true;
        }
      }, this);
    },
    // Initialize the container object
    _initContainer: function () {
      var container = this._container, style = container.style, position = $ (container) .position ();
      this._style = {"position": style.position, "overflow": style.overflow}; // backup style
      if (position! = "relative" && position! = "absolute") {style.position = "relative";}
      style.overflow = "hidden";
      $ (this) .trigger ("z_initContainer");
    },
    // Load picture
    load: function (src) {
      if (this._support) {
        var img = this._img, oThis = this;
        img.onload || (img.onload = this._LOAD);
        img.onerror || (img.onerror = function () {oThis.onError ("err image");});
        img.style.visibility = "hidden";
        this.onPreLoad ();
        img.src = src;
      }
    },
    // reset
    reset: function () {
      if (this._support) {
        this._x = this._y = 1; this._radian = 0;
        this._show ();
      }
    },
    // Destroy the program
    dispose: function () {
      if (this._support) {
        this._dispose ();
        $ (this) .trigger ("z_dispose");
        $ (this._container) .css (this._style); // Restore the style
        this._container = this._img = this._img.onload = this._img.onerror = this._LOAD = null;
      }
    }
  };
  // change mode
  ImageTrans.modes = function () {
    var css3Transform; // ccs3 transform style
    // Initialize the picture object function
    function initImg (img, container) {
      $ (img) .css ({
        position: "absolute",
        border: 0, padding: 0, margin: 0, width: "auto", height: "auto", // reset style
        visibility: "hidden" // hidden before loading
      });
      container.appendChild (img);
    }
    // Get transform parameter function
    function getMatrix (radian, x, y) {
      var Cos = Math.cos (radian), Sin = Math.sin (radian);
      return {
        M11: Cos * x, M12: -Sin * y,
        M21: Sin * x, M22: Cos * y
      };
    }
    return {
      css3: {// css3 set
        support: function () {
          var style = document.createElement ("div"). style;
          return ["transform", "MozTransform", "webkitTransform", "OTransform"]. some (
            function (css) {
              if (css in style) {
                css3Transform = css; return true;
              }
            });
        } (),
        init: function () {initImg (this._img, this._container);},
        load: function () {
          var img = this._img;
          $ (img) .css ({// center
            top: (this._clientHeight - img.offsetHeight) / 2 + "px",
            left: (this._clientWidth - img.offsetWidth) / 2 + "px",
            visibility: "visible"
