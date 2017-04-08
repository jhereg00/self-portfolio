(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Barrel = require('app/Barrel');
const Light = require('lib/gl/Light');
const Color = require('lib/Color');
const Scene3d = require('lib/gl/Scene3d');
const PerspectiveCamera = require('lib/gl/cameras/PerspectiveCamera');

const Object3d = require('lib/gl/Object3d');
const Plane = require('lib/gl/primitives/Plane');
const Material = require('lib/gl/Material');

const BARREL2_ROLL_TIME = 10000;

let scene = new Scene3d(2000,2000);
scene.backgroundColor = new Color (255,255,255,1);
scene.addTo(canvasContainer);

let barrel = new Barrel ();
barrel.moveTo(0, 34/2, 0);
scene.addObject(barrel);
let barrel2 = new Barrel ();
barrel2.rotateTo(Math.PI / 2, 0, 0);
barrel2.moveTo(-8, 25.3/2, 28);
scene.addObject(barrel2);

let floor = new Object3d(
  new Plane (180, 180, 4, 4),
  new Material ({color: new Color (255,255,255,1)})
);
floor.castsShadows = false;
floor.rotateTo(-Math.PI / 2, 0, 0);
scene.addObject(floor);

let primaryLight = new Light (Light.POINT, new Color (0,0,0,0), new Color (255,255,255,1), new Color (0,0,0,0), 300, 200);
primaryLight.diffuseIntensity = 1.5;
primaryLight.moveTo(-100, 100, -50);
primaryLight.bias = .025;
scene.addLight(primaryLight);

let cam = new PerspectiveCamera (15, 1, 1, 150);
cam.moveTo(0,0,-100);
cam.lookAt(0, 34/2, 20);
scene.setActiveCamera(cam);

let startTime = performance.now();
let lastLog = startTime;
let framesSinceLog = 0;
(function loop () {
  scene.draw();
  primaryLight.moveTo(Math.sin(Math.PI * (performance.now() - startTime) / 4000) * 100, 100, -50);
  cam.moveTo(Math.sin(Math.PI * (performance.now() - startTime) / 16000) + 60, Math.sin(Math.PI * (performance.now() - startTime) / 8000) * 20 + 50, -80);

  let rollPerc = ((performance.now() - startTime) / BARREL2_ROLL_TIME) % 1;
  barrel2.moveTo(-8 + (Math.sin(rollPerc * Math.PI * 2)) * 20, 25.3/2, 28);
  barrel2.rotateTo((Math.sin(rollPerc * Math.PI * 2)) * Math.PI * (20 / 25.3), -Math.PI / 2, Math.PI / 2);

  requestAnimationFrame(loop);

  if (performance.now() - lastLog > 1000) {
    console.log (Math.floor(1000 / ((performance.now() - lastLog) / framesSinceLog)) + ' fps');
    lastLog = performance.now();
    framesSinceLog = 0;
  }
  else {
    framesSinceLog++;
  }
})();

console.log(barrel.material.texture);

},{"app/Barrel":2,"lib/Color":4,"lib/gl/Light":17,"lib/gl/Material":18,"lib/gl/Object3d":20,"lib/gl/Scene3d":22,"lib/gl/cameras/PerspectiveCamera":23,"lib/gl/primitives/Plane":24}],2:[function(require,module,exports){
/**
 * Barrel class
 *
 * Mesh was created with 1 unit = 1 inch
 */
const Object3d = require('lib/gl/Object3d');
const Mesh = require('lib/gl/Mesh');
const Color = require('lib/Color');
const barrelData = require('obj/barrel.json');
const barrelMesh = new Mesh (
  barrelData.vertices,
  null,
  barrelData.normals,
  barrelData.uvs,
  barrelData.faces
);
const Material = require('lib/gl/Material');
const barrelMat = new Material ({
  texturePath: 'images/textures/barrel-shading.jpg',
  lineartPath: 'images/textures/barrel-lineart.png'
});

class Barrel extends Object3d {
  constructor () {
    super(barrelMesh, barrelMat);
    // this.castsShadows = false;
    for (let i = 0; i < this.mesh.normals.length / 3; i += 100) {
      console.log(this.mesh.getVertex(i), this.mesh.getNormal(i), this.mesh.getUV(i));
    }
  }
}

module.exports = Barrel;

},{"lib/Color":4,"lib/gl/Material":18,"lib/gl/Mesh":19,"lib/gl/Object3d":20,"obj/barrel.json":28}],3:[function(require,module,exports){
/**
 * AjaxRequest class
 *
 * Create a new instance to make a new request.  All options other than url are
 * optional.
 *
 * All functions (complete, success, and error) are passed the response text
 * and the xhttp request as arguments.
 *
 * @param {object} options
 *   @param {string} url
 *   @param {string} method - default: 'GET'
 *   @param {object} data - arbitrary data to send
 *   @param {function} complete - function to call when request is complete, successful or not
 *   @param {function} success - function to call when request completes with status code 2xx
 *   @param {function} error - function to call when request fails or completes with status code 4xx or 5xx
 *
 * @method addStateListener
 *   @param {int} stateIndex
 *   @param {Function} callback - function to call when that state is reached
 *     passed 2 arguments: `{string} responseText`, `{XMLHttpRequest} the request object`
 * @method getReadyState
 *   @returns {int} readyState of request
 * @method abort
 *
 * @static @enum readyState
 */
// requirements
const extendObject = require('lib/extendObject');

// settings
const DEFAULTS = {
  method: 'GET'
}
let activeRequests = [];

// the class
class AjaxRequest {
  constructor (options) {
    if (!options || !options.url) {
      throw new Error('AjaxRequest must have a url defined');
      return false;
    }

    this.stateFns = [[],[],[],[],[]];
    this.options = extendObject({}, DEFAULTS, options);

    // handle data
    let dataStr = "";
    for (let prop in this.options.data) {
  		dataStr += (dataStr === "" ? "" : "&") + prop + "=" + encodeURI(this.options.data[prop]);
    }

    // make actual request
  	let xhttp = this.xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = (function () {
      if (this.stateFns[xhttp.readyState] && this.stateFns[xhttp.readyState].length) {
        for (let i = 0, len = this.stateFns[xhttp.readyState].length; i < len; i++) {
          this.stateFns[xhttp.readyState][i](xhttp.responseText, xhttp);
        }
      }
    }).bind(this);
    this.addStateListener(AjaxRequest.readyState.DONE, this.onComplete.bind(this));

    // open and send the request
  	xhttp.open(this.options.method,(dataStr && this.options.method === 'GET' ? this.options.url + '?' + dataStr : this.options.url),true);
    // web-standards compliant x-requested-with
    xhttp.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	if (this.options.method !== 'GET' && dataStr) {
  		xhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  		xhttp.send(dataStr);
  	}
  	else {
  		xhttp.send();
  	}
    activeRequests.push(this);
  }
  // function we'll call when done
  onComplete (responseText, xhttp) {
    // done
    if (this.options.complete && typeof this.options.complete === 'function') {
      this.options.complete(responseText, xhttp);
    }

    // success or fail
    if (xhttp.status >= 200 && xhttp.status <= 299) {
      if (this.options.success && typeof this.options.success === 'function') {
        this.options.success(responseText, xhttp);
      }
    }
    else if (this.options.error && typeof this.options.error === 'function') {
      this.options.error(responseText, xhttp);
    }

    activeRequests.splice(activeRequests.indexOf(this),1);
  }
  // add a listener state
  addStateListener (stateIndex, fn) {
    // call immediately if already at or passed that state
    if (this.xhttp.readyState >= stateIndex) {
      fn(this.xhttp.responseText, this.xhttp);
    }
    this.stateFns[stateIndex].push(fn);
  }
  // access the xhttp's ready state easily
  getReadyState () {
    return this.xhttp.readyState;
  }
  // bail
  abort () {
    console.log('aborting AJAX call');
    this.xhttp.abort();
  }

  // readyState enum
  static get readyState() {
    return {
      UNSENT: 0,
      OPENED: 1,
      HEADERS_RECEIVED: 2,
      LOADING: 3,
      DONE: 4
    }
  }
  static get activeRequests () {
    return activeRequests;
  }
}

module.exports = AjaxRequest;

},{"lib/extendObject":5}],4:[function(require,module,exports){
/***
 * Color
 *
 * A simple means of controlling color.  Only handles RGB(A) right now.
 *
 * @param {number} red or {array} values or {string} hex or {number} hex
 * @param {number} green
 * @param {number} blue
 * @param {number} alpha
 */
// requirements
const extendObject = require('lib/extendObject');

class Color {
  constructor (r, g, b, a) {
    let values = {};
    // check if passed an array
    if (r instanceof Array) {
      values = {
        g: r[1],
        b: r[2],
        a: r[3],
        r: r[0]
      }
    }
    // check if passed a hex
    // if r is a number and g is undefined, probably passed a 0xffffff style hex
    else if ((typeof r === 'string' && /^(0x|#)?([a-f0-9]{3}){1,2}$/i.test(r)) ||
             (typeof r === 'number' && g === undefined)) {
      values = Color.parseHex(r);
    }
    // passed valid values!
    else {
      values = {
        r: r,
        g: g,
        b: b,
        a: a
      }
    }

    // normalize floats to int of 255
    // if passed a decimal value, assume it's this style
    if (values.r % 1 || values.g % 1 || values.b % 1) {
      ['r','g','b'].forEach((x) => Math.floor(x * 255));
    }

    if (values.a === undefined) {
      values.a = 1;
    }

    extendObject(this, values, true);
  }

  toFloatArray () {
    return [
      this.r / 255,
      this.g / 255,
      this.b / 255,
      this.a
    ];
  }

  static parseHex (hex) {
    if (typeof hex === 'string') {
      hex = hex.replace(/(^|[x#])([a-f0-9])([a-f0-9])([a-f0-9])$/, ($0, $1, $2, $3, $4) => '' + $2 + $2 + $3 + $3 + $4 + $4);
      hex = parseInt(hex.replace(/^0x|#/,''), 16);
    }
    return {
      r: hex >>> 16,
      g: hex >>> 8 & 0xff,
      b: hex & 0xff,
      a: 1
    }
  }
}

module.exports = Color;

},{"lib/extendObject":5}],5:[function(require,module,exports){
/**
 * extendObject function
 *
 * extend one object with another object's property's (default is deep extend)
 * this works with circular references and is faster than other deep extend methods
 * http://jsperf.com/comparing-custom-deep-extend-to-jquery-deep-extend/2
 *
 * based on this gist: https://gist.github.com/fshost/4146993
 *
 * @param {object} target - object that gets extended
 * @param {object} source - object with values to add to / override target's
 * @param {boolean, optional} shallow - if true, won't extend child objects if defined in target. Default: false
 *
 * @returns {object} extendedTarget
 */
let array = '[object Array]',
    object = '[object Object]',
    targetMeta,
    sourceMeta;

function setMeta (value) {
  // checks what type of value we have, array, object, or other
  let jclass = {}.toString.call(value);
  if (value === undefined) return 0;
  else if (typeof value !== 'object') return false;
  else if (jclass === array) return 1;
  else if (jclass === object) return 2;
};

function extendObject () {
  // parse from arguments
  let target = arguments[0];
  let shallow = arguments[arguments.length - 1] === true;
  for (let i = 1; i < arguments.length; i++) {
    let source = arguments[i];
    if (!source || (typeof source !== 'object' && typeof source !== 'function'))
      continue;
    for (let key in source) {
      // iterate through props in source object
      if (source.hasOwnProperty(key)) {
        targetMeta = setMeta(target[key]);
        sourceMeta = setMeta(source[key]);
        if (source[key] !== target[key]) {
          // not the same, better update target
          if (!shallow && sourceMeta && targetMeta && targetMeta === sourceMeta) {
            // deep extend if of same type
            target[key] = extendObject(target[key], source[key], true);
          } else if (sourceMeta !== 0) {
            // shallow, or just set to source's prop
            target[key] = source[key];
          }
        }
      }
      else break; // hasOwnProperty === false, meaning we're through the non-prototype stuff
    }
  }
  return target;
}

module.exports = extendObject;

},{}],6:[function(require,module,exports){
/**
 * GBuffer
 *
 * buffer that draws to several textures for deferred rendering.
 *
 * bound in this order:
 *  0: color
 *  1: normal
 *  2: depth
 */
const GLFramebuffer = require('lib/gl/GLFramebuffer');
const GLTextureFloat = require('lib/gl/GLTextureFloat');
const GLTextureDepth = require('lib/gl/GLTextureDepth');

class GBuffer extends GLFramebuffer {
  constructor (gl, size = 1024) {
    super(gl, size);
  }

  _createAndAttachTexture () {
    this.drawBuffersExtension = this.gl.getExtension('WEBGL_draw_buffers');
    if (!this.drawBuffersExtension) {
      throw new Error("GBuffer failed to get WEBGL_draw_buffers extension");
    }

    this.colorTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.normalTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.depthRGBTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.positionTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.specularityTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.lineartTexture = new GLTextureFloat (this.gl, null, this.size, this.size);
    this.depthTexture = new GLTextureDepth (this.gl, null, this.size, this.size);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture.texture, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT0_WEBGL, this.gl.TEXTURE_2D, this.colorTexture.texture, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT1_WEBGL, this.gl.TEXTURE_2D, this.normalTexture.texture, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT2_WEBGL, this.gl.TEXTURE_2D, this.depthRGBTexture.texture, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT3_WEBGL, this.gl.TEXTURE_2D, this.positionTexture.texture, 0);
    // this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT4_WEBGL, this.gl.TEXTURE_2D, this.specularityTexture.texture, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.drawBuffersExtension.COLOR_ATTACHMENT4_WEBGL, this.gl.TEXTURE_2D, this.lineartTexture.texture, 0);
  }

  use () {
    super.use();
    this.drawBuffersExtension.drawBuffersWEBGL([
      this.drawBuffersExtension.COLOR_ATTACHMENT0_WEBGL,
      this.drawBuffersExtension.COLOR_ATTACHMENT1_WEBGL,
      this.drawBuffersExtension.COLOR_ATTACHMENT2_WEBGL,
      this.drawBuffersExtension.COLOR_ATTACHMENT3_WEBGL,
      this.drawBuffersExtension.COLOR_ATTACHMENT4_WEBGL
    ]);
  }
}

module.exports = GBuffer;

},{"lib/gl/GLFramebuffer":10,"lib/gl/GLTextureDepth":15,"lib/gl/GLTextureFloat":16}],7:[function(require,module,exports){
/**
 * GLArrayBuffer
 *
 * Convenience class for creating GLBuffer with the type gl.ARRAY_BUFFER
 *
 * @extends GLBuffer
 *
 * @param {WebGLRenderingContext} gl
 * @param {int} sizePerVertex
 * @param {int} dataType
 *
 * @method bindData
 *   @param {gl.attributePosition} position
 *   @param {Array} data
 */
// requirements
const GLBuffer = require('lib/gl/GLBuffer');

class GLArrayBuffer extends GLBuffer {
  constructor (gl, size = 3, dataType = gl.FLOAT) {
    super(gl, gl.ARRAY_BUFFER, size, dataType);
  }

  bindData (position, data) {
    super.bindToAttribute(position);
    super.bindData(data);
  }
}

module.exports = GLArrayBuffer;

},{"lib/gl/GLBuffer":8}],8:[function(require,module,exports){
/**
 * GLBuffer
 *
 * Class to handle common buffer interactions, like binding data to an attribute.
 *
 * @param {WebGLContext} gl
 * @param {int from WebGLBufferType enum} bufferType
 * @param {int} size - A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
 * [@param {int from enum} dataType] - A GLenum specifying the data type of each component in the array. Must be one of: gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
 * [@param {int from enum} normalized ]- gl.TRUE or gl.FALSE
 * [@param {int} stride] - A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes.
 * [@param {int} offset] - A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
 *
 * @method bind - binds buffer to its WebGLContext so things can be done to it
 * @method bindToAttribute
 *   @param {int} attribute position to pass to gl.vertexAttribPointer
 * @method bindData
 *   @param {Array} data to bind
 *   [@param {int from enum}] draw type, defaults to gl.STATIC_DRAW
 *
 * @prop buffer - the actual WebGLBuffer
 */
// requirements

// settings

// class
class GLBuffer {
  constructor (
      gl,
      bufferType,
      attributeSize,
      dataType = gl.FLOAT,
      normalized = gl.FALSE,
      stride = 0,
      offset = 0
    ) {

    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      throw new Error(this.constructor.name + ' requires a WebGLRenderingContext as its first argument');
      return false;
    }
    this.gl = gl;
    this.buffer = this.gl.createBuffer();
    this.type = bufferType;
    this.attribSettings = {
      size: attributeSize,
      type: dataType,
      normalized: normalized,
      stride: stride,
      offset: offset
    }
  }

  bind () {
    this.gl.bindBuffer(this.type, this.buffer);
  }
  bindToAttribute (position) {
    this.bind();
    this.gl.vertexAttribPointer(
      position,
      this.attribSettings.size,
      this.attribSettings.type,
      this.attribSettings.normalized,
      this.attribSettings.stride,
      this.attribSettings.offset
    );
  }
  bindData (data, drawType) {
    this.bind();
    if (data instanceof Array) {
      if (this.type === this.gl.ELEMENT_ARRAY_BUFFER) {
        data = new Uint16Array(data);
      }
      else {
        data = new Float32Array(data);
      }
    }
    this.gl.bufferData(this.type, data, drawType || this.gl.STATIC_DRAW);
  }
}

module.exports = GLBuffer;

},{}],9:[function(require,module,exports){
/**
 * GLElementArrayBuffer
 *
 * Convenience class for creating GLBuffer with the type gl.ARRAY_BUFFER
 *
 * @extends GLBuffer
 *
 * @param {WebGLRenderingContext} gl
 * [@param {int} size]
 * [@param {enum} dataType]
 *
 * @method bindData
 *   @param {gl.attributePosition} position
 *   @param {Array} data
 */
// requirements
const GLBuffer = require('lib/gl/GLBuffer');

class GLElementArrayBuffer extends GLBuffer {
  constructor (gl, size = 1, dataType = gl.INT) {
    super(gl, gl.ELEMENT_ARRAY_BUFFER, size, dataType);
  }
}

module.exports = GLElementArrayBuffer;

},{"lib/gl/GLBuffer":8}],10:[function(require,module,exports){
/**
 * GLFramebuffer
 */
const GLTexture2d = require('lib/gl/GLTexture2d');

class GLFramebuffer {
  constructor (gl, size = 1024) {
    this.gl = gl;
    this.size = size;

    this.framebuffer = this.gl.createFramebuffer();
    // this.renderbuffer = this.gl.createRenderbuffer();
    // this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderbuffer);
    // this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, size, size);

    this._createAndAttachTexture();
  }

  _createAndAttachTexture () {
    this.texture = new GLTexture2d (this.gl, null, this.size, this.size);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture.texture, 0);
  }

  use () {
    // this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderbuffer);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.size, this.size);
  }
}

module.exports = GLFramebuffer;

},{"lib/gl/GLTexture2d":14}],11:[function(require,module,exports){
/**
 * GLProgram class
 *
 * Creates and controls a shader program.
 *
 * @param {WebGLRenderingContext} gl
 * @param {String[]} shaderUrls
 * @param {String[]} attributeNames
 * @param {String[]} uniformNames
 *
 * @method use - binds the program and preps attributes and uniforms to have data bound to them
 * @method addAttribute
 *   @param attributeName or array of names
 * @method addUniform
 *   @param uniformName or array of names
 * @method addReadyListener
 *   @param function
 *
 * @property {object} attributes - object that stores attribute locations for binding data
 * @property {object} uniforms - object that stores uniform locations for binding data
 * @property a - alias for attributes
 * @property u - alias for uniforms
 *
 * @static getBy - gets or creates a program as needed based on the passed arguments
 * @static getActive - gets the currently active program for the passed WebGLRenderingContext
 */
// requirements
const GLShader = require('lib/gl/GLShader');

// settings
let createdPrograms = [];
let activePrograms = [];

// class
class GLProgram {
  constructor (gl, shaders, attributeNames, uniformNames, definitions) {
    this.ready = false;
    this._readyFns = [];
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      throw new Error('GLShader requires a WebGLRenderingContext as its first argument');
    }
    this.gl = gl;

    let program = gl.createProgram();
    this.program = program;

    let shadersReady = 0;
    shaders = shaders.map((x) => new GLShader(this.gl, x, null, definitions));
    shaders.forEach((function (s) {
      s.addReadyListener((function () {
        shadersReady++;
        s.attachTo(program);
        if (shadersReady === shaders.length)
          this._initialize();
      }).bind(this));
    }).bind(this));

    this._attributeNames = attributeNames || [];
    this._uniformNames = uniformNames || [];
    this.attributes = {};
    this.uniforms = {};
    this.shaders = shaders;

    // store arguments for comparison
    let definitionsString = "";
    for (let prop in definitions) {
      definitionsString += prop + "=" + definitions[prop] + "&";
    }
    this._passedArguments = Array.from(arguments).slice(1,4).join(';') + ';' + definitionsString;
    createdPrograms.push(this);
  }
  _initialize () {
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
  	  throw new Error("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.program));
      return null;
  	}
    this.ready = true;
    this._readyFns.forEach((fn) => fn());
  }

  addReadyListener (fn) {
    if (!this.ready) {
      this._readyFns.push(fn);
    }
    else {
      fn();
    }
  }

  addAttribute (attributes) {
    if (!attributes) {
      return false;
    }
    else if (!(attributes instanceof Array)) {
      attributes = [attributes];
    }
    this._attributeNames = this._attributeNames.concat(attributes);
  }

  addUniform (uniforms) {
    if (!uniforms) {
      return false;
    }
    else if (!(uniforms instanceof Array)) {
      uniforms = [uniforms];
    }
    this._uniformNames = this._uniformNames.concat(uniforms);
  }

  use () {
    if (!this.ready) {
      return false;
    }

    this.gl.useProgram(this.program);
    this._attributeNames.forEach((function (name) {
      this.attributes[name] = this.gl.getAttribLocation(this.program, name);
      this.gl.enableVertexAttribArray(this.attributes[name]);
    }).bind(this));
    this._uniformNames.forEach((function (name) {
      this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
    }).bind(this));

    let activeProgram = GLProgram.getActive(this.gl);
    if (activeProgram) {
      activePrograms.splice(activePrograms.indexOf(activeProgram),1,this);
    }
    else {
      activePrograms.push(this);
    }

    return true;
  }

  getStructPosition (rootName, index, property) {
    return this.gl.getUniformLocation(this.program, rootName + '[' + index + '].' + property);
  }
  getArrayPosition (rootName, index) {
    return this.gl.getUniformLocation(this.program, rootName + '[' + index + ']');
  }

  get a() {
    return this.attributes || {};
  }
  get u() {
    return this.uniforms || {};
  }

  static getBy (...args) {
    let definitionsString = "";
    for (let prop in args[4] || {}) {
      definitionsString += prop + "=" + args[4][prop] + "&";
    }
    let compareString = args.slice(1,4).join(';') + ';' + definitionsString;
    for (let i = 0, len = createdPrograms.length; i < len; i++) {
      let p = createdPrograms[i];
      if (p.gl === args[0] &&
          p._passedArguments === compareString
        ) {
        return p;
      }
    };
    return new GLProgram (args[0], args[1], args[2], args[3], args[4]);
  }
  static getActive (gl) {
    return activePrograms.filter((p) => p.gl === gl)[0] || null;
  }
}

module.exports = GLProgram;

},{"lib/gl/GLShader":13}],12:[function(require,module,exports){
/***
 * GLScene
 *
 * Standard WebGL scene controller, useless on its own and intended to be extended.
 *
 * To set shaders and programs, you must override them in the child class.
 *
 * @param {int} width
 *   Width of the canvas (and viewport) upon creation. Default: 1280.
 * @param {int} height
 *   Height of the canvas (and viewport) upon creation. Default: 720.
 *
 * @protected {boolean} _needsUpdate
 *
 * @property {Color} backgroundColor
 *
 * @method addTo - append canvas to the passed element
 *   @param {DOMElement} parent
 * @method addReadyListener
 *   @param {function} fn
 */
///////////////
// requirements
///////////////
const Color = require('lib/Color');

///////////////
// constants / default settings
///////////////
// default size is standard HD (not full HD)
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

class GLScene {

  // constructor
  constructor (width, height) {
    this.ready = false;
    this._readyFns = [];
    // make a canvas and initialize gl context
    this.canvas = document.createElement('canvas');
    let gl = this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    // ensure gl context was successful
    if (!gl) {
      throw new Error('failed to get WebGL context.');
      return false;
    }

    this.width = width;
    this.height = height;

    this.backgroundColor = new Color(0,0,0,0);
    this.gl.clearDepth(1.0);
    // enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    // make nearer things obscure farther things
    this.gl.depthFunc(this.gl.LEQUAL);

    this.initializePrograms();
    this.initializeBuffers();

    let programCount = Object.keys(this.programs).length;
    let programReadyCount = 0;
    for (let prop in this.programs) {
      this.programs[prop].addReadyListener((function () {
        programReadyCount++;
        if (programReadyCount === programCount) {
          this.ready = true;
          this._readyFns.forEach(fn => fn());
          if (this._drawOnReady)
            this.draw();
        }
      }).bind(this));
    }
  }

  // properties
  get width () {
    return this.canvas.width;
  }
  set width (width) {
    this.canvas.width = width;
  }
  get height () {
    return this.canvas.height;
  }
  set height (height) {
    this.canvas.height = height;
  }

  get backgroundColor () { return this._backgroundColor; }
  set backgroundColor (color) {
    if (color instanceof Color) {
      this._backgroundColor = color;
    }
    else {
      this._backgroundColor = new Color (color);
    }
    this.gl.clearColor.apply(this.gl, this._backgroundColor.toFloatArray());
  }

  // interface functions
  initializePrograms () {
    console.error(this.constructor.name + ' does not override initializePrograms');
  }
  initializeBuffers () {
    console.error(this.constructor.name + ' does not override initializeBuffers');
  }
  draw () {
    console.error(this.constructor.name + ' does not override draw');
  }

  // methods
  addTo (parent) {
    parent.appendChild(this.canvas);
  }
  addReadyListener (fn) {
    if (!this.ready)
      this._readyFns.push(fn);
    else
      fn();
  }
}

module.exports = GLScene;

},{"lib/Color":4}],13:[function(require,module,exports){
/**
 * GLShader class
 *
 * @param gl - instance to bind shader to
 * @param filePath - file to load as a shader
 * @param type - 'VERTEX_SHADER' or 'FRAGMENT_SHADER'
 *
 * @property {boolean} ready
 *
 * @method initialize
 *   @param {string} source
 * @method attachTo
 *   @param {WebGLProgram} program
 * @method addReadyListener
 *   @param {function} fn
 *
 * @static purge - clears all fileRequests, making new shaders make AjaxRequests
 */

// requirements
const AjaxRequest = require('lib/AjaxRequest');

// store requests by url so we avoid doubling up
let fileRequests = {};
const vertexRegex = /gl_Position\s*=/;

class GLShader {
  constructor (gl, filePath, shaderType, definitions) {
    this.ready = false;
    this._readyFns = [];
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      throw new Error('GLShader requires a WebGLRenderingContext as its first argument');
    }

    this.gl = gl;
    if (shaderType)
      this.type = gl[shaderType];
    this.filePath = filePath;
    this.prependString = "";

    if (definitions) {
      for (let key in definitions) {
        this.prependString += "#define " + key + " " + definitions[key] + "\n";
      }
    }

    if (!fileRequests[filePath]) {
      // haven't gotten (or started to get) this one yet
      // so start a new request
      fileRequests[filePath] = new AjaxRequest({
        url: filePath,
        complete: this.initialize.bind(this)
      });
    }
    else {
      // already got (or started to get) this file
      // so add a callback to the request
      fileRequests[filePath].addStateListener(AjaxRequest.readyState.DONE, this.initialize.bind(this));
    }
  }

  initialize (source) {
    if (typeof this.type === 'undefined') {
      this.type = vertexRegex.test(source) ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER;
    }
    this.shader = this.gl.createShader(this.type);
    this.gl.shaderSource(this.shader, this.prependString + source);
    this.gl.compileShader(this.shader);
    // any errors?
    if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS)) {
      throw new Error("An error occurred compiling the shaders (" + this.filePath + "): \n" + this.gl.getShaderInfoLog(this.shader));
    }
    this.ready = true;
    this._readyFns.forEach((x) => x());
  }

  attachTo (program) {
    if (!program instanceof WebGLProgram)
      throw new Error("GLShader.attachTo must be passed a valid WebGLProgram");
    if (!this.ready) {
      this.addReadyListener((function () {
        this.attachTo(program);
      }).bind(this));
    }
    else {
      return this.gl.attachShader(program, this.shader);
    }
  }

  addReadyListener (fn) {
    if (!this.ready)
      this._readyFns.push(fn);
    else
      fn();
  }

  static purge () {
    fileRequests = {};
  }
}

module.exports = GLShader;

},{"lib/AjaxRequest":3}],14:[function(require,module,exports){
/**
 * GLTexture2d
 */
class GLTexture2d {
  constructor (gl, imageSrc, width, height) {
    this.gl = gl;
    this.texture = this.gl.createTexture();
    this.bind();

    // basic params
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.setImage(null, width, height);

    // TODO: imageSrc
  }
  bind () {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }
  setImage (image = null, width, height) {
    this.bind();
    if (image) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    }
    else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width || 1024, height || 1024, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    }
  }
}

module.exports = GLTexture2d;

},{}],15:[function(require,module,exports){
/**
 * GLTextureDepth
 */
const GLTexture2d = require('lib/gl/GLTexture2d');

class GLTextureDepth extends GLTexture2d {
  // constructor (gl, imageSrc, width, height) {
  //   super(gl, imageSrc, width, height);
  // }
  setImage (image = null, width, height) {
    this.gl.getExtension('WEBGL_depth_texture');
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT, width || 1024, height || 1024, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_SHORT, null);
  }
}

module.exports = GLTextureDepth;

},{"lib/gl/GLTexture2d":14}],16:[function(require,module,exports){
/**
 * GLTextureDepth
 */
const GLTexture2d = require('lib/gl/GLTexture2d');

class GLTextureFloat extends GLTexture2d {
  // constructor (gl, imageSrc, width, height) {
  //   super(gl, imageSrc, width, height);
  // }
  setImage (image = null, width, height) {
    this.gl.getExtension('OES_texture_float');
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width || 1024, height || 1024, 0, this.gl.RGBA, this.gl.FLOAT, null);
  }
}

module.exports = GLTextureFloat;

},{"lib/gl/GLTexture2d":14}],17:[function(require,module,exports){
/**
 * Light object
 *
 */
const Positionable = require('lib/gl/Positionable');
const PerspectiveCamera = require('lib/gl/cameras/PerspectiveCamera');
const GLProgram = require('lib/gl/GLProgram');

const GLTexture2d = require('lib/gl/GLTexture2d');

const RESOLUTION = 2048;

class Light extends Positionable {
  constructor (type, ambientColor, diffuseColor, specularColor, radius, falloffStart) {
    super();

    this.ambientColor = ambientColor;
    this.ambientIntensity = 1;
    this.diffuseColor = diffuseColor;
    this.diffuseIntensity = 1;
    this.specularColor = specularColor;
    this.specularIntensity = 1;
    this.radius = radius || 1;
    this.falloffStart = falloffStart || 0;
    this.bias = .05;

    this.type = type;

    switch (type) {
      case Light.POINT:
        this.shadowCameras = {
          xPositive: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(0, Math.PI / 2, 0),
          xNegative: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(0, -Math.PI / 2, 0),
          yPositive: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(-Math.PI / 2, 0, 0),
          yNegative: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(Math.PI / 2, 0, 0),
          zPositive: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(0, 0, 0),
          zNegative: new PerspectiveCamera (45 + (1/45)*360,1,1,this.radius).rotateTo(0, Math.PI, 0)
        }
        this.hasCubeMap = true;
        break;
    }
  }

  drawShadowMap (gl, program, objectList, buffers) {
    if (!program.ready) {
      return false;
    }
    program.use();
    if (!this.framebuffer) {
      this.framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      // this.renderbuffer = gl.createRenderbuffer();
      this.texture = gl.createTexture();
      // TODO: make a cubemap class
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, RESOLUTION, RESOLUTION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      this.renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, RESOLUTION, RESOLUTION);

      this.debugTex = new GLTexture2d (gl, null, RESOLUTION, RESOLUTION);
    }
    switch (this.type) {
      case Light.POINT:
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.viewport(0,0,RESOLUTION,RESOLUTION);
	      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
        // gl.clearColor(1.0,1.0,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3fv(program.u.uCamPos, new Float32Array([this.position.x, this.position.y, this.position.z]));
        gl.uniform1f(program.u.uCamRange, this.radius);
        for (let cam in this.shadowCameras) {
          let target = gl['TEXTURE_CUBE_MAP_' + (cam.replace(/^([x-z])(.+)$/i, ($0, $1, $2) => $2.toUpperCase() + '_' + $1.toUpperCase()))];
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target, this.texture, 0);
          gl.uniformMatrix4fv(program.u.uProjectionMatrix, false, this.shadowCameras[cam].projectionMatrix.flatten());

          // gl.clearColor(1.0,1.0,1.0,1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          // gl.clear(gl.DEPTH_BUFFER_BIT);

          objectList.forEach(function (o) {
            gl.uniformMatrix4fv(program.u.uMVMatrix, false, o.mvMatrix.flatten());
            buffers.aPosition.bindData(program.a.aPosition, o.mesh.vertices);
            buffers.elements.bindData(o.mesh.elements);
            gl.drawElements(gl.TRIANGLES, o.mesh.elements.length, gl.UNSIGNED_SHORT, 0);
          });
        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.debugTex.texture, 0);
        gl.uniformMatrix4fv(program.u.uProjectionMatrix, false, this.shadowCameras['xNegative'].projectionMatrix.flatten());

        // gl.clearColor(1.0,1.0,1.0,1.0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.clear(gl.DEPTH_BUFFER_BIT);

        objectList.forEach(function (o) {
          gl.uniformMatrix4fv(program.u.uMVMatrix, false, o.mvMatrix.flatten());
          buffers.aPosition.bindData(program.a.aPosition, o.mesh.vertices);
          buffers.elements.bindData(o.mesh.elements);
          gl.drawElements(gl.TRIANGLES, o.mesh.elements.length, gl.UNSIGNED_SHORT, 0);
        });

        break;
    }
    return true;
  }

  moveTo (...args) {
    super.moveTo.apply(this, args);
    for (let cam in this.shadowCameras) {
      this.shadowCameras[cam].moveTo.apply(this.shadowCameras[cam],args);
    }
  }
  moveBy (...args) {
    super.moveBy.apply(this, args);
    for (let cam in this.shadowCameras) {
      this.shadowCameras[cam].moveBy.apply(this.shadowCameras[cam],args);
    }
  }

  get positionArray () {
    return new Float32Array([this.position.x, this.position.y, this.position.z]);
  }

  //enum settings
  static get POINT () { return 0 };
  static get SPOT () { return 1 };
  static get DIRECTIONAL () { return 2 };
}

module.exports = Light;

},{"lib/gl/GLProgram":11,"lib/gl/GLTexture2d":14,"lib/gl/Positionable":21,"lib/gl/cameras/PerspectiveCamera":23}],18:[function(require,module,exports){
/**
 * Basic Material Class
 */
const Color = require('lib/Color');
const GLTexture2d = require('lib/gl/GLTexture2d');
const DEFAULT_PROPERTIES = {
  color: new Color (0xffffff),
  specularity: .2
}
class Material {
  constructor (properties) {
    properties = properties || {};
    this.color = properties.color || DEFAULT_PROPERTIES.color;
    this.specularity = !isNaN(properties.specularity) ? properties.specularity : DEFAULT_PROPERTIES.specularity;
    this.texture = properties.texture || null;
    this.texturePath = properties.texturePath || null;
    this.lineart = properties.lineart || null;
    this.lineartPath = properties.lineartPath || null;
  }

  textureFromImagePath (gl, path) {
    this.texture = new GLTexture2d (gl);
    let img = new Image ();
    img.src = path;
    if (img.completed) {
      this.texture.setImage(img, img.width, img.height);
    }
    else {
      img.addEventListener('load', (function (evt) {
        console.log(img);
        this.texture.setImage(img, img.width, img.height)
      }).bind(this));
    }
  }
  lineartFromImagePath (gl, path) {
    console.log(path);
    this.lineart = new GLTexture2d (gl);
    let img = new Image ();
    img.src = path;
    if (img.completed) {
      this.lineart.setImage(img, img.width, img.height);
    }
    else {
      img.addEventListener('load', (function (evt) {
        console.log(img);
        this.lineart.setImage(img, img.width, img.height)
      }).bind(this));
    }
  }
}

module.exports = Material;

},{"lib/Color":4,"lib/gl/GLTexture2d":14}],19:[function(require,module,exports){
/**
 * Mesh class
 */
class Mesh {
  constructor (vertexArray, elementArray, normalArray, uvArray, facesArray) {
    this.vertices = vertexArray || [];
    this.elements = elementArray || [];
    this.normals = normalArray || [];
    this.uv = uvArray || [];
    this.facesArray = facesArray;

    for (let i = this.normals.length, len = this.vertices.length; i < len; i += 3) {
      this.normals.push(0,0,1);
    }
    for (let i = this.uv.length / 2, len = this.vertices.length / 3; i < len; i++) {
      this.uv.push(0,0);
    }

    if (!this.elements.length && this.facesArray) {
      let fixedNormals = [];
      let fixedUVs = [];
      let addFixedNormal = (function (index, currentIndex) {
        let currentNormal = this.getNormal(currentIndex);
        fixedNormals[index * 3] = currentNormal[0];
        fixedNormals[index * 3 + 1] = currentNormal[1];
        fixedNormals[index * 3 + 2] = currentNormal[2];
      }).bind(this);

      let addFixedUV = (function (index, currentIndex) {
        let currentUV = this.getUV(currentIndex);
        fixedUVs[index * 2] = currentUV[0];
        fixedUVs[index * 2 + 1] = 1 - currentUV[1];
      }).bind(this);

      for (let i = 0, len = this.facesArray.length; i < len; i++) {
        let face = this.facesArray[i];
        if (face.vertices.length > 2) {
          this.elements.push(
            face.vertices[0] - 1,
            face.vertices[1] - 1,
            face.vertices[2] - 1
          )
          addFixedNormal(face.vertices[0] - 1, face.normals[0] - 1);
          addFixedNormal(face.vertices[1] - 1, face.normals[1] - 1);
          addFixedNormal(face.vertices[2] - 1, face.normals[2] - 1);
          addFixedUV(face.vertices[0] - 1, face.uvs[0] - 1);
          addFixedUV(face.vertices[1] - 1, face.uvs[1] - 1);
          addFixedUV(face.vertices[2] - 1, face.uvs[2] - 1);
          if (face.vertices.length > 3) {
            this.elements.push(
              face.vertices[0] - 1,
              face.vertices[2] - 1,
              face.vertices[3] - 1
            )
            addFixedNormal(face.vertices[3] - 1, face.normals[3] - 1);
            addFixedUV(face.vertices[3] - 1, face.uvs[3] - 1);
          }
        }
      }
      this.normals = fixedNormals;
      this.uv = fixedUVs;
    }
  }

  getVertex (index, size = 3) {
    return this.vertices.slice(index * size, index * size + size);
  }
  getNormal (index, size = 3) {
    return this.normals.slice(index * size, index * size + size);
  }
  getUV (index, size = 2) {
    return this.uv.slice(index * size, index * size + size);
  }
}

module.exports = Mesh;

},{}],20:[function(require,module,exports){
/**
 * Object3d
 *
 * Controls a single object which exists in 3d space.  Can also have any number
 * of child objects.  TODO: optimize drawing of child objects when they use
 * different shader programs.
 *
 * Note, while mesh and material can be altered after creation, they cannot be
 * replaced. Material, in particular, is used to determine the shader program
 * that will be used by this object.
 *
 * @param {Mesh} mesh
 * @param {Material} material
 *
 * @method draw
 *   @param {Matrix} projectionMatrix
 *   @param {Matrix} parentMatrix
 * @method addObject
 *   @param {string} name
 *   @param {Mesh} mesh
 *   @param {Material} material
 * @method addReadyListener
 *   @param {function} fn
 * @method moveTo
 * @method moveBy
 * @method rotateTo
 * @method rotateBy
 */
const Matrix = require('lib/math/Matrix');
const Mesh = require('lib/gl/Mesh');
const Material = require('lib/gl/Material');
const Positionable = require('lib/gl/Positionable');

class Object3d extends Positionable {
  constructor (mesh, material) {
    super();

    this.mesh = mesh || new Mesh();
    this.material = material || new Material();
    this.children = [];

    this.castsShadows = true;

    this._modelMatrix = Matrix.I(4);
    this._worldMatrix = Matrix.I(4);
    this._mvMatrix = Matrix.I(4);
    this._normalMatrix = Matrix.I(4);
  }

  _updateMatrices () {
    this._worldMatrix = Matrix.translation3d(this.position.x, this.position.y, this.position.z);
    this._modelMatrix = Matrix.rotation3d(this.rotation.x, this.rotation.y, this.rotation.z);
    this._mvMatrix = this._modelMatrix.multiply(this._worldMatrix);
    if (this.parent)
      this._mvMatrix = this._mvMatrix.multiply(this.parent.mvMatrix);
    this._normalMatrix = this._mvMatrix.inverse().transpose();
  }
  get mvMatrix () {
    if (this._needsUpdate) {
      this._updateMatrices();
      this._needsUpdate = false;
    }
    return this._mvMatrix;
  }
  get normalMatrix () {
    if (this._needsUpdate) {
      this._updateMatrices();
      this._needsUpdate = false;
    }
    return this._normalMatrix;
  }

  addObject (object) {
    object.parent = this;
    this.children.push(object);
  }

  // @override
  _flagForUpdate () {
    this._needsUpdate = true;
    this.children.forEach(function (o) {
      o._flagForUpdate();
    });
  }
}

module.exports = Object3d;

},{"lib/gl/Material":18,"lib/gl/Mesh":19,"lib/gl/Positionable":21,"lib/math/Matrix":26}],21:[function(require,module,exports){
/**
 * Positionable class
 *
 * Basically an interface that can be extended by things that need position controls.
 *
 * @method moveTo (x,y,z)
 * @method moveBy (x,y,z)
 * @method rotateTo (x,y,z)
 * @method rotateBy (x,y,z)
 *
 * @prop _needsUpdate
 * @prop {Matrix} MVMatrix
 */

class Positionable {
  constructor () {
    this.position = {x:0,y:0,z:0};
    this.rotation = {x:0,y:0,z:0};
  }
  _flagForUpdate () {
    this._needsUpdate = true;
  }
  moveTo (x,y,z) {
    this.position = {
      x: !isNaN(x) ? x : this.position.x,
      y: !isNaN(y) ? y : this.position.y,
      z: !isNaN(z) ? z : this.position.z
    }
    this._flagForUpdate();
    return this;
  }
  moveBy (x,y,z) {
    this.moveTo(
      this.position.x + x,
      this.position.y + y,
      this.position.z + z
    );
    this._flagForUpdate();
    return this;
  }
  rotateTo (x,y,z) {
    this.rotation = {
      x: !isNaN(x) ? x : this.rotation.x,
      y: !isNaN(y) ? y : this.rotation.y,
      z: !isNaN(z) ? z : this.rotation.z
    }
    this._flagForUpdate();
    return this;
  }
  rotateBy (x,y,z) {
    this.rotateTo(
      this.rotation.x + x,
      this.rotation.y + y,
      this.rotation.z + z
    );
    this._flagForUpdate();
    return this;
  }
}

module.exports = Positionable;

},{}],22:[function(require,module,exports){
/***
 * Scene3d
 *
 * Standard 3d scene controller, using blinn-phong shading, deferred rendering,
 * and a bit of postprocessing.
 *
 * @extends GLScene
 *
 * @protected {boolean} _needsUpdate
 *
 * @method addObject
 */

///////////////
// requirements
///////////////
const GLScene = require('lib/gl/GLScene');
const GLShader = require('lib/gl/GLShader');
const GLProgram = require('lib/gl/GLProgram');
const GLArrayBuffer = require('lib/gl/GLArrayBuffer');
const GLElementArrayBuffer = require('lib/gl/GLElementArrayBuffer');
const Object3d = require('lib/gl/Object3d');
const GLFramebuffer = require('lib/gl/GLFramebuffer');
const GBuffer = require('lib/gl/GBuffer');
const GLTexture2d = require('lib/gl/GLTexture2d');

const Matrix = require('lib/math/Matrix');

///////////////
// constants / default settings
///////////////
// default size is standard HD (not full HD)
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

const OBJECT_SHADERS = ['glsl/object.vs.glsl','glsl/object.fs.glsl'];
const OBJECT_ATTRIBUTES = ['aPosition','aNormal','aUV'];
const OBJECT_UNIFORMS = ['uProjectionMatrix','uMVMatrix','uNormalMatrix','uColor','uColorTexture','uSpecularity','uLineartTexture'];

class Scene3d extends GLScene {
  // constructor
  constructor (...args) {
    super(...args);
    this.objects = [];
    this.lights = [];
    // enable drawbuffers
    this.drawBuffersExtension = this.gl.getExtension('WEBGL_draw_buffers');
    if (!this.drawBuffersExtension) {
      // TODO: create fallback drawing program
      throw new Error('platform does not support WEBGL_draw_buffers');
    }

    // background texture
    this.backgroundTexture = new GLTexture2d (this.gl);
    let backgroundImage = new Image ();
    backgroundImage.src = "images/bg.jpg";

    if (backgroundImage.completed) {
      this.texture.setImage(backgroundImage, backgroundImage.width, backgroundImage.height);
    }
    else {
      backgroundImage.addEventListener('load', (function (evt) {
        console.log(backgroundImage);
        this.backgroundTexture.setImage(backgroundImage, backgroundImage.width, backgroundImage.height)
      }).bind(this));
    }
  }

  // properties

  // initialization functions
  initializePrograms () {
    // only define the output programs here
    // the gBuffer programs are defined by the addition of objects
    this.programs = {
      // lighting: new GLProgram(
      //   this.gl,
      //   ['glsl/out.vs.glsl','glsl/lighting.fs.glsl'],
      //   ['aPosition','aUV'],
      //   ['uNormalTexture','uPositionTexture','uColorTexture','uLights','uNumLights','uCameraPosition','uShadowCube']
      // ),
      out: new GLProgram(
        this.gl,
        ['glsl/out.vs.glsl','glsl/out.fs.glsl'],
        ['aPosition','aUV'],
        null
      ),
      depth: new GLProgram(
        this.gl,
        ['glsl/depth.vs.glsl','glsl/depth.fs.glsl'],
        ['aPosition'],
        ['uMVMatrix','uProjectionMatrix','uCamPos','uCamRange'],
        null
      )
    };
    this.dynamicProgramSettings = {
      lighting: [
        ['glsl/out.vs.glsl','glsl/lighting.fs.glsl'],
        ['aPosition','aUV'],
        ['uNormalTexture','uPositionTexture','uColorTexture','uLineartTexture','uLights','uNumLights','uCameraPosition','uShadowCube','uBackgroundTexture'],
        {
          BACKGROUND_TEXTURE: 1
        }
      ]
    }
    this._materialPrograms = {};
  }
  initializeBuffers () {
    this.buffers = {
      aPosition: new GLArrayBuffer(this.gl),
      aNormal: new GLArrayBuffer(this.gl),
      elements: new GLElementArrayBuffer(this.gl),
      aUV: new GLArrayBuffer(this.gl, 2),
      aPositionOut: new GLArrayBuffer(this.gl, 2)
    }
    this.framebuffers = {
      gBuffer: new GBuffer(this.gl),
      lightingBuffer: new GLFramebuffer(this.gl),
      compiled: new GLFramebuffer(this.gl)
    }
  }

  _bindMesh (program, mesh) {
    this.buffers.aPosition.bindData(program.a.aPosition, mesh.vertices);
    this.buffers.aNormal.bindData(program.a.aNormal, mesh.normals);
    this.buffers.aUV.bindData(program.a.aUV, mesh.uv);
    this.buffers.elements.bindData(mesh.elements);
  }
  _bindMaterial (program, material) {
    this.gl.uniform4fv(program.u.uColor, material.color.toFloatArray());
    this.gl.uniform1f(program.u.uSpecularity, material.specularity);
    if (material.texture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      material.texture.bind();
      this.gl.uniform1i(program.u.uColorTexture, 0);
    }
    if (material.lineart) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      material.lineart.bind();
      this.gl.uniform1i(program.u.uLineartTexture, 1);
    }
  }
  _drawObjects () {
    for (let p in this._materialPrograms) {
      let mp = this._materialPrograms[p];
      if (!mp.program.ready)
        continue;

      mp.program.use();
      if (!this.activeCamera)
        this.gl.uniformMatrix4fv(mp.program.u.uProjectionMatrix, false, Matrix.I(4).flatten());
      else
        this.gl.uniformMatrix4fv(mp.program.u.uProjectionMatrix, false, this.activeCamera.projectionMatrix.flatten());

      mp.objects.forEach((function (o) {
        // console.log(Math.max.apply(undefined, o.mesh.elements), Math.min.apply(undefined, o.mesh.elements), o.mesh.vertices.length / 3, o.mesh.normals.length / 3);
        this.gl.uniformMatrix4fv(mp.program.u.uMVMatrix, false, o.mvMatrix.flatten());
        this.gl.uniformMatrix4fv(mp.program.u.uNormalMatrix, false, o.normalMatrix.flatten());
        this._bindMesh(mp.program, o.mesh);
        this._bindMaterial(mp.program, o.material);
        this.gl.drawElements(this.gl.TRIANGLES, o.mesh.elements.length, this.gl.UNSIGNED_SHORT, 0);
      }).bind(this));
    }
  }
  _drawLighting () {
    // update shadowmaps
    let program = this.programs.depth;
    let shadowObjects = this.objects.filter((o) => o.castsShadows);
    this.gl.clearColor(1.0,1.0,1.0,1.0);
    if (!this.lights.every((l) => l.drawShadowMap(this.gl, program, shadowObjects, this.buffers)))
      return false;

    program = GLProgram.getBy(
      this.gl,
      this.dynamicProgramSettings.lighting[0],
      this.dynamicProgramSettings.lighting[1],
      this.dynamicProgramSettings.lighting[2],
      {
        NUM_LIGHTS: Math.min(this.lights.length,12),
        BACKGROUND_TEXTURE: 1
      }
    )
    if (!program.ready)
      return false;
    program.use();
    this.framebuffers.lightingBuffer.use();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.buffers.elements.bindData([0,1,2,0,2,3]);
    this.buffers.aPositionOut.bindData(program.a.aPosition, [-1,-1,1,-1,1,1,-1,1]);
    this.buffers.aUV.bindData(program.a.aUV, [0,0,1,0,1,1,0,1]);

    let p = program;
    let textureBindingOffset = 5;
    for (let i = 0, len = this.lights.length; i < len; i++) {
      // shadow cubes
      this.gl.activeTexture(this.gl['TEXTURE' + (i + textureBindingOffset)]);
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.lights[i].texture);
      // this.gl.uniform1i( p.getStructPosition('uLights',i,'shadowCube'), i + 1 );
      this.gl.uniform1i( p.getArrayPosition('uShadowCubes',i ), i + textureBindingOffset);
      // this.gl.uniform1i( p.u.uShadowCube, i + 3 );

      this.gl.uniform3fv(  p.getStructPosition('uLights',i,'position'),          this.lights[i].positionArray                    );
      this.gl.uniform4fv(  p.getStructPosition('uLights',i,'diffuseColor'),      this.lights[i].diffuseColor.toFloatArray()      );
      this.gl.uniform4fv(  p.getStructPosition('uLights',i,'ambientColor'),      this.lights[i].ambientColor.toFloatArray()      );
      this.gl.uniform4fv(  p.getStructPosition('uLights',i,'specularColor'),     this.lights[i].specularColor.toFloatArray()     );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'diffuseIntensity'),  this.lights[i].diffuseIntensity                 );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'ambientIntensity'),  this.lights[i].ambientIntensity                 );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'specularIntensity'), this.lights[i].specularIntensity                );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'radius'),            this.lights[i].radius                           );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'falloffStart'),      this.lights[i].falloffStart                     );
      this.gl.uniform1f(   p.getStructPosition('uLights',i,'bias'),               this.lights[i].bias                            );
    }

    this.gl.uniform1i(p.u.uNumLights, this.lights.length);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.framebuffers.gBuffer.normalTexture.bind();
    this.gl.uniform1i(program.u.uNormalTexture, 0);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.framebuffers.gBuffer.positionTexture.bind();
    this.gl.uniform1i(program.u.uPositionTexture, 1);
    this.gl.activeTexture(this.gl.TEXTURE2);
    this.framebuffers.gBuffer.colorTexture.bind();
    this.gl.uniform1i(program.u.uColorTexture, 2);
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.framebuffers.gBuffer.lineartTexture.bind();
    this.gl.uniform1i(program.u.uLineartTexture, 3);
    this.gl.activeTexture(this.gl.TEXTURE4);
    this.backgroundTexture.bind();
    this.gl.uniform1i(program.u.uBackgroundTexture, 4);

    this.gl.uniform3fv(program.u.uCameraPosition, new Float32Array([this.activeCamera.position.x, this.activeCamera.position.y, this.activeCamera.position.z]));

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }
  _drawCompiled () {
    if (!this.programs.compile.ready)
      return false;
    // draw compiled buffer, with color * light
    this.programs.compile.use();
    this.framebuffers.compiled.use();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.buffers.elements.bindData([0,1,2,0,2,3]);
    this.buffers.aPositionOut.bindData(this.programs.compile.a.aPosition, [-1,-1,1,-1,1,1,-1,1]);
    this.buffers.aUV.bindData(this.programs.compile.a.aUV, [0,0,1,0,1,1,0,1]);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.framebuffers.gBuffer.colorTexture.bind();
    this.gl.uniform1i(this.programs.compile.u.uColorTexture, 0);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.framebuffers.lightingBuffer.texture.bind();
    this.gl.uniform1i(this.programs.compile.u.uLightingTexture, 1);

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }
  _drawOutDebug () {
    if (!this.programs.out.ready)
      return false;


    // draw tiled output for debugging
    this.programs.out.use();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0,0,this.width,this.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.buffers.elements.bindData([0,1,2,0,2,3]);
    this.buffers.aPositionOut.bindData(this.programs.out.a.aPosition, [-1,1,0,1,0,0,-1,0]);
    this.buffers.aUV.bindData(this.programs.out.a.aUV, [1,1,0,1,0,0,1,0]);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.framebuffers.gBuffer.colorTexture.bind();
    this.gl.uniform1i(this.programs.out.u.uColorTexture, 0);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);

    this.buffers.aPositionOut.bindData(this.programs.out.a.aPosition, [0,1,1,1,1,0,0,0]);
    this.framebuffers.gBuffer.normalTexture.bind();
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);

    this.buffers.aPositionOut.bindData(this.programs.out.a.aPosition, [-1,0,0,0,0,-1,-1,-1]);
    // this.framebuffers.gBuffer.depthRGBTexture.bind();
    this.framebuffers.gBuffer.lineartTexture.bind();
    // this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, this.lights[0].texture);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);

    // this.buffers.aPositionOut.bindData(this.programs.out.a.aPosition, [0,0,1,0,1,-1,0,-1]);
    this.buffers.aPositionOut.bindData(this.programs.out.a.aPosition, [-1,1,1,1,1,-1,-1,-1]);
    this.framebuffers.lightingBuffer.texture.bind();
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }
  draw () {
    // first, let's draw our g-buffer
    this.framebuffers.gBuffer.use();
    this.gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this._drawObjects();
    this._drawLighting();
    //this._drawCompiled();

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this._drawOutDebug();
  }

  addObject (obj) {
    this.objects.push(obj);
    this._addSortedObject(obj);
    return obj;
  }
  _addSortedObject (obj) {
    // load texture files if needed
    if (obj.material.texturePath && !obj.material.texture) {
      obj.material.textureFromImagePath(this.gl, obj.material.texturePath);
    }
    if (obj.material.lineartPath && !obj.material.lineart) {
      obj.material.lineartFromImagePath(this.gl, obj.material.lineartPath);
    }

    // sort by the material program
    let materialProgram = GLProgram.getBy(
      this.gl,
      OBJECT_SHADERS,
      OBJECT_ATTRIBUTES,
      OBJECT_UNIFORMS,
      this._describeMaterial(obj.material));

    if (!this._materialPrograms[materialProgram._passedArguments])
      this._materialPrograms[materialProgram._passedArguments] = { program: materialProgram, objects: [] };
    this._materialPrograms[materialProgram._passedArguments].objects.push(obj);

    // wrap obj.addObject to add children to our sorted list
    obj._addObject = obj.addObject;
    obj.addObject = (function (child) {
      this._addSortedObject(child);
      obj._addObject.apply(obj, arguments);
    }).bind(this);
    obj.children.forEach((function (child) {
      this._addSortedObject(child);
    }).bind(this));
  }
  _describeMaterial (material) {
    return {
      COLOR_TEXTURE: material && material.texture ? 1 : 0,
      LINEART_TEXTURE: material && material.lineart ? 1 : 0,
      SPECULARITY_TEXTURE: material && material.specMap ? 1 : 0
    }
  }

  addLight (light) {
    this.lights.push(light);
  }

  setActiveCamera (camera) {
    this.activeCamera = camera;
    return this;
  }
}


    // this.program = GLProgram.getBy(
    //   this.gl,
    //   ['glsl/object.vs.glsl','glsl/object.fs.glsl'],
    //   ['aPosition'],
    //   ['uProjectionMatrix','uMVMatrix','uColor'],
    //   {
    //     COLOR_TEXTURE: this.material && this.material.texture ? 1 : 0
    //   });

module.exports = Scene3d;

},{"lib/gl/GBuffer":6,"lib/gl/GLArrayBuffer":7,"lib/gl/GLElementArrayBuffer":9,"lib/gl/GLFramebuffer":10,"lib/gl/GLProgram":11,"lib/gl/GLScene":12,"lib/gl/GLShader":13,"lib/gl/GLTexture2d":14,"lib/gl/Object3d":20,"lib/math/Matrix":26}],23:[function(require,module,exports){
/**
 * PerspectiveCamera
 *
 * Standard camera for 3D perspective
 *
 */
const Vector = require('lib/math/Vector');
const Matrix = require('lib/math/Matrix');
const Frustrum = require('lib/math/Frustrum');
const Positionable = require('lib/gl/Positionable');

class PerspectiveCamera extends Positionable {
  constructor (fieldOfViewY = 45, aspectRatio = 1, zNear = 1, zFar = 10) {
    super();
    this._projectionMatrix = Matrix.I(4);
    this.fieldOfViewY = fieldOfViewY;
    this.aspectRatio = aspectRatio;
    this.zNear = zNear;
    this.zFar = zFar;
  }

  get projectionMatrix () {
    if (this._needsUpdate)
      this._updateMatrix();
    return this._projectionMatrix;
  }
  get inverseMatrix () {
    if (this._needsUpdate)
      this._updateMatrix();
    return this._inverseMatrix;
  }

  _updateMatrix () {
    // determine our zAxis
    let zAxisV;
    if (this.target) {
      zAxisV = new Vector([
        this.target.x - this.position.x,
        this.target.y - this.position.y,
        this.target.z - this.position.z
      ]).normalize().multiply(-1);
    }
    else {
      // extra math is to make rotation 0,0,0 point towards positive z
      // console.log(this.rotation.y * (180 / Math.PI) % 360);
      zAxisV = new Vector([
        Math.cos(this.rotation.y + (Math.PI / 2)),
        Math.sin(this.rotation.x),
        -1 + Math.cos(this.rotation.y) + Math.cos(this.rotation.x)
      ]).normalize().multiply(-1);

      zAxisV.elements = zAxisV.elements.map((n) => Math.abs(n) < 1e-10 ? 0 : n);
      if (zAxisV.eql(new Vector([0,0,0]))) {
        zAxisV = new Vector([0,0,-1]);
      }

      // console.log(zAxisV.inspect(), Math.sin(this.rotation.x), 1 - Math.cos(this.rotation.y + (Math.PI / 2)) - Math.sin(this.rotation.x));
    }

		// cross with up to determine x
		let xAxisV = new Vector([Math.sin(this.rotation.z), Math.cos(this.rotation.z), 0]).cross(zAxisV).normalize();
    if (xAxisV.eql(new Vector([0,0,0]))) {
      xAxisV = new Vector([-1,0,0]);
    }
		// cross z and x to get y
		let yAxisV = zAxisV.cross(xAxisV).normalize().multiply(-1);

    this.positionMatrix = new Matrix([
			[xAxisV.elements[0], xAxisV.elements[1], xAxisV.elements[2], 0],
			[yAxisV.elements[0], yAxisV.elements[1], yAxisV.elements[2], 0],
			[zAxisV.elements[0], zAxisV.elements[1], zAxisV.elements[2], 0],
			[this.position.x,    this.position.y,    this.position.z,    1]
		]).inverse();


    // console.log(xAxisV, yAxisV, zAxisV, this.positionMatrix.inspect());

    let top = this.zNear * Math.tan(this.fieldOfViewY * Math.PI / 360);
		let bottom = -top;
		let left = bottom * this.aspectRatio;
		let right = top * this.aspectRatio;
    this.frustrum = new Frustrum(left, right, top, bottom, this.zNear, this.zFar);
		this.perspectiveMatrix = this.frustrum.matrix;

		this._projectionMatrix = this.positionMatrix.multiply(this.perspectiveMatrix);
    this._inverseMatrix = this._projectionMatrix.inverse();
  }
  lookAt (x,y,z) {
    this.target = {
      x: x,
      y: y,
      z: z
    }
    this._flagForUpdate();
    return this;
  }
}

module.exports = PerspectiveCamera;

},{"lib/gl/Positionable":21,"lib/math/Frustrum":25,"lib/math/Matrix":26,"lib/math/Vector":27}],24:[function(require,module,exports){
/**
 * Plane primitive mesh
 *
 * All parameters are optional, as defaults are set.
 *
 * @param {number} radius
 * @param {number} height
 * @param {number} axisDivisions
 * @param {number} heightDivisions
 * @param {boolean} cap
 */
const Mesh = require('lib/gl/Mesh');

class Plane extends Mesh {
  constructor (width = 1, height = 1, widthDivisions = 1, heightDivisions = 1) {
    let vertexArray = [],
        normalArray = [],
        elementArray = [];

    for (let w = 0; w <= widthDivisions; w++) {
      for (let h = 0; h <= heightDivisions; h++) {
        vertexArray.push(
          w * (width / widthDivisions) - (width / 2),
          h * (height / heightDivisions) - (height / 2),
          0
        );
        normalArray.push(0,0,-1);
        if (w < widthDivisions && h < heightDivisions) {
          elementArray.push(
            w * (heightDivisions + 1) + h,
            w * (heightDivisions + 1) + h + 1,
            (w + 1) * (heightDivisions + 1) + h + 1,

            w * (heightDivisions + 1) + h,
            (w + 1) * (heightDivisions + 1) + h,
            (w + 1) * (heightDivisions + 1) + h + 1
          );
        }
      }
    }

    super(vertexArray, elementArray, normalArray);
  }
}

module.exports = Plane;

},{"lib/gl/Mesh":19}],25:[function(require,module,exports){
/**
 *	generates a Frustrum matrix
 *	@param left
 *	@param right
 *	@param bottom
 *	@param top
 *	@param near
 *	@param far
 */
const Matrix = require('lib/math/Matrix');

class Frustrum {
  constructor (left, right, bottom, top, near, far) {
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.near = near;
    this.far = far;

    this._flagForUpdate();
  }

  _flagForUpdate () {
    this._needsUpdate = true;
  }

  get matrix () {
    if (this._needsUpdate) {
      var X = 2*this.near/(this.right-this.left);
      var Y = 2*this.near/(this.top-this.bottom);
      var A = (this.right+this.left)/(this.right-this.left);
      var B = (this.top+this.bottom)/(this.top-this.bottom);
      var C = -(this.far+this.near)/(this.far-this.near);
      var D = -2*this.far*this.near/(this.far-this.near);

      this._matrix = new Matrix ([[X, 0, A, 0],
                 [0, Y, B, 0],
                 [0, 0, C, D],
                 [0, 0, -1, 0]]);
    }
    return this._matrix;
  }
}

module.exports = Frustrum;

},{"lib/math/Matrix":26}],26:[function(require,module,exports){
/**
 * Matrix
 * Based heavily (i.e., largely copies) on the Sylvester library
 * Some differences, though:
 * 	 can be created with new keyword
 * 	 row/column indexes are 0 based, not 1 based
 * 	 not all methods have been ported over
 *
 * @param {array[]} elements - an array of arrays from which to build the matrix [rows[cols]]
 *
 * @method {Matrix} setElements - set the elements of this matrix
 *   @param {array[]} elements or Matrix or Vector to draw elements from
 *   @returns self
 * @method {boolean} equals
 *   @param {Matrix} comparedMatrix
 *   @returns matricesAreEqual
 * @method {Matrix} duplicate
 *   @returns {Matrix} new Matrix instance
 * @method {Matrix} map
 *   @param {Function} thing to do to each value
 *	 [@param] {Object} context for `this` keyword in function
 *	 @returns {Matrix} new Matrix instance
 * @method {boolean} isSameSizeAs
 *	 @param {Matrix} comparedMatrix
 *	 @returns {boolean}
 * @method {Matrix} add
 *   @param {Matrix} affectingMatrix
 *   @returns {Matrix} result
 * @method {Matrix} subtract
 *   @param {Matrix} affectingMatrix
 *   @returns {Matrix} result
 * @method {Matrix} multiply
 *   @param {Matrix}
 *   @returns {Matrix} product
 * @method inspect
 *   @returns {String} human readable output of matrix
 * @method flatten
 *   @returns {Array} values as a single array
 * @method transpose
 *   @returns {Matrix} this matrix transposed, meaning with rows exchanged with columns
 * @method inverse
 *   @returns {Matrix} new matrix of this one's inverse
 *
 * @property {object} dimensions
 * @property {boolean} isSingular
 * @property {boolean} isSquare
 * @property {number} determinant
 */

// settings
const PRECISION = 1e-6;

class Matrix {
	constructor (elements = []) {
		this.setElements(elements);
	}

	/**
	 * set this matrix' elements
	 * @param {array[]} elements or Matrix or Vector to draw elements from
	 * @returns {Matrix} self
	 */
	setElements (els) {
    let i,
				j,
				rows = 0,
				columns = 0,
				elements = els.elements || els; // if Vector or another Matrix passed, grab from its elements property

		// assuming we have a valid first element, start some loops to save the elements to this object
    if (elements[0] && typeof(elements[0][0]) !== 'undefined') {
      i = elements.length;
      this.elements = [];
      while (i--) {
				j = elements[i].length;
        this.elements[i] = [];
        while (j--) {
          this.elements[i][j] = elements[i][j];
        }
      }
    }
		else {
			// just a single array?  Make a 1xn matrix
	    this.elements = [];
	    for (let i = 0, n = elements.length; i < n; i++) {
	      this.elements.push([elements[i]]);
	    }
		}
		this.dimensions = {
			rows: this.elements.length || 0,
			columns: this.elements[0] && this.elements[0].length || 0
		}
    return this;
  }

	/**
	 * check if equal to another matrix
	 * @param {Matrix} comparedMatrix
	 * @returns {boolean} matricesAreEqual
	 */
	equals (matrix) {
		let M = matrix.elements || matrix;
		// make sure it's a matrix, not just arrays
		if (!M[0] || typeof(M[0][0]) === 'undefined') { M = new Matrix(M).elements; }
		// empty matrices?
		if (this.elements.length === 0 || M.length === 0)
      return this.elements.length === M.length;
		// easy part, same size?
    if (this.elements.length !== M.length) { return false; }
    if (this.elements[0].length !== M[0].length) { return false; }
		// real comparison
		let i = this.elements.length, nj = this.elements[0].length, j;
    while (i--) { j = nj;
      while (j--) {
        if (Math.abs(this.elements[i][j] - M[i][j]) > PRECISION) { return false; }
      }
    }
    return true;
	}

	/**
	 *	duplicate this matrix
	 *	@returns {Matrix} new Matrix instance
	 */
	duplicate () {
		return new Matrix (this);
	}

	/**
	 *	call a function on each element, just like Array.map
	 *	@param {Function} thing to do to each value
	 *	[@param] {Object} context for `this` keyword in function
	 *	@returns {Matrix} new Matrix instance
	 */
	map (fn, context) {
		if (this.elements.length === 0) { return new Matrix([]); }
    let els = [], i = this.elements.length, nj = this.elements[0].length, j;
    while (i--) { j = nj;
      els[i] = [];
      while (j--) {
        els[i][j] = fn.call(context, this.elements[i][j], i, j);
      }
    }
    return new Matrix(els);
	}

	/**
	 *	check if same size as passed matrix
	 *	@param {Matrix} compared matrix
	 *	@returns {boolean}
	 */
	isSameSizeAs (matrix) {
		if (!(matrix instanceof Matrix)) {
			matrix = new Matrix(matrix);
		}
		return (this.dimensions.rows === matrix.dimensions.rows && this.dimensions.columns === matrix.dimensions.columns);
	}

	/**
	 *	add
	 *	@param {Matrix} to add to this one
	 *	@returns {Matrix} new Matrix of result
	 */
	add (matrix) {
		if (this.elements.length === 0) return this.map(function(x) { return x });
    let M = matrix.elements || matrix;
    if (typeof(M[0][0]) === 'undefined') { M = new Matrix(M).elements; }
    if (!this.isSameSizeAs(M)) { return null; } // can only add same dimensioned matrices
    return this.map(function(x, i, j) { return x + M[i][j]; });
	}

	/**
	 * subtract
	 * @param {Matrix} to subtract from this one
	 * @returns {Matrix} new Matrix of result
	 */
	subtract (matrix) {
		if (this.elements.length === 0) return this.map(function(x) { return x });
    let M = matrix.elements || matrix;
    if (typeof(M[0][0]) === 'undefined') { M = new Matrix(M).elements; }
    if (!this.isSameSizeAs(M)) { return null; }
    return this.map(function(x, i, j) { return x - M[i][j]; });
	}

	/**
	 * .canMultiplyFromLeft
	 * @param {Matrix}
	 * @returns {boolean} if matrix is compatible to multiply with this one
	 */
	canMultiplyFromLeft (matrix) {
    if (this.elements.length === 0) { return false; }
    if (!(matrix instanceof Matrix)) { matrix = new Matrix(matrix); }
    // this.columns should equal matrix.rows
    return (this.dimensions.columns === matrix.dimensions.rows);
  }

	/**
	 *	.multiply
	 *	@param {Matrix}
	 *	@returns {Matrix} product
	 */
  multiply (matrix) {
    if (this.elements.length === 0) { return null; }
    if (!matrix.elements) {
      return this.map(function(x) { return x * matrix; });
    }
    if (!this.canMultiplyFromLeft(matrix)) { return null; }
    let M = matrix.elements || matrix;
    if (typeof(M[0][0]) === 'undefined') { M = new Matrix(M).elements; }
    let i = this.elements.length,
				nj = M[0].length,
				j;
    let cols = this.elements[0].length,
				c,
				elements = [],
				sum;
    while (i--) { j = nj;
      elements[i] = [];
      while (j--) {
				c = cols;
        sum = 0;
        while (c--) {
          sum += this.elements[i][c] * M[c][j];
        }
        elements[i][j] = sum;
      }
    }
    return new Matrix(elements);
  }

	/**
	 *	.inspect
	 *	@returns {String} human readable output of matrix
	 */
	inspect () {
    let matrix_rows = [];
    let n = this.elements.length;
    if (n === 0) return '[]';
    for (let i = 0; i < n; i++) {
      matrix_rows.push(this.elements[i].join(' '));
    }
    return matrix_rows.join('\n');
  }

	/**
	 *	flatten
	 *	@returns {Array} values as a single array
	 */
	flatten (forceType) {
		let out = [];
		for (let i = 0; i < this.elements.length; i++) {
			out = out.concat(this.elements[i]);
		}
		return new Float32Array(out);
	}

	/**
	 *	transpose
	 *	@returns {Matrix} this matrix transposed, meaning with rows exchanged with columns
	 */
	transpose () {
    if (this.elements.length === 0) return new Matrix([]);
    let rows = this.elements.length, cols = this.elements[0].length, j;
    let elements = [], i = cols;
    while (i--) { j = rows;
      elements[i] = [];
      while (j--) {
        elements[i][j] = this.elements[j][i];
      }
    }
    return new Matrix(elements);
  }

	/**
	 *	useful for internal purposes...
	 */
	toRightTriangular () {
    if (this.elements.length === 0) return new Matrix([]);
    let M = this.dup(), els;
    let n = this.elements.length, i, j, np = this.elements[0].length, p;
    for (i = 0; i < n; i++) {
      if (M.elements[i][i] === 0) {
        for (j = i + 1; j < n; j++) {
          if (M.elements[j][i] !== 0) {
            els = [];
            for (p = 0; p < np; p++) { els.push(M.elements[i][p] + M.elements[j][p]); }
            M.elements[i] = els;
            break;
          }
        }
      }
      if (M.elements[i][i] !== 0) {
        for (j = i + 1; j < n; j++) {
          let multiplier = M.elements[j][i] / M.elements[i][i];
          els = [];
          for (p = 0; p < np; p++) {
            // Elements with column numbers up to an including the number of the
            // row that we're subtracting can safely be set straight to zero,
            // since that's the point of this routine and it avoids having to
            // loop over and correct rounding errors later
            els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
          }
          M.elements[j] = els;
        }
      }
    }
    return M;
  }

	/**
	 *	inverse
	 *	@returns {Matrix} new matrix of this one's inverse
	 */
	inverse () {
    if (this.elements.length === 0) { return null; }
    if (!this.isSquare || this.isSingular) { return null; }
    let n = this.elements.length, i= n, j;
    let M = this.augment(Matrix.I(n)).toRightTriangular();
    let np = M.elements[0].length, p, els, divisor;
    let inverse_elements = [], new_element;
    // Matrix is non-singular so there will be no zeros on the
    // diagonal. Cycle through rows from last to first.
    while (i--) {
      // First, normalise diagonal elements to 1
      els = [];
      inverse_elements[i] = [];
      divisor = M.elements[i][i];
      for (p = 0; p < np; p++) {
        new_element = M.elements[i][p] / divisor;
        els.push(new_element);
        // Shuffle off the current row of the right hand side into the results
        // array as it will not be modified by later runs through this loop
        if (p >= n) { inverse_elements[i].push(new_element); }
      }
      M.elements[i] = els;
      // Then, subtract this row from those above it to give the identity matrix
      // on the left hand side
      j = i;
      while (j--) {
        els = [];
        for (p = 0; p < np; p++) {
          els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
        }
        M.elements[j] = els;
      }
    }
    return new Matrix(inverse_elements);
  }

	augment (matrix) {
    if (this.elements.length === 0) { return this.dup(); }
    let M = matrix.elements || matrix;
    if (typeof(M[0][0]) === 'undefined') { M = new Matrix(M).elements; }
    let T = this.dup(), cols = T.elements[0].length;
    let i = T.elements.length, nj = M[0].length, j;
    if (i !== M.length) { return null; }
    while (i--) { j = nj;
      while (j--) {
        T.elements[i][cols + j] = M[i][j];
      }
    }
    return T;
  }

	////////////////////////////
	// derived properties
	////////////////////////////
	get isSingular () {
    return (this.isSquare && this.determinant === 0);
  }

	get isSquare () {
    let cols = (this.elements.length === 0) ? 0 : this.elements[0].length;
    return (this.elements.length === cols);
  }

	get determinant () {
    if (this.elements.length === 0) { return 1; }
    if (!this.isSquare) { return null; }
    let M = this.toRightTriangular();
    let det = M.elements[0][0], n = M.elements.length;
    for (let i = 1; i < n; i++) {
      det = det * M.elements[i][i];
    }
    return det;
  }

	/////////////////////////
	// statics
	/////////////////////////
	/**
	 *	.create
	 *	@param {Array} elements - an array of arrays from which to build the matrix [rows[cols]]
	 *	@returns shiny new Matrix
	 */
	static create (elements) {
		return new Matrix (elements);
	}
	/**
	 *	.I
	 *	@param {int} size
	 *	@returns {Matrix} square identity matrix of `n` size
	 */
	static I (n) {
	  var els = [], i = n, j;
	  while (i--) { j = n;
	    els[i] = [];
	    while (j--) {
	      els[i][j] = (i === j) ? 1 : 0;
	    }
	  }
	  return new Matrix(els);
	};
	static identity (...args) {
		return Matrix.I.apply(args);
	}

	/**
	 *	rotations
	 */
	static rotation (angle, a /* axis vector */) {
		if (!a) {
	    return Matrix.create([
	      [Math.cos(angle),  -Math.sin(angle)],
	      [Math.sin(angle),   Math.cos(angle)]
	    ]);
	  }
	  var axis = a.dup();
	  if (axis.elements.length !== 3) { return null; }
	  var mod = axis.modulus();
	  var x = axis.elements[0]/mod, y = axis.elements[1]/mod, z = axis.elements[2]/mod;
	  var s = Math.sin(angle), c = Math.cos(angle), t = 1 - c;
	  // Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
	  // That proof rotates the co-ordinate system so angle becomes -angle and sin
	  // becomes -sin here.
	  return Matrix.create([
	    [ t*x*x + c, t*x*y - s*z, t*x*z + s*y ],
	    [ t*x*y + s*z, t*y*y + c, t*y*z - s*x ],
	    [ t*x*z - s*y, t*y*z + s*x, t*z*z + c ]
	  ]);
	}
	static rotationX (angle) {
		var c = Math.cos(angle), s = Math.sin(angle);
	  return Matrix.create([
	    [  1,  0,  0, 0 ],
	    [  0,  c, -s, 0 ],
	    [  0,  s,  c, 0 ],
			[	 0,  0,  0, 1 ]
	  ]);
	}
	static rotationY (angle) {
	  var c = Math.cos(angle), s = Math.sin(angle);
	  return Matrix.create([
	    [  c,  0,  -s, 0 ],
	    [  0,  1,  0, 0 ],
	    [  s,  0,  c, 0 ],
			[	 0,  0,  0, 1 ]
	  ]);
	};
	static rotationZ (angle) {
	  var c = Math.cos(angle), s = Math.sin(angle);
	  return Matrix.create([
	    [  c, -s,  0,	0 ],
	    [  s,  c,  0,	0 ],
	    [  0,  0,  1,	0 ],
			[	 0,	 0,  0, 1 ]
	  ]);
	};
	static rotation3d (x,y,z) {
		return Matrix.rotationZ(z).multiply(Matrix.rotationX(x)).multiply(Matrix.rotationY(y));
	}
	/**
	 *	translation
	 */
	static translation3d (x,y,z) {
		return Matrix.create([
			[1, 0, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 1, 0],
			[x, y, z, 1]
		]);
	}
}

// aliases
Matrix.prototype.eql = Matrix.prototype.equals;
Matrix.prototype.dup = Matrix.prototype.duplicate;
Matrix.prototype.x = Matrix.prototype.multiply;

module.exports = Matrix;

},{}],27:[function(require,module,exports){
/**
 * Vector class
 *
 * Vector based maths.
 * Based heavily (i.e., largely copies) on the Sylvester library
 * Some differences, though:
 * 	can be created with new keyword
 * 	indexes are 0 based, not 1 based
 */

// settings
var PRECISION = 1e-6;

class Vector {
  constructor (elements = []) {
    this.setElements(elements);
  }

  /**
	 *	.setElements
	 *	@param {Array} elements
	 */
	setElements (els) {
		this.elements = (els.elements || els).slice();
    return this;
	}

	e (i) {
    return (i < 1 || i > this.elements.length) ? null : this.elements[i-1];
  }

  dimensions () {
    return this.elements.length;
  }

  modulus () {
    return Math.sqrt(this.dot(this));
  }

  eql (vector) {
    var n = this.elements.length;
    var V = vector.elements || vector;
    if (n !== V.length) { return false; }
    while (n--) {
      if (Math.abs(this.elements[n] - V[n]) > PRECISION) { return false; }
    }
    return true;
  }

  dup () {
    return Vector.create(this.elements);
  }

  map (fn, context) {
    var elements = [];
    this.each(function(x, i) {
      elements.push(fn.call(context, x, i));
    });
    return Vector.create(elements);
  }

  forEach (fn, context) {
    var n = this.elements.length;
    for (var i = 0; i < n; i++) {
      fn.call(context, this.elements[i], i+1);
    }
  }

  // alias of forEach
  each () {
    this.forEach.apply(this, arguments);
  }

  toUnitVector () {
    var r = this.modulus();
    if (r === 0) { return this.dup(); }
    return this.map(function(x) { return x/r; });
  }

  angleFrom (vector) {
    var V = vector.elements || vector;
    var n = this.elements.length, k = n, i;
    if (n !== V.length) { return null; }
    var dot = 0, mod1 = 0, mod2 = 0;
    // Work things out in parallel to save time
    this.each(function(x, i) {
      dot += x * V[i-1];
      mod1 += x * x;
      mod2 += V[i-1] * V[i-1];
    });
    mod1 = Math.sqrt(mod1); mod2 = Math.sqrt(mod2);
    if (mod1*mod2 === 0) { return null; }
    var theta = dot / (mod1*mod2);
    if (theta < -1) { theta = -1; }
    if (theta > 1) { theta = 1; }
    return Math.acos(theta);
  }

  isParallelTo (vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (angle <= PRECISION);
  }

  isAntiparallelTo (vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (Math.abs(angle - Math.PI) <= PRECISION);
  }

  isPerpendicularTo (vector) {
    var dot = this.dot(vector);
    return (dot === null) ? null : (Math.abs(dot) <= PRECISION);
  }

  add (vector) {
    var V = vector.elements || vector;
    if (this.elements.length !== V.length) { return null; }
    return this.map(function(x, i) { return x + V[i-1]; });
  }

  subtract (vector) {
    var V = vector.elements || vector;
    if (this.elements.length !== V.length) { return null; }
    return this.map(function(x, i) { return x - V[i-1]; });
  }

  multiply (k) {
    return this.map(function(x) { return x*k; });
  }

  dot (vector) {
    var V = vector.elements || vector;
    var i, product = 0, n = this.elements.length;
    if (n !== V.length) { return null; }
    while (n--) { product += this.elements[n] * V[n]; }
    return product;
  }

  cross (vector) {
    var B = vector.elements || vector;
    if (this.elements.length !== 3 || B.length !== 3) { return null; }
    var A = this.elements;
    return Vector.create([
      (A[1] * B[2]) - (A[2] * B[1]),
      (A[2] * B[0]) - (A[0] * B[2]),
      (A[0] * B[1]) - (A[1] * B[0])
    ]);
  }

  max () {
    var m = 0, i = this.elements.length;
    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
    }
    return m;
  }

  indexOf (x) {
    var index = null, n = this.elements.length;
    for (var i = 0; i < n; i++) {
      if (index === null && this.elements[i] === x) {
        index = i + 1;
      }
    }
    return index;
  }

  round () {
    return this.map(function(x) { return Math.round(x); });
  }

  snapTo (x) {
    return this.map(function(y) {
      return (Math.abs(y - x) <= PRECISION) ? x : y;
    });
  }

  distanceFrom (obj) {
    if (obj.anchor || (obj.start && obj.end)) { return obj.distanceFrom(this); }
    var V = obj.elements || obj;
    if (V.length !== this.elements.length) { return null; }
    var sum = 0, part;
    this.each(function(x, i) {
      part = x - V[i-1];
      sum += part * part;
    });
    return Math.sqrt(sum);
  }

  liesOn (line) {
    return line.contains(this);
  }

  liesIn (plane) {
    return plane.contains(this);
  }

  reflectionIn (obj) {
    if (obj.anchor) {
      // obj is a plane or line
      var P = this.elements.slice();
      var C = obj.pointClosestTo(P).elements;
      return Vector.create([C[0] + (C[0] - P[0]), C[1] + (C[1] - P[1]), C[2] + (C[2] - (P[2] || 0))]);
    } else {
      // obj is a point
      var Q = obj.elements || obj;
      if (this.elements.length !== Q.length) { return null; }
      return this.map(function(x, i) { return Q[i-1] + (Q[i-1] - x); });
    }
  }

  to3D () {
    var V = this.dup();
    switch (V.elements.length) {
      case 3: break;
      case 2: V.elements.push(0); break;
      default: return null;
    }
    return V;
  }

  inspect () {
    return '[' + this.elements.join(', ') + ']';
  }

	normalize  () {
		var len = Math.sqrt(
			this.elements[0] * this.elements[0] +
			this.elements[1] * this.elements[1] +
			this.elements[2] * this.elements[2]);
		if (len > PRECISION) {
			return Vector.create([
				this.elements[0] / len,
				this.elements[1] / len,
				this.elements[2] / len
			]);
		}
		else
			return Vector.create([0,0,0]);
	}

  static create (elements) {
    return new Vector(elements);
  }
}

module.exports = Vector;

},{}],28:[function(require,module,exports){
module.exports={
  "vertices": [
    0,
    -16.758371,
    0,
    2.31996,
    6.525795,
    -11.663229,
    0,
    16.692755,
    -10.210489,
    1.991968,
    16.692755,
    -10.014298,
    3.907386,
    16.692755,
    -9.433263,
    5.672644,
    16.692755,
    -8.489712,
    7.219906,
    16.692755,
    -7.219907,
    8.489712,
    16.692755,
    -5.672644,
    9.433262,
    16.692755,
    -3.907386,
    10.014297,
    16.692755,
    -1.991969,
    10.210488,
    16.692755,
    -0.000002,
    10.014298,
    16.692755,
    1.991966,
    9.433263,
    16.692755,
    3.907383,
    8.489712,
    16.692755,
    5.672643,
    7.219906,
    16.692755,
    7.219905,
    5.672644,
    16.692755,
    8.489712,
    3.907383,
    16.692755,
    9.433262,
    1.991965,
    16.692755,
    10.014297,
    -0.000003,
    16.692755,
    10.210487,
    -1.991972,
    16.692755,
    10.014296,
    -3.90739,
    16.692755,
    9.433259,
    -5.672648,
    16.692755,
    8.489708,
    -7.219911,
    16.692755,
    7.219901,
    -8.489715,
    16.692755,
    5.672637,
    -9.433265,
    16.692755,
    3.907377,
    -10.014299,
    16.692755,
    1.991958,
    -10.210488,
    16.692755,
    -0.000011,
    -10.014296,
    16.692755,
    -1.991979,
    -9.433257,
    16.692755,
    -3.907396,
    -8.489704,
    16.692755,
    -5.672655,
    -7.219897,
    16.692755,
    -7.219916,
    -5.672632,
    16.692755,
    -8.489719,
    -3.907371,
    16.692755,
    -9.433269,
    -1.991952,
    16.692755,
    -10.0143,
    -2.084152,
    16.834354,
    10.477717,
    -0.000003,
    16.834354,
    10.682989,
    2.084146,
    16.834354,
    10.477719,
    4.088202,
    16.834354,
    9.869796,
    5.935151,
    16.834354,
    8.882582,
    7.554015,
    16.834354,
    7.554014,
    8.882583,
    16.834354,
    5.93515,
    9.869797,
    16.834354,
    4.088201,
    10.47772,
    16.834354,
    2.084146,
    10.68299,
    16.834354,
    -0.000002,
    10.477719,
    16.834354,
    -2.084149,
    9.869796,
    16.834354,
    -4.088204,
    8.882583,
    16.834354,
    -5.935152,
    7.554015,
    16.834354,
    -7.554015,
    5.935152,
    16.834354,
    -8.882583,
    -4.088189,
    16.834354,
    -9.869802,
    -5.935139,
    16.834354,
    -8.882591,
    -7.554006,
    16.834354,
    -7.554025,
    -8.882574,
    16.834354,
    -5.935163,
    -9.869791,
    16.834354,
    -4.088215,
    -10.477717,
    16.834354,
    -2.08416,
    -10.68299,
    16.834354,
    -0.000011,
    -10.477721,
    16.834354,
    2.084138,
    -9.869799,
    16.834354,
    4.088195,
    -8.882586,
    16.834354,
    5.935145,
    -7.554019,
    16.834354,
    7.554009,
    -5.935156,
    16.834354,
    8.882578,
    -4.088208,
    16.834354,
    9.869793,
    4.088204,
    16.834354,
    -9.869797,
    0,
    15.397423,
    -11.011142,
    0,
    16.834354,
    -10.682991,
    2.084148,
    16.834354,
    -10.47772,
    0,
    13.183923,
    -11.024074,
    2.15069,
    13.183923,
    -10.812249,
    4.21873,
    13.183923,
    -10.184916,
    6.124647,
    13.183923,
    -9.166183,
    7.795197,
    13.183923,
    -7.795197,
    9.166183,
    13.183923,
    -6.124647,
    10.184916,
    13.183923,
    -4.21873,
    10.812247,
    13.183923,
    -2.150691,
    11.024073,
    13.183923,
    -0.000001,
    10.812249,
    13.183923,
    2.150688,
    10.184916,
    13.183923,
    4.218728,
    9.166183,
    13.183923,
    6.124646,
    7.795197,
    13.183923,
    7.795197,
    6.124647,
    13.183923,
    9.166183,
    4.218729,
    13.183923,
    10.184916,
    2.150687,
    13.183923,
    10.812248,
    -0.000003,
    13.183923,
    11.024072,
    -2.150694,
    13.183923,
    10.812246,
    -4.218735,
    13.183923,
    10.184913,
    -6.124652,
    13.183923,
    9.166178,
    -7.795202,
    13.183923,
    7.795191,
    -9.166186,
    13.183923,
    6.12464,
    -10.184919,
    13.183923,
    4.218721,
    -10.81225,
    13.183923,
    2.15068,
    -11.024073,
    13.183923,
    -0.000011,
    -10.812246,
    13.183923,
    -2.150702,
    -10.184911,
    13.183923,
    -4.218742,
    -9.166174,
    13.183923,
    -6.124659,
    -7.795187,
    13.183923,
    -7.795207,
    -6.124634,
    13.183923,
    -9.166191,
    -4.218715,
    13.183923,
    -10.184923,
    -2.150673,
    13.183923,
    -10.812251,
    0,
    15.275227,
    -10.534209,
    2.055122,
    15.275227,
    -10.331798,
    4.031268,
    15.275227,
    -9.732342,
    5.852493,
    15.275227,
    -8.758876,
    7.448811,
    15.275227,
    -7.448811,
    8.758877,
    15.275227,
    -5.852493,
    9.732341,
    15.275227,
    -4.031268,
    10.331797,
    15.275227,
    -2.055123,
    10.534208,
    15.275227,
    -0.000001,
    10.331798,
    15.275227,
    2.05512,
    9.732342,
    15.275227,
    4.031265,
    8.758877,
    15.275227,
    5.852492,
    7.448811,
    15.275227,
    7.44881,
    5.852493,
    15.275227,
    8.758875,
    4.031265,
    15.275227,
    9.732341,
    2.05512,
    15.275227,
    10.331797,
    -0.000003,
    15.275227,
    10.534207,
    -2.055126,
    15.275227,
    10.331795,
    -4.031272,
    15.275227,
    9.732338,
    -5.852498,
    15.275227,
    8.758871,
    -7.448816,
    15.275227,
    7.448806,
    -8.758879,
    15.275227,
    5.852487,
    -9.732344,
    15.275227,
    4.031258,
    -10.331799,
    15.275227,
    2.055113,
    -10.534208,
    15.275227,
    -0.000011,
    -10.331795,
    15.275227,
    -2.055134,
    -9.732336,
    15.275227,
    -4.03128,
    -8.758867,
    15.275227,
    -5.852504,
    -7.448802,
    15.275227,
    -7.448821,
    -5.852481,
    15.275227,
    -8.758884,
    -4.031252,
    15.275227,
    -9.732347,
    -2.055106,
    15.275227,
    -10.3318,
    0,
    11.444892,
    -11.270176,
    -2.198685,
    11.444892,
    -11.053625,
    -4.312894,
    11.444892,
    -10.412292,
    -6.261361,
    11.444892,
    -9.370817,
    -7.969208,
    11.444892,
    -7.969227,
    -9.3708,
    11.444892,
    -6.261385,
    -10.412279,
    11.444892,
    -4.312922,
    -11.053619,
    11.444892,
    -2.198714,
    -11.270175,
    11.444892,
    -0.000011,
    -11.053624,
    11.444892,
    2.198692,
    -10.412288,
    11.444892,
    4.3129,
    -9.370813,
    11.444892,
    6.261368,
    -7.969223,
    11.444892,
    7.969213,
    -6.261379,
    11.444892,
    9.370804,
    -4.312914,
    11.444892,
    10.412281,
    -2.198707,
    11.444892,
    11.05362,
    -0.000004,
    11.444892,
    11.270175,
    2.1987,
    11.444892,
    11.053622,
    4.312908,
    11.444892,
    10.412284,
    6.261374,
    11.444892,
    9.370809,
    7.969217,
    11.444892,
    7.969218,
    9.37081,
    11.444892,
    6.261373,
    10.412285,
    11.444892,
    4.312907,
    11.053623,
    11.444892,
    2.1987,
    11.270175,
    11.444892,
    -0.000001,
    11.053621,
    11.444892,
    -2.198703,
    10.412284,
    11.444892,
    -4.31291,
    9.37081,
    11.444892,
    -6.261374,
    7.969217,
    11.444892,
    -7.969217,
    6.261374,
    11.444892,
    -9.370809,
    4.31291,
    11.444892,
    -10.412284,
    2.198702,
    11.444892,
    -11.053623,
    4.550766,
    6.525795,
    -10.986521,
    6.606688,
    6.525795,
    -9.887609,
    8.408718,
    6.525795,
    -8.408719,
    9.887609,
    6.525795,
    -6.606688,
    10.986522,
    6.525795,
    -4.550766,
    11.663228,
    6.525795,
    -2.319961,
    11.891725,
    6.525795,
    -0.000001,
    11.663229,
    6.525795,
    2.319959,
    10.986522,
    6.525795,
    4.550764,
    9.887609,
    6.525795,
    6.606687,
    8.408718,
    6.525795,
    8.408718,
    6.606688,
    6.525795,
    9.887609,
    4.550765,
    6.525795,
    10.986522,
    2.319958,
    6.525795,
    11.663229,
    -0.000004,
    6.525795,
    11.891725,
    -2.319965,
    6.525795,
    11.663227,
    -4.550771,
    6.525795,
    10.986518,
    -6.606694,
    6.525795,
    9.887605,
    -8.408724,
    6.525795,
    8.408712,
    -9.887613,
    6.525795,
    6.606681,
    -10.986526,
    6.525795,
    4.550756,
    -11.663231,
    6.525795,
    2.31995,
    -11.891725,
    6.525795,
    -0.000012,
    -11.663226,
    6.525795,
    -2.319973,
    -10.986515,
    6.525795,
    -4.550779,
    -9.8876,
    6.525795,
    -6.6067,
    -8.408708,
    6.525795,
    -8.40873,
    -6.606675,
    6.525795,
    -9.887618,
    -4.55075,
    6.525795,
    -10.986529,
    -2.319943,
    6.525795,
    -11.663232,
    0,
    6.525795,
    -11.891725,
    2.286239,
    8.274249,
    -11.493701,
    4.48462,
    8.274249,
    -10.826827,
    6.510658,
    8.274249,
    -9.74389,
    8.286496,
    8.274249,
    -8.286496,
    9.743891,
    8.274249,
    -6.510658,
    10.826828,
    8.274249,
    -4.48462,
    11.4937,
    8.274249,
    -2.28624,
    11.718874,
    8.274249,
    -0.000001,
    11.493701,
    8.274249,
    2.286237,
    10.826829,
    8.274249,
    4.484617,
    9.743891,
    8.274249,
    6.510657,
    8.286496,
    8.274249,
    8.286496,
    6.510658,
    8.274249,
    9.74389,
    4.484618,
    8.274249,
    10.826828,
    2.286236,
    8.274249,
    11.493701,
    -0.000004,
    8.274249,
    11.718874,
    -2.286244,
    8.274249,
    11.493699,
    -4.484624,
    8.274249,
    10.826825,
    -6.510664,
    8.274249,
    9.743885,
    -8.286502,
    8.274249,
    8.28649,
    -9.743894,
    8.274249,
    6.510651,
    -10.826832,
    8.274249,
    4.48461,
    -11.493703,
    8.274249,
    2.286229,
    -11.718874,
    8.274249,
    -0.000012,
    -11.493698,
    8.274249,
    -2.286252,
    -10.826822,
    8.274249,
    -4.484632,
    -9.743881,
    8.274249,
    -6.51067,
    -8.286485,
    8.274249,
    -8.286508,
    -6.510644,
    8.274249,
    -9.743897,
    -4.484603,
    8.274249,
    -10.826836,
    -2.286222,
    8.274249,
    -11.493704,
    0,
    8.274249,
    -11.718876,
    -2.084132,
    16.834354,
    -10.477723,
    0,
    6.485762,
    -12.394156,
    2.383797,
    8.25815,
    -11.984158,
    4.675986,
    8.25815,
    -11.288828,
    6.788479,
    8.25815,
    -10.159678,
    8.640096,
    8.25815,
    -8.640096,
    10.159679,
    8.25815,
    -6.788479,
    11.288829,
    8.25815,
    -4.675986,
    11.984157,
    8.25815,
    -2.383797,
    12.21894,
    8.25815,
    -0.000001,
    11.984158,
    8.25815,
    2.383795,
    11.28883,
    8.25815,
    4.675983,
    10.159679,
    8.25815,
    6.788478,
    8.640096,
    8.25815,
    8.640096,
    6.788479,
    8.25815,
    10.159679,
    4.675984,
    8.25815,
    11.288829,
    2.383794,
    8.25815,
    11.984158,
    -0.000004,
    8.25815,
    12.21894,
    -2.383802,
    8.25815,
    11.984156,
    -4.675992,
    8.25815,
    11.288825,
    -6.788485,
    8.25815,
    10.159674,
    -8.640101,
    8.25815,
    8.64009,
    -10.159682,
    8.25815,
    6.788472,
    -11.288833,
    8.25815,
    4.675976,
    -11.984159,
    8.25815,
    2.383786,
    -12.21894,
    8.25815,
    -0.000012,
    -11.984155,
    8.25815,
    -2.38381,
    -11.288821,
    8.25815,
    -4.676,
    -10.15967,
    8.25815,
    -6.788492,
    -8.640084,
    8.25815,
    -8.640108,
    -6.788465,
    8.25815,
    -10.159686,
    -4.675969,
    8.25815,
    -11.288836,
    -2.383779,
    8.25815,
    -11.98416,
    0,
    11.48649,
    -11.762383,
    0,
    13.249328,
    -11.512911,
    -2.24604,
    13.249328,
    -11.291697,
    -4.405784,
    13.249328,
    -10.63655,
    -6.396217,
    13.249328,
    -9.572645,
    -8.140847,
    13.249328,
    -8.140868,
    -9.572627,
    13.249328,
    -6.396243,
    -10.636538,
    13.249328,
    -4.405813,
    -11.291691,
    13.249328,
    -2.24607,
    -11.512911,
    13.249328,
    -0.000012,
    -11.291696,
    13.249328,
    2.246047,
    -10.636546,
    13.249328,
    4.40579,
    -9.57264,
    13.249328,
    6.396224,
    -8.140864,
    13.249328,
    8.140852,
    -6.396236,
    13.249328,
    9.572631,
    -4.405805,
    13.249328,
    10.636539,
    -2.246062,
    13.249328,
    11.291692,
    -0.000004,
    13.249328,
    11.512909,
    2.246055,
    13.249328,
    11.291694,
    4.405798,
    13.249328,
    10.636543,
    6.396231,
    13.249328,
    9.572637,
    8.140857,
    13.249328,
    8.140858,
    9.572638,
    13.249328,
    6.39623,
    10.636543,
    13.249328,
    4.405798,
    11.291695,
    13.249328,
    2.246056,
    11.512911,
    13.249328,
    -0.000001,
    11.291693,
    13.249328,
    -2.246058,
    10.636543,
    13.249328,
    -4.4058,
    9.572637,
    13.249328,
    -6.396231,
    8.140857,
    13.249328,
    -8.140858,
    6.396231,
    13.249328,
    -9.572636,
    4.405801,
    13.249328,
    -10.636543,
    2.246058,
    13.249328,
    -11.291695,
    2.148167,
    15.397423,
    -10.799566,
    4.213782,
    15.397423,
    -10.172971,
    6.117463,
    15.397423,
    -9.155431,
    7.786053,
    15.397423,
    -7.786053,
    9.155432,
    15.397423,
    -6.117463,
    10.17297,
    15.397423,
    -4.213782,
    10.799565,
    15.397423,
    -2.148168,
    11.011141,
    15.397423,
    -0.000002,
    10.799566,
    15.397423,
    2.148165,
    10.172971,
    15.397423,
    4.213779,
    9.155432,
    15.397423,
    6.117462,
    7.786053,
    15.397423,
    7.786053,
    6.117463,
    15.397423,
    9.15543,
    4.213779,
    15.397423,
    10.17297,
    2.148165,
    15.397423,
    10.799565,
    -0.000003,
    15.397423,
    11.01114,
    -2.148172,
    15.397423,
    10.799563,
    -4.213787,
    15.397423,
    10.172967,
    -6.117467,
    15.397423,
    9.155426,
    -7.786059,
    15.397423,
    7.786048,
    -9.155435,
    15.397423,
    6.117456,
    -10.172973,
    15.397423,
    4.213772,
    -10.799567,
    15.397423,
    2.148157,
    -11.011141,
    15.397423,
    -0.000011,
    -10.799563,
    15.397423,
    -2.148179,
    -10.172965,
    15.397423,
    -4.213794,
    -9.155422,
    15.397423,
    -6.117475,
    -7.786044,
    15.397423,
    -7.786064,
    -6.11745,
    15.397423,
    -9.155439,
    -4.213766,
    15.397423,
    -10.172976,
    -2.148151,
    15.397423,
    -10.799569,
    -2.294709,
    11.48649,
    -11.536375,
    -4.501253,
    11.48649,
    -10.867031,
    -6.534816,
    11.48649,
    -9.780073,
    -8.31725,
    11.48649,
    -8.317271,
    -9.780055,
    11.48649,
    -6.534842,
    -10.867018,
    11.48649,
    -4.501282,
    -11.536369,
    11.48649,
    -2.294739,
    -11.762382,
    11.48649,
    -0.000012,
    -11.536374,
    11.48649,
    2.294716,
    -10.867027,
    11.48649,
    4.501259,
    -9.780069,
    11.48649,
    6.534822,
    -8.317267,
    11.48649,
    8.317255,
    -6.534835,
    11.48649,
    9.780059,
    -4.501274,
    11.48649,
    10.867021,
    -2.294732,
    11.48649,
    11.53637,
    -0.000004,
    11.48649,
    11.762382,
    2.294724,
    11.48649,
    11.536372,
    4.501267,
    11.48649,
    10.867023,
    6.53483,
    11.48649,
    9.780065,
    8.31726,
    11.48649,
    8.317261,
    9.780066,
    11.48649,
    6.534829,
    10.867024,
    11.48649,
    4.501266,
    11.536373,
    11.48649,
    2.294725,
    11.762382,
    11.48649,
    -0.000001,
    11.536371,
    11.48649,
    -2.294728,
    10.867023,
    11.48649,
    -4.501269,
    9.780065,
    11.48649,
    -6.53483,
    8.31726,
    11.48649,
    -8.31726,
    6.53483,
    11.48649,
    -9.780064,
    4.501269,
    11.48649,
    -10.867023,
    2.294727,
    11.48649,
    -11.536373,
    2.41798,
    6.485762,
    -12.156006,
    4.743039,
    6.485762,
    -11.450707,
    6.885824,
    6.485762,
    -10.305365,
    8.763991,
    6.485762,
    -8.763991,
    10.305366,
    6.485762,
    -6.885824,
    11.450708,
    6.485762,
    -4.743038,
    12.156005,
    6.485762,
    -2.41798,
    12.394156,
    6.485762,
    -0.000001,
    12.156006,
    6.485762,
    2.417978,
    11.450708,
    6.485762,
    4.743036,
    10.305366,
    6.485762,
    6.885823,
    8.763991,
    6.485762,
    8.763991,
    6.885824,
    6.485762,
    10.305366,
    4.743037,
    6.485762,
    11.450708,
    2.417977,
    6.485762,
    12.156006,
    -0.000004,
    6.485762,
    12.394156,
    -2.417985,
    6.485762,
    12.156004,
    -4.743043,
    6.485762,
    11.450704,
    -6.88583,
    6.485762,
    10.305361,
    -8.763997,
    6.485762,
    8.763986,
    -10.305369,
    6.485762,
    6.885817,
    -11.450712,
    6.485762,
    4.743028,
    -12.156008,
    6.485762,
    2.417969,
    -12.394156,
    6.485762,
    -0.000012,
    -12.156003,
    6.485762,
    -2.417993,
    -11.450701,
    6.485762,
    -4.743052,
    -10.305356,
    6.485762,
    -6.885837,
    -8.76398,
    6.485762,
    -8.764004,
    -6.88581,
    6.485762,
    -10.305374,
    -4.743021,
    6.485762,
    -11.450716,
    -2.417961,
    6.485762,
    -12.156009,
    0,
    8.25815,
    -12.218942,
    0,
    16.758371,
    0,
    2.31996,
    -6.525795,
    -11.663229,
    0,
    -16.692755,
    -10.210489,
    1.991968,
    -16.692755,
    -10.014298,
    3.907386,
    -16.692755,
    -9.433263,
    5.672644,
    -16.692755,
    -8.489712,
    7.219906,
    -16.692755,
    -7.219907,
    8.489712,
    -16.692755,
    -5.672644,
    9.433262,
    -16.692755,
    -3.907386,
    10.014297,
    -16.692755,
    -1.991969,
    10.210488,
    -16.692755,
    -0.000002,
    10.014298,
    -16.692755,
    1.991966,
    9.433263,
    -16.692755,
    3.907383,
    8.489712,
    -16.692755,
    5.672643,
    7.219906,
    -16.692755,
    7.219905,
    5.672644,
    -16.692755,
    8.489712,
    3.907383,
    -16.692755,
    9.433262,
    1.991965,
    -16.692755,
    10.014297,
    -0.000003,
    -16.692755,
    10.210487,
    -1.991972,
    -16.692755,
    10.014296,
    -3.90739,
    -16.692755,
    9.433259,
    -5.672648,
    -16.692755,
    8.489708,
    -7.219911,
    -16.692755,
    7.219901,
    -8.489715,
    -16.692755,
    5.672637,
    -9.433265,
    -16.692755,
    3.907377,
    -10.014299,
    -16.692755,
    1.991958,
    -10.210488,
    -16.692755,
    -0.000011,
    -10.014296,
    -16.692755,
    -1.991979,
    -9.433257,
    -16.692755,
    -3.907396,
    -8.489704,
    -16.692755,
    -5.672655,
    -7.219897,
    -16.692755,
    -7.219916,
    -5.672632,
    -16.692755,
    -8.489719,
    -3.907371,
    -16.692755,
    -9.433269,
    -1.991952,
    -16.692755,
    -10.0143,
    -2.084152,
    -16.834354,
    10.477717,
    -0.000003,
    -16.834354,
    10.682989,
    2.084146,
    -16.834354,
    10.477719,
    4.088202,
    -16.834354,
    9.869796,
    5.935151,
    -16.834354,
    8.882582,
    7.554015,
    -16.834354,
    7.554014,
    8.882583,
    -16.834354,
    5.93515,
    9.869797,
    -16.834354,
    4.088201,
    10.47772,
    -16.834354,
    2.084146,
    10.68299,
    -16.834354,
    -0.000002,
    10.477719,
    -16.834354,
    -2.084149,
    9.869796,
    -16.834354,
    -4.088204,
    8.882583,
    -16.834354,
    -5.935152,
    7.554015,
    -16.834354,
    -7.554015,
    5.935152,
    -16.834354,
    -8.882583,
    -4.088189,
    -16.834354,
    -9.869802,
    -5.935139,
    -16.834354,
    -8.882591,
    -7.554006,
    -16.834354,
    -7.554025,
    -8.882574,
    -16.834354,
    -5.935163,
    -9.869791,
    -16.834354,
    -4.088215,
    -10.477717,
    -16.834354,
    -2.08416,
    -10.68299,
    -16.834354,
    -0.000011,
    -10.477721,
    -16.834354,
    2.084138,
    -9.869799,
    -16.834354,
    4.088195,
    -8.882586,
    -16.834354,
    5.935145,
    -7.554019,
    -16.834354,
    7.554009,
    -5.935156,
    -16.834354,
    8.882578,
    -4.088208,
    -16.834354,
    9.869793,
    4.088204,
    -16.834354,
    -9.869797,
    0,
    -15.397423,
    -11.011142,
    0,
    -16.834354,
    -10.682991,
    2.084148,
    -16.834354,
    -10.47772,
    0,
    -13.183923,
    -11.024074,
    2.15069,
    -13.183923,
    -10.812249,
    4.21873,
    -13.183923,
    -10.184916,
    6.124647,
    -13.183923,
    -9.166183,
    7.795197,
    -13.183923,
    -7.795197,
    9.166183,
    -13.183923,
    -6.124647,
    10.184916,
    -13.183923,
    -4.21873,
    10.812247,
    -13.183923,
    -2.150691,
    11.024073,
    -13.183923,
    -0.000001,
    10.812249,
    -13.183923,
    2.150688,
    10.184916,
    -13.183923,
    4.218728,
    9.166183,
    -13.183923,
    6.124646,
    7.795197,
    -13.183923,
    7.795197,
    6.124647,
    -13.183923,
    9.166183,
    4.218729,
    -13.183923,
    10.184916,
    2.150687,
    -13.183923,
    10.812248,
    -0.000003,
    -13.183923,
    11.024072,
    -2.150694,
    -13.183923,
    10.812246,
    -4.218735,
    -13.183923,
    10.184913,
    -6.124652,
    -13.183923,
    9.166178,
    -7.795202,
    -13.183923,
    7.795191,
    -9.166186,
    -13.183923,
    6.12464,
    -10.184919,
    -13.183923,
    4.218721,
    -10.81225,
    -13.183923,
    2.15068,
    -11.024073,
    -13.183923,
    -0.000011,
    -10.812246,
    -13.183923,
    -2.150702,
    -10.184911,
    -13.183923,
    -4.218742,
    -9.166174,
    -13.183923,
    -6.124659,
    -7.795187,
    -13.183923,
    -7.795207,
    -6.124634,
    -13.183923,
    -9.166191,
    -4.218715,
    -13.183923,
    -10.184923,
    -2.150673,
    -13.183923,
    -10.812251,
    0,
    -15.275227,
    -10.534209,
    2.055122,
    -15.275227,
    -10.331798,
    4.031268,
    -15.275227,
    -9.732342,
    5.852493,
    -15.275227,
    -8.758876,
    7.448811,
    -15.275227,
    -7.448811,
    8.758877,
    -15.275227,
    -5.852493,
    9.732341,
    -15.275227,
    -4.031268,
    10.331797,
    -15.275227,
    -2.055123,
    10.534208,
    -15.275227,
    -0.000001,
    10.331798,
    -15.275227,
    2.05512,
    9.732342,
    -15.275227,
    4.031265,
    8.758877,
    -15.275227,
    5.852492,
    7.448811,
    -15.275227,
    7.44881,
    5.852493,
    -15.275227,
    8.758875,
    4.031265,
    -15.275227,
    9.732341,
    2.05512,
    -15.275227,
    10.331797,
    -0.000003,
    -15.275227,
    10.534207,
    -2.055126,
    -15.275227,
    10.331795,
    -4.031272,
    -15.275227,
    9.732338,
    -5.852498,
    -15.275227,
    8.758871,
    -7.448816,
    -15.275227,
    7.448806,
    -8.758879,
    -15.275227,
    5.852487,
    -9.732344,
    -15.275227,
    4.031258,
    -10.331799,
    -15.275227,
    2.055113,
    -10.534208,
    -15.275227,
    -0.000011,
    -10.331795,
    -15.275227,
    -2.055134,
    -9.732336,
    -15.275227,
    -4.03128,
    -8.758867,
    -15.275227,
    -5.852504,
    -7.448802,
    -15.275227,
    -7.448821,
    -5.852481,
    -15.275227,
    -8.758884,
    -4.031252,
    -15.275227,
    -9.732347,
    -2.055106,
    -15.275227,
    -10.3318,
    0,
    -11.444892,
    -11.270176,
    -2.198685,
    -11.444892,
    -11.053625,
    -4.312894,
    -11.444892,
    -10.412292,
    -6.261361,
    -11.444892,
    -9.370817,
    -7.969208,
    -11.444892,
    -7.969227,
    -9.3708,
    -11.444892,
    -6.261385,
    -10.412279,
    -11.444892,
    -4.312922,
    -11.053619,
    -11.444892,
    -2.198714,
    -11.270175,
    -11.444892,
    -0.000011,
    -11.053624,
    -11.444892,
    2.198692,
    -10.412288,
    -11.444892,
    4.3129,
    -9.370813,
    -11.444892,
    6.261368,
    -7.969223,
    -11.444892,
    7.969213,
    -6.261379,
    -11.444892,
    9.370804,
    -4.312914,
    -11.444892,
    10.412281,
    -2.198707,
    -11.444892,
    11.05362,
    -0.000004,
    -11.444892,
    11.270175,
    2.1987,
    -11.444892,
    11.053622,
    4.312908,
    -11.444892,
    10.412284,
    6.261374,
    -11.444892,
    9.370809,
    7.969217,
    -11.444892,
    7.969218,
    9.37081,
    -11.444892,
    6.261373,
    10.412285,
    -11.444892,
    4.312907,
    11.053623,
    -11.444892,
    2.1987,
    11.270175,
    -11.444892,
    -0.000001,
    11.053621,
    -11.444892,
    -2.198703,
    10.412284,
    -11.444892,
    -4.31291,
    9.37081,
    -11.444892,
    -6.261374,
    7.969217,
    -11.444892,
    -7.969217,
    6.261374,
    -11.444892,
    -9.370809,
    4.31291,
    -11.444892,
    -10.412284,
    2.198702,
    -11.444892,
    -11.053623,
    4.550766,
    -6.525795,
    -10.986521,
    6.606688,
    -6.525795,
    -9.887609,
    8.408718,
    -6.525795,
    -8.408719,
    9.887609,
    -6.525795,
    -6.606688,
    10.986522,
    -6.525795,
    -4.550766,
    11.663228,
    -6.525795,
    -2.319961,
    11.891725,
    -6.525795,
    -0.000001,
    11.663229,
    -6.525795,
    2.319959,
    10.986522,
    -6.525795,
    4.550764,
    9.887609,
    -6.525795,
    6.606687,
    8.408718,
    -6.525795,
    8.408718,
    6.606688,
    -6.525795,
    9.887609,
    4.550765,
    -6.525795,
    10.986522,
    2.319958,
    -6.525795,
    11.663229,
    -0.000004,
    -6.525795,
    11.891725,
    -2.319965,
    -6.525795,
    11.663227,
    -4.550771,
    -6.525795,
    10.986518,
    -6.606694,
    -6.525795,
    9.887605,
    -8.408724,
    -6.525795,
    8.408712,
    -9.887613,
    -6.525795,
    6.606681,
    -10.986526,
    -6.525795,
    4.550756,
    -11.663231,
    -6.525795,
    2.31995,
    -11.891725,
    -6.525795,
    -0.000012,
    -11.663226,
    -6.525795,
    -2.319973,
    -10.986515,
    -6.525795,
    -4.550779,
    -9.8876,
    -6.525795,
    -6.6067,
    -8.408708,
    -6.525795,
    -8.40873,
    -6.606675,
    -6.525795,
    -9.887618,
    -4.55075,
    -6.525795,
    -10.986529,
    -2.319943,
    -6.525795,
    -11.663232,
    0,
    -6.525795,
    -11.891725,
    2.286239,
    -8.274249,
    -11.493701,
    4.48462,
    -8.274249,
    -10.826827,
    6.510658,
    -8.274249,
    -9.74389,
    8.286496,
    -8.274249,
    -8.286496,
    9.743891,
    -8.274249,
    -6.510658,
    10.826828,
    -8.274249,
    -4.48462,
    11.4937,
    -8.274249,
    -2.28624,
    11.718874,
    -8.274249,
    -0.000001,
    11.493701,
    -8.274249,
    2.286237,
    10.826829,
    -8.274249,
    4.484617,
    9.743891,
    -8.274249,
    6.510657,
    8.286496,
    -8.274249,
    8.286496,
    6.510658,
    -8.274249,
    9.74389,
    4.484618,
    -8.274249,
    10.826828,
    2.286236,
    -8.274249,
    11.493701,
    -0.000004,
    -8.274249,
    11.718874,
    -2.286244,
    -8.274249,
    11.493699,
    -4.484624,
    -8.274249,
    10.826825,
    -6.510664,
    -8.274249,
    9.743885,
    -8.286502,
    -8.274249,
    8.28649,
    -9.743894,
    -8.274249,
    6.510651,
    -10.826832,
    -8.274249,
    4.48461,
    -11.493703,
    -8.274249,
    2.286229,
    -11.718874,
    -8.274249,
    -0.000012,
    -11.493698,
    -8.274249,
    -2.286252,
    -10.826822,
    -8.274249,
    -4.484632,
    -9.743881,
    -8.274249,
    -6.51067,
    -8.286485,
    -8.274249,
    -8.286508,
    -6.510644,
    -8.274249,
    -9.743897,
    -4.484603,
    -8.274249,
    -10.826836,
    -2.286222,
    -8.274249,
    -11.493704,
    0,
    -8.274249,
    -11.718876,
    -2.084132,
    -16.834354,
    -10.477723,
    0,
    -6.485762,
    -12.394156,
    2.383797,
    -8.25815,
    -11.984158,
    4.675986,
    -8.25815,
    -11.288828,
    6.788479,
    -8.25815,
    -10.159678,
    8.640096,
    -8.25815,
    -8.640096,
    10.159679,
    -8.25815,
    -6.788479,
    11.288829,
    -8.25815,
    -4.675986,
    11.984157,
    -8.25815,
    -2.383797,
    12.21894,
    -8.25815,
    -0.000001,
    11.984158,
    -8.25815,
    2.383795,
    11.28883,
    -8.25815,
    4.675983,
    10.159679,
    -8.25815,
    6.788478,
    8.640096,
    -8.25815,
    8.640096,
    6.788479,
    -8.25815,
    10.159679,
    4.675984,
    -8.25815,
    11.288829,
    2.383794,
    -8.25815,
    11.984158,
    -0.000004,
    -8.25815,
    12.21894,
    -2.383802,
    -8.25815,
    11.984156,
    -4.675992,
    -8.25815,
    11.288825,
    -6.788485,
    -8.25815,
    10.159674,
    -8.640101,
    -8.25815,
    8.64009,
    -10.159682,
    -8.25815,
    6.788472,
    -11.288833,
    -8.25815,
    4.675976,
    -11.984159,
    -8.25815,
    2.383786,
    -12.21894,
    -8.25815,
    -0.000012,
    -11.984155,
    -8.25815,
    -2.38381,
    -11.288821,
    -8.25815,
    -4.676,
    -10.15967,
    -8.25815,
    -6.788492,
    -8.640084,
    -8.25815,
    -8.640108,
    -6.788465,
    -8.25815,
    -10.159686,
    -4.675969,
    -8.25815,
    -11.288836,
    -2.383779,
    -8.25815,
    -11.98416,
    0,
    -11.48649,
    -11.762383,
    0,
    -13.249328,
    -11.512911,
    -2.24604,
    -13.249328,
    -11.291697,
    -4.405784,
    -13.249328,
    -10.63655,
    -6.396217,
    -13.249328,
    -9.572645,
    -8.140847,
    -13.249328,
    -8.140868,
    -9.572627,
    -13.249328,
    -6.396243,
    -10.636538,
    -13.249328,
    -4.405813,
    -11.291691,
    -13.249328,
    -2.24607,
    -11.512911,
    -13.249328,
    -0.000012,
    -11.291696,
    -13.249328,
    2.246047,
    -10.636546,
    -13.249328,
    4.40579,
    -9.57264,
    -13.249328,
    6.396224,
    -8.140864,
    -13.249328,
    8.140852,
    -6.396236,
    -13.249328,
    9.572631,
    -4.405805,
    -13.249328,
    10.636539,
    -2.246062,
    -13.249328,
    11.291692,
    -0.000004,
    -13.249328,
    11.512909,
    2.246055,
    -13.249328,
    11.291694,
    4.405798,
    -13.249328,
    10.636543,
    6.396231,
    -13.249328,
    9.572637,
    8.140857,
    -13.249328,
    8.140858,
    9.572638,
    -13.249328,
    6.39623,
    10.636543,
    -13.249328,
    4.405798,
    11.291695,
    -13.249328,
    2.246056,
    11.512911,
    -13.249328,
    -0.000001,
    11.291693,
    -13.249328,
    -2.246058,
    10.636543,
    -13.249328,
    -4.4058,
    9.572637,
    -13.249328,
    -6.396231,
    8.140857,
    -13.249328,
    -8.140858,
    6.396231,
    -13.249328,
    -9.572636,
    4.405801,
    -13.249328,
    -10.636543,
    2.246058,
    -13.249328,
    -11.291695,
    2.148167,
    -15.397423,
    -10.799566,
    4.213782,
    -15.397423,
    -10.172971,
    6.117463,
    -15.397423,
    -9.155431,
    7.786053,
    -15.397423,
    -7.786053,
    9.155432,
    -15.397423,
    -6.117463,
    10.17297,
    -15.397423,
    -4.213782,
    10.799565,
    -15.397423,
    -2.148168,
    11.011141,
    -15.397423,
    -0.000002,
    10.799566,
    -15.397423,
    2.148165,
    10.172971,
    -15.397423,
    4.213779,
    9.155432,
    -15.397423,
    6.117462,
    7.786053,
    -15.397423,
    7.786053,
    6.117463,
    -15.397423,
    9.15543,
    4.213779,
    -15.397423,
    10.17297,
    2.148165,
    -15.397423,
    10.799565,
    -0.000003,
    -15.397423,
    11.01114,
    -2.148172,
    -15.397423,
    10.799563,
    -4.213787,
    -15.397423,
    10.172967,
    -6.117467,
    -15.397423,
    9.155426,
    -7.786059,
    -15.397423,
    7.786048,
    -9.155435,
    -15.397423,
    6.117456,
    -10.172973,
    -15.397423,
    4.213772,
    -10.799567,
    -15.397423,
    2.148157,
    -11.011141,
    -15.397423,
    -0.000011,
    -10.799563,
    -15.397423,
    -2.148179,
    -10.172965,
    -15.397423,
    -4.213794,
    -9.155422,
    -15.397423,
    -6.117475,
    -7.786044,
    -15.397423,
    -7.786064,
    -6.11745,
    -15.397423,
    -9.155439,
    -4.213766,
    -15.397423,
    -10.172976,
    -2.148151,
    -15.397423,
    -10.799569,
    -2.294709,
    -11.48649,
    -11.536375,
    -4.501253,
    -11.48649,
    -10.867031,
    -6.534816,
    -11.48649,
    -9.780073,
    -8.31725,
    -11.48649,
    -8.317271,
    -9.780055,
    -11.48649,
    -6.534842,
    -10.867018,
    -11.48649,
    -4.501282,
    -11.536369,
    -11.48649,
    -2.294739,
    -11.762382,
    -11.48649,
    -0.000012,
    -11.536374,
    -11.48649,
    2.294716,
    -10.867027,
    -11.48649,
    4.501259,
    -9.780069,
    -11.48649,
    6.534822,
    -8.317267,
    -11.48649,
    8.317255,
    -6.534835,
    -11.48649,
    9.780059,
    -4.501274,
    -11.48649,
    10.867021,
    -2.294732,
    -11.48649,
    11.53637,
    -0.000004,
    -11.48649,
    11.762382,
    2.294724,
    -11.48649,
    11.536372,
    4.501267,
    -11.48649,
    10.867023,
    6.53483,
    -11.48649,
    9.780065,
    8.31726,
    -11.48649,
    8.317261,
    9.780066,
    -11.48649,
    6.534829,
    10.867024,
    -11.48649,
    4.501266,
    11.536373,
    -11.48649,
    2.294725,
    11.762382,
    -11.48649,
    -0.000001,
    11.536371,
    -11.48649,
    -2.294728,
    10.867023,
    -11.48649,
    -4.501269,
    9.780065,
    -11.48649,
    -6.53483,
    8.31726,
    -11.48649,
    -8.31726,
    6.53483,
    -11.48649,
    -9.780064,
    4.501269,
    -11.48649,
    -10.867023,
    2.294727,
    -11.48649,
    -11.536373,
    2.41798,
    -6.485762,
    -12.156006,
    4.743039,
    -6.485762,
    -11.450707,
    6.885824,
    -6.485762,
    -10.305365,
    8.763991,
    -6.485762,
    -8.763991,
    10.305366,
    -6.485762,
    -6.885824,
    11.450708,
    -6.485762,
    -4.743038,
    12.156005,
    -6.485762,
    -2.41798,
    12.394156,
    -6.485762,
    -0.000001,
    12.156006,
    -6.485762,
    2.417978,
    11.450708,
    -6.485762,
    4.743036,
    10.305366,
    -6.485762,
    6.885823,
    8.763991,
    -6.485762,
    8.763991,
    6.885824,
    -6.485762,
    10.305366,
    4.743037,
    -6.485762,
    11.450708,
    2.417977,
    -6.485762,
    12.156006,
    -0.000004,
    -6.485762,
    12.394156,
    -2.417985,
    -6.485762,
    12.156004,
    -4.743043,
    -6.485762,
    11.450704,
    -6.88583,
    -6.485762,
    10.305361,
    -8.763997,
    -6.485762,
    8.763986,
    -10.305369,
    -6.485762,
    6.885817,
    -11.450712,
    -6.485762,
    4.743028,
    -12.156008,
    -6.485762,
    2.417969,
    -12.394156,
    -6.485762,
    -0.000012,
    -12.156003,
    -6.485762,
    -2.417993,
    -11.450701,
    -6.485762,
    -4.743052,
    -10.305356,
    -6.485762,
    -6.885837,
    -8.76398,
    -6.485762,
    -8.764004,
    -6.88581,
    -6.485762,
    -10.305374,
    -4.743021,
    -6.485762,
    -11.450716,
    -2.417961,
    -6.485762,
    -12.156009,
    0,
    -8.25815,
    -12.218942,
    -2.084152,
    16.834354,
    10.477717,
    -0.000003,
    16.834354,
    10.682989,
    2.084146,
    16.834354,
    10.477719,
    4.088202,
    16.834354,
    9.869796,
    5.935151,
    16.834354,
    8.882582,
    7.554015,
    16.834354,
    7.554014,
    8.882583,
    16.834354,
    5.93515,
    9.869797,
    16.834354,
    4.088201,
    10.47772,
    16.834354,
    2.084146,
    10.68299,
    16.834354,
    -0.000002,
    10.477719,
    16.834354,
    -2.084149,
    9.869796,
    16.834354,
    -4.088204,
    8.882583,
    16.834354,
    -5.935152,
    7.554015,
    16.834354,
    -7.554015,
    5.935152,
    16.834354,
    -8.882583,
    -4.088189,
    16.834354,
    -9.869802,
    -5.935139,
    16.834354,
    -8.882591,
    -7.554006,
    16.834354,
    -7.554025,
    -8.882574,
    16.834354,
    -5.935163,
    -9.869791,
    16.834354,
    -4.088215,
    -10.477717,
    16.834354,
    -2.08416,
    -10.68299,
    16.834354,
    -0.000011,
    -10.477721,
    16.834354,
    2.084138,
    -9.869799,
    16.834354,
    4.088195,
    -8.882586,
    16.834354,
    5.935145,
    -7.554019,
    16.834354,
    7.554009,
    -5.935156,
    16.834354,
    8.882578,
    -4.088208,
    16.834354,
    9.869793,
    4.088204,
    16.834354,
    -9.869797,
    0,
    15.397423,
    -11.011142,
    0,
    16.834354,
    -10.682991,
    2.084148,
    16.834354,
    -10.47772,
    -2.084132,
    16.834354,
    -10.477723,
    0,
    11.48649,
    -11.762383,
    0,
    13.249328,
    -11.512911,
    -2.24604,
    13.249328,
    -11.291697,
    -4.405784,
    13.249328,
    -10.63655,
    -6.396217,
    13.249328,
    -9.572645,
    -8.140847,
    13.249328,
    -8.140868,
    -9.572627,
    13.249328,
    -6.396243,
    -10.636538,
    13.249328,
    -4.405813,
    -11.291691,
    13.249328,
    -2.24607,
    -11.512911,
    13.249328,
    -0.000012,
    -11.291696,
    13.249328,
    2.246047,
    -10.636546,
    13.249328,
    4.40579,
    -9.57264,
    13.249328,
    6.396224,
    -8.140864,
    13.249328,
    8.140852,
    -6.396236,
    13.249328,
    9.572631,
    -4.405805,
    13.249328,
    10.636539,
    -2.246062,
    13.249328,
    11.291692,
    -0.000004,
    13.249328,
    11.512909,
    2.246055,
    13.249328,
    11.291694,
    4.405798,
    13.249328,
    10.636543,
    6.396231,
    13.249328,
    9.572637,
    8.140857,
    13.249328,
    8.140858,
    9.572638,
    13.249328,
    6.39623,
    10.636543,
    13.249328,
    4.405798,
    11.291695,
    13.249328,
    2.246056,
    11.512911,
    13.249328,
    -0.000001,
    11.291693,
    13.249328,
    -2.246058,
    10.636543,
    13.249328,
    -4.4058,
    9.572637,
    13.249328,
    -6.396231,
    8.140857,
    13.249328,
    -8.140858,
    6.396231,
    13.249328,
    -9.572636,
    4.405801,
    13.249328,
    -10.636543,
    2.246058,
    13.249328,
    -11.291695,
    2.148167,
    15.397423,
    -10.799566,
    4.213782,
    15.397423,
    -10.172971,
    6.117463,
    15.397423,
    -9.155431,
    7.786053,
    15.397423,
    -7.786053,
    9.155432,
    15.397423,
    -6.117463,
    10.17297,
    15.397423,
    -4.213782,
    10.799565,
    15.397423,
    -2.148168,
    11.011141,
    15.397423,
    -0.000002,
    10.799566,
    15.397423,
    2.148165,
    10.172971,
    15.397423,
    4.213779,
    9.155432,
    15.397423,
    6.117462,
    7.786053,
    15.397423,
    7.786053,
    6.117463,
    15.397423,
    9.15543,
    4.213779,
    15.397423,
    10.17297,
    2.148165,
    15.397423,
    10.799565,
    -0.000003,
    15.397423,
    11.01114,
    -2.148172,
    15.397423,
    10.799563,
    -4.213787,
    15.397423,
    10.172967,
    -6.117467,
    15.397423,
    9.155426,
    -7.786059,
    15.397423,
    7.786048,
    -9.155435,
    15.397423,
    6.117456,
    -10.172973,
    15.397423,
    4.213772,
    -10.799567,
    15.397423,
    2.148157,
    -11.011141,
    15.397423,
    -0.000011,
    -10.799563,
    15.397423,
    -2.148179,
    -10.172965,
    15.397423,
    -4.213794,
    -9.155422,
    15.397423,
    -6.117475,
    -7.786044,
    15.397423,
    -7.786064,
    -6.11745,
    15.397423,
    -9.155439,
    -4.213766,
    15.397423,
    -10.172976,
    -2.148151,
    15.397423,
    -10.799569,
    -2.294709,
    11.48649,
    -11.536375,
    -4.501253,
    11.48649,
    -10.867031,
    -6.534816,
    11.48649,
    -9.780073,
    -8.31725,
    11.48649,
    -8.317271,
    -9.780055,
    11.48649,
    -6.534842,
    -10.867018,
    11.48649,
    -4.501282,
    -11.536369,
    11.48649,
    -2.294739,
    -11.762382,
    11.48649,
    -0.000012,
    -11.536374,
    11.48649,
    2.294716,
    -10.867027,
    11.48649,
    4.501259,
    -9.780069,
    11.48649,
    6.534822,
    -8.317267,
    11.48649,
    8.317255,
    -6.534835,
    11.48649,
    9.780059,
    -4.501274,
    11.48649,
    10.867021,
    -2.294732,
    11.48649,
    11.53637,
    -0.000004,
    11.48649,
    11.762382,
    2.294724,
    11.48649,
    11.536372,
    4.501267,
    11.48649,
    10.867023,
    6.53483,
    11.48649,
    9.780065,
    8.31726,
    11.48649,
    8.317261,
    9.780066,
    11.48649,
    6.534829,
    10.867024,
    11.48649,
    4.501266,
    11.536373,
    11.48649,
    2.294725,
    11.762382,
    11.48649,
    -0.000001,
    11.536371,
    11.48649,
    -2.294728,
    10.867023,
    11.48649,
    -4.501269,
    9.780065,
    11.48649,
    -6.53483,
    8.31726,
    11.48649,
    -8.31726,
    6.53483,
    11.48649,
    -9.780064,
    4.501269,
    11.48649,
    -10.867023,
    2.294727,
    11.48649,
    -11.536373,
    -2.084152,
    -16.834354,
    10.477717,
    -0.000003,
    -16.834354,
    10.682989,
    2.084146,
    -16.834354,
    10.477719,
    4.088202,
    -16.834354,
    9.869796,
    5.935151,
    -16.834354,
    8.882582,
    7.554015,
    -16.834354,
    7.554014,
    8.882583,
    -16.834354,
    5.93515,
    9.869797,
    -16.834354,
    4.088201,
    10.47772,
    -16.834354,
    2.084146,
    10.68299,
    -16.834354,
    -0.000002,
    10.477719,
    -16.834354,
    -2.084149,
    9.869796,
    -16.834354,
    -4.088204,
    8.882583,
    -16.834354,
    -5.935152,
    7.554015,
    -16.834354,
    -7.554015,
    5.935152,
    -16.834354,
    -8.882583,
    -4.088189,
    -16.834354,
    -9.869802,
    -5.935139,
    -16.834354,
    -8.882591,
    -7.554006,
    -16.834354,
    -7.554025,
    -8.882574,
    -16.834354,
    -5.935163,
    -9.869791,
    -16.834354,
    -4.088215,
    -10.477717,
    -16.834354,
    -2.08416,
    -10.68299,
    -16.834354,
    -0.000011,
    -10.477721,
    -16.834354,
    2.084138,
    -9.869799,
    -16.834354,
    4.088195,
    -8.882586,
    -16.834354,
    5.935145,
    -7.554019,
    -16.834354,
    7.554009,
    -5.935156,
    -16.834354,
    8.882578,
    -4.088208,
    -16.834354,
    9.869793,
    4.088204,
    -16.834354,
    -9.869797,
    0,
    -15.397423,
    -11.011142,
    0,
    -16.834354,
    -10.682991,
    2.084148,
    -16.834354,
    -10.47772,
    -2.084132,
    -16.834354,
    -10.477723,
    0,
    -6.485762,
    -12.394156,
    2.383797,
    -8.25815,
    -11.984158,
    4.675986,
    -8.25815,
    -11.288828,
    6.788479,
    -8.25815,
    -10.159678,
    8.640096,
    -8.25815,
    -8.640096,
    10.159679,
    -8.25815,
    -6.788479,
    11.288829,
    -8.25815,
    -4.675986,
    11.984157,
    -8.25815,
    -2.383797,
    12.21894,
    -8.25815,
    -0.000001,
    11.984158,
    -8.25815,
    2.383795,
    11.28883,
    -8.25815,
    4.675983,
    10.159679,
    -8.25815,
    6.788478,
    8.640096,
    -8.25815,
    8.640096,
    6.788479,
    -8.25815,
    10.159679,
    4.675984,
    -8.25815,
    11.288829,
    2.383794,
    -8.25815,
    11.984158,
    -0.000004,
    -8.25815,
    12.21894,
    -2.383802,
    -8.25815,
    11.984156,
    -4.675992,
    -8.25815,
    11.288825,
    -6.788485,
    -8.25815,
    10.159674,
    -8.640101,
    -8.25815,
    8.64009,
    -10.159682,
    -8.25815,
    6.788472,
    -11.288833,
    -8.25815,
    4.675976,
    -11.984159,
    -8.25815,
    2.383786,
    -12.21894,
    -8.25815,
    -0.000012,
    -11.984155,
    -8.25815,
    -2.38381,
    -11.288821,
    -8.25815,
    -4.676,
    -10.15967,
    -8.25815,
    -6.788492,
    -8.640084,
    -8.25815,
    -8.640108,
    -6.788465,
    -8.25815,
    -10.159686,
    -4.675969,
    -8.25815,
    -11.288836,
    -2.383779,
    -8.25815,
    -11.98416,
    0,
    -11.48649,
    -11.762383,
    0,
    -13.249328,
    -11.512911,
    -2.24604,
    -13.249328,
    -11.291697,
    -4.405784,
    -13.249328,
    -10.63655,
    -6.396217,
    -13.249328,
    -9.572645,
    -8.140847,
    -13.249328,
    -8.140868,
    -9.572627,
    -13.249328,
    -6.396243,
    -10.636538,
    -13.249328,
    -4.405813,
    -11.291691,
    -13.249328,
    -2.24607,
    -11.512911,
    -13.249328,
    -0.000012,
    -11.291696,
    -13.249328,
    2.246047,
    -10.636546,
    -13.249328,
    4.40579,
    -9.57264,
    -13.249328,
    6.396224,
    -8.140864,
    -13.249328,
    8.140852,
    -6.396236,
    -13.249328,
    9.572631,
    -4.405805,
    -13.249328,
    10.636539,
    -2.246062,
    -13.249328,
    11.291692,
    -0.000004,
    -13.249328,
    11.512909,
    2.246055,
    -13.249328,
    11.291694,
    4.405798,
    -13.249328,
    10.636543,
    6.396231,
    -13.249328,
    9.572637,
    8.140857,
    -13.249328,
    8.140858,
    9.572638,
    -13.249328,
    6.39623,
    10.636543,
    -13.249328,
    4.405798,
    11.291695,
    -13.249328,
    2.246056,
    11.512911,
    -13.249328,
    -0.000001,
    11.291693,
    -13.249328,
    -2.246058,
    10.636543,
    -13.249328,
    -4.4058,
    9.572637,
    -13.249328,
    -6.396231,
    8.140857,
    -13.249328,
    -8.140858,
    6.396231,
    -13.249328,
    -9.572636,
    4.405801,
    -13.249328,
    -10.636543,
    2.246058,
    -13.249328,
    -11.291695,
    2.148167,
    -15.397423,
    -10.799566,
    4.213782,
    -15.397423,
    -10.172971,
    6.117463,
    -15.397423,
    -9.155431,
    7.786053,
    -15.397423,
    -7.786053,
    9.155432,
    -15.397423,
    -6.117463,
    10.17297,
    -15.397423,
    -4.213782,
    10.799565,
    -15.397423,
    -2.148168,
    11.011141,
    -15.397423,
    -0.000002,
    10.799566,
    -15.397423,
    2.148165,
    10.172971,
    -15.397423,
    4.213779,
    9.155432,
    -15.397423,
    6.117462,
    7.786053,
    -15.397423,
    7.786053,
    6.117463,
    -15.397423,
    9.15543,
    4.213779,
    -15.397423,
    10.17297,
    2.148165,
    -15.397423,
    10.799565,
    -0.000003,
    -15.397423,
    11.01114,
    -2.148172,
    -15.397423,
    10.799563,
    -4.213787,
    -15.397423,
    10.172967,
    -6.117467,
    -15.397423,
    9.155426,
    -7.786059,
    -15.397423,
    7.786048,
    -9.155435,
    -15.397423,
    6.117456,
    -10.172973,
    -15.397423,
    4.213772,
    -10.799567,
    -15.397423,
    2.148157,
    -11.011141,
    -15.397423,
    -0.000011,
    -10.799563,
    -15.397423,
    -2.148179,
    -10.172965,
    -15.397423,
    -4.213794,
    -9.155422,
    -15.397423,
    -6.117475,
    -7.786044,
    -15.397423,
    -7.786064,
    -6.11745,
    -15.397423,
    -9.155439,
    -4.213766,
    -15.397423,
    -10.172976,
    -2.148151,
    -15.397423,
    -10.799569,
    -2.294709,
    -11.48649,
    -11.536375,
    -4.501253,
    -11.48649,
    -10.867031,
    -6.534816,
    -11.48649,
    -9.780073,
    -8.31725,
    -11.48649,
    -8.317271,
    -9.780055,
    -11.48649,
    -6.534842,
    -10.867018,
    -11.48649,
    -4.501282,
    -11.536369,
    -11.48649,
    -2.294739,
    -11.762382,
    -11.48649,
    -0.000012,
    -11.536374,
    -11.48649,
    2.294716,
    -10.867027,
    -11.48649,
    4.501259,
    -9.780069,
    -11.48649,
    6.534822,
    -8.317267,
    -11.48649,
    8.317255,
    -6.534835,
    -11.48649,
    9.780059,
    -4.501274,
    -11.48649,
    10.867021,
    -2.294732,
    -11.48649,
    11.53637,
    -0.000004,
    -11.48649,
    11.762382,
    2.294724,
    -11.48649,
    11.536372,
    4.501267,
    -11.48649,
    10.867023,
    6.53483,
    -11.48649,
    9.780065,
    8.31726,
    -11.48649,
    8.317261,
    9.780066,
    -11.48649,
    6.534829,
    10.867024,
    -11.48649,
    4.501266,
    11.536373,
    -11.48649,
    2.294725,
    11.762382,
    -11.48649,
    -0.000001,
    11.536371,
    -11.48649,
    -2.294728,
    10.867023,
    -11.48649,
    -4.501269,
    9.780065,
    -11.48649,
    -6.53483,
    8.31726,
    -11.48649,
    -8.31726,
    6.53483,
    -11.48649,
    -9.780064,
    4.501269,
    -11.48649,
    -10.867023,
    2.294727,
    -11.48649,
    -11.536373,
    2.41798,
    -6.485762,
    -12.156006,
    4.743039,
    -6.485762,
    -11.450707,
    6.885824,
    -6.485762,
    -10.305365,
    8.763991,
    -6.485762,
    -8.763991,
    10.305366,
    -6.485762,
    -6.885824,
    11.450708,
    -6.485762,
    -4.743038,
    12.156005,
    -6.485762,
    -2.41798,
    12.394156,
    -6.485762,
    -0.000001,
    12.156006,
    -6.485762,
    2.417978,
    11.450708,
    -6.485762,
    4.743036,
    10.305366,
    -6.485762,
    6.885823,
    8.763991,
    -6.485762,
    8.763991,
    6.885824,
    -6.485762,
    10.305366,
    4.743037,
    -6.485762,
    11.450708,
    2.417977,
    -6.485762,
    12.156006,
    -0.000004,
    -6.485762,
    12.394156,
    -2.417985,
    -6.485762,
    12.156004,
    -4.743043,
    -6.485762,
    11.450704,
    -6.88583,
    -6.485762,
    10.305361,
    -8.763997,
    -6.485762,
    8.763986,
    -10.305369,
    -6.485762,
    6.885817,
    -11.450712,
    -6.485762,
    4.743028,
    -12.156008,
    -6.485762,
    2.417969,
    -12.394156,
    -6.485762,
    -0.000012,
    -12.156003,
    -6.485762,
    -2.417993,
    -11.450701,
    -6.485762,
    -4.743052,
    -10.305356,
    -6.485762,
    -6.885837,
    -8.76398,
    -6.485762,
    -8.764004,
    -6.88581,
    -6.485762,
    -10.305374,
    -4.743021,
    -6.485762,
    -11.450716,
    -2.417961,
    -6.485762,
    -12.156009,
    0,
    -8.25815,
    -12.218942,
    0,
    6.485762,
    -12.394156,
    2.383797,
    8.25815,
    -11.984158,
    4.675986,
    8.25815,
    -11.288828,
    6.788479,
    8.25815,
    -10.159678,
    8.640096,
    8.25815,
    -8.640096,
    10.159679,
    8.25815,
    -6.788479,
    11.288829,
    8.25815,
    -4.675986,
    11.984157,
    8.25815,
    -2.383797,
    12.21894,
    8.25815,
    -0.000001,
    11.984158,
    8.25815,
    2.383795,
    11.28883,
    8.25815,
    4.675983,
    10.159679,
    8.25815,
    6.788478,
    8.640096,
    8.25815,
    8.640096,
    6.788479,
    8.25815,
    10.159679,
    4.675984,
    8.25815,
    11.288829,
    2.383794,
    8.25815,
    11.984158,
    -0.000004,
    8.25815,
    12.21894,
    -2.383802,
    8.25815,
    11.984156,
    -4.675992,
    8.25815,
    11.288825,
    -6.788485,
    8.25815,
    10.159674,
    -8.640101,
    8.25815,
    8.64009,
    -10.159682,
    8.25815,
    6.788472,
    -11.288833,
    8.25815,
    4.675976,
    -11.984159,
    8.25815,
    2.383786,
    -12.21894,
    8.25815,
    -0.000012,
    -11.984155,
    8.25815,
    -2.38381,
    -11.288821,
    8.25815,
    -4.676,
    -10.15967,
    8.25815,
    -6.788492,
    -8.640084,
    8.25815,
    -8.640108,
    -6.788465,
    8.25815,
    -10.159686,
    -4.675969,
    8.25815,
    -11.288836,
    -2.383779,
    8.25815,
    -11.98416,
    2.41798,
    6.485762,
    -12.156006,
    4.743039,
    6.485762,
    -11.450707,
    6.885824,
    6.485762,
    -10.305365,
    8.763991,
    6.485762,
    -8.763991,
    10.305366,
    6.485762,
    -6.885824,
    11.450708,
    6.485762,
    -4.743038,
    12.156005,
    6.485762,
    -2.41798,
    12.394156,
    6.485762,
    -0.000001,
    12.156006,
    6.485762,
    2.417978,
    11.450708,
    6.485762,
    4.743036,
    10.305366,
    6.485762,
    6.885823,
    8.763991,
    6.485762,
    8.763991,
    6.885824,
    6.485762,
    10.305366,
    4.743037,
    6.485762,
    11.450708,
    2.417977,
    6.485762,
    12.156006,
    -0.000004,
    6.485762,
    12.394156,
    -2.417985,
    6.485762,
    12.156004,
    -4.743043,
    6.485762,
    11.450704,
    -6.88583,
    6.485762,
    10.305361,
    -8.763997,
    6.485762,
    8.763986,
    -10.305369,
    6.485762,
    6.885817,
    -11.450712,
    6.485762,
    4.743028,
    -12.156008,
    6.485762,
    2.417969,
    -12.394156,
    6.485762,
    -0.000012,
    -12.156003,
    6.485762,
    -2.417993,
    -11.450701,
    6.485762,
    -4.743052,
    -10.305356,
    6.485762,
    -6.885837,
    -8.76398,
    6.485762,
    -8.764004,
    -6.88581,
    6.485762,
    -10.305374,
    -4.743021,
    6.485762,
    -11.450716,
    -2.417961,
    6.485762,
    -12.156009,
    0,
    8.25815,
    -12.218942,
    0,
    14.973991,
    -9.402202,
    0,
    17,
    -9.402202,
    1.834279,
    17,
    -9.22154,
    3.598067,
    17,
    -8.686502,
    5.223583,
    17,
    -7.817646,
    6.64836,
    17,
    -6.648361,
    7.817645,
    17,
    -5.223583,
    8.686501,
    17,
    -3.598068,
    9.221539,
    17,
    -1.83428,
    9.402201,
    17,
    -0.000002,
    9.22154,
    17,
    1.834276,
    8.686502,
    17,
    3.598064,
    7.817645,
    17,
    5.223581,
    6.64836,
    17,
    6.648359,
    5.223583,
    17,
    7.817643,
    3.598065,
    17,
    8.6865,
    1.834276,
    17,
    9.221539,
    -0.000003,
    17,
    9.402199,
    -1.834282,
    17,
    9.221538,
    -3.59807,
    17,
    8.686498,
    -5.223587,
    17,
    7.81764,
    -6.648364,
    17,
    6.648355,
    -7.817647,
    17,
    5.223577,
    -8.686502,
    17,
    3.598058,
    -9.221541,
    17,
    1.834269,
    -9.4022,
    17,
    -0.00001,
    -9.221538,
    17,
    -1.834289,
    -8.686496,
    17,
    -3.598077,
    -7.817637,
    17,
    -5.223594,
    -6.648351,
    17,
    -6.648369,
    -5.223572,
    17,
    -7.817653,
    -3.598053,
    17,
    -8.686507,
    -1.834264,
    17,
    -9.221543,
    1.834279,
    14.973991,
    -9.22154,
    3.598067,
    14.973991,
    -8.686502,
    5.223583,
    14.973991,
    -7.817646,
    6.64836,
    14.973991,
    -6.648361,
    7.817645,
    14.973991,
    -5.223583,
    8.686501,
    14.973991,
    -3.598068,
    9.221539,
    14.973991,
    -1.83428,
    9.402201,
    14.973991,
    -0.000002,
    9.22154,
    14.973991,
    1.834276,
    8.686502,
    14.973991,
    3.598064,
    7.817645,
    14.973991,
    5.223581,
    6.64836,
    14.973991,
    6.648359,
    5.223583,
    14.973991,
    7.817643,
    3.598065,
    14.973991,
    8.6865,
    1.834276,
    14.973991,
    9.221539,
    -0.000003,
    14.973991,
    9.402199,
    -1.834282,
    14.973991,
    9.221538,
    -3.59807,
    14.973991,
    8.686498,
    -5.223587,
    14.973991,
    7.81764,
    -6.648364,
    14.973991,
    6.648355,
    -7.817647,
    14.973991,
    5.223577,
    -8.686502,
    14.973991,
    3.598058,
    -9.221541,
    14.973991,
    1.834269,
    -9.4022,
    14.973991,
    -0.00001,
    -9.221538,
    14.973991,
    -1.834289,
    -8.686496,
    14.973991,
    -3.598077,
    -7.817637,
    14.973991,
    -5.223594,
    -6.648351,
    14.973991,
    -6.648369,
    -5.223572,
    14.973991,
    -7.817653,
    -3.598053,
    14.973991,
    -8.686507,
    -1.834264,
    14.973991,
    -9.221543,
    0,
    -14.973991,
    -9.402202,
    0,
    -17,
    -9.402202,
    1.834279,
    -17,
    -9.22154,
    3.598067,
    -17,
    -8.686502,
    5.223583,
    -17,
    -7.817646,
    6.64836,
    -17,
    -6.648361,
    7.817645,
    -17,
    -5.223583,
    8.686501,
    -17,
    -3.598068,
    9.221539,
    -17,
    -1.83428,
    9.402201,
    -17,
    -0.000002,
    9.22154,
    -17,
    1.834276,
    8.686502,
    -17,
    3.598064,
    7.817645,
    -17,
    5.223581,
    6.64836,
    -17,
    6.648359,
    5.223583,
    -17,
    7.817643,
    3.598065,
    -17,
    8.6865,
    1.834276,
    -17,
    9.221539,
    -0.000003,
    -17,
    9.402199,
    -1.834282,
    -17,
    9.221538,
    -3.59807,
    -17,
    8.686498,
    -5.223587,
    -17,
    7.81764,
    -6.648364,
    -17,
    6.648355,
    -7.817647,
    -17,
    5.223577,
    -8.686502,
    -17,
    3.598058,
    -9.221541,
    -17,
    1.834269,
    -9.4022,
    -17,
    -0.00001,
    -9.221538,
    -17,
    -1.834289,
    -8.686496,
    -17,
    -3.598077,
    -7.817637,
    -17,
    -5.223594,
    -6.648351,
    -17,
    -6.648369,
    -5.223572,
    -17,
    -7.817653,
    -3.598053,
    -17,
    -8.686507,
    -1.834264,
    -17,
    -9.221543,
    1.834279,
    -14.973991,
    -9.22154,
    3.598067,
    -14.973991,
    -8.686502,
    5.223583,
    -14.973991,
    -7.817646,
    6.64836,
    -14.973991,
    -6.648361,
    7.817645,
    -14.973991,
    -5.223583,
    8.686501,
    -14.973991,
    -3.598068,
    9.221539,
    -14.973991,
    -1.83428,
    9.402201,
    -14.973991,
    -0.000002,
    9.22154,
    -14.973991,
    1.834276,
    8.686502,
    -14.973991,
    3.598064,
    7.817645,
    -14.973991,
    5.223581,
    6.64836,
    -14.973991,
    6.648359,
    5.223583,
    -14.973991,
    7.817643,
    3.598065,
    -14.973991,
    8.6865,
    1.834276,
    -14.973991,
    9.221539,
    -0.000003,
    -14.973991,
    9.402199,
    -1.834282,
    -14.973991,
    9.221538,
    -3.59807,
    -14.973991,
    8.686498,
    -5.223587,
    -14.973991,
    7.81764,
    -6.648364,
    -14.973991,
    6.648355,
    -7.817647,
    -14.973991,
    5.223577,
    -8.686502,
    -14.973991,
    3.598058,
    -9.221541,
    -14.973991,
    1.834269,
    -9.4022,
    -14.973991,
    -0.00001,
    -9.221538,
    -14.973991,
    -1.834289,
    -8.686496,
    -14.973991,
    -3.598077,
    -7.817637,
    -14.973991,
    -5.223594,
    -6.648351,
    -14.973991,
    -6.648369,
    -5.223572,
    -14.973991,
    -7.817653,
    -3.598053,
    -14.973991,
    -8.686507,
    -1.834264,
    -14.973991,
    -9.221543,
    0,
    17,
    -10.4995,
    2.048351,
    17,
    -10.297755,
    4.017985,
    17,
    -9.700274,
    5.83321,
    17,
    -8.730016,
    7.424267,
    17,
    -7.424268,
    8.730016,
    17,
    -5.83321,
    9.700273,
    17,
    -4.017985,
    10.297754,
    17,
    -2.048352,
    10.499499,
    17,
    -0.000002,
    10.297755,
    17,
    2.048349,
    9.700274,
    17,
    4.017982,
    8.730016,
    17,
    5.833208,
    7.424267,
    17,
    7.424267,
    5.833209,
    17,
    8.730015,
    4.017983,
    17,
    9.700273,
    2.048348,
    17,
    10.297754,
    -0.000003,
    17,
    10.499498,
    -2.048355,
    17,
    10.297752,
    -4.017989,
    17,
    9.70027,
    -5.833214,
    17,
    8.730011,
    -7.424272,
    17,
    7.424262,
    -8.730019,
    17,
    5.833203,
    -9.700275,
    17,
    4.017976,
    -10.297756,
    17,
    2.048341,
    -10.499499,
    17,
    -0.000011,
    -10.297752,
    17,
    -2.048362,
    -9.700268,
    17,
    -4.017996,
    -8.730007,
    17,
    -5.833221,
    -7.424258,
    17,
    -7.424277,
    -5.833197,
    17,
    -8.730023,
    -4.01797,
    17,
    -9.700279,
    -2.048335,
    17,
    -10.297758,
    0,
    17,
    -9.402202,
    1.834279,
    17,
    -9.22154,
    3.598067,
    17,
    -8.686502,
    5.223583,
    17,
    -7.817646,
    6.64836,
    17,
    -6.648361,
    7.817645,
    17,
    -5.223583,
    8.686501,
    17,
    -3.598068,
    9.221539,
    17,
    -1.83428,
    9.402201,
    17,
    -0.000002,
    9.22154,
    17,
    1.834276,
    8.686502,
    17,
    3.598064,
    7.817645,
    17,
    5.223581,
    6.64836,
    17,
    6.648359,
    5.223583,
    17,
    7.817643,
    3.598065,
    17,
    8.6865,
    1.834276,
    17,
    9.221539,
    -0.000003,
    17,
    9.402199,
    -1.834282,
    17,
    9.221538,
    -3.59807,
    17,
    8.686498,
    -5.223587,
    17,
    7.81764,
    -6.648364,
    17,
    6.648355,
    -7.817647,
    17,
    5.223577,
    -8.686502,
    17,
    3.598058,
    -9.221541,
    17,
    1.834269,
    -9.4022,
    17,
    -0.00001,
    -9.221538,
    17,
    -1.834289,
    -8.686496,
    17,
    -3.598077,
    -7.817637,
    17,
    -5.223594,
    -6.648351,
    17,
    -6.648369,
    -5.223572,
    17,
    -7.817653,
    -3.598053,
    17,
    -8.686507,
    -1.834264,
    17,
    -9.221543,
    0,
    -17,
    -10.4995,
    2.048351,
    -17,
    -10.297755,
    4.017985,
    -17,
    -9.700274,
    5.83321,
    -17,
    -8.730016,
    7.424267,
    -17,
    -7.424268,
    8.730016,
    -17,
    -5.83321,
    9.700273,
    -17,
    -4.017985,
    10.297754,
    -17,
    -2.048352,
    10.499499,
    -17,
    -0.000002,
    10.297755,
    -17,
    2.048349,
    9.700274,
    -17,
    4.017982,
    8.730016,
    -17,
    5.833208,
    7.424267,
    -17,
    7.424267,
    5.833209,
    -17,
    8.730015,
    4.017983,
    -17,
    9.700273,
    2.048348,
    -17,
    10.297754,
    -0.000003,
    -17,
    10.499498,
    -2.048355,
    -17,
    10.297752,
    -4.017989,
    -17,
    9.70027,
    -5.833214,
    -17,
    8.730011,
    -7.424272,
    -17,
    7.424262,
    -8.730019,
    -17,
    5.833203,
    -9.700275,
    -17,
    4.017976,
    -10.297756,
    -17,
    2.048341,
    -10.499499,
    -17,
    -0.000011,
    -10.297752,
    -17,
    -2.048362,
    -9.700268,
    -17,
    -4.017996,
    -8.730007,
    -17,
    -5.833221,
    -7.424258,
    -17,
    -7.424277,
    -5.833197,
    -17,
    -8.730023,
    -4.01797,
    -17,
    -9.700279,
    -2.048335,
    -17,
    -10.297758,
    0,
    -17,
    -9.402202,
    1.834279,
    -17,
    -9.22154,
    3.598067,
    -17,
    -8.686502,
    5.223583,
    -17,
    -7.817646,
    6.64836,
    -17,
    -6.648361,
    7.817645,
    -17,
    -5.223583,
    8.686501,
    -17,
    -3.598068,
    9.221539,
    -17,
    -1.83428,
    9.402201,
    -17,
    -0.000002,
    9.22154,
    -17,
    1.834276,
    8.686502,
    -17,
    3.598064,
    7.817645,
    -17,
    5.223581,
    6.64836,
    -17,
    6.648359,
    5.223583,
    -17,
    7.817643,
    3.598065,
    -17,
    8.6865,
    1.834276,
    -17,
    9.221539,
    -0.000003,
    -17,
    9.402199,
    -1.834282,
    -17,
    9.221538,
    -3.59807,
    -17,
    8.686498,
    -5.223587,
    -17,
    7.81764,
    -6.648364,
    -17,
    6.648355,
    -7.817647,
    -17,
    5.223577,
    -8.686502,
    -17,
    3.598058,
    -9.221541,
    -17,
    1.834269,
    -9.4022,
    -17,
    -0.00001,
    -9.221538,
    -17,
    -1.834289,
    -8.686496,
    -17,
    -3.598077,
    -7.817637,
    -17,
    -5.223594,
    -6.648351,
    -17,
    -6.648369,
    -5.223572,
    -17,
    -7.817653,
    -3.598053,
    -17,
    -8.686507,
    -1.834264,
    -17,
    -9.221543,
    0,
    -17,
    0,
    0,
    14.973991,
    -9.402202,
    0,
    17,
    -10.4995,
    2.048351,
    17,
    -10.297755,
    4.017985,
    17,
    -9.700274,
    5.83321,
    17,
    -8.730016,
    7.424267,
    17,
    -7.424268,
    8.730016,
    17,
    -5.83321,
    9.700273,
    17,
    -4.017985,
    10.297754,
    17,
    -2.048352,
    10.499499,
    17,
    -0.000002,
    10.297755,
    17,
    2.048349,
    9.700274,
    17,
    4.017982,
    8.730016,
    17,
    5.833208,
    7.424267,
    17,
    7.424267,
    5.833209,
    17,
    8.730015,
    4.017983,
    17,
    9.700273,
    2.048348,
    17,
    10.297754,
    -0.000003,
    17,
    10.499498,
    -2.048355,
    17,
    10.297752,
    -4.017989,
    17,
    9.70027,
    -5.833214,
    17,
    8.730011,
    -7.424272,
    17,
    7.424262,
    -8.730019,
    17,
    5.833203,
    -9.700275,
    17,
    4.017976,
    -10.297756,
    17,
    2.048341,
    -10.499499,
    17,
    -0.000011,
    -10.297752,
    17,
    -2.048362,
    -9.700268,
    17,
    -4.017996,
    -8.730007,
    17,
    -5.833221,
    -7.424258,
    17,
    -7.424277,
    -5.833197,
    17,
    -8.730023,
    -4.01797,
    17,
    -9.700279,
    -2.048335,
    17,
    -10.297758,
    0,
    7.540144,
    -12.164228,
    2.373123,
    7.540144,
    -11.930496,
    4.655049,
    7.540144,
    -11.23828,
    6.758083,
    7.540144,
    -10.114186,
    8.601408,
    7.540144,
    -8.601408,
    10.114188,
    7.540144,
    -6.758082,
    11.238281,
    7.540144,
    -4.655048,
    11.930495,
    7.540144,
    -2.373124,
    12.164227,
    7.540144,
    -0.000001,
    11.930496,
    7.540144,
    2.373121,
    11.238282,
    7.540144,
    4.655046,
    10.114188,
    7.540144,
    6.758082,
    8.601408,
    7.540144,
    8.601408,
    6.758082,
    7.540144,
    10.114187,
    4.655047,
    7.540144,
    11.238281,
    2.37312,
    7.540144,
    11.930496,
    -0.000004,
    7.540144,
    12.164227,
    -2.373128,
    7.540144,
    11.930494,
    -4.655054,
    7.540144,
    11.238278,
    -6.758089,
    7.540144,
    10.114182,
    -8.601414,
    7.540144,
    8.601402,
    -10.114191,
    7.540144,
    6.758076,
    -11.238285,
    7.540144,
    4.655039,
    -11.930498,
    7.540144,
    2.373113,
    -12.164227,
    7.540144,
    -0.000012,
    -11.930493,
    7.540144,
    -2.373136,
    -11.238275,
    7.540144,
    -4.655062,
    -10.114178,
    7.540144,
    -6.758095,
    -8.601397,
    7.540144,
    -8.601419,
    -6.758069,
    7.540144,
    -10.114196,
    -4.655032,
    7.540144,
    -11.238289,
    -2.373105,
    7.540144,
    -11.930499,
    0,
    13.39185,
    -11.336113,
    2.211566,
    13.39185,
    -11.118293,
    4.338143,
    13.39185,
    -10.473203,
    6.298007,
    13.39185,
    -9.425633,
    8.015841,
    13.39185,
    -8.015841,
    9.425634,
    13.39185,
    -6.298007,
    10.473203,
    13.39185,
    -4.338142,
    11.118291,
    13.39185,
    -2.211566,
    11.336112,
    13.39185,
    -0.000001,
    11.118293,
    13.39185,
    2.211564,
    10.473203,
    13.39185,
    4.33814,
    9.425634,
    13.39185,
    6.298006,
    8.015841,
    13.39185,
    8.015842,
    6.298007,
    13.39185,
    9.425633,
    4.33814,
    13.39185,
    10.473203,
    2.211563,
    13.39185,
    11.118292,
    -0.000004,
    13.39185,
    11.336111,
    -2.21157,
    13.39185,
    11.11829,
    -4.338147,
    13.39185,
    10.473199,
    -6.298012,
    13.39185,
    9.425629,
    -8.015848,
    13.39185,
    8.015837,
    -9.425637,
    13.39185,
    6.298,
    -10.473206,
    13.39185,
    4.338133,
    -11.118294,
    13.39185,
    2.211556,
    -11.336112,
    13.39185,
    -0.000011,
    -11.118289,
    13.39185,
    -2.211578,
    -10.473197,
    13.39185,
    -4.338155,
    -9.425625,
    13.39185,
    -6.298018,
    -8.015832,
    13.39185,
    -8.015852,
    -6.297993,
    13.39185,
    -9.425642,
    -4.338127,
    13.39185,
    -10.473209,
    -2.211549,
    13.39185,
    -11.118295,
    0,
    15.54235,
    -10.832383,
    2.113293,
    15.54235,
    -10.624242,
    4.145374,
    15.54235,
    -10.007818,
    6.018149,
    15.54235,
    -9.006798,
    7.659651,
    15.54235,
    -7.659651,
    9.006799,
    15.54235,
    -6.018149,
    10.007817,
    15.54235,
    -4.145374,
    10.624241,
    15.54235,
    -2.113294,
    10.832382,
    15.54235,
    -0.000001,
    10.624242,
    15.54235,
    2.113291,
    10.007818,
    15.54235,
    4.145371,
    9.006799,
    15.54235,
    6.018148,
    7.659651,
    15.54235,
    7.659651,
    6.018149,
    15.54235,
    9.006797,
    4.145371,
    15.54235,
    10.007817,
    2.113291,
    15.54235,
    10.624241,
    -0.000003,
    15.54235,
    10.832381,
    -2.113297,
    15.54235,
    10.624239,
    -4.145378,
    15.54235,
    10.007814,
    -6.018154,
    15.54235,
    9.006793,
    -7.659657,
    15.54235,
    7.659646,
    -9.006801,
    15.54235,
    6.018143,
    -10.00782,
    15.54235,
    4.145364,
    -10.624243,
    15.54235,
    2.113283,
    -10.832382,
    15.54235,
    -0.000011,
    -10.624239,
    15.54235,
    -2.113305,
    -10.007812,
    15.54235,
    -4.145386,
    -9.006789,
    15.54235,
    -6.018161,
    -7.659642,
    15.54235,
    -7.659661,
    -6.018137,
    15.54235,
    -9.006806,
    -4.145358,
    15.54235,
    -10.007824,
    -2.113277,
    15.54235,
    -10.624245,
    0,
    14.973991,
    0,
    1.834279,
    14.973991,
    -9.22154,
    3.598067,
    14.973991,
    -8.686502,
    5.223583,
    14.973991,
    -7.817646,
    6.64836,
    14.973991,
    -6.648361,
    7.817645,
    14.973991,
    -5.223583,
    8.686501,
    14.973991,
    -3.598068,
    9.221539,
    14.973991,
    -1.83428,
    9.402201,
    14.973991,
    -0.000002,
    9.22154,
    14.973991,
    1.834276,
    8.686502,
    14.973991,
    3.598064,
    7.817645,
    14.973991,
    5.223581,
    6.64836,
    14.973991,
    6.648359,
    5.223583,
    14.973991,
    7.817643,
    3.598065,
    14.973991,
    8.6865,
    1.834276,
    14.973991,
    9.221539,
    -0.000003,
    14.973991,
    9.402199,
    -1.834282,
    14.973991,
    9.221538,
    -3.59807,
    14.973991,
    8.686498,
    -5.223587,
    14.973991,
    7.81764,
    -6.648364,
    14.973991,
    6.648355,
    -7.817647,
    14.973991,
    5.223577,
    -8.686502,
    14.973991,
    3.598058,
    -9.221541,
    14.973991,
    1.834269,
    -9.4022,
    14.973991,
    -0.00001,
    -9.221538,
    14.973991,
    -1.834289,
    -8.686496,
    14.973991,
    -3.598077,
    -7.817637,
    14.973991,
    -5.223594,
    -6.648351,
    14.973991,
    -6.648369,
    -5.223572,
    14.973991,
    -7.817653,
    -3.598053,
    14.973991,
    -8.686507,
    -1.834264,
    14.973991,
    -9.221543,
    0,
    17,
    0,
    0,
    -14.973991,
    -9.402202,
    0,
    -17,
    -10.4995,
    2.048351,
    -17,
    -10.297755,
    4.017985,
    -17,
    -9.700274,
    5.83321,
    -17,
    -8.730016,
    7.424267,
    -17,
    -7.424268,
    8.730016,
    -17,
    -5.83321,
    9.700273,
    -17,
    -4.017985,
    10.297754,
    -17,
    -2.048352,
    10.499499,
    -17,
    -0.000002,
    10.297755,
    -17,
    2.048349,
    9.700274,
    -17,
    4.017982,
    8.730016,
    -17,
    5.833208,
    7.424267,
    -17,
    7.424267,
    5.833209,
    -17,
    8.730015,
    4.017983,
    -17,
    9.700273,
    2.048348,
    -17,
    10.297754,
    -0.000003,
    -17,
    10.499498,
    -2.048355,
    -17,
    10.297752,
    -4.017989,
    -17,
    9.70027,
    -5.833214,
    -17,
    8.730011,
    -7.424272,
    -17,
    7.424262,
    -8.730019,
    -17,
    5.833203,
    -9.700275,
    -17,
    4.017976,
    -10.297756,
    -17,
    2.048341,
    -10.499499,
    -17,
    -0.000011,
    -10.297752,
    -17,
    -2.048362,
    -9.700268,
    -17,
    -4.017996,
    -8.730007,
    -17,
    -5.833221,
    -7.424258,
    -17,
    -7.424277,
    -5.833197,
    -17,
    -8.730023,
    -4.01797,
    -17,
    -9.700279,
    -2.048335,
    -17,
    -10.297758,
    0,
    0,
    -12.65,
    2.467892,
    0,
    -12.406933,
    4.840946,
    0,
    -11.687076,
    7.027963,
    0,
    -10.51809,
    8.944901,
    0,
    -8.944901,
    10.518091,
    0,
    -7.027963,
    11.687076,
    0,
    -4.840945,
    12.406933,
    0,
    -2.467893,
    12.65,
    0,
    -0.000001,
    12.406934,
    0,
    2.467891,
    11.687077,
    0,
    4.840943,
    10.518091,
    0,
    7.027963,
    8.944901,
    0,
    8.944901,
    7.027963,
    0,
    10.518091,
    4.840943,
    0,
    11.687077,
    2.46789,
    0,
    12.406934,
    -0.000004,
    0,
    12.65,
    -2.467898,
    0,
    12.406932,
    -4.840951,
    0,
    11.687073,
    -7.027969,
    0,
    10.518086,
    -8.944906,
    0,
    8.944895,
    -10.518095,
    0,
    7.027956,
    -11.687079,
    0,
    4.840936,
    -12.406936,
    0,
    2.467882,
    -12.65,
    0,
    -0.000012,
    -12.406931,
    0,
    -2.467906,
    -11.68707,
    0,
    -4.840959,
    -10.518082,
    0,
    -7.027976,
    -8.944889,
    0,
    -8.944912,
    -7.027949,
    0,
    -10.5181,
    -4.840928,
    0,
    -11.687083,
    -2.467874,
    0,
    -12.406937,
    0,
    -7.540144,
    -12.164228,
    2.373123,
    -7.540144,
    -11.930496,
    4.655049,
    -7.540144,
    -11.23828,
    6.758083,
    -7.540144,
    -10.114186,
    8.601408,
    -7.540144,
    -8.601408,
    10.114188,
    -7.540144,
    -6.758082,
    11.238281,
    -7.540144,
    -4.655048,
    11.930495,
    -7.540144,
    -2.373124,
    12.164227,
    -7.540144,
    -0.000001,
    11.930496,
    -7.540144,
    2.373121,
    11.238282,
    -7.540144,
    4.655046,
    10.114188,
    -7.540144,
    6.758082,
    8.601408,
    -7.540144,
    8.601408,
    6.758082,
    -7.540144,
    10.114187,
    4.655047,
    -7.540144,
    11.238281,
    2.37312,
    -7.540144,
    11.930496,
    -0.000004,
    -7.540144,
    12.164227,
    -2.373128,
    -7.540144,
    11.930494,
    -4.655054,
    -7.540144,
    11.238278,
    -6.758089,
    -7.540144,
    10.114182,
    -8.601414,
    -7.540144,
    8.601402,
    -10.114191,
    -7.540144,
    6.758076,
    -11.238285,
    -7.540144,
    4.655039,
    -11.930498,
    -7.540144,
    2.373113,
    -12.164227,
    -7.540144,
    -0.000012,
    -11.930493,
    -7.540144,
    -2.373136,
    -11.238275,
    -7.540144,
    -4.655062,
    -10.114178,
    -7.540144,
    -6.758095,
    -8.601397,
    -7.540144,
    -8.601419,
    -6.758069,
    -7.540144,
    -10.114196,
    -4.655032,
    -7.540144,
    -11.238289,
    -2.373105,
    -7.540144,
    -11.930499,
    0,
    -13.39185,
    -11.336113,
    2.211566,
    -13.39185,
    -11.118293,
    4.338143,
    -13.39185,
    -10.473203,
    6.298007,
    -13.39185,
    -9.425633,
    8.015841,
    -13.39185,
    -8.015841,
    9.425634,
    -13.39185,
    -6.298007,
    10.473203,
    -13.39185,
    -4.338142,
    11.118291,
    -13.39185,
    -2.211566,
    11.336112,
    -13.39185,
    -0.000001,
    11.118293,
    -13.39185,
    2.211564,
    10.473203,
    -13.39185,
    4.33814,
    9.425634,
    -13.39185,
    6.298006,
    8.015841,
    -13.39185,
    8.015842,
    6.298007,
    -13.39185,
    9.425633,
    4.33814,
    -13.39185,
    10.473203,
    2.211563,
    -13.39185,
    11.118292,
    -0.000004,
    -13.39185,
    11.336111,
    -2.21157,
    -13.39185,
    11.11829,
    -4.338147,
    -13.39185,
    10.473199,
    -6.298012,
    -13.39185,
    9.425629,
    -8.015848,
    -13.39185,
    8.015837,
    -9.425637,
    -13.39185,
    6.298,
    -10.473206,
    -13.39185,
    4.338133,
    -11.118294,
    -13.39185,
    2.211556,
    -11.336112,
    -13.39185,
    -0.000011,
    -11.118289,
    -13.39185,
    -2.211578,
    -10.473197,
    -13.39185,
    -4.338155,
    -9.425625,
    -13.39185,
    -6.298018,
    -8.015832,
    -13.39185,
    -8.015852,
    -6.297993,
    -13.39185,
    -9.425642,
    -4.338127,
    -13.39185,
    -10.473209,
    -2.211549,
    -13.39185,
    -11.118295,
    0,
    -15.54235,
    -10.832383,
    2.113293,
    -15.54235,
    -10.624242,
    4.145374,
    -15.54235,
    -10.007818,
    6.018149,
    -15.54235,
    -9.006798,
    7.659651,
    -15.54235,
    -7.659651,
    9.006799,
    -15.54235,
    -6.018149,
    10.007817,
    -15.54235,
    -4.145374,
    10.624241,
    -15.54235,
    -2.113294,
    10.832382,
    -15.54235,
    -0.000001,
    10.624242,
    -15.54235,
    2.113291,
    10.007818,
    -15.54235,
    4.145371,
    9.006799,
    -15.54235,
    6.018148,
    7.659651,
    -15.54235,
    7.659651,
    6.018149,
    -15.54235,
    9.006797,
    4.145371,
    -15.54235,
    10.007817,
    2.113291,
    -15.54235,
    10.624241,
    -0.000003,
    -15.54235,
    10.832381,
    -2.113297,
    -15.54235,
    10.624239,
    -4.145378,
    -15.54235,
    10.007814,
    -6.018154,
    -15.54235,
    9.006793,
    -7.659657,
    -15.54235,
    7.659646,
    -9.006801,
    -15.54235,
    6.018143,
    -10.00782,
    -15.54235,
    4.145364,
    -10.624243,
    -15.54235,
    2.113283,
    -10.832382,
    -15.54235,
    -0.000011,
    -10.624239,
    -15.54235,
    -2.113305,
    -10.007812,
    -15.54235,
    -4.145386,
    -9.006789,
    -15.54235,
    -6.018161,
    -7.659642,
    -15.54235,
    -7.659661,
    -6.018137,
    -15.54235,
    -9.006806,
    -4.145358,
    -15.54235,
    -10.007824,
    -2.113277,
    -15.54235,
    -10.624245,
    0,
    -14.973991,
    0,
    1.834279,
    -14.973991,
    -9.22154,
    3.598067,
    -14.973991,
    -8.686502,
    5.223583,
    -14.973991,
    -7.817646,
    6.64836,
    -14.973991,
    -6.648361,
    7.817645,
    -14.973991,
    -5.223583,
    8.686501,
    -14.973991,
    -3.598068,
    9.221539,
    -14.973991,
    -1.83428,
    9.402201,
    -14.973991,
    -0.000002,
    9.22154,
    -14.973991,
    1.834276,
    8.686502,
    -14.973991,
    3.598064,
    7.817645,
    -14.973991,
    5.223581,
    6.64836,
    -14.973991,
    6.648359,
    5.223583,
    -14.973991,
    7.817643,
    3.598065,
    -14.973991,
    8.6865,
    1.834276,
    -14.973991,
    9.221539,
    -0.000003,
    -14.973991,
    9.402199,
    -1.834282,
    -14.973991,
    9.221538,
    -3.59807,
    -14.973991,
    8.686498,
    -5.223587,
    -14.973991,
    7.81764,
    -6.648364,
    -14.973991,
    6.648355,
    -7.817647,
    -14.973991,
    5.223577,
    -8.686502,
    -14.973991,
    3.598058,
    -9.221541,
    -14.973991,
    1.834269,
    -9.4022,
    -14.973991,
    -0.00001,
    -9.221538,
    -14.973991,
    -1.834289,
    -8.686496,
    -14.973991,
    -3.598077,
    -7.817637,
    -14.973991,
    -5.223594,
    -6.648351,
    -14.973991,
    -6.648369,
    -5.223572,
    -14.973991,
    -7.817653,
    -3.598053,
    -14.973991,
    -8.686507,
    -1.834264,
    -14.973991,
    -9.221543
  ],
  "normals": [
    -0.0123,
    0.9995,
    -0.0297,
    -0.0063,
    0.9995,
    -0.0316,
    -0.0507,
    0.9911,
    0.1225,
    -0.0737,
    0.9911,
    0.1103,
    0.0484,
    -0.9687,
    0.2434,
    0.095,
    -0.9687,
    0.2293,
    0,
    0.9995,
    -0.0322,
    -0.0258,
    0.9911,
    0.13,
    0.1379,
    -0.9687,
    0.2064,
    0,
    0.9911,
    0.1326,
    0.1755,
    -0.9687,
    0.1755,
    0.2064,
    -0.9687,
    0.1379,
    0.2293,
    -0.9687,
    0.095,
    0.2434,
    -0.9687,
    0.0484,
    0.2482,
    -0.9687,
    0,
    0.2434,
    -0.9687,
    -0.0484,
    0.2293,
    -0.9687,
    -0.095,
    -0.0155,
    -0.9968,
    0.0779,
    0,
    -0.9968,
    0.0794,
    0.2064,
    -0.9687,
    -0.1379,
    -0.0304,
    -0.9968,
    0.0734,
    0.1755,
    -0.9687,
    -0.1755,
    -0.0441,
    -0.9968,
    0.066,
    0.1379,
    -0.9687,
    -0.2064,
    -0.0562,
    -0.9968,
    0.0562,
    0.095,
    -0.9687,
    -0.2293,
    -0.066,
    -0.9968,
    0.0441,
    0.0484,
    -0.9687,
    -0.2434,
    -0.0734,
    -0.9968,
    0.0304,
    0,
    -0.9687,
    -0.2482,
    -0.0779,
    -0.9968,
    0.0155,
    0,
    -0.9964,
    -0.0842,
    -0.0164,
    -0.9964,
    -0.0826,
    -0.0794,
    -0.9968,
    0,
    -0.0322,
    -0.9964,
    -0.0778,
    0,
    0.9579,
    0.2871,
    -0.056,
    0.9579,
    0.2815,
    -0.0779,
    -0.9968,
    -0.0155,
    -0.0468,
    -0.9964,
    -0.07,
    -0.0734,
    -0.9968,
    -0.0304,
    -0.0595,
    -0.9964,
    -0.0595,
    -0.1098,
    0.9579,
    0.2652,
    -0.066,
    -0.9968,
    -0.0441,
    -0.07,
    -0.9964,
    -0.0468,
    -0.1595,
    0.9579,
    0.2387,
    -0.0562,
    -0.9968,
    -0.0562,
    -0.0778,
    -0.9964,
    -0.0322,
    -0.203,
    0.9579,
    0.203,
    -0.0441,
    -0.9968,
    -0.066,
    0.0063,
    0.9995,
    -0.0316,
    -0.0826,
    -0.9964,
    -0.0164,
    -0.2387,
    0.9579,
    0.1595,
    -0.0304,
    -0.9968,
    -0.0734,
    0.0123,
    0.9995,
    -0.0297,
    0.0258,
    0.9911,
    0.13,
    -0.0842,
    -0.9964,
    0,
    -0.2652,
    0.9579,
    0.1098,
    -0.0155,
    -0.9968,
    -0.0779,
    0.0179,
    0.9995,
    -0.0267,
    0.0507,
    0.9911,
    0.1225,
    -0.0826,
    -0.9964,
    0.0164,
    -0.2815,
    0.9579,
    0.056,
    0,
    -0.9968,
    -0.0794,
    0.0227,
    0.9995,
    -0.0227,
    0.0737,
    0.9911,
    0.1103,
    -0.0778,
    -0.9964,
    0.0322,
    -0.2871,
    0.9579,
    0,
    0.0155,
    -0.9968,
    -0.0779,
    0.0267,
    0.9995,
    -0.0179,
    0.0938,
    0.9911,
    0.0938,
    -0.07,
    -0.9964,
    0.0468,
    -0.2815,
    0.9579,
    -0.056,
    0.0304,
    -0.9968,
    -0.0734,
    0.0297,
    0.9995,
    -0.0123,
    0.1103,
    0.9911,
    0.0737,
    -0.0595,
    -0.9964,
    0.0595,
    -0.2652,
    0.9579,
    -0.1098,
    0.0441,
    -0.9968,
    -0.066,
    0.0316,
    0.9995,
    -0.0063,
    0.1225,
    0.9911,
    0.0507,
    -0.0468,
    -0.9964,
    0.07,
    -0.2387,
    0.9579,
    -0.1595,
    0.0562,
    -0.9968,
    -0.0562,
    0.0322,
    0.9995,
    0,
    0.13,
    0.9911,
    0.0258,
    -0.0322,
    -0.9964,
    0.0778,
    -0.203,
    0.9579,
    -0.203,
    0.066,
    -0.9968,
    -0.0441,
    0.0316,
    0.9995,
    0.0063,
    0.1326,
    0.9911,
    0,
    -0.0164,
    -0.9964,
    0.0826,
    -0.1595,
    0.9579,
    -0.2387,
    0.0734,
    -0.9968,
    -0.0304,
    0.0297,
    0.9995,
    0.0123,
    0.13,
    0.9911,
    -0.0258,
    0,
    -0.9964,
    0.0842,
    -0.1098,
    0.9579,
    -0.2652,
    0.0779,
    -0.9968,
    -0.0155,
    0.0267,
    0.9995,
    0.0179,
    0.1225,
    0.9911,
    -0.0507,
    0.0164,
    -0.9964,
    0.0826,
    -0.056,
    0.9579,
    -0.2815,
    0.0794,
    -0.9968,
    0,
    0.0227,
    0.9995,
    0.0227,
    0.1103,
    0.9911,
    -0.0737,
    0.0322,
    -0.9964,
    0.0778,
    0,
    0.9579,
    -0.2871,
    0.0779,
    -0.9968,
    0.0155,
    0.0179,
    0.9995,
    0.0267,
    0.0938,
    0.9911,
    -0.0938,
    0.0468,
    -0.9964,
    0.07,
    0.056,
    0.9579,
    -0.2815,
    0.0734,
    -0.9968,
    0.0304,
    0.0123,
    0.9995,
    0.0297,
    0.0737,
    0.9911,
    -0.1103,
    0.0595,
    -0.9964,
    0.0595,
    0.1098,
    0.9579,
    -0.2652,
    0.066,
    -0.9968,
    0.0441,
    -0.0484,
    -0.9687,
    -0.2434,
    0.0063,
    0.9995,
    0.0316,
    0.0507,
    0.9911,
    -0.1225,
    0.07,
    -0.9964,
    0.0468,
    0.1595,
    0.9579,
    -0.2387,
    0.0562,
    -0.9968,
    0.0562,
    -0.095,
    -0.9687,
    -0.2293,
    0,
    0.9995,
    0.0322,
    0.0258,
    0.9911,
    -0.13,
    0.0778,
    -0.9964,
    0.0322,
    0.203,
    0.9579,
    -0.203,
    0.0441,
    -0.9968,
    0.066,
    -0.1379,
    -0.9687,
    -0.2064,
    -0.0063,
    0.9995,
    0.0316,
    0,
    0.9911,
    -0.1326,
    0.0826,
    -0.9964,
    0.0164,
    0.2387,
    0.9579,
    -0.1595,
    0.0304,
    -0.9968,
    0.0734,
    -0.1755,
    -0.9687,
    -0.1755,
    -0.0123,
    0.9995,
    0.0297,
    -0.0258,
    0.9911,
    -0.13,
    0.0842,
    -0.9964,
    0,
    0.2652,
    0.9579,
    -0.1098,
    0.0155,
    -0.9968,
    0.0779,
    -0.2064,
    -0.9687,
    -0.1379,
    -0.0179,
    0.9995,
    0.0267,
    -0.0507,
    0.9911,
    -0.1225,
    0.0826,
    -0.9964,
    -0.0164,
    0.2815,
    0.9579,
    -0.056,
    -0.2293,
    -0.9687,
    -0.095,
    -0.0227,
    0.9995,
    0.0227,
    -0.0737,
    0.9911,
    -0.1103,
    0.0778,
    -0.9964,
    -0.0322,
    0.2871,
    0.9579,
    0,
    -0.2434,
    -0.9687,
    -0.0484,
    -0.0267,
    0.9995,
    0.0179,
    -0.0938,
    0.9911,
    -0.0938,
    0.07,
    -0.9964,
    -0.0468,
    0.2815,
    0.9579,
    0.056,
    -0.2482,
    -0.9687,
    0,
    -0.0297,
    0.9995,
    0.0123,
    -0.1103,
    0.9911,
    -0.0737,
    0.0595,
    -0.9964,
    -0.0595,
    0.2652,
    0.9579,
    0.1098,
    -0.2434,
    -0.9687,
    0.0484,
    -0.0316,
    0.9995,
    0.0063,
    -0.1225,
    0.9911,
    -0.0507,
    0.0468,
    -0.9964,
    -0.07,
    0.2387,
    0.9579,
    0.1595,
    -0.2293,
    -0.9687,
    0.095,
    -0.0322,
    0.9995,
    0,
    -0.13,
    0.9911,
    -0.0258,
    0.0322,
    -0.9964,
    -0.0778,
    0.203,
    0.9579,
    0.203,
    -0.2064,
    -0.9687,
    0.1379,
    -0.0316,
    0.9995,
    -0.0063,
    -0.1326,
    0.9911,
    0,
    0.0164,
    -0.9964,
    -0.0826,
    0.1595,
    0.9579,
    0.2387,
    -0.1755,
    -0.9687,
    0.1755,
    -0.0297,
    0.9995,
    -0.0123,
    -0.13,
    0.9911,
    0.0258,
    0.1098,
    0.9579,
    0.2652,
    -0.1379,
    -0.9687,
    0.2064,
    -0.0267,
    0.9995,
    -0.0179,
    -0.1225,
    0.9911,
    0.0507,
    0.056,
    0.9579,
    0.2815,
    -0.095,
    -0.9687,
    0.2293,
    -0.0227,
    0.9995,
    -0.0227,
    -0.1103,
    0.9911,
    0.0737,
    -0.0484,
    -0.9687,
    0.2434,
    -0.0179,
    0.9995,
    -0.0267,
    -0.0938,
    0.9911,
    0.0938,
    0,
    -0.9687,
    0.2482,
    -0.0123,
    -0.9995,
    -0.0297,
    -0.0063,
    -0.9995,
    -0.0316,
    -0.0507,
    -0.9911,
    0.1225,
    -0.0737,
    -0.9911,
    0.1103,
    0.0484,
    0.9687,
    0.2434,
    0.095,
    0.9687,
    0.2293,
    0,
    -0.9995,
    -0.0322,
    -0.0258,
    -0.9911,
    0.13,
    0.1379,
    0.9687,
    0.2064,
    0,
    -0.9911,
    0.1326,
    0.1755,
    0.9687,
    0.1755,
    0.2064,
    0.9687,
    0.1379,
    0.2293,
    0.9687,
    0.095,
    0.2434,
    0.9687,
    0.0484,
    0.2482,
    0.9687,
    0,
    0.2434,
    0.9687,
    -0.0484,
    0.2293,
    0.9687,
    -0.095,
    -0.0155,
    0.9968,
    0.0779,
    0,
    0.9968,
    0.0794,
    0.2064,
    0.9687,
    -0.1379,
    -0.0304,
    0.9968,
    0.0734,
    0.1755,
    0.9687,
    -0.1755,
    -0.0441,
    0.9968,
    0.066,
    0.1379,
    0.9687,
    -0.2064,
    -0.0562,
    0.9968,
    0.0562,
    0.095,
    0.9687,
    -0.2293,
    -0.066,
    0.9968,
    0.0441,
    0.0484,
    0.9687,
    -0.2434,
    -0.0734,
    0.9968,
    0.0304,
    0,
    0.9687,
    -0.2482,
    -0.0779,
    0.9968,
    0.0155,
    0,
    0.9964,
    -0.0842,
    -0.0164,
    0.9964,
    -0.0826,
    -0.0794,
    0.9968,
    0,
    -0.0322,
    0.9964,
    -0.0778,
    0,
    -0.9579,
    0.2871,
    -0.056,
    -0.9579,
    0.2815,
    -0.0779,
    0.9968,
    -0.0155,
    -0.0468,
    0.9964,
    -0.07,
    -0.0734,
    0.9968,
    -0.0304,
    -0.0595,
    0.9964,
    -0.0595,
    -0.1098,
    -0.9579,
    0.2652,
    -0.066,
    0.9968,
    -0.0441,
    -0.07,
    0.9964,
    -0.0468,
    -0.1595,
    -0.9579,
    0.2387,
    -0.0562,
    0.9968,
    -0.0562,
    -0.0778,
    0.9964,
    -0.0322,
    -0.203,
    -0.9579,
    0.203,
    -0.0441,
    0.9968,
    -0.066,
    0.0063,
    -0.9995,
    -0.0316,
    -0.0826,
    0.9964,
    -0.0164,
    -0.2387,
    -0.9579,
    0.1595,
    -0.0304,
    0.9968,
    -0.0734,
    0.0123,
    -0.9995,
    -0.0297,
    0.0258,
    -0.9911,
    0.13,
    -0.0842,
    0.9964,
    0,
    -0.2652,
    -0.9579,
    0.1098,
    -0.0155,
    0.9968,
    -0.0779,
    0.0179,
    -0.9995,
    -0.0267,
    0.0507,
    -0.9911,
    0.1225,
    -0.0826,
    0.9964,
    0.0164,
    -0.2815,
    -0.9579,
    0.056,
    0,
    0.9968,
    -0.0794,
    0.0227,
    -0.9995,
    -0.0227,
    0.0737,
    -0.9911,
    0.1103,
    -0.0778,
    0.9964,
    0.0322,
    -0.2871,
    -0.9579,
    0,
    0.0155,
    0.9968,
    -0.0779,
    0.0267,
    -0.9995,
    -0.0179,
    0.0938,
    -0.9911,
    0.0938,
    -0.07,
    0.9964,
    0.0468,
    -0.2815,
    -0.9579,
    -0.056,
    0.0304,
    0.9968,
    -0.0734,
    0.0297,
    -0.9995,
    -0.0123,
    0.1103,
    -0.9911,
    0.0737,
    -0.0595,
    0.9964,
    0.0595,
    -0.2652,
    -0.9579,
    -0.1098,
    0.0441,
    0.9968,
    -0.066,
    0.0316,
    -0.9995,
    -0.0063,
    0.1225,
    -0.9911,
    0.0507,
    -0.0468,
    0.9964,
    0.07,
    -0.2387,
    -0.9579,
    -0.1595,
    0.0562,
    0.9968,
    -0.0562,
    0.0322,
    -0.9995,
    0,
    0.13,
    -0.9911,
    0.0258,
    -0.0322,
    0.9964,
    0.0778,
    -0.203,
    -0.9579,
    -0.203,
    0.066,
    0.9968,
    -0.0441,
    0.0316,
    -0.9995,
    0.0063,
    0.1326,
    -0.9911,
    0,
    -0.0164,
    0.9964,
    0.0826,
    -0.1595,
    -0.9579,
    -0.2387,
    0.0734,
    0.9968,
    -0.0304,
    0.0297,
    -0.9995,
    0.0123,
    0.13,
    -0.9911,
    -0.0258,
    0,
    0.9964,
    0.0842,
    -0.1098,
    -0.9579,
    -0.2652,
    0.0779,
    0.9968,
    -0.0155,
    0.0267,
    -0.9995,
    0.0179,
    0.1225,
    -0.9911,
    -0.0507,
    0.0164,
    0.9964,
    0.0826,
    -0.056,
    -0.9579,
    -0.2815,
    0.0794,
    0.9968,
    0,
    0.0227,
    -0.9995,
    0.0227,
    0.1103,
    -0.9911,
    -0.0737,
    0.0322,
    0.9964,
    0.0778,
    0,
    -0.9579,
    -0.2871,
    0.0779,
    0.9968,
    0.0155,
    0.0179,
    -0.9995,
    0.0267,
    0.0938,
    -0.9911,
    -0.0938,
    0.0468,
    0.9964,
    0.07,
    0.056,
    -0.9579,
    -0.2815,
    0.0734,
    0.9968,
    0.0304,
    0.0123,
    -0.9995,
    0.0297,
    0.0737,
    -0.9911,
    -0.1103,
    0.0595,
    0.9964,
    0.0595,
    0.1098,
    -0.9579,
    -0.2652,
    0.066,
    0.9968,
    0.0441,
    -0.0484,
    0.9687,
    -0.2434,
    0.0063,
    -0.9995,
    0.0316,
    0.0507,
    -0.9911,
    -0.1225,
    0.07,
    0.9964,
    0.0468,
    0.1595,
    -0.9579,
    -0.2387,
    0.0562,
    0.9968,
    0.0562,
    -0.095,
    0.9687,
    -0.2293,
    0,
    -0.9995,
    0.0322,
    0.0258,
    -0.9911,
    -0.13,
    0.0778,
    0.9964,
    0.0322,
    0.203,
    -0.9579,
    -0.203,
    0.0441,
    0.9968,
    0.066,
    -0.1379,
    0.9687,
    -0.2064,
    -0.0063,
    -0.9995,
    0.0316,
    0,
    -0.9911,
    -0.1326,
    0.0826,
    0.9964,
    0.0164,
    0.2387,
    -0.9579,
    -0.1595,
    0.0304,
    0.9968,
    0.0734,
    -0.1755,
    0.9687,
    -0.1755,
    -0.0123,
    -0.9995,
    0.0297,
    -0.0258,
    -0.9911,
    -0.13,
    0.0842,
    0.9964,
    0,
    0.2652,
    -0.9579,
    -0.1098,
    0.0155,
    0.9968,
    0.0779,
    -0.2064,
    0.9687,
    -0.1379,
    -0.0179,
    -0.9995,
    0.0267,
    -0.0507,
    -0.9911,
    -0.1225,
    0.0826,
    0.9964,
    -0.0164,
    0.2815,
    -0.9579,
    -0.056,
    -0.2293,
    0.9687,
    -0.095,
    -0.0227,
    -0.9995,
    0.0227,
    -0.0737,
    -0.9911,
    -0.1103,
    0.0778,
    0.9964,
    -0.0322,
    0.2871,
    -0.9579,
    0,
    -0.2434,
    0.9687,
    -0.0484,
    -0.0267,
    -0.9995,
    0.0179,
    -0.0938,
    -0.9911,
    -0.0938,
    0.07,
    0.9964,
    -0.0468,
    0.2815,
    -0.9579,
    0.056,
    -0.2482,
    0.9687,
    0,
    -0.0297,
    -0.9995,
    0.0123,
    -0.1103,
    -0.9911,
    -0.0737,
    0.0595,
    0.9964,
    -0.0595,
    0.2652,
    -0.9579,
    0.1098,
    -0.2434,
    0.9687,
    0.0484,
    -0.0316,
    -0.9995,
    0.0063,
    -0.1225,
    -0.9911,
    -0.0507,
    0.0468,
    0.9964,
    -0.07,
    0.2387,
    -0.9579,
    0.1595,
    -0.2293,
    0.9687,
    0.095,
    -0.0322,
    -0.9995,
    0,
    -0.13,
    -0.9911,
    -0.0258,
    0.0322,
    0.9964,
    -0.0778,
    0.203,
    -0.9579,
    0.203,
    -0.2064,
    0.9687,
    0.1379,
    -0.0316,
    -0.9995,
    -0.0063,
    -0.1326,
    -0.9911,
    0,
    0.0164,
    0.9964,
    -0.0826,
    0.1595,
    -0.9579,
    0.2387,
    -0.1755,
    0.9687,
    0.1755,
    -0.0297,
    -0.9995,
    -0.0123,
    -0.13,
    -0.9911,
    0.0258,
    0.1098,
    -0.9579,
    0.2652,
    -0.1379,
    0.9687,
    0.2064,
    -0.0267,
    -0.9995,
    -0.0179,
    -0.1225,
    -0.9911,
    0.0507,
    0.056,
    -0.9579,
    0.2815,
    -0.095,
    0.9687,
    0.2293,
    -0.0227,
    -0.9995,
    -0.0227,
    -0.1103,
    -0.9911,
    0.0737,
    -0.0484,
    0.9687,
    0.2434,
    -0.0179,
    -0.9995,
    -0.0267,
    -0.0938,
    -0.9911,
    0.0938,
    0,
    0.9687,
    0.2482,
    -0.1902,
    0.2226,
    -0.9561,
    0,
    0.2226,
    -0.9749,
    -0.3731,
    0.2226,
    -0.9007,
    -0.5416,
    0.2226,
    -0.8106,
    -0.6894,
    0.2226,
    -0.6894,
    -0.8106,
    0.2226,
    -0.5416,
    -0.9007,
    0.2226,
    -0.3731,
    -0.9561,
    0.2226,
    -0.1902,
    -0.9749,
    0.2226,
    0,
    -0.9561,
    0.2226,
    0.1902,
    -0.9007,
    0.2226,
    0.3731,
    -0.8106,
    0.2226,
    0.5416,
    -0.6894,
    0.2226,
    0.6894,
    -0.5416,
    0.2226,
    0.8106,
    -0.3731,
    0.2226,
    0.9007,
    -0.1902,
    0.2226,
    0.9561,
    0,
    0.2226,
    0.9749,
    0.1902,
    0.2226,
    0.9561,
    0.3731,
    0.2226,
    0.9007,
    0.5416,
    0.2226,
    0.8106,
    0.6894,
    0.2226,
    0.6894,
    0.8106,
    0.2226,
    0.5416,
    0.9007,
    0.2226,
    0.3731,
    0.9561,
    0.2226,
    0.1902,
    0.9749,
    0.2226,
    0,
    0.9561,
    0.2226,
    -0.1902,
    0.9007,
    0.2226,
    -0.3731,
    0.8106,
    0.2226,
    -0.5416,
    0.6894,
    0.2226,
    -0.6894,
    0.5416,
    0.2226,
    -0.8106,
    0.3731,
    0.2226,
    -0.9007,
    0.1902,
    0.2226,
    -0.9561,
    0,
    0.1401,
    -0.9901,
    0.1932,
    0.1401,
    -0.9711,
    0.3789,
    0.1401,
    -0.9148,
    0.5501,
    0.1401,
    -0.8232,
    0.7001,
    0.1401,
    -0.7001,
    0.8232,
    0.1401,
    -0.5501,
    0.9148,
    0.1401,
    -0.3789,
    0.9711,
    0.1401,
    -0.1932,
    0.9901,
    0.1401,
    0,
    0.9711,
    0.1401,
    0.1932,
    0.9148,
    0.1401,
    0.3789,
    0.8232,
    0.1401,
    0.5501,
    0.7001,
    0.1401,
    0.7001,
    0.5501,
    0.1401,
    0.8232,
    0.3789,
    0.1401,
    0.9148,
    0.1932,
    0.1401,
    0.9711,
    0,
    0.1401,
    0.9901,
    -0.1932,
    0.1401,
    0.9711,
    -0.3789,
    0.1401,
    0.9148,
    -0.5501,
    0.1401,
    0.8232,
    -0.7001,
    0.1401,
    0.7001,
    -0.8232,
    0.1401,
    0.5501,
    -0.8233,
    0.1401,
    0.5501,
    -0.9148,
    0.1401,
    0.3789,
    -0.9711,
    0.1401,
    0.1932,
    -0.9901,
    0.1401,
    0,
    -0.9711,
    0.1401,
    -0.1932,
    -0.9148,
    0.1401,
    -0.3789,
    -0.8232,
    0.1401,
    -0.5501,
    -0.7001,
    0.1401,
    -0.7001,
    -0.5501,
    0.1401,
    -0.8232,
    -0.5501,
    0.1401,
    -0.8233,
    -0.3789,
    0.1401,
    -0.9148,
    -0.1932,
    0.1401,
    -0.9711,
    -0.1902,
    -0.2226,
    -0.9561,
    0,
    -0.2226,
    -0.9749,
    -0.3731,
    -0.2226,
    -0.9007,
    -0.5416,
    -0.2226,
    -0.8106,
    -0.6894,
    -0.2226,
    -0.6894,
    -0.8106,
    -0.2226,
    -0.5416,
    -0.9007,
    -0.2226,
    -0.3731,
    -0.9561,
    -0.2226,
    -0.1902,
    -0.9749,
    -0.2226,
    0,
    -0.9561,
    -0.2226,
    0.1902,
    -0.9007,
    -0.2226,
    0.3731,
    -0.8106,
    -0.2226,
    0.5416,
    -0.6894,
    -0.2226,
    0.6894,
    -0.5416,
    -0.2226,
    0.8106,
    -0.3731,
    -0.2226,
    0.9007,
    -0.1902,
    -0.2226,
    0.9561,
    0,
    -0.2226,
    0.9749,
    0.1902,
    -0.2226,
    0.9561,
    0.3731,
    -0.2226,
    0.9007,
    0.5416,
    -0.2226,
    0.8106,
    0.6894,
    -0.2226,
    0.6894,
    0.8106,
    -0.2226,
    0.5416,
    0.9007,
    -0.2226,
    0.3731,
    0.9561,
    -0.2226,
    0.1902,
    0.9749,
    -0.2226,
    0,
    0.9561,
    -0.2226,
    -0.1902,
    0.9007,
    -0.2226,
    -0.3731,
    0.8106,
    -0.2226,
    -0.5416,
    0.6894,
    -0.2226,
    -0.6894,
    0.5416,
    -0.2226,
    -0.8106,
    0.3731,
    -0.2226,
    -0.9007,
    0.1902,
    -0.2226,
    -0.9561,
    0,
    -0.1401,
    -0.9901,
    0.1932,
    -0.1401,
    -0.9711,
    0.3789,
    -0.1401,
    -0.9148,
    0.5501,
    -0.1401,
    -0.8232,
    0.7001,
    -0.1401,
    -0.7001,
    0.8232,
    -0.1401,
    -0.5501,
    0.9148,
    -0.1401,
    -0.3789,
    0.9711,
    -0.1401,
    -0.1932,
    0.9901,
    -0.1401,
    0,
    0.9711,
    -0.1401,
    0.1932,
    0.9148,
    -0.1401,
    0.3789,
    0.8232,
    -0.1401,
    0.5501,
    0.7001,
    -0.1401,
    0.7001,
    0.5501,
    -0.1401,
    0.8232,
    0.3789,
    -0.1401,
    0.9148,
    0.1932,
    -0.1401,
    0.9711,
    0,
    -0.1401,
    0.9901,
    -0.1932,
    -0.1401,
    0.9711,
    -0.3789,
    -0.1401,
    0.9148,
    -0.5501,
    -0.1401,
    0.8232,
    -0.7001,
    -0.1401,
    0.7001,
    -0.8233,
    -0.1401,
    0.5501,
    -0.8232,
    -0.1401,
    0.5501,
    -0.9148,
    -0.1401,
    0.3789,
    -0.9711,
    -0.1401,
    0.1932,
    -0.9901,
    -0.1401,
    0,
    -0.9711,
    -0.1401,
    -0.1932,
    -0.9148,
    -0.1401,
    -0.3789,
    -0.8232,
    -0.1401,
    -0.5501,
    -0.7001,
    -0.1401,
    -0.7001,
    -0.5501,
    -0.1401,
    -0.8233,
    -0.3789,
    -0.1401,
    -0.9148,
    -0.1932,
    -0.1401,
    -0.9711,
    -0.8274,
    -0.0984,
    -0.5529,
    -0.9194,
    -0.0984,
    -0.3808,
    0,
    -0.0984,
    0.9951,
    -0.1941,
    -0.0984,
    0.976,
    0.1941,
    -0.0984,
    0.976,
    -0.976,
    -0.0984,
    -0.1941,
    -0.9951,
    -0.0984,
    0,
    0.3808,
    -0.0984,
    0.9194,
    0.9194,
    -0.0984,
    -0.3808,
    0.8274,
    -0.0984,
    -0.5529,
    -0.7037,
    -0.0984,
    0.7037,
    -0.8274,
    -0.0984,
    0.5529,
    0.7037,
    -0.0984,
    -0.7037,
    -0.1941,
    -0.0984,
    -0.976,
    -0.3808,
    -0.0984,
    -0.9194,
    0.5529,
    -0.0984,
    -0.8274,
    0.3808,
    -0.0984,
    -0.9194,
    0.5529,
    -0.0984,
    0.8274,
    0.8274,
    -0.0984,
    0.5529,
    0.7037,
    -0.0984,
    0.7037,
    -0.9194,
    -0.0984,
    0.3808,
    0.976,
    -0.0984,
    -0.1941,
    0.1941,
    -0.0984,
    -0.976,
    0,
    -0.0984,
    -0.9951,
    0.9951,
    -0.0984,
    0,
    -0.7037,
    -0.0984,
    -0.7037,
    0.9194,
    -0.0984,
    0.3808,
    -0.976,
    -0.0984,
    0.1941,
    0.976,
    -0.0984,
    0.1941,
    -0.5529,
    -0.0984,
    -0.8274,
    -0.5529,
    -0.0984,
    0.8274,
    -0.3808,
    -0.0984,
    0.9194,
    -0.8274,
    0.0984,
    -0.5529,
    -0.9194,
    0.0984,
    -0.3808,
    0,
    0.0984,
    0.9951,
    -0.1941,
    0.0984,
    0.976,
    0.1941,
    0.0984,
    0.976,
    -0.976,
    0.0984,
    -0.1941,
    -0.9951,
    0.0984,
    0,
    0.3808,
    0.0984,
    0.9194,
    0.9194,
    0.0984,
    -0.3808,
    0.8274,
    0.0984,
    -0.5529,
    -0.7037,
    0.0984,
    0.7037,
    -0.8274,
    0.0984,
    0.5529,
    0.7037,
    0.0984,
    -0.7037,
    -0.1941,
    0.0984,
    -0.976,
    -0.3808,
    0.0984,
    -0.9194,
    0.5529,
    0.0984,
    -0.8274,
    0.3808,
    0.0984,
    -0.9194,
    0.5529,
    0.0984,
    0.8274,
    0.8274,
    0.0984,
    0.5529,
    0.7037,
    0.0984,
    0.7037,
    -0.9194,
    0.0984,
    0.3808,
    0.976,
    0.0984,
    -0.1941,
    0.1941,
    0.0984,
    -0.976,
    0,
    0.0984,
    -0.9951,
    0.9951,
    0.0984,
    0,
    -0.7037,
    0.0984,
    -0.7037,
    0.9194,
    0.0984,
    0.3808,
    -0.976,
    0.0984,
    0.1941,
    0.976,
    0.0984,
    0.1941,
    -0.5529,
    0.0984,
    -0.8274,
    -0.5529,
    0.0984,
    0.8274,
    -0.3808,
    0.0984,
    0.9194,
    0,
    1,
    0,
    0,
    -1,
    0,
    -0.9239,
    0,
    -0.3827,
    -0.9808,
    0,
    -0.1951,
    0.3827,
    0,
    0.9239,
    0.5556,
    0,
    0.8314,
    -0.5556,
    0,
    0.8314,
    -0.3827,
    0,
    0.9239,
    0.9808,
    0,
    -0.1951,
    0.9239,
    0,
    -0.3827,
    0,
    0,
    -1,
    -0.1951,
    0,
    -0.9808,
    -1,
    0,
    0,
    0.7071,
    0,
    0.7071,
    -0.1951,
    0,
    0.9808,
    0.8314,
    0,
    -0.5556,
    -0.3827,
    0,
    -0.9239,
    -0.9808,
    0,
    0.1951,
    0.8314,
    0,
    0.5556,
    0,
    0,
    1,
    0.7071,
    0,
    -0.7071,
    -0.5556,
    0,
    -0.8314,
    -0.9239,
    0,
    0.3827,
    0.9239,
    0,
    0.3827,
    0.5556,
    0,
    -0.8314,
    -0.7071,
    0,
    -0.7071,
    -0.8314,
    0,
    0.5556,
    0.9808,
    0,
    0.1951,
    0.3827,
    0,
    -0.9239,
    -0.8314,
    0,
    -0.5556,
    -0.7071,
    0,
    0.7071,
    1,
    0,
    0,
    0.1951,
    0,
    0.9808,
    0.1951,
    0,
    -0.9808,
    0,
    0.2254,
    -0.9742,
    0,
    0.2226,
    -0.9749,
    0.1902,
    0.2226,
    -0.9561,
    0.1901,
    0.2254,
    -0.9555,
    0.3731,
    0.2226,
    -0.9007,
    0.3728,
    0.2254,
    -0.9001,
    0.5416,
    0.2226,
    -0.8106,
    0.5412,
    0.2254,
    -0.8101,
    0.6894,
    0.2226,
    -0.6894,
    0.6889,
    0.2254,
    -0.6889,
    0.8106,
    0.2226,
    -0.5416,
    0.8101,
    0.2254,
    -0.5412,
    0.9007,
    0.2226,
    -0.3731,
    0.9001,
    0.2254,
    -0.3728,
    0.9561,
    0.2226,
    -0.1902,
    0.9555,
    0.2254,
    -0.1901,
    0.9749,
    0.2226,
    0,
    0.9742,
    0.2254,
    0,
    0.9561,
    0.2226,
    0.1902,
    0.9555,
    0.2254,
    0.1901,
    0.9007,
    0.2226,
    0.3731,
    0.9001,
    0.2254,
    0.3728,
    0.8106,
    0.2226,
    0.5416,
    0.8101,
    0.2254,
    0.5412,
    0.6894,
    0.2226,
    0.6894,
    0.6889,
    0.2254,
    0.6889,
    0.5416,
    0.2226,
    0.8106,
    0.5412,
    0.2254,
    0.8101,
    0.3731,
    0.2226,
    0.9007,
    0.3728,
    0.2254,
    0.9001,
    0.1902,
    0.2226,
    0.9561,
    0.1901,
    0.2254,
    0.9555,
    0,
    0.2226,
    0.9749,
    0,
    0.2254,
    0.9742,
    -0.1902,
    0.2226,
    0.9561,
    -0.1901,
    0.2254,
    0.9555,
    -0.3731,
    0.2226,
    0.9007,
    -0.3728,
    0.2254,
    0.9001,
    -0.5416,
    0.2226,
    0.8106,
    -0.5412,
    0.2254,
    0.8101,
    -0.6894,
    0.2226,
    0.6894,
    -0.6889,
    0.2254,
    0.6889,
    -0.8106,
    0.2226,
    0.5416,
    -0.8101,
    0.2254,
    0.5412,
    -0.9007,
    0.2226,
    0.3731,
    -0.9001,
    0.2254,
    0.3728,
    -0.9561,
    0.2226,
    0.1902,
    -0.9555,
    0.2254,
    0.1901,
    -0.9749,
    0.2226,
    0,
    -0.9742,
    0.2254,
    0,
    -0.9561,
    0.2226,
    -0.1902,
    -0.9555,
    0.2254,
    -0.1901,
    -0.9007,
    0.2226,
    -0.3731,
    -0.9001,
    0.2254,
    -0.3728,
    -0.8106,
    0.2226,
    -0.5416,
    -0.8101,
    0.2254,
    -0.5412,
    -0.6894,
    0.2226,
    -0.6894,
    -0.6889,
    0.2254,
    -0.6889,
    -0.5416,
    0.2226,
    -0.8106,
    -0.5412,
    0.2254,
    -0.8101,
    -0.3731,
    0.2226,
    -0.9007,
    -0.3728,
    0.2254,
    -0.9001,
    -0.1902,
    0.2226,
    -0.9561,
    -0.19,
    0.2254,
    -0.9555,
    -0.1941,
    0.102,
    -0.9756,
    0,
    0.102,
    -0.9948,
    -0.3807,
    0.102,
    -0.919,
    -0.5527,
    0.102,
    -0.8271,
    -0.7034,
    0.102,
    -0.7034,
    -0.8271,
    0.102,
    -0.5527,
    -0.919,
    0.102,
    -0.3807,
    -0.9756,
    0.102,
    -0.1941,
    -0.9948,
    0.102,
    0,
    -0.9756,
    0.102,
    0.1941,
    -0.919,
    0.102,
    0.3807,
    -0.8271,
    0.102,
    0.5527,
    -0.7034,
    0.102,
    0.7034,
    -0.5527,
    0.102,
    0.8271,
    -0.3807,
    0.102,
    0.919,
    -0.1941,
    0.102,
    0.9756,
    0,
    0.102,
    0.9948,
    0.1941,
    0.102,
    0.9756,
    0.3807,
    0.102,
    0.919,
    0.5527,
    0.102,
    0.8271,
    0.7034,
    0.102,
    0.7034,
    0.8271,
    0.102,
    0.5527,
    0.919,
    0.102,
    0.3807,
    0.9756,
    0.102,
    0.1941,
    0.9948,
    0.102,
    0,
    0.9756,
    0.102,
    -0.1941,
    0.919,
    0.102,
    -0.3807,
    0.8271,
    0.102,
    -0.5527,
    0.7034,
    0.102,
    -0.7034,
    0.5527,
    0.102,
    -0.8271,
    0.3807,
    0.102,
    -0.919,
    0.1941,
    0.102,
    -0.9756,
    -0.1917,
    0.1838,
    -0.9641,
    0,
    0.1838,
    -0.9829,
    -0.3761,
    0.1838,
    -0.9081,
    -0.5461,
    0.1838,
    -0.8173,
    -0.6951,
    0.1838,
    -0.6951,
    -0.8173,
    0.1838,
    -0.5461,
    -0.9081,
    0.1838,
    -0.3761,
    -0.9641,
    0.1838,
    -0.1917,
    -0.9829,
    0.1838,
    0,
    -0.9641,
    0.1838,
    0.1917,
    -0.9081,
    0.1838,
    0.3761,
    -0.8173,
    0.1838,
    0.5461,
    -0.6951,
    0.1838,
    0.6951,
    -0.5461,
    0.1838,
    0.8173,
    -0.3761,
    0.1838,
    0.9081,
    -0.1917,
    0.1838,
    0.9641,
    0,
    0.1838,
    0.9829,
    0.1917,
    0.1838,
    0.9641,
    0.3761,
    0.1838,
    0.9081,
    0.5461,
    0.1838,
    0.8173,
    0.6951,
    0.1838,
    0.6951,
    0.8173,
    0.1838,
    0.5461,
    0.9081,
    0.1838,
    0.3761,
    0.9641,
    0.1838,
    0.1917,
    0.9829,
    0.1838,
    0,
    0.9641,
    0.1838,
    -0.1917,
    0.9081,
    0.1838,
    -0.3761,
    0.8173,
    0.1838,
    -0.5461,
    0.6951,
    0.1838,
    -0.6951,
    0.5461,
    0.1838,
    -0.8173,
    0.3761,
    0.1838,
    -0.9081,
    0.1917,
    0.1838,
    -0.9641,
    0,
    -0.2254,
    -0.9742,
    0.1901,
    -0.2254,
    -0.9555,
    0.1902,
    -0.2226,
    -0.9561,
    0,
    -0.2226,
    -0.9749,
    0.3728,
    -0.2254,
    -0.9001,
    0.3731,
    -0.2226,
    -0.9007,
    0.5412,
    -0.2254,
    -0.8101,
    0.5416,
    -0.2226,
    -0.8106,
    0.6889,
    -0.2254,
    -0.6889,
    0.6894,
    -0.2226,
    -0.6894,
    0.8101,
    -0.2254,
    -0.5412,
    0.8106,
    -0.2226,
    -0.5416,
    0.9001,
    -0.2254,
    -0.3728,
    0.9007,
    -0.2226,
    -0.3731,
    0.9555,
    -0.2254,
    -0.1901,
    0.9561,
    -0.2226,
    -0.1902,
    0.9742,
    -0.2254,
    0,
    0.9749,
    -0.2226,
    0,
    0.9555,
    -0.2254,
    0.1901,
    0.9561,
    -0.2226,
    0.1902,
    0.9001,
    -0.2254,
    0.3728,
    0.9007,
    -0.2226,
    0.3731,
    0.8101,
    -0.2254,
    0.5412,
    0.8106,
    -0.2226,
    0.5416,
    0.6889,
    -0.2254,
    0.6889,
    0.6894,
    -0.2226,
    0.6894,
    0.5412,
    -0.2254,
    0.8101,
    0.5416,
    -0.2226,
    0.8106,
    0.3728,
    -0.2254,
    0.9001,
    0.3731,
    -0.2226,
    0.9007,
    0.1901,
    -0.2254,
    0.9555,
    0.1902,
    -0.2226,
    0.9561,
    0,
    -0.2254,
    0.9742,
    0,
    -0.2226,
    0.9749,
    -0.1901,
    -0.2254,
    0.9555,
    -0.1902,
    -0.2226,
    0.9561,
    -0.3728,
    -0.2254,
    0.9001,
    -0.3731,
    -0.2226,
    0.9007,
    -0.5412,
    -0.2254,
    0.8101,
    -0.5416,
    -0.2226,
    0.8106,
    -0.6889,
    -0.2254,
    0.6889,
    -0.6894,
    -0.2226,
    0.6894,
    -0.8101,
    -0.2254,
    0.5412,
    -0.8106,
    -0.2226,
    0.5416,
    -0.9001,
    -0.2254,
    0.3728,
    -0.9007,
    -0.2226,
    0.3731,
    -0.9555,
    -0.2254,
    0.1901,
    -0.9561,
    -0.2226,
    0.1902,
    -0.9742,
    -0.2254,
    0,
    -0.9749,
    -0.2226,
    0,
    -0.9555,
    -0.2254,
    -0.1901,
    -0.9561,
    -0.2226,
    -0.1902,
    -0.9001,
    -0.2254,
    -0.3728,
    -0.9007,
    -0.2226,
    -0.3731,
    -0.8101,
    -0.2254,
    -0.5412,
    -0.8106,
    -0.2226,
    -0.5416,
    -0.6889,
    -0.2254,
    -0.6889,
    -0.6894,
    -0.2226,
    -0.6894,
    -0.5412,
    -0.2254,
    -0.8101,
    -0.5416,
    -0.2226,
    -0.8106,
    -0.3728,
    -0.2254,
    -0.9001,
    -0.3731,
    -0.2226,
    -0.9007,
    -0.19,
    -0.2254,
    -0.9555,
    -0.1902,
    -0.2226,
    -0.9561,
    0,
    -0.102,
    -0.9948,
    -0.1941,
    -0.102,
    -0.9756,
    -0.3807,
    -0.102,
    -0.919,
    -0.5527,
    -0.102,
    -0.8271,
    -0.7034,
    -0.102,
    -0.7034,
    -0.8271,
    -0.102,
    -0.5527,
    -0.919,
    -0.102,
    -0.3807,
    -0.9756,
    -0.102,
    -0.1941,
    -0.9948,
    -0.102,
    0,
    -0.9756,
    -0.102,
    0.1941,
    -0.919,
    -0.102,
    0.3807,
    -0.8271,
    -0.102,
    0.5527,
    -0.7034,
    -0.102,
    0.7034,
    -0.5527,
    -0.102,
    0.8271,
    -0.3807,
    -0.102,
    0.919,
    -0.1941,
    -0.102,
    0.9756,
    0,
    -0.102,
    0.9948,
    0.1941,
    -0.102,
    0.9756,
    0.3807,
    -0.102,
    0.919,
    0.5527,
    -0.102,
    0.8271,
    0.7034,
    -0.102,
    0.7034,
    0.8271,
    -0.102,
    0.5527,
    0.919,
    -0.102,
    0.3807,
    0.9756,
    -0.102,
    0.1941,
    0.9948,
    -0.102,
    0,
    0.9756,
    -0.102,
    -0.1941,
    0.919,
    -0.102,
    -0.3807,
    0.8271,
    -0.102,
    -0.5527,
    0.7034,
    -0.102,
    -0.7034,
    0.5527,
    -0.102,
    -0.8271,
    0.3807,
    -0.102,
    -0.919,
    0.1941,
    -0.102,
    -0.9756,
    0,
    -0.1838,
    -0.9829,
    -0.1917,
    -0.1838,
    -0.9641,
    -0.3761,
    -0.1838,
    -0.9081,
    -0.5461,
    -0.1838,
    -0.8173,
    -0.6951,
    -0.1838,
    -0.6951,
    -0.8173,
    -0.1838,
    -0.5461,
    -0.9081,
    -0.1838,
    -0.3761,
    -0.9641,
    -0.1838,
    -0.1917,
    -0.9829,
    -0.1838,
    0,
    -0.9641,
    -0.1838,
    0.1917,
    -0.9081,
    -0.1838,
    0.3761,
    -0.8173,
    -0.1838,
    0.5461,
    -0.6951,
    -0.1838,
    0.6951,
    -0.5461,
    -0.1838,
    0.8173,
    -0.3761,
    -0.1838,
    0.9081,
    -0.1917,
    -0.1838,
    0.9641,
    0,
    -0.1838,
    0.9829,
    0.1917,
    -0.1838,
    0.9641,
    0.3761,
    -0.1838,
    0.9081,
    0.5461,
    -0.1838,
    0.8173,
    0.6951,
    -0.1838,
    0.6951,
    0.8173,
    -0.1838,
    0.5461,
    0.9081,
    -0.1838,
    0.3761,
    0.9641,
    -0.1838,
    0.1917,
    0.9829,
    -0.1838,
    0,
    0.9641,
    -0.1838,
    -0.1917,
    0.9081,
    -0.1838,
    -0.3761,
    0.8173,
    -0.1838,
    -0.5461,
    0.6951,
    -0.1838,
    -0.6951,
    0.5461,
    -0.1838,
    -0.8173,
    0.3761,
    -0.1838,
    -0.9081,
    0.1917,
    -0.1838,
    -0.9641
  ],
  "uvs": [
    0.8718,
    0.8201,
    0.885,
    0.8241,
    0.8844,
    0.827,
    0.8707,
    0.8228,
    0.924,
    0.8162,
    0.9354,
    0.8101,
    0.937,
    0.8126,
    0.9251,
    0.8189,
    0.911,
    0.6934,
    0.9228,
    0.697,
    0.9239,
    0.6943,
    0.9116,
    0.6906,
    0.8987,
    0.8254,
    0.8987,
    0.8284,
    0.9116,
    0.82,
    0.9121,
    0.8229,
    0.9337,
    0.7028,
    0.9353,
    0.7004,
    0.8987,
    0.8213,
    0.8987,
    0.8242,
    0.9433,
    0.7106,
    0.9453,
    0.7086,
    0.9511,
    0.7202,
    0.9535,
    0.7186,
    0.957,
    0.7311,
    0.9596,
    0.73,
    0.9606,
    0.7429,
    0.9634,
    0.7424,
    0.9618,
    0.7552,
    0.9646,
    0.7552,
    0.9606,
    0.7675,
    0.9634,
    0.7681,
    0.957,
    0.7794,
    0.9596,
    0.7805,
    0.9126,
    0.8251,
    0.8987,
    0.8265,
    0.8987,
    0.8295,
    0.9132,
    0.828,
    0.9511,
    0.7903,
    0.9535,
    0.7919,
    0.9259,
    0.821,
    0.9271,
    0.8238,
    0.9433,
    0.7998,
    0.9453,
    0.8019,
    0.9383,
    0.8145,
    0.9399,
    0.817,
    0.9337,
    0.8077,
    0.9353,
    0.8101,
    0.9491,
    0.8056,
    0.9512,
    0.8077,
    0.9228,
    0.8135,
    0.9239,
    0.8162,
    0.9579,
    0.7948,
    0.9604,
    0.7965,
    0.911,
    0.8171,
    0.9116,
    0.8199,
    0.9645,
    0.7825,
    0.9673,
    0.7836,
    0.8987,
    0.8183,
    0.8987,
    0.8212,
    0.9685,
    0.7691,
    0.9715,
    0.7697,
    0.8987,
    0.8227,
    0.8855,
    0.8214,
    0.885,
    0.8243,
    0.8987,
    0.8257,
    0.9699,
    0.7552,
    0.9729,
    0.7552,
    0.8729,
    0.8176,
    0.8717,
    0.8203,
    0.8987,
    0.8164,
    0.9106,
    0.8152,
    0.9112,
    0.818,
    0.8987,
    0.8192,
    0.9685,
    0.7413,
    0.9715,
    0.7408,
    0.8612,
    0.8114,
    0.8596,
    0.8138,
    0.9645,
    0.728,
    0.9673,
    0.7268,
    0.851,
    0.803,
    0.8489,
    0.8051,
    0.9221,
    0.8117,
    0.9232,
    0.8143,
    0.9579,
    0.7157,
    0.9604,
    0.714,
    0.8426,
    0.7927,
    0.8401,
    0.7944,
    0.9327,
    0.8061,
    0.9342,
    0.8084,
    0.9491,
    0.7049,
    0.9512,
    0.7028,
    0.8363,
    0.7811,
    0.8336,
    0.7822,
    0.9419,
    0.7985,
    0.9439,
    0.8005,
    0.9383,
    0.696,
    0.9399,
    0.6935,
    0.9124,
    0.8241,
    0.913,
    0.827,
    0.8325,
    0.7684,
    0.8296,
    0.769,
    0.9495,
    0.7892,
    0.9519,
    0.7908,
    0.9259,
    0.6894,
    0.9271,
    0.6867,
    0.9256,
    0.8201,
    0.9267,
    0.8228,
    0.8858,
    0.82,
    0.8852,
    0.8229,
    0.8312,
    0.7552,
    0.8283,
    0.7552,
    0.9552,
    0.7786,
    0.9578,
    0.7797,
    0.9126,
    0.6854,
    0.9132,
    0.6824,
    0.9377,
    0.8136,
    0.9393,
    0.8161,
    0.8734,
    0.8162,
    0.8723,
    0.8189,
    0.8325,
    0.7421,
    0.8296,
    0.7415,
    0.9587,
    0.7672,
    0.9614,
    0.7677,
    0.8987,
    0.684,
    0.8987,
    0.681,
    0.9483,
    0.8049,
    0.9504,
    0.807,
    0.862,
    0.8101,
    0.8604,
    0.8126,
    0.8363,
    0.7294,
    0.8336,
    0.7283,
    0.9598,
    0.7552,
    0.9627,
    0.7552,
    0.8848,
    0.6854,
    0.8842,
    0.6824,
    0.957,
    0.7942,
    0.9595,
    0.7959,
    0.852,
    0.8019,
    0.8499,
    0.804,
    0.8426,
    0.7177,
    0.8401,
    0.7161,
    0.9587,
    0.7433,
    0.9614,
    0.7428,
    0.8714,
    0.6894,
    0.8703,
    0.6867,
    0.9635,
    0.7821,
    0.9663,
    0.7832,
    0.8438,
    0.7919,
    0.8414,
    0.7935,
    0.851,
    0.7075,
    0.8489,
    0.7054,
    0.9552,
    0.7318,
    0.9578,
    0.7308,
    0.8591,
    0.696,
    0.8575,
    0.6935,
    0.9675,
    0.7689,
    0.9705,
    0.7695,
    0.8377,
    0.7805,
    0.835,
    0.7816,
    0.8612,
    0.6991,
    0.8596,
    0.6967,
    0.9495,
    0.7213,
    0.9519,
    0.7197,
    0.8483,
    0.7049,
    0.8462,
    0.7028,
    0.9689,
    0.7552,
    0.9719,
    0.7552,
    0.8339,
    0.7681,
    0.8311,
    0.7687,
    0.8729,
    0.6929,
    0.8717,
    0.6902,
    0.9419,
    0.712,
    0.9439,
    0.71,
    0.8395,
    0.7157,
    0.837,
    0.714,
    0.9675,
    0.7416,
    0.9705,
    0.741,
    0.8327,
    0.7552,
    0.8298,
    0.7552,
    0.8855,
    0.689,
    0.885,
    0.6862,
    0.9327,
    0.7044,
    0.9342,
    0.702,
    0.8329,
    0.728,
    0.8301,
    0.7268,
    0.9635,
    0.7284,
    0.9663,
    0.7272,
    0.8339,
    0.7424,
    0.8311,
    0.7418,
    0.8987,
    0.6878,
    0.8987,
    0.6848,
    0.9221,
    0.6988,
    0.9232,
    0.6961,
    0.8289,
    0.7413,
    0.8259,
    0.7408,
    0.957,
    0.7163,
    0.9595,
    0.7146,
    0.8377,
    0.73,
    0.835,
    0.7289,
    0.9119,
    0.689,
    0.9124,
    0.6862,
    0.9106,
    0.6953,
    0.9112,
    0.6925,
    0.8275,
    0.7552,
    0.8245,
    0.7552,
    0.9483,
    0.7056,
    0.9504,
    0.7035,
    0.8438,
    0.7186,
    0.8414,
    0.7169,
    0.9245,
    0.6929,
    0.9257,
    0.6902,
    0.8987,
    0.6941,
    0.8987,
    0.6913,
    0.8289,
    0.7691,
    0.8259,
    0.7697,
    0.9377,
    0.6969,
    0.9393,
    0.6944,
    0.852,
    0.7086,
    0.8499,
    0.7065,
    0.9362,
    0.6991,
    0.9378,
    0.6967,
    0.8868,
    0.6953,
    0.8862,
    0.6925,
    0.8329,
    0.7825,
    0.8301,
    0.7836,
    0.9256,
    0.6904,
    0.9267,
    0.6876,
    0.862,
    0.7004,
    0.8604,
    0.6979,
    0.9464,
    0.7075,
    0.9485,
    0.7054,
    0.8753,
    0.6988,
    0.8742,
    0.6961,
    0.8395,
    0.7948,
    0.837,
    0.7965,
    0.8864,
    0.8171,
    0.8858,
    0.8199,
    0.9124,
    0.6864,
    0.913,
    0.6835,
    0.8734,
    0.6943,
    0.8723,
    0.6915,
    0.9548,
    0.7177,
    0.9573,
    0.7161,
    0.8647,
    0.7044,
    0.8632,
    0.702,
    0.8483,
    0.8056,
    0.8462,
    0.8077,
    0.8746,
    0.8135,
    0.8735,
    0.8162,
    0.8987,
    0.6851,
    0.8987,
    0.6821,
    0.8858,
    0.6905,
    0.8852,
    0.6876,
    0.9611,
    0.7294,
    0.9638,
    0.7283,
    0.8555,
    0.712,
    0.8535,
    0.71,
    0.8591,
    0.8145,
    0.8575,
    0.817,
    0.8636,
    0.8077,
    0.8621,
    0.8101,
    0.885,
    0.6864,
    0.8844,
    0.6835,
    0.8987,
    0.6892,
    0.8987,
    0.6863,
    0.9649,
    0.7421,
    0.9678,
    0.7415,
    0.8479,
    0.7213,
    0.8455,
    0.7197,
    0.8714,
    0.821,
    0.8703,
    0.8238,
    0.8541,
    0.7998,
    0.8521,
    0.8019,
    0.8718,
    0.6904,
    0.8707,
    0.6876,
    0.9116,
    0.6905,
    0.9121,
    0.6876,
    0.9662,
    0.7552,
    0.9691,
    0.7552,
    0.8422,
    0.7318,
    0.8396,
    0.7308,
    0.8848,
    0.8251,
    0.8842,
    0.828,
    0.8462,
    0.7903,
    0.8439,
    0.7919,
    0.8597,
    0.6969,
    0.858,
    0.6944,
    0.924,
    0.6943,
    0.9251,
    0.6915,
    0.9649,
    0.7684,
    0.9678,
    0.769,
    0.8387,
    0.7433,
    0.836,
    0.7428,
    0.8404,
    0.7794,
    0.8378,
    0.7805,
    0.8491,
    0.7056,
    0.847,
    0.7035,
    0.9354,
    0.7004,
    0.937,
    0.6979,
    0.9611,
    0.7811,
    0.9638,
    0.7822,
    0.8376,
    0.7552,
    0.8347,
    0.7552,
    0.8368,
    0.7675,
    0.834,
    0.7681,
    0.8403,
    0.7163,
    0.8379,
    0.7146,
    0.9454,
    0.7086,
    0.9474,
    0.7065,
    0.9548,
    0.7927,
    0.9573,
    0.7944,
    0.8387,
    0.7672,
    0.836,
    0.7677,
    0.8356,
    0.7552,
    0.8328,
    0.7552,
    0.8339,
    0.7284,
    0.8311,
    0.7272,
    0.9536,
    0.7186,
    0.956,
    0.7169,
    0.9464,
    0.803,
    0.9485,
    0.8051,
    0.8422,
    0.7786,
    0.8396,
    0.7797,
    0.8368,
    0.7429,
    0.834,
    0.7424,
    0.8299,
    0.7416,
    0.8269,
    0.741,
    0.9597,
    0.73,
    0.9624,
    0.7289,
    0.9362,
    0.8114,
    0.9378,
    0.8138,
    0.8479,
    0.7892,
    0.8455,
    0.7908,
    0.8404,
    0.7311,
    0.8378,
    0.73,
    0.8285,
    0.7552,
    0.8255,
    0.7552,
    0.9634,
    0.7424,
    0.9663,
    0.7418,
    0.9245,
    0.8176,
    0.9257,
    0.8203,
    0.8555,
    0.7985,
    0.8535,
    0.8005,
    0.8462,
    0.7202,
    0.8439,
    0.7186,
    0.8299,
    0.7689,
    0.8269,
    0.7695,
    0.9647,
    0.7552,
    0.9676,
    0.7552,
    0.9119,
    0.8214,
    0.9124,
    0.8243,
    0.8647,
    0.8061,
    0.8632,
    0.8084,
    0.8541,
    0.7106,
    0.8521,
    0.7086,
    0.8339,
    0.7821,
    0.8311,
    0.7832,
    0.9634,
    0.7681,
    0.9663,
    0.7687,
    0.8753,
    0.8117,
    0.8742,
    0.8143,
    0.8636,
    0.7028,
    0.8621,
    0.7004,
    0.8403,
    0.7942,
    0.8379,
    0.7959,
    0.9597,
    0.7805,
    0.9624,
    0.7816,
    0.8868,
    0.8152,
    0.8862,
    0.818,
    0.8746,
    0.697,
    0.8735,
    0.6943,
    0.8491,
    0.8049,
    0.847,
    0.807,
    0.9536,
    0.7919,
    0.956,
    0.7935,
    0.8864,
    0.6934,
    0.8858,
    0.6906,
    0.8597,
    0.8136,
    0.858,
    0.8161,
    0.9454,
    0.8019,
    0.9474,
    0.804,
    0.8987,
    0.6922,
    0.8987,
    0.6893,
    0.8718,
    0.8201,
    0.8707,
    0.8228,
    0.8844,
    0.827,
    0.885,
    0.8241,
    0.924,
    0.8162,
    0.9251,
    0.8189,
    0.937,
    0.8126,
    0.9354,
    0.8101,
    0.911,
    0.6934,
    0.9116,
    0.6906,
    0.9239,
    0.6943,
    0.9228,
    0.697,
    0.8987,
    0.8284,
    0.8987,
    0.8254,
    0.9116,
    0.82,
    0.9121,
    0.8229,
    0.9353,
    0.7004,
    0.9337,
    0.7028,
    0.8987,
    0.8213,
    0.8987,
    0.8242,
    0.9453,
    0.7086,
    0.9433,
    0.7106,
    0.9535,
    0.7186,
    0.9511,
    0.7202,
    0.9596,
    0.73,
    0.957,
    0.7311,
    0.9634,
    0.7424,
    0.9606,
    0.7429,
    0.9646,
    0.7552,
    0.9618,
    0.7552,
    0.9634,
    0.7681,
    0.9606,
    0.7675,
    0.9596,
    0.7805,
    0.957,
    0.7794,
    0.9126,
    0.8251,
    0.9132,
    0.828,
    0.8987,
    0.8295,
    0.8987,
    0.8265,
    0.9535,
    0.7919,
    0.9511,
    0.7903,
    0.9259,
    0.821,
    0.9271,
    0.8238,
    0.9453,
    0.8019,
    0.9433,
    0.7998,
    0.9383,
    0.8145,
    0.9399,
    0.817,
    0.9353,
    0.8101,
    0.9337,
    0.8077,
    0.9491,
    0.8056,
    0.9512,
    0.8077,
    0.9239,
    0.8162,
    0.9228,
    0.8135,
    0.9579,
    0.7948,
    0.9604,
    0.7965,
    0.9116,
    0.8199,
    0.911,
    0.8171,
    0.9645,
    0.7825,
    0.9673,
    0.7836,
    0.8987,
    0.8212,
    0.8987,
    0.8183,
    0.9685,
    0.7691,
    0.9715,
    0.7697,
    0.8987,
    0.8227,
    0.8987,
    0.8257,
    0.885,
    0.8243,
    0.8855,
    0.8214,
    0.9699,
    0.7552,
    0.9729,
    0.7552,
    0.8717,
    0.8203,
    0.8729,
    0.8176,
    0.8987,
    0.8164,
    0.8987,
    0.8192,
    0.9112,
    0.818,
    0.9106,
    0.8152,
    0.9685,
    0.7413,
    0.9715,
    0.7408,
    0.8596,
    0.8138,
    0.8612,
    0.8114,
    0.9645,
    0.728,
    0.9673,
    0.7268,
    0.8489,
    0.8051,
    0.851,
    0.803,
    0.9232,
    0.8143,
    0.9221,
    0.8117,
    0.9579,
    0.7157,
    0.9604,
    0.714,
    0.8401,
    0.7944,
    0.8426,
    0.7927,
    0.9342,
    0.8084,
    0.9327,
    0.8061,
    0.9491,
    0.7049,
    0.9512,
    0.7028,
    0.8336,
    0.7822,
    0.8363,
    0.7811,
    0.9439,
    0.8005,
    0.9419,
    0.7985,
    0.9383,
    0.696,
    0.9399,
    0.6935,
    0.913,
    0.827,
    0.9124,
    0.8241,
    0.8296,
    0.769,
    0.8325,
    0.7684,
    0.9519,
    0.7908,
    0.9495,
    0.7892,
    0.9259,
    0.6894,
    0.9271,
    0.6867,
    0.9267,
    0.8228,
    0.9256,
    0.8201,
    0.8858,
    0.82,
    0.8852,
    0.8229,
    0.8283,
    0.7552,
    0.8312,
    0.7552,
    0.9578,
    0.7797,
    0.9552,
    0.7786,
    0.9126,
    0.6854,
    0.9132,
    0.6824,
    0.9393,
    0.8161,
    0.9377,
    0.8136,
    0.8734,
    0.8162,
    0.8723,
    0.8189,
    0.8296,
    0.7415,
    0.8325,
    0.7421,
    0.9614,
    0.7677,
    0.9587,
    0.7672,
    0.8987,
    0.684,
    0.8987,
    0.681,
    0.9504,
    0.807,
    0.9483,
    0.8049,
    0.862,
    0.8101,
    0.8604,
    0.8126,
    0.8336,
    0.7283,
    0.8363,
    0.7294,
    0.9627,
    0.7552,
    0.9598,
    0.7552,
    0.8848,
    0.6854,
    0.8842,
    0.6824,
    0.9595,
    0.7959,
    0.957,
    0.7942,
    0.852,
    0.8019,
    0.8499,
    0.804,
    0.8401,
    0.7161,
    0.8426,
    0.7177,
    0.9614,
    0.7428,
    0.9587,
    0.7433,
    0.8714,
    0.6894,
    0.8703,
    0.6867,
    0.9663,
    0.7832,
    0.9635,
    0.7821,
    0.8438,
    0.7919,
    0.8414,
    0.7935,
    0.8489,
    0.7054,
    0.851,
    0.7075,
    0.9578,
    0.7308,
    0.9552,
    0.7318,
    0.8591,
    0.696,
    0.8575,
    0.6935,
    0.9705,
    0.7695,
    0.9675,
    0.7689,
    0.8377,
    0.7805,
    0.835,
    0.7816,
    0.8596,
    0.6967,
    0.8612,
    0.6991,
    0.9519,
    0.7197,
    0.9495,
    0.7213,
    0.8483,
    0.7049,
    0.8462,
    0.7028,
    0.9719,
    0.7552,
    0.9689,
    0.7552,
    0.8339,
    0.7681,
    0.8311,
    0.7687,
    0.8717,
    0.6902,
    0.8729,
    0.6929,
    0.9439,
    0.71,
    0.9419,
    0.712,
    0.8395,
    0.7157,
    0.837,
    0.714,
    0.9705,
    0.741,
    0.9675,
    0.7416,
    0.8327,
    0.7552,
    0.8298,
    0.7552,
    0.885,
    0.6862,
    0.8855,
    0.689,
    0.9342,
    0.702,
    0.9327,
    0.7044,
    0.8329,
    0.728,
    0.8301,
    0.7268,
    0.9663,
    0.7272,
    0.9635,
    0.7284,
    0.8339,
    0.7424,
    0.8311,
    0.7418,
    0.8987,
    0.6848,
    0.8987,
    0.6878,
    0.9232,
    0.6961,
    0.9221,
    0.6988,
    0.8289,
    0.7413,
    0.8259,
    0.7408,
    0.9595,
    0.7146,
    0.957,
    0.7163,
    0.8377,
    0.73,
    0.835,
    0.7289,
    0.9124,
    0.6862,
    0.9119,
    0.689,
    0.9112,
    0.6925,
    0.9106,
    0.6953,
    0.8275,
    0.7552,
    0.8245,
    0.7552,
    0.9504,
    0.7035,
    0.9483,
    0.7056,
    0.8438,
    0.7186,
    0.8414,
    0.7169,
    0.9257,
    0.6902,
    0.9245,
    0.6929,
    0.8987,
    0.6913,
    0.8987,
    0.6941,
    0.8289,
    0.7691,
    0.8259,
    0.7697,
    0.9393,
    0.6944,
    0.9377,
    0.6969,
    0.852,
    0.7086,
    0.8499,
    0.7065,
    0.9378,
    0.6967,
    0.9362,
    0.6991,
    0.8862,
    0.6925,
    0.8868,
    0.6953,
    0.8329,
    0.7825,
    0.8301,
    0.7836,
    0.9267,
    0.6876,
    0.9256,
    0.6904,
    0.862,
    0.7004,
    0.8604,
    0.6979,
    0.9485,
    0.7054,
    0.9464,
    0.7075,
    0.8742,
    0.6961,
    0.8753,
    0.6988,
    0.8395,
    0.7948,
    0.837,
    0.7965,
    0.8858,
    0.8199,
    0.8864,
    0.8171,
    0.913,
    0.6835,
    0.9124,
    0.6864,
    0.8734,
    0.6943,
    0.8723,
    0.6915,
    0.9573,
    0.7161,
    0.9548,
    0.7177,
    0.8632,
    0.702,
    0.8647,
    0.7044,
    0.8483,
    0.8056,
    0.8462,
    0.8077,
    0.8735,
    0.8162,
    0.8746,
    0.8135,
    0.8987,
    0.6821,
    0.8987,
    0.6851,
    0.8858,
    0.6905,
    0.8852,
    0.6876,
    0.9638,
    0.7283,
    0.9611,
    0.7294,
    0.8535,
    0.71,
    0.8555,
    0.712,
    0.8591,
    0.8145,
    0.8575,
    0.817,
    0.8621,
    0.8101,
    0.8636,
    0.8077,
    0.8844,
    0.6835,
    0.885,
    0.6864,
    0.8987,
    0.6892,
    0.8987,
    0.6863,
    0.9678,
    0.7415,
    0.9649,
    0.7421,
    0.8455,
    0.7197,
    0.8479,
    0.7213,
    0.8714,
    0.821,
    0.8703,
    0.8238,
    0.8521,
    0.8019,
    0.8541,
    0.7998,
    0.8707,
    0.6876,
    0.8718,
    0.6904,
    0.9116,
    0.6905,
    0.9121,
    0.6876,
    0.9691,
    0.7552,
    0.9662,
    0.7552,
    0.8396,
    0.7308,
    0.8422,
    0.7318,
    0.8848,
    0.8251,
    0.8842,
    0.828,
    0.8439,
    0.7919,
    0.8462,
    0.7903,
    0.858,
    0.6944,
    0.8597,
    0.6969,
    0.924,
    0.6943,
    0.9251,
    0.6915,
    0.9678,
    0.769,
    0.9649,
    0.7684,
    0.836,
    0.7428,
    0.8387,
    0.7433,
    0.8378,
    0.7805,
    0.8404,
    0.7794,
    0.847,
    0.7035,
    0.8491,
    0.7056,
    0.9354,
    0.7004,
    0.937,
    0.6979,
    0.9638,
    0.7822,
    0.9611,
    0.7811,
    0.8347,
    0.7552,
    0.8376,
    0.7552,
    0.834,
    0.7681,
    0.8368,
    0.7675,
    0.8379,
    0.7146,
    0.8403,
    0.7163,
    0.9454,
    0.7086,
    0.9474,
    0.7065,
    0.9573,
    0.7944,
    0.9548,
    0.7927,
    0.836,
    0.7677,
    0.8387,
    0.7672,
    0.8328,
    0.7552,
    0.8356,
    0.7552,
    0.8311,
    0.7272,
    0.8339,
    0.7284,
    0.9536,
    0.7186,
    0.956,
    0.7169,
    0.9485,
    0.8051,
    0.9464,
    0.803,
    0.8396,
    0.7797,
    0.8422,
    0.7786,
    0.834,
    0.7424,
    0.8368,
    0.7429,
    0.8269,
    0.741,
    0.8299,
    0.7416,
    0.9597,
    0.73,
    0.9624,
    0.7289,
    0.9378,
    0.8138,
    0.9362,
    0.8114,
    0.8455,
    0.7908,
    0.8479,
    0.7892,
    0.8378,
    0.73,
    0.8404,
    0.7311,
    0.8255,
    0.7552,
    0.8285,
    0.7552,
    0.9634,
    0.7424,
    0.9663,
    0.7418,
    0.9257,
    0.8203,
    0.9245,
    0.8176,
    0.8535,
    0.8005,
    0.8555,
    0.7985,
    0.8439,
    0.7186,
    0.8462,
    0.7202,
    0.8269,
    0.7695,
    0.8299,
    0.7689,
    0.9647,
    0.7552,
    0.9676,
    0.7552,
    0.9124,
    0.8243,
    0.9119,
    0.8214,
    0.8632,
    0.8084,
    0.8647,
    0.8061,
    0.8521,
    0.7086,
    0.8541,
    0.7106,
    0.8311,
    0.7832,
    0.8339,
    0.7821,
    0.9634,
    0.7681,
    0.9663,
    0.7687,
    0.8742,
    0.8143,
    0.8753,
    0.8117,
    0.8621,
    0.7004,
    0.8636,
    0.7028,
    0.8379,
    0.7959,
    0.8403,
    0.7942,
    0.9597,
    0.7805,
    0.9624,
    0.7816,
    0.8862,
    0.818,
    0.8868,
    0.8152,
    0.8735,
    0.6943,
    0.8746,
    0.697,
    0.847,
    0.807,
    0.8491,
    0.8049,
    0.9536,
    0.7919,
    0.956,
    0.7935,
    0.8858,
    0.6906,
    0.8864,
    0.6934,
    0.858,
    0.8161,
    0.8597,
    0.8136,
    0.9454,
    0.8019,
    0.9474,
    0.804,
    0.8987,
    0.6893,
    0.8987,
    0.6922,
    0.4991,
    0.9874,
    0.4991,
    0.9874,
    0.4686,
    0.9874,
    0.4686,
    0.9874,
    0.5295,
    0.9874,
    0.5295,
    0.9874,
    0.5599,
    0.9874,
    0.5599,
    0.9874,
    0.5904,
    0.9874,
    0.5904,
    0.9874,
    0.6208,
    0.9874,
    0.6208,
    0.9874,
    0.6513,
    0.9874,
    0.6513,
    0.9874,
    0.6817,
    0.9874,
    0.6817,
    0.9874,
    0.7122,
    0.9874,
    0.7122,
    0.9874,
    0.7426,
    0.9874,
    0.7426,
    0.9874,
    0.773,
    0.9874,
    0.773,
    0.9874,
    0.8035,
    0.9874,
    0.8035,
    0.9874,
    0.8339,
    0.9874,
    0.8339,
    0.9874,
    0.8644,
    0.9874,
    0.8644,
    0.9874,
    0.8948,
    0.9874,
    0.8948,
    0.9874,
    0.9252,
    0.9874,
    0.9252,
    0.9874,
    0.9557,
    0.9874,
    0.9557,
    0.9874,
    0.9861,
    0.9874,
    0.9861,
    0.9874,
    0.0424,
    0.9874,
    0.0424,
    0.9874,
    0.012,
    0.9874,
    0.012,
    0.9874,
    0.0729,
    0.9874,
    0.0729,
    0.9874,
    0.1033,
    0.9874,
    0.1033,
    0.9874,
    0.1338,
    0.9874,
    0.1338,
    0.9874,
    0.1642,
    0.9874,
    0.1642,
    0.9874,
    0.1947,
    0.9874,
    0.1947,
    0.9874,
    0.2251,
    0.9874,
    0.2251,
    0.9874,
    0.2555,
    0.9874,
    0.2555,
    0.9874,
    0.286,
    0.9874,
    0.286,
    0.9874,
    0.3164,
    0.9874,
    0.3164,
    0.9874,
    0.3469,
    0.9874,
    0.3469,
    0.9874,
    0.3773,
    0.9874,
    0.3773,
    0.9874,
    0.4077,
    0.9874,
    0.4077,
    0.9874,
    0.4382,
    0.9874,
    0.4382,
    0.9874,
    0.4716,
    0.8517,
    0.4716,
    0.9874,
    0.4411,
    0.9874,
    0.4411,
    0.8517,
    0.4107,
    0.9874,
    0.4107,
    0.8517,
    0.3802,
    0.9874,
    0.3802,
    0.8517,
    0.3498,
    0.9874,
    0.3498,
    0.8517,
    0.3193,
    0.9874,
    0.3193,
    0.8517,
    0.2889,
    0.9874,
    0.2889,
    0.8517,
    0.2585,
    0.9874,
    0.2585,
    0.8517,
    0.228,
    0.9874,
    0.228,
    0.8517,
    0.1976,
    0.9874,
    0.1976,
    0.8517,
    0.1671,
    0.9874,
    0.1671,
    0.8517,
    0.1367,
    0.9874,
    0.1367,
    0.8517,
    0.1063,
    0.9874,
    0.1063,
    0.8517,
    0.0758,
    0.9874,
    0.0758,
    0.8517,
    0.0454,
    0.9874,
    0.0454,
    0.8517,
    0.0149,
    0.9874,
    0.0149,
    0.8517,
    0.9891,
    0.8517,
    0.9891,
    0.9874,
    0.9586,
    0.9874,
    0.9586,
    0.8517,
    0.9282,
    0.9874,
    0.9282,
    0.8517,
    0.8977,
    0.9874,
    0.8977,
    0.8517,
    0.8673,
    0.9874,
    0.8673,
    0.8517,
    0.8368,
    0.9874,
    0.8368,
    0.8517,
    0.8064,
    0.9874,
    0.8064,
    0.8517,
    0.776,
    0.9874,
    0.776,
    0.8517,
    0.7455,
    0.9874,
    0.7455,
    0.8517,
    0.7151,
    0.9874,
    0.7151,
    0.8517,
    0.6846,
    0.9874,
    0.6846,
    0.8517,
    0.6542,
    0.9874,
    0.6542,
    0.8517,
    0.6238,
    0.9874,
    0.6238,
    0.8517,
    0.5933,
    0.9874,
    0.5933,
    0.8517,
    0.5629,
    0.9874,
    0.5629,
    0.8517,
    0.5324,
    0.9874,
    0.5324,
    0.8517,
    0.502,
    0.9874,
    0.502,
    0.8517,
    0.4982,
    0.9874,
    0.4677,
    0.9874,
    0.4677,
    0.8517,
    0.4982,
    0.8517,
    0.5286,
    0.9874,
    0.5286,
    0.8517,
    0.5591,
    0.9874,
    0.5591,
    0.8517,
    0.5895,
    0.9874,
    0.5895,
    0.8517,
    0.62,
    0.9874,
    0.62,
    0.8517,
    0.6504,
    0.9874,
    0.6504,
    0.8517,
    0.6808,
    0.9874,
    0.6808,
    0.8517,
    0.7113,
    0.9874,
    0.7113,
    0.8517,
    0.7417,
    0.9874,
    0.7417,
    0.8517,
    0.7722,
    0.9874,
    0.7722,
    0.8517,
    0.8026,
    0.9874,
    0.8026,
    0.8517,
    0.833,
    0.9874,
    0.833,
    0.8517,
    0.8635,
    0.9874,
    0.8635,
    0.8517,
    0.8939,
    0.9874,
    0.8939,
    0.8517,
    0.9244,
    0.9874,
    0.9244,
    0.8517,
    0.9548,
    0.9874,
    0.9548,
    0.8517,
    0.9852,
    0.9874,
    0.9852,
    0.8517,
    0.0416,
    0.9874,
    0.0111,
    0.9874,
    0.0111,
    0.8517,
    0.0416,
    0.8517,
    0.072,
    0.9874,
    0.072,
    0.8517,
    0.1025,
    0.9874,
    0.1025,
    0.8517,
    0.1329,
    0.9874,
    0.1329,
    0.8517,
    0.1633,
    0.9874,
    0.1633,
    0.8517,
    0.1938,
    0.9874,
    0.1938,
    0.8517,
    0.2242,
    0.9874,
    0.2242,
    0.8517,
    0.2547,
    0.9874,
    0.2547,
    0.8517,
    0.2851,
    0.9874,
    0.2851,
    0.8517,
    0.3155,
    0.9874,
    0.3155,
    0.8517,
    0.346,
    0.9874,
    0.346,
    0.8517,
    0.3764,
    0.9874,
    0.3764,
    0.8517,
    0.4069,
    0.9874,
    0.4069,
    0.8517,
    0.4373,
    0.9874,
    0.4373,
    0.8517,
    0.4703,
    0.9874,
    0.4399,
    0.9874,
    0.4399,
    0.8517,
    0.4703,
    0.8517,
    0.4094,
    0.9874,
    0.4094,
    0.8517,
    0.379,
    0.9874,
    0.379,
    0.8517,
    0.3485,
    0.9874,
    0.3485,
    0.8517,
    0.3181,
    0.9874,
    0.3181,
    0.8517,
    0.2877,
    0.9874,
    0.2877,
    0.8517,
    0.2572,
    0.9874,
    0.2572,
    0.8517,
    0.2268,
    0.9874,
    0.2268,
    0.8517,
    0.1963,
    0.9874,
    0.1963,
    0.8517,
    0.1659,
    0.9874,
    0.1659,
    0.8517,
    0.1354,
    0.9874,
    0.1354,
    0.8517,
    0.105,
    0.9874,
    0.105,
    0.8517,
    0.0746,
    0.9874,
    0.0746,
    0.8517,
    0.0441,
    0.9874,
    0.0441,
    0.8517,
    0.0137,
    0.9874,
    0.0137,
    0.8517,
    0.9878,
    0.9874,
    0.9574,
    0.9874,
    0.9574,
    0.8517,
    0.9878,
    0.8517,
    0.9269,
    0.9874,
    0.9269,
    0.8517,
    0.8965,
    0.9874,
    0.8965,
    0.8517,
    0.866,
    0.9874,
    0.866,
    0.8517,
    0.8356,
    0.9874,
    0.8356,
    0.8517,
    0.8052,
    0.9874,
    0.8052,
    0.8517,
    0.7747,
    0.9874,
    0.7747,
    0.8517,
    0.7443,
    0.9874,
    0.7443,
    0.8517,
    0.7138,
    0.9874,
    0.7138,
    0.8517,
    0.6834,
    0.9874,
    0.6834,
    0.8517,
    0.6529,
    0.9874,
    0.6529,
    0.8517,
    0.6225,
    0.9874,
    0.6225,
    0.8517,
    0.5921,
    0.9874,
    0.5921,
    0.8517,
    0.5616,
    0.9874,
    0.5616,
    0.8517,
    0.5312,
    0.9874,
    0.5312,
    0.8517,
    0.5007,
    0.9874,
    0.5007,
    0.8517,
    0.6206,
    0.8517,
    0.651,
    0.8517,
    0.651,
    0.9874,
    0.6206,
    0.9874,
    0.9554,
    0.8517,
    0.9554,
    0.9874,
    0.925,
    0.9874,
    0.925,
    0.8517,
    0.9859,
    0.9874,
    0.9859,
    0.8517,
    0.6814,
    0.8517,
    0.7119,
    0.8517,
    0.7119,
    0.9874,
    0.6814,
    0.9874,
    0.0422,
    0.9874,
    0.0117,
    0.9874,
    0.0117,
    0.8517,
    0.0422,
    0.8517,
    0.2857,
    0.8517,
    0.3161,
    0.8517,
    0.3161,
    0.9874,
    0.2857,
    0.9874,
    0.8336,
    0.9874,
    0.8032,
    0.9874,
    0.8032,
    0.8517,
    0.8336,
    0.8517,
    0.3466,
    0.8517,
    0.3466,
    0.9874,
    0.4988,
    0.8517,
    0.5292,
    0.8517,
    0.5292,
    0.9874,
    0.4988,
    0.9874,
    0.377,
    0.8517,
    0.4075,
    0.8517,
    0.4075,
    0.9874,
    0.377,
    0.9874,
    0.0726,
    0.9874,
    0.0726,
    0.8517,
    0.1335,
    0.9874,
    0.1031,
    0.9874,
    0.1031,
    0.8517,
    0.1335,
    0.8517,
    0.7728,
    0.9874,
    0.7728,
    0.8517,
    0.2553,
    0.9874,
    0.2553,
    0.8517,
    0.4379,
    0.8517,
    0.4684,
    0.8517,
    0.4684,
    0.9874,
    0.4379,
    0.9874,
    0.2248,
    0.8517,
    0.2248,
    0.9874,
    0.5901,
    0.8517,
    0.5901,
    0.9874,
    0.1639,
    0.9874,
    0.1639,
    0.8517,
    0.7423,
    0.8517,
    0.7423,
    0.9874,
    0.1944,
    0.9874,
    0.1944,
    0.8517,
    0.5597,
    0.8517,
    0.5597,
    0.9874,
    0.8641,
    0.9874,
    0.8641,
    0.8517,
    0.8945,
    0.9874,
    0.8945,
    0.8517,
    0.6219,
    0.9874,
    0.6219,
    0.8517,
    0.6524,
    0.8517,
    0.6524,
    0.9874,
    0.9568,
    0.9874,
    0.9263,
    0.9874,
    0.9263,
    0.8517,
    0.9568,
    0.8517,
    0.9872,
    0.8517,
    0.9872,
    0.9874,
    0.6828,
    0.9874,
    0.6828,
    0.8517,
    0.7133,
    0.8517,
    0.7133,
    0.9874,
    0.0436,
    0.8517,
    0.0436,
    0.9874,
    0.0131,
    0.9874,
    0.0131,
    0.8517,
    0.2871,
    0.9874,
    0.2871,
    0.8517,
    0.3175,
    0.8517,
    0.3175,
    0.9874,
    0.835,
    0.8517,
    0.835,
    0.9874,
    0.8046,
    0.9874,
    0.8046,
    0.8517,
    0.348,
    0.8517,
    0.348,
    0.9874,
    0.5002,
    0.9874,
    0.5002,
    0.8517,
    0.5306,
    0.8517,
    0.5306,
    0.9874,
    0.3784,
    0.9874,
    0.3784,
    0.8517,
    0.4088,
    0.8517,
    0.4088,
    0.9874,
    0.074,
    0.8517,
    0.074,
    0.9874,
    0.1349,
    0.8517,
    0.1349,
    0.9874,
    0.1044,
    0.9874,
    0.1044,
    0.8517,
    0.7741,
    0.9874,
    0.7741,
    0.8517,
    0.2566,
    0.8517,
    0.2566,
    0.9874,
    0.4393,
    0.9874,
    0.4393,
    0.8517,
    0.4697,
    0.8517,
    0.4697,
    0.9874,
    0.2262,
    0.9874,
    0.2262,
    0.8517,
    0.5915,
    0.9874,
    0.5915,
    0.8517,
    0.1653,
    0.8517,
    0.1653,
    0.9874,
    0.7437,
    0.8517,
    0.7437,
    0.9874,
    0.1958,
    0.9874,
    0.1958,
    0.8517,
    0.5611,
    0.9874,
    0.5611,
    0.8517,
    0.8655,
    0.8517,
    0.8655,
    0.9874,
    0.8959,
    0.9874,
    0.8959,
    0.8517,
    0.4079,
    0.7886,
    0.4298,
    0.7886,
    0.4298,
    0.8134,
    0.4079,
    0.8134,
    0.2982,
    0.7886,
    0.3202,
    0.7886,
    0.3202,
    0.8134,
    0.2982,
    0.8134,
    0.5613,
    0.7886,
    0.5832,
    0.7886,
    0.5832,
    0.8134,
    0.5613,
    0.8134,
    0.0133,
    0.7886,
    0.0352,
    0.7886,
    0.0352,
    0.8134,
    0.0133,
    0.8134,
    0.1667,
    0.7886,
    0.1886,
    0.7886,
    0.1886,
    0.8134,
    0.1667,
    0.8134,
    0.4517,
    0.7886,
    0.4517,
    0.8134,
    0.6051,
    0.7886,
    0.6051,
    0.8134,
    0.0571,
    0.7886,
    0.0571,
    0.8134,
    0.3421,
    0.7886,
    0.3421,
    0.8134,
    0.2105,
    0.7886,
    0.2105,
    0.8134,
    0.4736,
    0.7886,
    0.4736,
    0.8134,
    0.6271,
    0.7886,
    0.6271,
    0.8134,
    0.079,
    0.7886,
    0.079,
    0.8134,
    0.2325,
    0.7886,
    0.2325,
    0.8134,
    0.4955,
    0.7886,
    0.4955,
    0.8134,
    0.649,
    0.7886,
    0.649,
    0.8134,
    0.1009,
    0.7886,
    0.1009,
    0.8134,
    0.2544,
    0.7886,
    0.2544,
    0.8134,
    0.5174,
    0.7886,
    0.5174,
    0.8134,
    0.364,
    0.7886,
    0.364,
    0.8134,
    0.6709,
    0.7886,
    0.6709,
    0.8134,
    0.1229,
    0.7886,
    0.1229,
    0.8134,
    0.3859,
    0.7886,
    0.3859,
    0.8134,
    0.2763,
    0.7886,
    0.2763,
    0.8134,
    0.5394,
    0.7886,
    0.5394,
    0.8134,
    0.6928,
    0.7886,
    0.6928,
    0.8134,
    0.1448,
    0.7886,
    0.1448,
    0.8134,
    0.7147,
    0.7886,
    0.7147,
    0.8134,
    0.4079,
    0.02,
    0.4079,
    0.0449,
    0.4298,
    0.0449,
    0.4298,
    0.02,
    0.2982,
    0.02,
    0.2982,
    0.0449,
    0.3202,
    0.0449,
    0.3202,
    0.02,
    0.5613,
    0.02,
    0.5613,
    0.0449,
    0.5832,
    0.0449,
    0.5832,
    0.02,
    0.0133,
    0.02,
    0.0133,
    0.0449,
    0.0352,
    0.0449,
    0.0352,
    0.02,
    0.1667,
    0.02,
    0.1667,
    0.0449,
    0.1886,
    0.0449,
    0.1886,
    0.02,
    0.4517,
    0.0449,
    0.4517,
    0.02,
    0.6051,
    0.0449,
    0.6051,
    0.02,
    0.0571,
    0.0449,
    0.0571,
    0.02,
    0.3421,
    0.0449,
    0.3421,
    0.02,
    0.2105,
    0.0449,
    0.2105,
    0.02,
    0.4736,
    0.0449,
    0.4736,
    0.02,
    0.6271,
    0.0449,
    0.6271,
    0.02,
    0.079,
    0.0449,
    0.079,
    0.02,
    0.2325,
    0.0449,
    0.2325,
    0.02,
    0.4955,
    0.0449,
    0.4955,
    0.02,
    0.649,
    0.0449,
    0.649,
    0.02,
    0.1009,
    0.0449,
    0.1009,
    0.02,
    0.2544,
    0.0449,
    0.2544,
    0.02,
    0.5174,
    0.0449,
    0.5174,
    0.02,
    0.364,
    0.0449,
    0.364,
    0.02,
    0.6709,
    0.0449,
    0.6709,
    0.02,
    0.1229,
    0.0449,
    0.1229,
    0.02,
    0.3859,
    0.0449,
    0.3859,
    0.02,
    0.2763,
    0.0449,
    0.2763,
    0.02,
    0.5394,
    0.0449,
    0.5394,
    0.02,
    0.6928,
    0.0449,
    0.6928,
    0.02,
    0.1448,
    0.0449,
    0.1448,
    0.02,
    0.7147,
    0.0449,
    0.7147,
    0.02,
    0.7753,
    0.3305,
    0.7753,
    0.3181,
    0.7889,
    0.3181,
    0.7889,
    0.3305,
    0.7753,
    0.5785,
    0.7753,
    0.5661,
    0.7889,
    0.5661,
    0.7889,
    0.5785,
    0.7753,
    0.6406,
    0.7753,
    0.6282,
    0.7889,
    0.6282,
    0.7889,
    0.6406,
    0.7753,
    0.4917,
    0.7753,
    0.4793,
    0.7889,
    0.4793,
    0.7889,
    0.4917,
    0.7753,
    0.4049,
    0.7753,
    0.3925,
    0.7889,
    0.3925,
    0.7889,
    0.4049,
    0.7753,
    0.3057,
    0.7889,
    0.3057,
    0.7753,
    0.5537,
    0.7889,
    0.5537,
    0.7753,
    0.6158,
    0.7889,
    0.6158,
    0.7753,
    0.4669,
    0.7889,
    0.4669,
    0.7753,
    0.3801,
    0.7889,
    0.3801,
    0.7753,
    0.2933,
    0.7889,
    0.2933,
    0.7753,
    0.5413,
    0.7889,
    0.5413,
    0.7753,
    0.6034,
    0.7889,
    0.6034,
    0.7753,
    0.4545,
    0.7889,
    0.4545,
    0.7753,
    0.3677,
    0.7889,
    0.3677,
    0.7753,
    0.6902,
    0.7753,
    0.6778,
    0.7889,
    0.6778,
    0.7889,
    0.6902,
    0.7753,
    0.5289,
    0.7889,
    0.5289,
    0.7753,
    0.4421,
    0.7889,
    0.4421,
    0.7753,
    0.3553,
    0.7889,
    0.3553,
    0.7753,
    0.6654,
    0.7889,
    0.6654,
    0.7753,
    0.5165,
    0.7889,
    0.5165,
    0.7753,
    0.4297,
    0.7889,
    0.4297,
    0.7753,
    0.3429,
    0.7889,
    0.3429,
    0.7753,
    0.653,
    0.7889,
    0.653,
    0.7753,
    0.5041,
    0.7889,
    0.5041,
    0.7753,
    0.5909,
    0.7889,
    0.5909,
    0.7753,
    0.4173,
    0.7889,
    0.4173,
    0.789,
    0.3305,
    0.7754,
    0.3305,
    0.7754,
    0.3181,
    0.789,
    0.3181,
    0.7889,
    0.5785,
    0.7753,
    0.5785,
    0.7753,
    0.5661,
    0.7889,
    0.5661,
    0.7889,
    0.6406,
    0.7753,
    0.6406,
    0.7753,
    0.6282,
    0.7889,
    0.6282,
    0.789,
    0.4917,
    0.7753,
    0.4917,
    0.7753,
    0.4793,
    0.789,
    0.4793,
    0.789,
    0.4049,
    0.7753,
    0.4049,
    0.7754,
    0.3925,
    0.789,
    0.3925,
    0.7754,
    0.3057,
    0.789,
    0.3057,
    0.7753,
    0.5537,
    0.7889,
    0.5537,
    0.7753,
    0.6157,
    0.7889,
    0.6158,
    0.7753,
    0.4669,
    0.789,
    0.4669,
    0.7754,
    0.3801,
    0.789,
    0.3801,
    0.7754,
    0.2933,
    0.789,
    0.2933,
    0.7753,
    0.5413,
    0.7889,
    0.5413,
    0.7753,
    0.6033,
    0.7889,
    0.6034,
    0.7753,
    0.4545,
    0.789,
    0.4545,
    0.7754,
    0.3677,
    0.789,
    0.3677,
    0.7889,
    0.6902,
    0.7753,
    0.6902,
    0.7753,
    0.6778,
    0.7889,
    0.6778,
    0.7753,
    0.5289,
    0.7889,
    0.5289,
    0.7753,
    0.4421,
    0.789,
    0.4421,
    0.7754,
    0.3553,
    0.789,
    0.3553,
    0.7753,
    0.6654,
    0.7889,
    0.6654,
    0.7753,
    0.5165,
    0.7889,
    0.5165,
    0.7753,
    0.4297,
    0.789,
    0.4297,
    0.7754,
    0.3429,
    0.789,
    0.3429,
    0.7753,
    0.653,
    0.7889,
    0.653,
    0.7753,
    0.5041,
    0.7889,
    0.5041,
    0.7753,
    0.5909,
    0.7889,
    0.5909,
    0.7753,
    0.4173,
    0.789,
    0.4173,
    0.3421,
    0.7567,
    0.3421,
    0.7886,
    0.3202,
    0.7886,
    0.3202,
    0.7567,
    0.2982,
    0.7886,
    0.2982,
    0.7567,
    0.2763,
    0.7886,
    0.2763,
    0.7567,
    0.2544,
    0.7886,
    0.2544,
    0.7567,
    0.2325,
    0.7886,
    0.2325,
    0.7567,
    0.2106,
    0.7886,
    0.2106,
    0.7567,
    0.1886,
    0.7886,
    0.1886,
    0.7567,
    0.1667,
    0.7886,
    0.1667,
    0.7567,
    0.1448,
    0.7886,
    0.1448,
    0.7567,
    0.1229,
    0.7886,
    0.1229,
    0.7567,
    0.1009,
    0.7886,
    0.1009,
    0.7567,
    0.079,
    0.7886,
    0.079,
    0.7567,
    0.0571,
    0.7886,
    0.0571,
    0.7567,
    0.0352,
    0.7886,
    0.0352,
    0.7567,
    0.0133,
    0.7886,
    0.0133,
    0.7567,
    0.7147,
    0.7567,
    0.7147,
    0.7886,
    0.6928,
    0.7886,
    0.6928,
    0.7567,
    0.6709,
    0.7886,
    0.6709,
    0.7567,
    0.649,
    0.7886,
    0.649,
    0.7567,
    0.6271,
    0.7886,
    0.6271,
    0.7567,
    0.6051,
    0.7886,
    0.6051,
    0.7567,
    0.5832,
    0.7886,
    0.5832,
    0.7567,
    0.5613,
    0.7886,
    0.5613,
    0.7567,
    0.5394,
    0.7886,
    0.5394,
    0.7567,
    0.5174,
    0.7886,
    0.5174,
    0.7567,
    0.4955,
    0.7886,
    0.4955,
    0.7567,
    0.4736,
    0.7886,
    0.4736,
    0.7567,
    0.4517,
    0.7886,
    0.4517,
    0.7567,
    0.4298,
    0.7886,
    0.4298,
    0.7567,
    0.4078,
    0.7886,
    0.4078,
    0.7567,
    0.3859,
    0.7886,
    0.3859,
    0.7567,
    0.364,
    0.7886,
    0.364,
    0.7567,
    0.364,
    0.4166,
    0.364,
    0.5816,
    0.3421,
    0.5816,
    0.3421,
    0.4166,
    0.3859,
    0.4166,
    0.3859,
    0.5816,
    0.4078,
    0.4166,
    0.4078,
    0.5816,
    0.4298,
    0.4166,
    0.4298,
    0.5816,
    0.4517,
    0.4166,
    0.4517,
    0.5816,
    0.4736,
    0.4166,
    0.4736,
    0.5816,
    0.4955,
    0.4166,
    0.4955,
    0.5816,
    0.5174,
    0.4166,
    0.5174,
    0.5816,
    0.5394,
    0.4166,
    0.5394,
    0.5816,
    0.5613,
    0.4166,
    0.5613,
    0.5816,
    0.5832,
    0.4166,
    0.5832,
    0.5816,
    0.6051,
    0.4166,
    0.6051,
    0.5816,
    0.6271,
    0.4166,
    0.6271,
    0.5816,
    0.649,
    0.4166,
    0.649,
    0.5816,
    0.6709,
    0.4166,
    0.6709,
    0.5816,
    0.6928,
    0.4166,
    0.6928,
    0.5816,
    0.7147,
    0.4166,
    0.7147,
    0.5816,
    0.0352,
    0.4166,
    0.0352,
    0.5816,
    0.0133,
    0.5816,
    0.0133,
    0.4166,
    0.0571,
    0.4166,
    0.0571,
    0.5816,
    0.079,
    0.4166,
    0.079,
    0.5816,
    0.1009,
    0.4166,
    0.1009,
    0.5816,
    0.1229,
    0.4166,
    0.1229,
    0.5816,
    0.1448,
    0.4166,
    0.1448,
    0.5816,
    0.1667,
    0.4166,
    0.1667,
    0.5816,
    0.1886,
    0.4166,
    0.1886,
    0.5816,
    0.2106,
    0.4166,
    0.2106,
    0.5816,
    0.2325,
    0.4166,
    0.2325,
    0.5816,
    0.2544,
    0.4166,
    0.2544,
    0.5816,
    0.2763,
    0.4166,
    0.2763,
    0.5816,
    0.2982,
    0.4166,
    0.2982,
    0.5816,
    0.3202,
    0.4166,
    0.3202,
    0.5816,
    0.364,
    0.7097,
    0.3421,
    0.7097,
    0.3859,
    0.7097,
    0.4078,
    0.7097,
    0.4298,
    0.7097,
    0.4517,
    0.7097,
    0.4736,
    0.7097,
    0.4955,
    0.7097,
    0.5174,
    0.7097,
    0.5394,
    0.7097,
    0.5613,
    0.7097,
    0.5832,
    0.7097,
    0.6051,
    0.7097,
    0.6271,
    0.7097,
    0.649,
    0.7097,
    0.6709,
    0.7097,
    0.6928,
    0.7097,
    0.7147,
    0.7097,
    0.0352,
    0.7097,
    0.0133,
    0.7097,
    0.0571,
    0.7097,
    0.079,
    0.7097,
    0.1009,
    0.7097,
    0.1229,
    0.7097,
    0.1448,
    0.7097,
    0.1667,
    0.7097,
    0.1886,
    0.7097,
    0.2106,
    0.7097,
    0.2325,
    0.7097,
    0.2544,
    0.7097,
    0.2763,
    0.7097,
    0.2982,
    0.7097,
    0.3202,
    0.7097,
    0.8601,
    0.1406,
    0.847,
    0.2727,
    0.8215,
    0.2676,
    0.8731,
    0.2727,
    0.8986,
    0.2676,
    0.9226,
    0.2576,
    0.9443,
    0.2432,
    0.9627,
    0.2248,
    0.9772,
    0.2031,
    0.9871,
    0.1791,
    0.9922,
    0.1536,
    0.9922,
    0.1275,
    0.9871,
    0.102,
    0.9772,
    0.078,
    0.9627,
    0.0563,
    0.9443,
    0.0379,
    0.9226,
    0.0235,
    0.8986,
    0.0135,
    0.8731,
    0.0084,
    0.847,
    0.0084,
    0.8215,
    0.0135,
    0.7975,
    0.0235,
    0.7758,
    0.0379,
    0.7574,
    0.0563,
    0.743,
    0.078,
    0.733,
    0.102,
    0.7279,
    0.1275,
    0.7279,
    0.1536,
    0.733,
    0.1791,
    0.743,
    0.2031,
    0.7574,
    0.2248,
    0.7758,
    0.2432,
    0.7975,
    0.2576,
    0.3421,
    0.0768,
    0.3202,
    0.0768,
    0.3202,
    0.0449,
    0.3421,
    0.0449,
    0.2982,
    0.0768,
    0.2982,
    0.0449,
    0.2763,
    0.0768,
    0.2763,
    0.0449,
    0.2544,
    0.0768,
    0.2544,
    0.0449,
    0.2325,
    0.0768,
    0.2325,
    0.0449,
    0.2106,
    0.0768,
    0.2106,
    0.0449,
    0.1886,
    0.0768,
    0.1886,
    0.0449,
    0.1667,
    0.0768,
    0.1667,
    0.0449,
    0.1448,
    0.0768,
    0.1448,
    0.0449,
    0.1229,
    0.0768,
    0.1229,
    0.0449,
    0.1009,
    0.0768,
    0.1009,
    0.0449,
    0.079,
    0.0768,
    0.079,
    0.0449,
    0.0571,
    0.0768,
    0.0571,
    0.0449,
    0.0352,
    0.0768,
    0.0352,
    0.0449,
    0.0133,
    0.0768,
    0.0133,
    0.0449,
    0.7147,
    0.0768,
    0.6928,
    0.0768,
    0.6928,
    0.0449,
    0.7147,
    0.0449,
    0.6709,
    0.0768,
    0.6709,
    0.0449,
    0.649,
    0.0768,
    0.649,
    0.0449,
    0.6271,
    0.0768,
    0.6271,
    0.0449,
    0.6051,
    0.0768,
    0.6051,
    0.0449,
    0.5832,
    0.0768,
    0.5832,
    0.0449,
    0.5613,
    0.0768,
    0.5613,
    0.0449,
    0.5394,
    0.0768,
    0.5394,
    0.0449,
    0.5174,
    0.0768,
    0.5174,
    0.0449,
    0.4955,
    0.0768,
    0.4955,
    0.0449,
    0.4736,
    0.0768,
    0.4736,
    0.0449,
    0.4517,
    0.0768,
    0.4517,
    0.0449,
    0.4298,
    0.0768,
    0.4298,
    0.0449,
    0.4078,
    0.0768,
    0.4078,
    0.0449,
    0.3859,
    0.0768,
    0.3859,
    0.0449,
    0.364,
    0.0768,
    0.364,
    0.0449,
    0.364,
    0.4169,
    0.3421,
    0.4169,
    0.3421,
    0.2519,
    0.364,
    0.2519,
    0.3859,
    0.4169,
    0.3859,
    0.2519,
    0.4078,
    0.4169,
    0.4078,
    0.2519,
    0.4298,
    0.4169,
    0.4298,
    0.2519,
    0.4517,
    0.4169,
    0.4517,
    0.2519,
    0.4736,
    0.4169,
    0.4736,
    0.2519,
    0.4955,
    0.4169,
    0.4955,
    0.2519,
    0.5174,
    0.4169,
    0.5174,
    0.2519,
    0.5394,
    0.4169,
    0.5394,
    0.2519,
    0.5613,
    0.4169,
    0.5613,
    0.2519,
    0.5832,
    0.4169,
    0.5832,
    0.2519,
    0.6051,
    0.4169,
    0.6051,
    0.2519,
    0.6271,
    0.4169,
    0.6271,
    0.2519,
    0.649,
    0.4169,
    0.649,
    0.2519,
    0.6709,
    0.4169,
    0.6709,
    0.2519,
    0.6928,
    0.4169,
    0.6928,
    0.2519,
    0.7147,
    0.4169,
    0.7147,
    0.2519,
    0.0352,
    0.4169,
    0.0133,
    0.4169,
    0.0133,
    0.2519,
    0.0352,
    0.2519,
    0.0571,
    0.4169,
    0.0571,
    0.2519,
    0.079,
    0.4169,
    0.079,
    0.2519,
    0.1009,
    0.4169,
    0.1009,
    0.2519,
    0.1229,
    0.4169,
    0.1229,
    0.2519,
    0.1448,
    0.4169,
    0.1448,
    0.2519,
    0.1667,
    0.4169,
    0.1667,
    0.2519,
    0.1886,
    0.4169,
    0.1886,
    0.2519,
    0.2106,
    0.4169,
    0.2106,
    0.2519,
    0.2325,
    0.4169,
    0.2325,
    0.2519,
    0.2544,
    0.4169,
    0.2544,
    0.2519,
    0.2763,
    0.4169,
    0.2763,
    0.2519,
    0.2982,
    0.4169,
    0.2982,
    0.2519,
    0.3202,
    0.4169,
    0.3202,
    0.2519,
    0.3421,
    0.1238,
    0.364,
    0.1238,
    0.3859,
    0.1238,
    0.4078,
    0.1238,
    0.4298,
    0.1238,
    0.4517,
    0.1238,
    0.4736,
    0.1238,
    0.4955,
    0.1238,
    0.5174,
    0.1238,
    0.5394,
    0.1238,
    0.5613,
    0.1238,
    0.5832,
    0.1238,
    0.6051,
    0.1238,
    0.6271,
    0.1238,
    0.649,
    0.1238,
    0.6709,
    0.1238,
    0.6928,
    0.1238,
    0.7147,
    0.1238,
    0.0133,
    0.1238,
    0.0352,
    0.1238,
    0.0571,
    0.1238,
    0.079,
    0.1238,
    0.1009,
    0.1238,
    0.1229,
    0.1238,
    0.1448,
    0.1238,
    0.1667,
    0.1238,
    0.1886,
    0.1238,
    0.2106,
    0.1238,
    0.2325,
    0.1238,
    0.2544,
    0.1238,
    0.2763,
    0.1238,
    0.2982,
    0.1238,
    0.3202,
    0.1238,
    0.8601,
    0.1406,
    0.8215,
    0.2676,
    0.847,
    0.2727,
    0.8731,
    0.2727,
    0.8986,
    0.2676,
    0.9226,
    0.2576,
    0.9443,
    0.2432,
    0.9627,
    0.2248,
    0.9772,
    0.2031,
    0.9871,
    0.1791,
    0.9922,
    0.1536,
    0.9922,
    0.1275,
    0.9871,
    0.102,
    0.9772,
    0.078,
    0.9627,
    0.0563,
    0.9443,
    0.0379,
    0.9226,
    0.0235,
    0.8986,
    0.0135,
    0.8731,
    0.0084,
    0.847,
    0.0084,
    0.8215,
    0.0135,
    0.7975,
    0.0235,
    0.7758,
    0.0379,
    0.7574,
    0.0563,
    0.743,
    0.078,
    0.733,
    0.102,
    0.7279,
    0.1275,
    0.7279,
    0.1536,
    0.733,
    0.1791,
    0.743,
    0.2031,
    0.7574,
    0.2248,
    0.7758,
    0.2432,
    0.7975,
    0.2576
  ],
  "faces": [
    {
      "vertices": [
        "223",
        "224",
        "258",
        "257"
      ],
      "normals": [
        "1",
        "2",
        "2",
        "1"
      ],
      "uvs": [
        "1",
        "2",
        "3",
        "4"
      ]
    },
    {
      "vertices": [
        "69",
        "70",
        "289",
        "290"
      ],
      "normals": [
        "3",
        "4",
        "4",
        "3"
      ],
      "uvs": [
        "5",
        "6",
        "7",
        "8"
      ]
    },
    {
      "vertices": [
        "114",
        "113",
        "305",
        "306"
      ],
      "normals": [
        "5",
        "6",
        "6",
        "5"
      ],
      "uvs": [
        "9",
        "10",
        "11",
        "12"
      ]
    },
    {
      "vertices": [
        "224",
        "225",
        "385",
        "258"
      ],
      "normals": [
        "2",
        "7",
        "7",
        "2"
      ],
      "uvs": [
        "2",
        "13",
        "14",
        "3"
      ]
    },
    {
      "vertices": [
        "68",
        "69",
        "290",
        "291"
      ],
      "normals": [
        "8",
        "3",
        "3",
        "8"
      ],
      "uvs": [
        "15",
        "5",
        "8",
        "16"
      ]
    },
    {
      "vertices": [
        "113",
        "112",
        "304",
        "305"
      ],
      "normals": [
        "6",
        "9",
        "9",
        "6"
      ],
      "uvs": [
        "10",
        "17",
        "18",
        "11"
      ]
    },
    {
      "vertices": [
        "67",
        "68",
        "291",
        "260"
      ],
      "normals": [
        "10",
        "8",
        "8",
        "10"
      ],
      "uvs": [
        "19",
        "15",
        "16",
        "20"
      ]
    },
    {
      "vertices": [
        "112",
        "111",
        "303",
        "304"
      ],
      "normals": [
        "9",
        "11",
        "11",
        "9"
      ],
      "uvs": [
        "17",
        "21",
        "22",
        "18"
      ]
    },
    {
      "vertices": [
        "111",
        "110",
        "302",
        "303"
      ],
      "normals": [
        "11",
        "12",
        "12",
        "11"
      ],
      "uvs": [
        "21",
        "23",
        "24",
        "22"
      ]
    },
    {
      "vertices": [
        "110",
        "109",
        "301",
        "302"
      ],
      "normals": [
        "12",
        "13",
        "13",
        "12"
      ],
      "uvs": [
        "23",
        "25",
        "26",
        "24"
      ]
    },
    {
      "vertices": [
        "109",
        "108",
        "300",
        "301"
      ],
      "normals": [
        "13",
        "14",
        "14",
        "13"
      ],
      "uvs": [
        "25",
        "27",
        "28",
        "26"
      ]
    },
    {
      "vertices": [
        "108",
        "107",
        "299",
        "300"
      ],
      "normals": [
        "14",
        "15",
        "15",
        "14"
      ],
      "uvs": [
        "27",
        "29",
        "30",
        "28"
      ]
    },
    {
      "vertices": [
        "107",
        "106",
        "298",
        "299"
      ],
      "normals": [
        "15",
        "16",
        "16",
        "15"
      ],
      "uvs": [
        "29",
        "31",
        "32",
        "30"
      ]
    },
    {
      "vertices": [
        "106",
        "105",
        "297",
        "298"
      ],
      "normals": [
        "16",
        "17",
        "17",
        "16"
      ],
      "uvs": [
        "31",
        "33",
        "34",
        "32"
      ]
    },
    {
      "vertices": [
        "2",
        "193",
        "227",
        "354"
      ],
      "normals": [
        "18",
        "19",
        "19",
        "18"
      ],
      "uvs": [
        "35",
        "36",
        "37",
        "38"
      ]
    },
    {
      "vertices": [
        "105",
        "104",
        "296",
        "297"
      ],
      "normals": [
        "17",
        "20",
        "20",
        "17"
      ],
      "uvs": [
        "33",
        "39",
        "40",
        "34"
      ]
    },
    {
      "vertices": [
        "163",
        "2",
        "354",
        "355"
      ],
      "normals": [
        "21",
        "18",
        "18",
        "21"
      ],
      "uvs": [
        "41",
        "35",
        "38",
        "42"
      ]
    },
    {
      "vertices": [
        "104",
        "103",
        "295",
        "296"
      ],
      "normals": [
        "20",
        "22",
        "22",
        "20"
      ],
      "uvs": [
        "39",
        "43",
        "44",
        "40"
      ]
    },
    {
      "vertices": [
        "164",
        "163",
        "355",
        "356"
      ],
      "normals": [
        "23",
        "21",
        "21",
        "23"
      ],
      "uvs": [
        "45",
        "41",
        "42",
        "46"
      ]
    },
    {
      "vertices": [
        "103",
        "102",
        "294",
        "295"
      ],
      "normals": [
        "22",
        "24",
        "24",
        "22"
      ],
      "uvs": [
        "43",
        "47",
        "48",
        "44"
      ]
    },
    {
      "vertices": [
        "165",
        "164",
        "356",
        "357"
      ],
      "normals": [
        "25",
        "23",
        "23",
        "25"
      ],
      "uvs": [
        "49",
        "45",
        "46",
        "50"
      ]
    },
    {
      "vertices": [
        "102",
        "101",
        "293",
        "294"
      ],
      "normals": [
        "24",
        "26",
        "26",
        "24"
      ],
      "uvs": [
        "47",
        "51",
        "52",
        "48"
      ]
    },
    {
      "vertices": [
        "166",
        "165",
        "357",
        "358"
      ],
      "normals": [
        "27",
        "25",
        "25",
        "27"
      ],
      "uvs": [
        "53",
        "49",
        "50",
        "54"
      ]
    },
    {
      "vertices": [
        "101",
        "100",
        "292",
        "293"
      ],
      "normals": [
        "26",
        "28",
        "28",
        "26"
      ],
      "uvs": [
        "51",
        "55",
        "56",
        "52"
      ]
    },
    {
      "vertices": [
        "167",
        "166",
        "358",
        "359"
      ],
      "normals": [
        "29",
        "27",
        "27",
        "29"
      ],
      "uvs": [
        "57",
        "53",
        "54",
        "58"
      ]
    },
    {
      "vertices": [
        "100",
        "99",
        "64",
        "292"
      ],
      "normals": [
        "28",
        "30",
        "30",
        "28"
      ],
      "uvs": [
        "55",
        "59",
        "60",
        "56"
      ]
    },
    {
      "vertices": [
        "168",
        "167",
        "359",
        "360"
      ],
      "normals": [
        "31",
        "29",
        "29",
        "31"
      ],
      "uvs": [
        "61",
        "57",
        "58",
        "62"
      ]
    },
    {
      "vertices": [
        "131",
        "132",
        "323",
        "259"
      ],
      "normals": [
        "32",
        "33",
        "33",
        "32"
      ],
      "uvs": [
        "63",
        "64",
        "65",
        "66"
      ]
    },
    {
      "vertices": [
        "169",
        "168",
        "360",
        "361"
      ],
      "normals": [
        "34",
        "31",
        "31",
        "34"
      ],
      "uvs": [
        "67",
        "61",
        "62",
        "68"
      ]
    },
    {
      "vertices": [
        "132",
        "133",
        "324",
        "323"
      ],
      "normals": [
        "33",
        "35",
        "35",
        "33"
      ],
      "uvs": [
        "64",
        "69",
        "70",
        "65"
      ]
    },
    {
      "vertices": [
        "3",
        "4",
        "66",
        "65"
      ],
      "normals": [
        "36",
        "37",
        "37",
        "36"
      ],
      "uvs": [
        "71",
        "72",
        "73",
        "74"
      ]
    },
    {
      "vertices": [
        "170",
        "169",
        "361",
        "362"
      ],
      "normals": [
        "38",
        "34",
        "34",
        "38"
      ],
      "uvs": [
        "75",
        "67",
        "68",
        "76"
      ]
    },
    {
      "vertices": [
        "133",
        "134",
        "325",
        "324"
      ],
      "normals": [
        "35",
        "39",
        "39",
        "35"
      ],
      "uvs": [
        "69",
        "77",
        "78",
        "70"
      ]
    },
    {
      "vertices": [
        "171",
        "170",
        "362",
        "363"
      ],
      "normals": [
        "40",
        "38",
        "38",
        "40"
      ],
      "uvs": [
        "79",
        "75",
        "76",
        "80"
      ]
    },
    {
      "vertices": [
        "134",
        "135",
        "326",
        "325"
      ],
      "normals": [
        "39",
        "41",
        "41",
        "39"
      ],
      "uvs": [
        "77",
        "81",
        "82",
        "78"
      ]
    },
    {
      "vertices": [
        "4",
        "5",
        "63",
        "66"
      ],
      "normals": [
        "37",
        "42",
        "42",
        "37"
      ],
      "uvs": [
        "72",
        "83",
        "84",
        "73"
      ]
    },
    {
      "vertices": [
        "172",
        "171",
        "363",
        "364"
      ],
      "normals": [
        "43",
        "40",
        "40",
        "43"
      ],
      "uvs": [
        "85",
        "79",
        "80",
        "86"
      ]
    },
    {
      "vertices": [
        "135",
        "136",
        "327",
        "326"
      ],
      "normals": [
        "41",
        "44",
        "44",
        "41"
      ],
      "uvs": [
        "81",
        "87",
        "88",
        "82"
      ]
    },
    {
      "vertices": [
        "5",
        "6",
        "49",
        "63"
      ],
      "normals": [
        "42",
        "45",
        "45",
        "42"
      ],
      "uvs": [
        "83",
        "89",
        "90",
        "84"
      ]
    },
    {
      "vertices": [
        "173",
        "172",
        "364",
        "365"
      ],
      "normals": [
        "46",
        "43",
        "43",
        "46"
      ],
      "uvs": [
        "91",
        "85",
        "86",
        "92"
      ]
    },
    {
      "vertices": [
        "136",
        "137",
        "328",
        "327"
      ],
      "normals": [
        "44",
        "47",
        "47",
        "44"
      ],
      "uvs": [
        "87",
        "93",
        "94",
        "88"
      ]
    },
    {
      "vertices": [
        "6",
        "7",
        "48",
        "49"
      ],
      "normals": [
        "45",
        "48",
        "48",
        "45"
      ],
      "uvs": [
        "89",
        "95",
        "96",
        "90"
      ]
    },
    {
      "vertices": [
        "174",
        "173",
        "365",
        "366"
      ],
      "normals": [
        "49",
        "46",
        "46",
        "49"
      ],
      "uvs": [
        "97",
        "91",
        "92",
        "98"
      ]
    },
    {
      "vertices": [
        "225",
        "194",
        "228",
        "385"
      ],
      "normals": [
        "7",
        "50",
        "50",
        "7"
      ],
      "uvs": [
        "13",
        "99",
        "100",
        "14"
      ]
    },
    {
      "vertices": [
        "137",
        "138",
        "329",
        "328"
      ],
      "normals": [
        "47",
        "51",
        "51",
        "47"
      ],
      "uvs": [
        "93",
        "101",
        "102",
        "94"
      ]
    },
    {
      "vertices": [
        "7",
        "8",
        "47",
        "48"
      ],
      "normals": [
        "48",
        "52",
        "52",
        "48"
      ],
      "uvs": [
        "95",
        "103",
        "104",
        "96"
      ]
    },
    {
      "vertices": [
        "175",
        "174",
        "366",
        "367"
      ],
      "normals": [
        "53",
        "49",
        "49",
        "53"
      ],
      "uvs": [
        "105",
        "97",
        "98",
        "106"
      ]
    },
    {
      "vertices": [
        "194",
        "195",
        "229",
        "228"
      ],
      "normals": [
        "50",
        "54",
        "54",
        "50"
      ],
      "uvs": [
        "99",
        "107",
        "108",
        "100"
      ]
    },
    {
      "vertices": [
        "98",
        "67",
        "260",
        "261"
      ],
      "normals": [
        "55",
        "10",
        "10",
        "55"
      ],
      "uvs": [
        "109",
        "19",
        "20",
        "110"
      ]
    },
    {
      "vertices": [
        "138",
        "139",
        "330",
        "329"
      ],
      "normals": [
        "51",
        "56",
        "56",
        "51"
      ],
      "uvs": [
        "101",
        "111",
        "112",
        "102"
      ]
    },
    {
      "vertices": [
        "8",
        "9",
        "46",
        "47"
      ],
      "normals": [
        "52",
        "57",
        "57",
        "52"
      ],
      "uvs": [
        "103",
        "113",
        "114",
        "104"
      ]
    },
    {
      "vertices": [
        "176",
        "175",
        "367",
        "368"
      ],
      "normals": [
        "58",
        "53",
        "53",
        "58"
      ],
      "uvs": [
        "115",
        "105",
        "106",
        "116"
      ]
    },
    {
      "vertices": [
        "195",
        "196",
        "230",
        "229"
      ],
      "normals": [
        "54",
        "59",
        "59",
        "54"
      ],
      "uvs": [
        "107",
        "117",
        "118",
        "108"
      ]
    },
    {
      "vertices": [
        "97",
        "98",
        "261",
        "262"
      ],
      "normals": [
        "60",
        "55",
        "55",
        "60"
      ],
      "uvs": [
        "119",
        "109",
        "110",
        "120"
      ]
    },
    {
      "vertices": [
        "139",
        "140",
        "331",
        "330"
      ],
      "normals": [
        "56",
        "61",
        "61",
        "56"
      ],
      "uvs": [
        "111",
        "121",
        "122",
        "112"
      ]
    },
    {
      "vertices": [
        "9",
        "10",
        "45",
        "46"
      ],
      "normals": [
        "57",
        "62",
        "62",
        "57"
      ],
      "uvs": [
        "113",
        "123",
        "124",
        "114"
      ]
    },
    {
      "vertices": [
        "177",
        "176",
        "368",
        "369"
      ],
      "normals": [
        "63",
        "58",
        "58",
        "63"
      ],
      "uvs": [
        "125",
        "115",
        "116",
        "126"
      ]
    },
    {
      "vertices": [
        "196",
        "197",
        "231",
        "230"
      ],
      "normals": [
        "59",
        "64",
        "64",
        "59"
      ],
      "uvs": [
        "117",
        "127",
        "128",
        "118"
      ]
    },
    {
      "vertices": [
        "96",
        "97",
        "262",
        "263"
      ],
      "normals": [
        "65",
        "60",
        "60",
        "65"
      ],
      "uvs": [
        "129",
        "119",
        "120",
        "130"
      ]
    },
    {
      "vertices": [
        "140",
        "141",
        "332",
        "331"
      ],
      "normals": [
        "61",
        "66",
        "66",
        "61"
      ],
      "uvs": [
        "121",
        "131",
        "132",
        "122"
      ]
    },
    {
      "vertices": [
        "10",
        "11",
        "44",
        "45"
      ],
      "normals": [
        "62",
        "67",
        "67",
        "62"
      ],
      "uvs": [
        "123",
        "133",
        "134",
        "124"
      ]
    },
    {
      "vertices": [
        "178",
        "177",
        "369",
        "370"
      ],
      "normals": [
        "68",
        "63",
        "63",
        "68"
      ],
      "uvs": [
        "135",
        "125",
        "126",
        "136"
      ]
    },
    {
      "vertices": [
        "197",
        "198",
        "232",
        "231"
      ],
      "normals": [
        "64",
        "69",
        "69",
        "64"
      ],
      "uvs": [
        "127",
        "137",
        "138",
        "128"
      ]
    },
    {
      "vertices": [
        "95",
        "96",
        "263",
        "264"
      ],
      "normals": [
        "70",
        "65",
        "65",
        "70"
      ],
      "uvs": [
        "139",
        "129",
        "130",
        "140"
      ]
    },
    {
      "vertices": [
        "141",
        "142",
        "333",
        "332"
      ],
      "normals": [
        "66",
        "71",
        "71",
        "66"
      ],
      "uvs": [
        "131",
        "141",
        "142",
        "132"
      ]
    },
    {
      "vertices": [
        "11",
        "12",
        "43",
        "44"
      ],
      "normals": [
        "67",
        "72",
        "72",
        "67"
      ],
      "uvs": [
        "133",
        "143",
        "144",
        "134"
      ]
    },
    {
      "vertices": [
        "179",
        "178",
        "370",
        "371"
      ],
      "normals": [
        "73",
        "68",
        "68",
        "73"
      ],
      "uvs": [
        "145",
        "135",
        "136",
        "146"
      ]
    },
    {
      "vertices": [
        "198",
        "199",
        "233",
        "232"
      ],
      "normals": [
        "69",
        "74",
        "74",
        "69"
      ],
      "uvs": [
        "137",
        "147",
        "148",
        "138"
      ]
    },
    {
      "vertices": [
        "94",
        "95",
        "264",
        "265"
      ],
      "normals": [
        "75",
        "70",
        "70",
        "75"
      ],
      "uvs": [
        "149",
        "139",
        "140",
        "150"
      ]
    },
    {
      "vertices": [
        "142",
        "143",
        "334",
        "333"
      ],
      "normals": [
        "71",
        "76",
        "76",
        "71"
      ],
      "uvs": [
        "141",
        "151",
        "152",
        "142"
      ]
    },
    {
      "vertices": [
        "12",
        "13",
        "42",
        "43"
      ],
      "normals": [
        "72",
        "77",
        "77",
        "72"
      ],
      "uvs": [
        "143",
        "153",
        "154",
        "144"
      ]
    },
    {
      "vertices": [
        "180",
        "179",
        "371",
        "372"
      ],
      "normals": [
        "78",
        "73",
        "73",
        "78"
      ],
      "uvs": [
        "155",
        "145",
        "146",
        "156"
      ]
    },
    {
      "vertices": [
        "199",
        "200",
        "234",
        "233"
      ],
      "normals": [
        "74",
        "79",
        "79",
        "74"
      ],
      "uvs": [
        "147",
        "157",
        "158",
        "148"
      ]
    },
    {
      "vertices": [
        "93",
        "94",
        "265",
        "266"
      ],
      "normals": [
        "80",
        "75",
        "75",
        "80"
      ],
      "uvs": [
        "159",
        "149",
        "150",
        "160"
      ]
    },
    {
      "vertices": [
        "143",
        "144",
        "335",
        "334"
      ],
      "normals": [
        "76",
        "81",
        "81",
        "76"
      ],
      "uvs": [
        "151",
        "161",
        "162",
        "152"
      ]
    },
    {
      "vertices": [
        "13",
        "14",
        "41",
        "42"
      ],
      "normals": [
        "77",
        "82",
        "82",
        "77"
      ],
      "uvs": [
        "153",
        "163",
        "164",
        "154"
      ]
    },
    {
      "vertices": [
        "181",
        "180",
        "372",
        "373"
      ],
      "normals": [
        "83",
        "78",
        "78",
        "83"
      ],
      "uvs": [
        "165",
        "155",
        "156",
        "166"
      ]
    },
    {
      "vertices": [
        "200",
        "201",
        "235",
        "234"
      ],
      "normals": [
        "79",
        "84",
        "84",
        "79"
      ],
      "uvs": [
        "157",
        "167",
        "168",
        "158"
      ]
    },
    {
      "vertices": [
        "92",
        "93",
        "266",
        "267"
      ],
      "normals": [
        "85",
        "80",
        "80",
        "85"
      ],
      "uvs": [
        "169",
        "159",
        "160",
        "170"
      ]
    },
    {
      "vertices": [
        "144",
        "145",
        "336",
        "335"
      ],
      "normals": [
        "81",
        "86",
        "86",
        "81"
      ],
      "uvs": [
        "161",
        "171",
        "172",
        "162"
      ]
    },
    {
      "vertices": [
        "14",
        "15",
        "40",
        "41"
      ],
      "normals": [
        "82",
        "87",
        "87",
        "82"
      ],
      "uvs": [
        "163",
        "173",
        "174",
        "164"
      ]
    },
    {
      "vertices": [
        "182",
        "181",
        "373",
        "374"
      ],
      "normals": [
        "88",
        "83",
        "83",
        "88"
      ],
      "uvs": [
        "175",
        "165",
        "166",
        "176"
      ]
    },
    {
      "vertices": [
        "201",
        "202",
        "236",
        "235"
      ],
      "normals": [
        "84",
        "89",
        "89",
        "84"
      ],
      "uvs": [
        "167",
        "177",
        "178",
        "168"
      ]
    },
    {
      "vertices": [
        "91",
        "92",
        "267",
        "268"
      ],
      "normals": [
        "90",
        "85",
        "85",
        "90"
      ],
      "uvs": [
        "179",
        "169",
        "170",
        "180"
      ]
    },
    {
      "vertices": [
        "145",
        "146",
        "337",
        "336"
      ],
      "normals": [
        "86",
        "91",
        "91",
        "86"
      ],
      "uvs": [
        "171",
        "181",
        "182",
        "172"
      ]
    },
    {
      "vertices": [
        "15",
        "16",
        "39",
        "40"
      ],
      "normals": [
        "87",
        "92",
        "92",
        "87"
      ],
      "uvs": [
        "173",
        "183",
        "184",
        "174"
      ]
    },
    {
      "vertices": [
        "183",
        "182",
        "374",
        "375"
      ],
      "normals": [
        "93",
        "88",
        "88",
        "93"
      ],
      "uvs": [
        "185",
        "175",
        "176",
        "186"
      ]
    },
    {
      "vertices": [
        "202",
        "203",
        "237",
        "236"
      ],
      "normals": [
        "89",
        "94",
        "94",
        "89"
      ],
      "uvs": [
        "177",
        "187",
        "188",
        "178"
      ]
    },
    {
      "vertices": [
        "90",
        "91",
        "268",
        "269"
      ],
      "normals": [
        "95",
        "90",
        "90",
        "95"
      ],
      "uvs": [
        "189",
        "179",
        "180",
        "190"
      ]
    },
    {
      "vertices": [
        "146",
        "147",
        "338",
        "337"
      ],
      "normals": [
        "91",
        "96",
        "96",
        "91"
      ],
      "uvs": [
        "181",
        "191",
        "192",
        "182"
      ]
    },
    {
      "vertices": [
        "16",
        "17",
        "38",
        "39"
      ],
      "normals": [
        "92",
        "97",
        "97",
        "92"
      ],
      "uvs": [
        "183",
        "193",
        "194",
        "184"
      ]
    },
    {
      "vertices": [
        "184",
        "183",
        "375",
        "376"
      ],
      "normals": [
        "98",
        "93",
        "93",
        "98"
      ],
      "uvs": [
        "195",
        "185",
        "186",
        "196"
      ]
    },
    {
      "vertices": [
        "203",
        "204",
        "238",
        "237"
      ],
      "normals": [
        "94",
        "99",
        "99",
        "94"
      ],
      "uvs": [
        "187",
        "197",
        "198",
        "188"
      ]
    },
    {
      "vertices": [
        "89",
        "90",
        "269",
        "270"
      ],
      "normals": [
        "100",
        "95",
        "95",
        "100"
      ],
      "uvs": [
        "199",
        "189",
        "190",
        "200"
      ]
    },
    {
      "vertices": [
        "147",
        "148",
        "339",
        "338"
      ],
      "normals": [
        "96",
        "101",
        "101",
        "96"
      ],
      "uvs": [
        "191",
        "201",
        "202",
        "192"
      ]
    },
    {
      "vertices": [
        "17",
        "18",
        "37",
        "38"
      ],
      "normals": [
        "97",
        "102",
        "102",
        "97"
      ],
      "uvs": [
        "193",
        "203",
        "204",
        "194"
      ]
    },
    {
      "vertices": [
        "185",
        "184",
        "376",
        "377"
      ],
      "normals": [
        "103",
        "98",
        "98",
        "103"
      ],
      "uvs": [
        "205",
        "195",
        "196",
        "206"
      ]
    },
    {
      "vertices": [
        "204",
        "205",
        "239",
        "238"
      ],
      "normals": [
        "99",
        "104",
        "104",
        "99"
      ],
      "uvs": [
        "197",
        "207",
        "208",
        "198"
      ]
    },
    {
      "vertices": [
        "88",
        "89",
        "270",
        "271"
      ],
      "normals": [
        "105",
        "100",
        "100",
        "105"
      ],
      "uvs": [
        "209",
        "199",
        "200",
        "210"
      ]
    },
    {
      "vertices": [
        "148",
        "149",
        "340",
        "339"
      ],
      "normals": [
        "101",
        "106",
        "106",
        "101"
      ],
      "uvs": [
        "201",
        "211",
        "212",
        "202"
      ]
    },
    {
      "vertices": [
        "18",
        "19",
        "36",
        "37"
      ],
      "normals": [
        "102",
        "107",
        "107",
        "102"
      ],
      "uvs": [
        "203",
        "213",
        "214",
        "204"
      ]
    },
    {
      "vertices": [
        "186",
        "185",
        "377",
        "378"
      ],
      "normals": [
        "108",
        "103",
        "103",
        "108"
      ],
      "uvs": [
        "215",
        "205",
        "206",
        "216"
      ]
    },
    {
      "vertices": [
        "205",
        "206",
        "240",
        "239"
      ],
      "normals": [
        "104",
        "109",
        "109",
        "104"
      ],
      "uvs": [
        "207",
        "217",
        "218",
        "208"
      ]
    },
    {
      "vertices": [
        "87",
        "88",
        "271",
        "272"
      ],
      "normals": [
        "110",
        "105",
        "105",
        "110"
      ],
      "uvs": [
        "219",
        "209",
        "210",
        "220"
      ]
    },
    {
      "vertices": [
        "149",
        "150",
        "341",
        "340"
      ],
      "normals": [
        "106",
        "111",
        "111",
        "106"
      ],
      "uvs": [
        "211",
        "221",
        "222",
        "212"
      ]
    },
    {
      "vertices": [
        "19",
        "20",
        "35",
        "36"
      ],
      "normals": [
        "107",
        "112",
        "112",
        "107"
      ],
      "uvs": [
        "213",
        "223",
        "224",
        "214"
      ]
    },
    {
      "vertices": [
        "187",
        "186",
        "378",
        "379"
      ],
      "normals": [
        "113",
        "108",
        "108",
        "113"
      ],
      "uvs": [
        "225",
        "215",
        "216",
        "226"
      ]
    },
    {
      "vertices": [
        "206",
        "207",
        "241",
        "240"
      ],
      "normals": [
        "109",
        "114",
        "114",
        "109"
      ],
      "uvs": [
        "217",
        "227",
        "228",
        "218"
      ]
    },
    {
      "vertices": [
        "86",
        "87",
        "272",
        "273"
      ],
      "normals": [
        "115",
        "110",
        "110",
        "115"
      ],
      "uvs": [
        "229",
        "219",
        "220",
        "230"
      ]
    },
    {
      "vertices": [
        "150",
        "151",
        "342",
        "341"
      ],
      "normals": [
        "111",
        "116",
        "116",
        "111"
      ],
      "uvs": [
        "221",
        "231",
        "232",
        "222"
      ]
    },
    {
      "vertices": [
        "20",
        "21",
        "62",
        "35"
      ],
      "normals": [
        "112",
        "117",
        "117",
        "112"
      ],
      "uvs": [
        "223",
        "233",
        "234",
        "224"
      ]
    },
    {
      "vertices": [
        "188",
        "187",
        "379",
        "380"
      ],
      "normals": [
        "118",
        "113",
        "113",
        "118"
      ],
      "uvs": [
        "235",
        "225",
        "226",
        "236"
      ]
    },
    {
      "vertices": [
        "99",
        "130",
        "322",
        "64"
      ],
      "normals": [
        "30",
        "119",
        "119",
        "30"
      ],
      "uvs": [
        "59",
        "237",
        "238",
        "60"
      ]
    },
    {
      "vertices": [
        "207",
        "208",
        "242",
        "241"
      ],
      "normals": [
        "114",
        "120",
        "120",
        "114"
      ],
      "uvs": [
        "227",
        "239",
        "240",
        "228"
      ]
    },
    {
      "vertices": [
        "85",
        "86",
        "273",
        "274"
      ],
      "normals": [
        "121",
        "115",
        "115",
        "121"
      ],
      "uvs": [
        "241",
        "229",
        "230",
        "242"
      ]
    },
    {
      "vertices": [
        "151",
        "152",
        "343",
        "342"
      ],
      "normals": [
        "116",
        "122",
        "122",
        "116"
      ],
      "uvs": [
        "231",
        "243",
        "244",
        "232"
      ]
    },
    {
      "vertices": [
        "21",
        "22",
        "61",
        "62"
      ],
      "normals": [
        "117",
        "123",
        "123",
        "117"
      ],
      "uvs": [
        "233",
        "245",
        "246",
        "234"
      ]
    },
    {
      "vertices": [
        "189",
        "188",
        "380",
        "381"
      ],
      "normals": [
        "124",
        "118",
        "118",
        "124"
      ],
      "uvs": [
        "247",
        "235",
        "236",
        "248"
      ]
    },
    {
      "vertices": [
        "130",
        "129",
        "321",
        "322"
      ],
      "normals": [
        "119",
        "125",
        "125",
        "119"
      ],
      "uvs": [
        "237",
        "249",
        "250",
        "238"
      ]
    },
    {
      "vertices": [
        "208",
        "209",
        "243",
        "242"
      ],
      "normals": [
        "120",
        "126",
        "126",
        "120"
      ],
      "uvs": [
        "239",
        "251",
        "252",
        "240"
      ]
    },
    {
      "vertices": [
        "84",
        "85",
        "274",
        "275"
      ],
      "normals": [
        "127",
        "121",
        "121",
        "127"
      ],
      "uvs": [
        "253",
        "241",
        "242",
        "254"
      ]
    },
    {
      "vertices": [
        "152",
        "153",
        "344",
        "343"
      ],
      "normals": [
        "122",
        "128",
        "128",
        "122"
      ],
      "uvs": [
        "243",
        "255",
        "256",
        "244"
      ]
    },
    {
      "vertices": [
        "22",
        "23",
        "60",
        "61"
      ],
      "normals": [
        "123",
        "129",
        "129",
        "123"
      ],
      "uvs": [
        "245",
        "257",
        "258",
        "246"
      ]
    },
    {
      "vertices": [
        "190",
        "189",
        "381",
        "382"
      ],
      "normals": [
        "130",
        "124",
        "124",
        "130"
      ],
      "uvs": [
        "259",
        "247",
        "248",
        "260"
      ]
    },
    {
      "vertices": [
        "129",
        "128",
        "320",
        "321"
      ],
      "normals": [
        "125",
        "131",
        "131",
        "125"
      ],
      "uvs": [
        "249",
        "261",
        "262",
        "250"
      ]
    },
    {
      "vertices": [
        "209",
        "210",
        "244",
        "243"
      ],
      "normals": [
        "126",
        "132",
        "132",
        "126"
      ],
      "uvs": [
        "251",
        "263",
        "264",
        "252"
      ]
    },
    {
      "vertices": [
        "83",
        "84",
        "275",
        "276"
      ],
      "normals": [
        "133",
        "127",
        "127",
        "133"
      ],
      "uvs": [
        "265",
        "253",
        "254",
        "266"
      ]
    },
    {
      "vertices": [
        "153",
        "154",
        "345",
        "344"
      ],
      "normals": [
        "128",
        "134",
        "134",
        "128"
      ],
      "uvs": [
        "255",
        "267",
        "268",
        "256"
      ]
    },
    {
      "vertices": [
        "23",
        "24",
        "59",
        "60"
      ],
      "normals": [
        "129",
        "135",
        "135",
        "129"
      ],
      "uvs": [
        "257",
        "269",
        "270",
        "258"
      ]
    },
    {
      "vertices": [
        "191",
        "190",
        "382",
        "383"
      ],
      "normals": [
        "136",
        "130",
        "130",
        "136"
      ],
      "uvs": [
        "271",
        "259",
        "260",
        "272"
      ]
    },
    {
      "vertices": [
        "128",
        "127",
        "319",
        "320"
      ],
      "normals": [
        "131",
        "137",
        "137",
        "131"
      ],
      "uvs": [
        "261",
        "273",
        "274",
        "262"
      ]
    },
    {
      "vertices": [
        "210",
        "211",
        "245",
        "244"
      ],
      "normals": [
        "132",
        "138",
        "138",
        "132"
      ],
      "uvs": [
        "263",
        "275",
        "276",
        "264"
      ]
    },
    {
      "vertices": [
        "82",
        "83",
        "276",
        "277"
      ],
      "normals": [
        "139",
        "133",
        "133",
        "139"
      ],
      "uvs": [
        "277",
        "265",
        "266",
        "278"
      ]
    },
    {
      "vertices": [
        "154",
        "155",
        "346",
        "345"
      ],
      "normals": [
        "134",
        "140",
        "140",
        "134"
      ],
      "uvs": [
        "267",
        "279",
        "280",
        "268"
      ]
    },
    {
      "vertices": [
        "24",
        "25",
        "58",
        "59"
      ],
      "normals": [
        "135",
        "141",
        "141",
        "135"
      ],
      "uvs": [
        "269",
        "281",
        "282",
        "270"
      ]
    },
    {
      "vertices": [
        "192",
        "191",
        "383",
        "384"
      ],
      "normals": [
        "142",
        "136",
        "136",
        "142"
      ],
      "uvs": [
        "283",
        "271",
        "272",
        "284"
      ]
    },
    {
      "vertices": [
        "127",
        "126",
        "318",
        "319"
      ],
      "normals": [
        "137",
        "143",
        "143",
        "137"
      ],
      "uvs": [
        "273",
        "285",
        "286",
        "274"
      ]
    },
    {
      "vertices": [
        "211",
        "212",
        "246",
        "245"
      ],
      "normals": [
        "138",
        "144",
        "144",
        "138"
      ],
      "uvs": [
        "275",
        "287",
        "288",
        "276"
      ]
    },
    {
      "vertices": [
        "81",
        "82",
        "277",
        "278"
      ],
      "normals": [
        "145",
        "139",
        "139",
        "145"
      ],
      "uvs": [
        "289",
        "277",
        "278",
        "290"
      ]
    },
    {
      "vertices": [
        "155",
        "156",
        "347",
        "346"
      ],
      "normals": [
        "140",
        "146",
        "146",
        "140"
      ],
      "uvs": [
        "279",
        "291",
        "292",
        "280"
      ]
    },
    {
      "vertices": [
        "25",
        "26",
        "57",
        "58"
      ],
      "normals": [
        "141",
        "147",
        "147",
        "141"
      ],
      "uvs": [
        "281",
        "293",
        "294",
        "282"
      ]
    },
    {
      "vertices": [
        "193",
        "192",
        "384",
        "227"
      ],
      "normals": [
        "19",
        "142",
        "142",
        "19"
      ],
      "uvs": [
        "36",
        "283",
        "284",
        "37"
      ]
    },
    {
      "vertices": [
        "126",
        "125",
        "317",
        "318"
      ],
      "normals": [
        "143",
        "148",
        "148",
        "143"
      ],
      "uvs": [
        "285",
        "295",
        "296",
        "286"
      ]
    },
    {
      "vertices": [
        "212",
        "213",
        "247",
        "246"
      ],
      "normals": [
        "144",
        "149",
        "149",
        "144"
      ],
      "uvs": [
        "287",
        "297",
        "298",
        "288"
      ]
    },
    {
      "vertices": [
        "80",
        "81",
        "278",
        "279"
      ],
      "normals": [
        "150",
        "145",
        "145",
        "150"
      ],
      "uvs": [
        "299",
        "289",
        "290",
        "300"
      ]
    },
    {
      "vertices": [
        "156",
        "157",
        "348",
        "347"
      ],
      "normals": [
        "146",
        "151",
        "151",
        "146"
      ],
      "uvs": [
        "291",
        "301",
        "302",
        "292"
      ]
    },
    {
      "vertices": [
        "26",
        "27",
        "56",
        "57"
      ],
      "normals": [
        "147",
        "152",
        "152",
        "147"
      ],
      "uvs": [
        "293",
        "303",
        "304",
        "294"
      ]
    },
    {
      "vertices": [
        "125",
        "124",
        "316",
        "317"
      ],
      "normals": [
        "148",
        "153",
        "153",
        "148"
      ],
      "uvs": [
        "295",
        "305",
        "306",
        "296"
      ]
    },
    {
      "vertices": [
        "213",
        "214",
        "248",
        "247"
      ],
      "normals": [
        "149",
        "154",
        "154",
        "149"
      ],
      "uvs": [
        "297",
        "307",
        "308",
        "298"
      ]
    },
    {
      "vertices": [
        "79",
        "80",
        "279",
        "280"
      ],
      "normals": [
        "155",
        "150",
        "150",
        "155"
      ],
      "uvs": [
        "309",
        "299",
        "300",
        "310"
      ]
    },
    {
      "vertices": [
        "157",
        "158",
        "349",
        "348"
      ],
      "normals": [
        "151",
        "156",
        "156",
        "151"
      ],
      "uvs": [
        "301",
        "311",
        "312",
        "302"
      ]
    },
    {
      "vertices": [
        "27",
        "28",
        "55",
        "56"
      ],
      "normals": [
        "152",
        "157",
        "157",
        "152"
      ],
      "uvs": [
        "303",
        "313",
        "314",
        "304"
      ]
    },
    {
      "vertices": [
        "124",
        "123",
        "315",
        "316"
      ],
      "normals": [
        "153",
        "158",
        "158",
        "153"
      ],
      "uvs": [
        "305",
        "315",
        "316",
        "306"
      ]
    },
    {
      "vertices": [
        "214",
        "215",
        "249",
        "248"
      ],
      "normals": [
        "154",
        "159",
        "159",
        "154"
      ],
      "uvs": [
        "307",
        "317",
        "318",
        "308"
      ]
    },
    {
      "vertices": [
        "78",
        "79",
        "280",
        "281"
      ],
      "normals": [
        "160",
        "155",
        "155",
        "160"
      ],
      "uvs": [
        "319",
        "309",
        "310",
        "320"
      ]
    },
    {
      "vertices": [
        "158",
        "159",
        "350",
        "349"
      ],
      "normals": [
        "156",
        "161",
        "161",
        "156"
      ],
      "uvs": [
        "311",
        "321",
        "322",
        "312"
      ]
    },
    {
      "vertices": [
        "28",
        "29",
        "54",
        "55"
      ],
      "normals": [
        "157",
        "162",
        "162",
        "157"
      ],
      "uvs": [
        "313",
        "323",
        "324",
        "314"
      ]
    },
    {
      "vertices": [
        "123",
        "122",
        "314",
        "315"
      ],
      "normals": [
        "158",
        "163",
        "163",
        "158"
      ],
      "uvs": [
        "315",
        "325",
        "326",
        "316"
      ]
    },
    {
      "vertices": [
        "215",
        "216",
        "250",
        "249"
      ],
      "normals": [
        "159",
        "164",
        "164",
        "159"
      ],
      "uvs": [
        "317",
        "327",
        "328",
        "318"
      ]
    },
    {
      "vertices": [
        "77",
        "78",
        "281",
        "282"
      ],
      "normals": [
        "165",
        "160",
        "160",
        "165"
      ],
      "uvs": [
        "329",
        "319",
        "320",
        "330"
      ]
    },
    {
      "vertices": [
        "159",
        "160",
        "351",
        "350"
      ],
      "normals": [
        "161",
        "166",
        "166",
        "161"
      ],
      "uvs": [
        "321",
        "331",
        "332",
        "322"
      ]
    },
    {
      "vertices": [
        "29",
        "30",
        "53",
        "54"
      ],
      "normals": [
        "162",
        "167",
        "167",
        "162"
      ],
      "uvs": [
        "323",
        "333",
        "334",
        "324"
      ]
    },
    {
      "vertices": [
        "122",
        "121",
        "313",
        "314"
      ],
      "normals": [
        "163",
        "168",
        "168",
        "163"
      ],
      "uvs": [
        "325",
        "335",
        "336",
        "326"
      ]
    },
    {
      "vertices": [
        "216",
        "217",
        "251",
        "250"
      ],
      "normals": [
        "164",
        "169",
        "169",
        "164"
      ],
      "uvs": [
        "327",
        "337",
        "338",
        "328"
      ]
    },
    {
      "vertices": [
        "76",
        "77",
        "282",
        "283"
      ],
      "normals": [
        "170",
        "165",
        "165",
        "170"
      ],
      "uvs": [
        "339",
        "329",
        "330",
        "340"
      ]
    },
    {
      "vertices": [
        "160",
        "161",
        "352",
        "351"
      ],
      "normals": [
        "166",
        "171",
        "171",
        "166"
      ],
      "uvs": [
        "331",
        "341",
        "342",
        "332"
      ]
    },
    {
      "vertices": [
        "30",
        "31",
        "52",
        "53"
      ],
      "normals": [
        "167",
        "172",
        "172",
        "167"
      ],
      "uvs": [
        "333",
        "343",
        "344",
        "334"
      ]
    },
    {
      "vertices": [
        "121",
        "120",
        "312",
        "313"
      ],
      "normals": [
        "168",
        "173",
        "173",
        "168"
      ],
      "uvs": [
        "335",
        "345",
        "346",
        "336"
      ]
    },
    {
      "vertices": [
        "217",
        "218",
        "252",
        "251"
      ],
      "normals": [
        "169",
        "174",
        "174",
        "169"
      ],
      "uvs": [
        "337",
        "347",
        "348",
        "338"
      ]
    },
    {
      "vertices": [
        "75",
        "76",
        "283",
        "284"
      ],
      "normals": [
        "175",
        "170",
        "170",
        "175"
      ],
      "uvs": [
        "349",
        "339",
        "340",
        "350"
      ]
    },
    {
      "vertices": [
        "161",
        "162",
        "353",
        "352"
      ],
      "normals": [
        "171",
        "176",
        "176",
        "171"
      ],
      "uvs": [
        "341",
        "351",
        "352",
        "342"
      ]
    },
    {
      "vertices": [
        "31",
        "32",
        "51",
        "52"
      ],
      "normals": [
        "172",
        "177",
        "177",
        "172"
      ],
      "uvs": [
        "343",
        "353",
        "354",
        "344"
      ]
    },
    {
      "vertices": [
        "120",
        "119",
        "311",
        "312"
      ],
      "normals": [
        "173",
        "178",
        "178",
        "173"
      ],
      "uvs": [
        "345",
        "355",
        "356",
        "346"
      ]
    },
    {
      "vertices": [
        "218",
        "219",
        "253",
        "252"
      ],
      "normals": [
        "174",
        "179",
        "179",
        "174"
      ],
      "uvs": [
        "347",
        "357",
        "358",
        "348"
      ]
    },
    {
      "vertices": [
        "74",
        "75",
        "284",
        "285"
      ],
      "normals": [
        "180",
        "175",
        "175",
        "180"
      ],
      "uvs": [
        "359",
        "349",
        "350",
        "360"
      ]
    },
    {
      "vertices": [
        "162",
        "131",
        "259",
        "353"
      ],
      "normals": [
        "176",
        "32",
        "32",
        "176"
      ],
      "uvs": [
        "351",
        "63",
        "66",
        "352"
      ]
    },
    {
      "vertices": [
        "32",
        "33",
        "50",
        "51"
      ],
      "normals": [
        "177",
        "181",
        "181",
        "177"
      ],
      "uvs": [
        "353",
        "361",
        "362",
        "354"
      ]
    },
    {
      "vertices": [
        "119",
        "118",
        "310",
        "311"
      ],
      "normals": [
        "178",
        "182",
        "182",
        "178"
      ],
      "uvs": [
        "355",
        "363",
        "364",
        "356"
      ]
    },
    {
      "vertices": [
        "219",
        "220",
        "254",
        "253"
      ],
      "normals": [
        "179",
        "183",
        "183",
        "179"
      ],
      "uvs": [
        "357",
        "365",
        "366",
        "358"
      ]
    },
    {
      "vertices": [
        "73",
        "74",
        "285",
        "286"
      ],
      "normals": [
        "184",
        "180",
        "180",
        "184"
      ],
      "uvs": [
        "367",
        "359",
        "360",
        "368"
      ]
    },
    {
      "vertices": [
        "33",
        "34",
        "226",
        "50"
      ],
      "normals": [
        "181",
        "185",
        "185",
        "181"
      ],
      "uvs": [
        "361",
        "369",
        "370",
        "362"
      ]
    },
    {
      "vertices": [
        "118",
        "117",
        "309",
        "310"
      ],
      "normals": [
        "182",
        "186",
        "186",
        "182"
      ],
      "uvs": [
        "363",
        "371",
        "372",
        "364"
      ]
    },
    {
      "vertices": [
        "220",
        "221",
        "255",
        "254"
      ],
      "normals": [
        "183",
        "187",
        "187",
        "183"
      ],
      "uvs": [
        "365",
        "373",
        "374",
        "366"
      ]
    },
    {
      "vertices": [
        "72",
        "73",
        "286",
        "287"
      ],
      "normals": [
        "188",
        "184",
        "184",
        "188"
      ],
      "uvs": [
        "375",
        "367",
        "368",
        "376"
      ]
    },
    {
      "vertices": [
        "34",
        "3",
        "65",
        "226"
      ],
      "normals": [
        "185",
        "36",
        "36",
        "185"
      ],
      "uvs": [
        "369",
        "71",
        "74",
        "370"
      ]
    },
    {
      "vertices": [
        "117",
        "116",
        "308",
        "309"
      ],
      "normals": [
        "186",
        "189",
        "189",
        "186"
      ],
      "uvs": [
        "371",
        "377",
        "378",
        "372"
      ]
    },
    {
      "vertices": [
        "221",
        "222",
        "256",
        "255"
      ],
      "normals": [
        "187",
        "190",
        "190",
        "187"
      ],
      "uvs": [
        "373",
        "379",
        "380",
        "374"
      ]
    },
    {
      "vertices": [
        "71",
        "72",
        "287",
        "288"
      ],
      "normals": [
        "191",
        "188",
        "188",
        "191"
      ],
      "uvs": [
        "381",
        "375",
        "376",
        "382"
      ]
    },
    {
      "vertices": [
        "116",
        "115",
        "307",
        "308"
      ],
      "normals": [
        "189",
        "192",
        "192",
        "189"
      ],
      "uvs": [
        "377",
        "383",
        "384",
        "378"
      ]
    },
    {
      "vertices": [
        "222",
        "223",
        "257",
        "256"
      ],
      "normals": [
        "190",
        "1",
        "1",
        "190"
      ],
      "uvs": [
        "379",
        "1",
        "4",
        "380"
      ]
    },
    {
      "vertices": [
        "70",
        "71",
        "288",
        "289"
      ],
      "normals": [
        "4",
        "191",
        "191",
        "4"
      ],
      "uvs": [
        "6",
        "381",
        "382",
        "7"
      ]
    },
    {
      "vertices": [
        "115",
        "114",
        "306",
        "307"
      ],
      "normals": [
        "192",
        "5",
        "5",
        "192"
      ],
      "uvs": [
        "383",
        "9",
        "12",
        "384"
      ]
    },
    {
      "vertices": [
        "608",
        "642",
        "643",
        "609"
      ],
      "normals": [
        "193",
        "193",
        "194",
        "194"
      ],
      "uvs": [
        "385",
        "386",
        "387",
        "388"
      ]
    },
    {
      "vertices": [
        "454",
        "675",
        "674",
        "455"
      ],
      "normals": [
        "195",
        "195",
        "196",
        "196"
      ],
      "uvs": [
        "389",
        "390",
        "391",
        "392"
      ]
    },
    {
      "vertices": [
        "499",
        "691",
        "690",
        "498"
      ],
      "normals": [
        "197",
        "197",
        "198",
        "198"
      ],
      "uvs": [
        "393",
        "394",
        "395",
        "396"
      ]
    },
    {
      "vertices": [
        "609",
        "643",
        "770",
        "610"
      ],
      "normals": [
        "194",
        "194",
        "199",
        "199"
      ],
      "uvs": [
        "388",
        "387",
        "397",
        "398"
      ]
    },
    {
      "vertices": [
        "453",
        "676",
        "675",
        "454"
      ],
      "normals": [
        "200",
        "200",
        "195",
        "195"
      ],
      "uvs": [
        "399",
        "400",
        "390",
        "389"
      ]
    },
    {
      "vertices": [
        "498",
        "690",
        "689",
        "497"
      ],
      "normals": [
        "198",
        "198",
        "201",
        "201"
      ],
      "uvs": [
        "396",
        "395",
        "401",
        "402"
      ]
    },
    {
      "vertices": [
        "452",
        "645",
        "676",
        "453"
      ],
      "normals": [
        "202",
        "202",
        "200",
        "200"
      ],
      "uvs": [
        "403",
        "404",
        "400",
        "399"
      ]
    },
    {
      "vertices": [
        "497",
        "689",
        "688",
        "496"
      ],
      "normals": [
        "201",
        "201",
        "203",
        "203"
      ],
      "uvs": [
        "402",
        "401",
        "405",
        "406"
      ]
    },
    {
      "vertices": [
        "496",
        "688",
        "687",
        "495"
      ],
      "normals": [
        "203",
        "203",
        "204",
        "204"
      ],
      "uvs": [
        "406",
        "405",
        "407",
        "408"
      ]
    },
    {
      "vertices": [
        "495",
        "687",
        "686",
        "494"
      ],
      "normals": [
        "204",
        "204",
        "205",
        "205"
      ],
      "uvs": [
        "408",
        "407",
        "409",
        "410"
      ]
    },
    {
      "vertices": [
        "494",
        "686",
        "685",
        "493"
      ],
      "normals": [
        "205",
        "205",
        "206",
        "206"
      ],
      "uvs": [
        "410",
        "409",
        "411",
        "412"
      ]
    },
    {
      "vertices": [
        "493",
        "685",
        "684",
        "492"
      ],
      "normals": [
        "206",
        "206",
        "207",
        "207"
      ],
      "uvs": [
        "412",
        "411",
        "413",
        "414"
      ]
    },
    {
      "vertices": [
        "492",
        "684",
        "683",
        "491"
      ],
      "normals": [
        "207",
        "207",
        "208",
        "208"
      ],
      "uvs": [
        "414",
        "413",
        "415",
        "416"
      ]
    },
    {
      "vertices": [
        "491",
        "683",
        "682",
        "490"
      ],
      "normals": [
        "208",
        "208",
        "209",
        "209"
      ],
      "uvs": [
        "416",
        "415",
        "417",
        "418"
      ]
    },
    {
      "vertices": [
        "387",
        "739",
        "612",
        "578"
      ],
      "normals": [
        "210",
        "210",
        "211",
        "211"
      ],
      "uvs": [
        "419",
        "420",
        "421",
        "422"
      ]
    },
    {
      "vertices": [
        "490",
        "682",
        "681",
        "489"
      ],
      "normals": [
        "209",
        "209",
        "212",
        "212"
      ],
      "uvs": [
        "418",
        "417",
        "423",
        "424"
      ]
    },
    {
      "vertices": [
        "548",
        "740",
        "739",
        "387"
      ],
      "normals": [
        "213",
        "213",
        "210",
        "210"
      ],
      "uvs": [
        "425",
        "426",
        "420",
        "419"
      ]
    },
    {
      "vertices": [
        "489",
        "681",
        "680",
        "488"
      ],
      "normals": [
        "212",
        "212",
        "214",
        "214"
      ],
      "uvs": [
        "424",
        "423",
        "427",
        "428"
      ]
    },
    {
      "vertices": [
        "549",
        "741",
        "740",
        "548"
      ],
      "normals": [
        "215",
        "215",
        "213",
        "213"
      ],
      "uvs": [
        "429",
        "430",
        "426",
        "425"
      ]
    },
    {
      "vertices": [
        "488",
        "680",
        "679",
        "487"
      ],
      "normals": [
        "214",
        "214",
        "216",
        "216"
      ],
      "uvs": [
        "428",
        "427",
        "431",
        "432"
      ]
    },
    {
      "vertices": [
        "550",
        "742",
        "741",
        "549"
      ],
      "normals": [
        "217",
        "217",
        "215",
        "215"
      ],
      "uvs": [
        "433",
        "434",
        "430",
        "429"
      ]
    },
    {
      "vertices": [
        "487",
        "679",
        "678",
        "486"
      ],
      "normals": [
        "216",
        "216",
        "218",
        "218"
      ],
      "uvs": [
        "432",
        "431",
        "435",
        "436"
      ]
    },
    {
      "vertices": [
        "551",
        "743",
        "742",
        "550"
      ],
      "normals": [
        "219",
        "219",
        "217",
        "217"
      ],
      "uvs": [
        "437",
        "438",
        "434",
        "433"
      ]
    },
    {
      "vertices": [
        "486",
        "678",
        "677",
        "485"
      ],
      "normals": [
        "218",
        "218",
        "220",
        "220"
      ],
      "uvs": [
        "436",
        "435",
        "439",
        "440"
      ]
    },
    {
      "vertices": [
        "552",
        "744",
        "743",
        "551"
      ],
      "normals": [
        "221",
        "221",
        "219",
        "219"
      ],
      "uvs": [
        "441",
        "442",
        "438",
        "437"
      ]
    },
    {
      "vertices": [
        "485",
        "677",
        "449",
        "484"
      ],
      "normals": [
        "220",
        "220",
        "222",
        "222"
      ],
      "uvs": [
        "440",
        "439",
        "443",
        "444"
      ]
    },
    {
      "vertices": [
        "553",
        "745",
        "744",
        "552"
      ],
      "normals": [
        "223",
        "223",
        "221",
        "221"
      ],
      "uvs": [
        "445",
        "446",
        "442",
        "441"
      ]
    },
    {
      "vertices": [
        "516",
        "644",
        "708",
        "517"
      ],
      "normals": [
        "224",
        "224",
        "225",
        "225"
      ],
      "uvs": [
        "447",
        "448",
        "449",
        "450"
      ]
    },
    {
      "vertices": [
        "554",
        "746",
        "745",
        "553"
      ],
      "normals": [
        "226",
        "226",
        "223",
        "223"
      ],
      "uvs": [
        "451",
        "452",
        "446",
        "445"
      ]
    },
    {
      "vertices": [
        "517",
        "708",
        "709",
        "518"
      ],
      "normals": [
        "225",
        "225",
        "227",
        "227"
      ],
      "uvs": [
        "450",
        "449",
        "453",
        "454"
      ]
    },
    {
      "vertices": [
        "388",
        "450",
        "451",
        "389"
      ],
      "normals": [
        "228",
        "228",
        "229",
        "229"
      ],
      "uvs": [
        "455",
        "456",
        "457",
        "458"
      ]
    },
    {
      "vertices": [
        "555",
        "747",
        "746",
        "554"
      ],
      "normals": [
        "230",
        "230",
        "226",
        "226"
      ],
      "uvs": [
        "459",
        "460",
        "452",
        "451"
      ]
    },
    {
      "vertices": [
        "518",
        "709",
        "710",
        "519"
      ],
      "normals": [
        "227",
        "227",
        "231",
        "231"
      ],
      "uvs": [
        "454",
        "453",
        "461",
        "462"
      ]
    },
    {
      "vertices": [
        "556",
        "748",
        "747",
        "555"
      ],
      "normals": [
        "232",
        "232",
        "230",
        "230"
      ],
      "uvs": [
        "463",
        "464",
        "460",
        "459"
      ]
    },
    {
      "vertices": [
        "519",
        "710",
        "711",
        "520"
      ],
      "normals": [
        "231",
        "231",
        "233",
        "233"
      ],
      "uvs": [
        "462",
        "461",
        "465",
        "466"
      ]
    },
    {
      "vertices": [
        "389",
        "451",
        "448",
        "390"
      ],
      "normals": [
        "229",
        "229",
        "234",
        "234"
      ],
      "uvs": [
        "458",
        "457",
        "467",
        "468"
      ]
    },
    {
      "vertices": [
        "557",
        "749",
        "748",
        "556"
      ],
      "normals": [
        "235",
        "235",
        "232",
        "232"
      ],
      "uvs": [
        "469",
        "470",
        "464",
        "463"
      ]
    },
    {
      "vertices": [
        "520",
        "711",
        "712",
        "521"
      ],
      "normals": [
        "233",
        "233",
        "236",
        "236"
      ],
      "uvs": [
        "466",
        "465",
        "471",
        "472"
      ]
    },
    {
      "vertices": [
        "390",
        "448",
        "434",
        "391"
      ],
      "normals": [
        "234",
        "234",
        "237",
        "237"
      ],
      "uvs": [
        "468",
        "467",
        "473",
        "474"
      ]
    },
    {
      "vertices": [
        "558",
        "750",
        "749",
        "557"
      ],
      "normals": [
        "238",
        "238",
        "235",
        "235"
      ],
      "uvs": [
        "475",
        "476",
        "470",
        "469"
      ]
    },
    {
      "vertices": [
        "521",
        "712",
        "713",
        "522"
      ],
      "normals": [
        "236",
        "236",
        "239",
        "239"
      ],
      "uvs": [
        "472",
        "471",
        "477",
        "478"
      ]
    },
    {
      "vertices": [
        "391",
        "434",
        "433",
        "392"
      ],
      "normals": [
        "237",
        "237",
        "240",
        "240"
      ],
      "uvs": [
        "474",
        "473",
        "479",
        "480"
      ]
    },
    {
      "vertices": [
        "559",
        "751",
        "750",
        "558"
      ],
      "normals": [
        "241",
        "241",
        "238",
        "238"
      ],
      "uvs": [
        "481",
        "482",
        "476",
        "475"
      ]
    },
    {
      "vertices": [
        "610",
        "770",
        "613",
        "579"
      ],
      "normals": [
        "199",
        "199",
        "242",
        "242"
      ],
      "uvs": [
        "398",
        "397",
        "483",
        "484"
      ]
    },
    {
      "vertices": [
        "522",
        "713",
        "714",
        "523"
      ],
      "normals": [
        "239",
        "239",
        "243",
        "243"
      ],
      "uvs": [
        "478",
        "477",
        "485",
        "486"
      ]
    },
    {
      "vertices": [
        "392",
        "433",
        "432",
        "393"
      ],
      "normals": [
        "240",
        "240",
        "244",
        "244"
      ],
      "uvs": [
        "480",
        "479",
        "487",
        "488"
      ]
    },
    {
      "vertices": [
        "560",
        "752",
        "751",
        "559"
      ],
      "normals": [
        "245",
        "245",
        "241",
        "241"
      ],
      "uvs": [
        "489",
        "490",
        "482",
        "481"
      ]
    },
    {
      "vertices": [
        "579",
        "613",
        "614",
        "580"
      ],
      "normals": [
        "242",
        "242",
        "246",
        "246"
      ],
      "uvs": [
        "484",
        "483",
        "491",
        "492"
      ]
    },
    {
      "vertices": [
        "483",
        "646",
        "645",
        "452"
      ],
      "normals": [
        "247",
        "247",
        "202",
        "202"
      ],
      "uvs": [
        "493",
        "494",
        "404",
        "403"
      ]
    },
    {
      "vertices": [
        "523",
        "714",
        "715",
        "524"
      ],
      "normals": [
        "243",
        "243",
        "248",
        "248"
      ],
      "uvs": [
        "486",
        "485",
        "495",
        "496"
      ]
    },
    {
      "vertices": [
        "393",
        "432",
        "431",
        "394"
      ],
      "normals": [
        "244",
        "244",
        "249",
        "249"
      ],
      "uvs": [
        "488",
        "487",
        "497",
        "498"
      ]
    },
    {
      "vertices": [
        "561",
        "753",
        "752",
        "560"
      ],
      "normals": [
        "250",
        "250",
        "245",
        "245"
      ],
      "uvs": [
        "499",
        "500",
        "490",
        "489"
      ]
    },
    {
      "vertices": [
        "580",
        "614",
        "615",
        "581"
      ],
      "normals": [
        "246",
        "246",
        "251",
        "251"
      ],
      "uvs": [
        "492",
        "491",
        "501",
        "502"
      ]
    },
    {
      "vertices": [
        "482",
        "647",
        "646",
        "483"
      ],
      "normals": [
        "252",
        "252",
        "247",
        "247"
      ],
      "uvs": [
        "503",
        "504",
        "494",
        "493"
      ]
    },
    {
      "vertices": [
        "524",
        "715",
        "716",
        "525"
      ],
      "normals": [
        "248",
        "248",
        "253",
        "253"
      ],
      "uvs": [
        "496",
        "495",
        "505",
        "506"
      ]
    },
    {
      "vertices": [
        "394",
        "431",
        "430",
        "395"
      ],
      "normals": [
        "249",
        "249",
        "254",
        "254"
      ],
      "uvs": [
        "498",
        "497",
        "507",
        "508"
      ]
    },
    {
      "vertices": [
        "562",
        "754",
        "753",
        "561"
      ],
      "normals": [
        "255",
        "255",
        "250",
        "250"
      ],
      "uvs": [
        "509",
        "510",
        "500",
        "499"
      ]
    },
    {
      "vertices": [
        "581",
        "615",
        "616",
        "582"
      ],
      "normals": [
        "251",
        "251",
        "256",
        "256"
      ],
      "uvs": [
        "502",
        "501",
        "511",
        "512"
      ]
    },
    {
      "vertices": [
        "481",
        "648",
        "647",
        "482"
      ],
      "normals": [
        "257",
        "257",
        "252",
        "252"
      ],
      "uvs": [
        "513",
        "514",
        "504",
        "503"
      ]
    },
    {
      "vertices": [
        "525",
        "716",
        "717",
        "526"
      ],
      "normals": [
        "253",
        "253",
        "258",
        "258"
      ],
      "uvs": [
        "506",
        "505",
        "515",
        "516"
      ]
    },
    {
      "vertices": [
        "395",
        "430",
        "429",
        "396"
      ],
      "normals": [
        "254",
        "254",
        "259",
        "259"
      ],
      "uvs": [
        "508",
        "507",
        "517",
        "518"
      ]
    },
    {
      "vertices": [
        "563",
        "755",
        "754",
        "562"
      ],
      "normals": [
        "260",
        "260",
        "255",
        "255"
      ],
      "uvs": [
        "519",
        "520",
        "510",
        "509"
      ]
    },
    {
      "vertices": [
        "582",
        "616",
        "617",
        "583"
      ],
      "normals": [
        "256",
        "256",
        "261",
        "261"
      ],
      "uvs": [
        "512",
        "511",
        "521",
        "522"
      ]
    },
    {
      "vertices": [
        "480",
        "649",
        "648",
        "481"
      ],
      "normals": [
        "262",
        "262",
        "257",
        "257"
      ],
      "uvs": [
        "523",
        "524",
        "514",
        "513"
      ]
    },
    {
      "vertices": [
        "526",
        "717",
        "718",
        "527"
      ],
      "normals": [
        "258",
        "258",
        "263",
        "263"
      ],
      "uvs": [
        "516",
        "515",
        "525",
        "526"
      ]
    },
    {
      "vertices": [
        "396",
        "429",
        "428",
        "397"
      ],
      "normals": [
        "259",
        "259",
        "264",
        "264"
      ],
      "uvs": [
        "518",
        "517",
        "527",
        "528"
      ]
    },
    {
      "vertices": [
        "564",
        "756",
        "755",
        "563"
      ],
      "normals": [
        "265",
        "265",
        "260",
        "260"
      ],
      "uvs": [
        "529",
        "530",
        "520",
        "519"
      ]
    },
    {
      "vertices": [
        "583",
        "617",
        "618",
        "584"
      ],
      "normals": [
        "261",
        "261",
        "266",
        "266"
      ],
      "uvs": [
        "522",
        "521",
        "531",
        "532"
      ]
    },
    {
      "vertices": [
        "479",
        "650",
        "649",
        "480"
      ],
      "normals": [
        "267",
        "267",
        "262",
        "262"
      ],
      "uvs": [
        "533",
        "534",
        "524",
        "523"
      ]
    },
    {
      "vertices": [
        "527",
        "718",
        "719",
        "528"
      ],
      "normals": [
        "263",
        "263",
        "268",
        "268"
      ],
      "uvs": [
        "526",
        "525",
        "535",
        "536"
      ]
    },
    {
      "vertices": [
        "397",
        "428",
        "427",
        "398"
      ],
      "normals": [
        "264",
        "264",
        "269",
        "269"
      ],
      "uvs": [
        "528",
        "527",
        "537",
        "538"
      ]
    },
    {
      "vertices": [
        "565",
        "757",
        "756",
        "564"
      ],
      "normals": [
        "270",
        "270",
        "265",
        "265"
      ],
      "uvs": [
        "539",
        "540",
        "530",
        "529"
      ]
    },
    {
      "vertices": [
        "584",
        "618",
        "619",
        "585"
      ],
      "normals": [
        "266",
        "266",
        "271",
        "271"
      ],
      "uvs": [
        "532",
        "531",
        "541",
        "542"
      ]
    },
    {
      "vertices": [
        "478",
        "651",
        "650",
        "479"
      ],
      "normals": [
        "272",
        "272",
        "267",
        "267"
      ],
      "uvs": [
        "543",
        "544",
        "534",
        "533"
      ]
    },
    {
      "vertices": [
        "528",
        "719",
        "720",
        "529"
      ],
      "normals": [
        "268",
        "268",
        "273",
        "273"
      ],
      "uvs": [
        "536",
        "535",
        "545",
        "546"
      ]
    },
    {
      "vertices": [
        "398",
        "427",
        "426",
        "399"
      ],
      "normals": [
        "269",
        "269",
        "274",
        "274"
      ],
      "uvs": [
        "538",
        "537",
        "547",
        "548"
      ]
    },
    {
      "vertices": [
        "566",
        "758",
        "757",
        "565"
      ],
      "normals": [
        "275",
        "275",
        "270",
        "270"
      ],
      "uvs": [
        "549",
        "550",
        "540",
        "539"
      ]
    },
    {
      "vertices": [
        "585",
        "619",
        "620",
        "586"
      ],
      "normals": [
        "271",
        "271",
        "276",
        "276"
      ],
      "uvs": [
        "542",
        "541",
        "551",
        "552"
      ]
    },
    {
      "vertices": [
        "477",
        "652",
        "651",
        "478"
      ],
      "normals": [
        "277",
        "277",
        "272",
        "272"
      ],
      "uvs": [
        "553",
        "554",
        "544",
        "543"
      ]
    },
    {
      "vertices": [
        "529",
        "720",
        "721",
        "530"
      ],
      "normals": [
        "273",
        "273",
        "278",
        "278"
      ],
      "uvs": [
        "546",
        "545",
        "555",
        "556"
      ]
    },
    {
      "vertices": [
        "399",
        "426",
        "425",
        "400"
      ],
      "normals": [
        "274",
        "274",
        "279",
        "279"
      ],
      "uvs": [
        "548",
        "547",
        "557",
        "558"
      ]
    },
    {
      "vertices": [
        "567",
        "759",
        "758",
        "566"
      ],
      "normals": [
        "280",
        "280",
        "275",
        "275"
      ],
      "uvs": [
        "559",
        "560",
        "550",
        "549"
      ]
    },
    {
      "vertices": [
        "586",
        "620",
        "621",
        "587"
      ],
      "normals": [
        "276",
        "276",
        "281",
        "281"
      ],
      "uvs": [
        "552",
        "551",
        "561",
        "562"
      ]
    },
    {
      "vertices": [
        "476",
        "653",
        "652",
        "477"
      ],
      "normals": [
        "282",
        "282",
        "277",
        "277"
      ],
      "uvs": [
        "563",
        "564",
        "554",
        "553"
      ]
    },
    {
      "vertices": [
        "530",
        "721",
        "722",
        "531"
      ],
      "normals": [
        "278",
        "278",
        "283",
        "283"
      ],
      "uvs": [
        "556",
        "555",
        "565",
        "566"
      ]
    },
    {
      "vertices": [
        "400",
        "425",
        "424",
        "401"
      ],
      "normals": [
        "279",
        "279",
        "284",
        "284"
      ],
      "uvs": [
        "558",
        "557",
        "567",
        "568"
      ]
    },
    {
      "vertices": [
        "568",
        "760",
        "759",
        "567"
      ],
      "normals": [
        "285",
        "285",
        "280",
        "280"
      ],
      "uvs": [
        "569",
        "570",
        "560",
        "559"
      ]
    },
    {
      "vertices": [
        "587",
        "621",
        "622",
        "588"
      ],
      "normals": [
        "281",
        "281",
        "286",
        "286"
      ],
      "uvs": [
        "562",
        "561",
        "571",
        "572"
      ]
    },
    {
      "vertices": [
        "475",
        "654",
        "653",
        "476"
      ],
      "normals": [
        "287",
        "287",
        "282",
        "282"
      ],
      "uvs": [
        "573",
        "574",
        "564",
        "563"
      ]
    },
    {
      "vertices": [
        "531",
        "722",
        "723",
        "532"
      ],
      "normals": [
        "283",
        "283",
        "288",
        "288"
      ],
      "uvs": [
        "566",
        "565",
        "575",
        "576"
      ]
    },
    {
      "vertices": [
        "401",
        "424",
        "423",
        "402"
      ],
      "normals": [
        "284",
        "284",
        "289",
        "289"
      ],
      "uvs": [
        "568",
        "567",
        "577",
        "578"
      ]
    },
    {
      "vertices": [
        "569",
        "761",
        "760",
        "568"
      ],
      "normals": [
        "290",
        "290",
        "285",
        "285"
      ],
      "uvs": [
        "579",
        "580",
        "570",
        "569"
      ]
    },
    {
      "vertices": [
        "588",
        "622",
        "623",
        "589"
      ],
      "normals": [
        "286",
        "286",
        "291",
        "291"
      ],
      "uvs": [
        "572",
        "571",
        "581",
        "582"
      ]
    },
    {
      "vertices": [
        "474",
        "655",
        "654",
        "475"
      ],
      "normals": [
        "292",
        "292",
        "287",
        "287"
      ],
      "uvs": [
        "583",
        "584",
        "574",
        "573"
      ]
    },
    {
      "vertices": [
        "532",
        "723",
        "724",
        "533"
      ],
      "normals": [
        "288",
        "288",
        "293",
        "293"
      ],
      "uvs": [
        "576",
        "575",
        "585",
        "586"
      ]
    },
    {
      "vertices": [
        "402",
        "423",
        "422",
        "403"
      ],
      "normals": [
        "289",
        "289",
        "294",
        "294"
      ],
      "uvs": [
        "578",
        "577",
        "587",
        "588"
      ]
    },
    {
      "vertices": [
        "570",
        "762",
        "761",
        "569"
      ],
      "normals": [
        "295",
        "295",
        "290",
        "290"
      ],
      "uvs": [
        "589",
        "590",
        "580",
        "579"
      ]
    },
    {
      "vertices": [
        "589",
        "623",
        "624",
        "590"
      ],
      "normals": [
        "291",
        "291",
        "296",
        "296"
      ],
      "uvs": [
        "582",
        "581",
        "591",
        "592"
      ]
    },
    {
      "vertices": [
        "473",
        "656",
        "655",
        "474"
      ],
      "normals": [
        "297",
        "297",
        "292",
        "292"
      ],
      "uvs": [
        "593",
        "594",
        "584",
        "583"
      ]
    },
    {
      "vertices": [
        "533",
        "724",
        "725",
        "534"
      ],
      "normals": [
        "293",
        "293",
        "298",
        "298"
      ],
      "uvs": [
        "586",
        "585",
        "595",
        "596"
      ]
    },
    {
      "vertices": [
        "403",
        "422",
        "421",
        "404"
      ],
      "normals": [
        "294",
        "294",
        "299",
        "299"
      ],
      "uvs": [
        "588",
        "587",
        "597",
        "598"
      ]
    },
    {
      "vertices": [
        "571",
        "763",
        "762",
        "570"
      ],
      "normals": [
        "300",
        "300",
        "295",
        "295"
      ],
      "uvs": [
        "599",
        "600",
        "590",
        "589"
      ]
    },
    {
      "vertices": [
        "590",
        "624",
        "625",
        "591"
      ],
      "normals": [
        "296",
        "296",
        "301",
        "301"
      ],
      "uvs": [
        "592",
        "591",
        "601",
        "602"
      ]
    },
    {
      "vertices": [
        "472",
        "657",
        "656",
        "473"
      ],
      "normals": [
        "302",
        "302",
        "297",
        "297"
      ],
      "uvs": [
        "603",
        "604",
        "594",
        "593"
      ]
    },
    {
      "vertices": [
        "534",
        "725",
        "726",
        "535"
      ],
      "normals": [
        "298",
        "298",
        "303",
        "303"
      ],
      "uvs": [
        "596",
        "595",
        "605",
        "606"
      ]
    },
    {
      "vertices": [
        "404",
        "421",
        "420",
        "405"
      ],
      "normals": [
        "299",
        "299",
        "304",
        "304"
      ],
      "uvs": [
        "598",
        "597",
        "607",
        "608"
      ]
    },
    {
      "vertices": [
        "572",
        "764",
        "763",
        "571"
      ],
      "normals": [
        "305",
        "305",
        "300",
        "300"
      ],
      "uvs": [
        "609",
        "610",
        "600",
        "599"
      ]
    },
    {
      "vertices": [
        "591",
        "625",
        "626",
        "592"
      ],
      "normals": [
        "301",
        "301",
        "306",
        "306"
      ],
      "uvs": [
        "602",
        "601",
        "611",
        "612"
      ]
    },
    {
      "vertices": [
        "471",
        "658",
        "657",
        "472"
      ],
      "normals": [
        "307",
        "307",
        "302",
        "302"
      ],
      "uvs": [
        "613",
        "614",
        "604",
        "603"
      ]
    },
    {
      "vertices": [
        "535",
        "726",
        "727",
        "536"
      ],
      "normals": [
        "303",
        "303",
        "308",
        "308"
      ],
      "uvs": [
        "606",
        "605",
        "615",
        "616"
      ]
    },
    {
      "vertices": [
        "405",
        "420",
        "447",
        "406"
      ],
      "normals": [
        "304",
        "304",
        "309",
        "309"
      ],
      "uvs": [
        "608",
        "607",
        "617",
        "618"
      ]
    },
    {
      "vertices": [
        "573",
        "765",
        "764",
        "572"
      ],
      "normals": [
        "310",
        "310",
        "305",
        "305"
      ],
      "uvs": [
        "619",
        "620",
        "610",
        "609"
      ]
    },
    {
      "vertices": [
        "484",
        "449",
        "707",
        "515"
      ],
      "normals": [
        "222",
        "222",
        "311",
        "311"
      ],
      "uvs": [
        "444",
        "443",
        "621",
        "622"
      ]
    },
    {
      "vertices": [
        "592",
        "626",
        "627",
        "593"
      ],
      "normals": [
        "306",
        "306",
        "312",
        "312"
      ],
      "uvs": [
        "612",
        "611",
        "623",
        "624"
      ]
    },
    {
      "vertices": [
        "470",
        "659",
        "658",
        "471"
      ],
      "normals": [
        "313",
        "313",
        "307",
        "307"
      ],
      "uvs": [
        "625",
        "626",
        "614",
        "613"
      ]
    },
    {
      "vertices": [
        "536",
        "727",
        "728",
        "537"
      ],
      "normals": [
        "308",
        "308",
        "314",
        "314"
      ],
      "uvs": [
        "616",
        "615",
        "627",
        "628"
      ]
    },
    {
      "vertices": [
        "406",
        "447",
        "446",
        "407"
      ],
      "normals": [
        "309",
        "309",
        "315",
        "315"
      ],
      "uvs": [
        "618",
        "617",
        "629",
        "630"
      ]
    },
    {
      "vertices": [
        "574",
        "766",
        "765",
        "573"
      ],
      "normals": [
        "316",
        "316",
        "310",
        "310"
      ],
      "uvs": [
        "631",
        "632",
        "620",
        "619"
      ]
    },
    {
      "vertices": [
        "515",
        "707",
        "706",
        "514"
      ],
      "normals": [
        "311",
        "311",
        "317",
        "317"
      ],
      "uvs": [
        "622",
        "621",
        "633",
        "634"
      ]
    },
    {
      "vertices": [
        "593",
        "627",
        "628",
        "594"
      ],
      "normals": [
        "312",
        "312",
        "318",
        "318"
      ],
      "uvs": [
        "624",
        "623",
        "635",
        "636"
      ]
    },
    {
      "vertices": [
        "469",
        "660",
        "659",
        "470"
      ],
      "normals": [
        "319",
        "319",
        "313",
        "313"
      ],
      "uvs": [
        "637",
        "638",
        "626",
        "625"
      ]
    },
    {
      "vertices": [
        "537",
        "728",
        "729",
        "538"
      ],
      "normals": [
        "314",
        "314",
        "320",
        "320"
      ],
      "uvs": [
        "628",
        "627",
        "639",
        "640"
      ]
    },
    {
      "vertices": [
        "407",
        "446",
        "445",
        "408"
      ],
      "normals": [
        "315",
        "315",
        "321",
        "321"
      ],
      "uvs": [
        "630",
        "629",
        "641",
        "642"
      ]
    },
    {
      "vertices": [
        "575",
        "767",
        "766",
        "574"
      ],
      "normals": [
        "322",
        "322",
        "316",
        "316"
      ],
      "uvs": [
        "643",
        "644",
        "632",
        "631"
      ]
    },
    {
      "vertices": [
        "514",
        "706",
        "705",
        "513"
      ],
      "normals": [
        "317",
        "317",
        "323",
        "323"
      ],
      "uvs": [
        "634",
        "633",
        "645",
        "646"
      ]
    },
    {
      "vertices": [
        "594",
        "628",
        "629",
        "595"
      ],
      "normals": [
        "318",
        "318",
        "324",
        "324"
      ],
      "uvs": [
        "636",
        "635",
        "647",
        "648"
      ]
    },
    {
      "vertices": [
        "468",
        "661",
        "660",
        "469"
      ],
      "normals": [
        "325",
        "325",
        "319",
        "319"
      ],
      "uvs": [
        "649",
        "650",
        "638",
        "637"
      ]
    },
    {
      "vertices": [
        "538",
        "729",
        "730",
        "539"
      ],
      "normals": [
        "320",
        "320",
        "326",
        "326"
      ],
      "uvs": [
        "640",
        "639",
        "651",
        "652"
      ]
    },
    {
      "vertices": [
        "408",
        "445",
        "444",
        "409"
      ],
      "normals": [
        "321",
        "321",
        "327",
        "327"
      ],
      "uvs": [
        "642",
        "641",
        "653",
        "654"
      ]
    },
    {
      "vertices": [
        "576",
        "768",
        "767",
        "575"
      ],
      "normals": [
        "328",
        "328",
        "322",
        "322"
      ],
      "uvs": [
        "655",
        "656",
        "644",
        "643"
      ]
    },
    {
      "vertices": [
        "513",
        "705",
        "704",
        "512"
      ],
      "normals": [
        "323",
        "323",
        "329",
        "329"
      ],
      "uvs": [
        "646",
        "645",
        "657",
        "658"
      ]
    },
    {
      "vertices": [
        "595",
        "629",
        "630",
        "596"
      ],
      "normals": [
        "324",
        "324",
        "330",
        "330"
      ],
      "uvs": [
        "648",
        "647",
        "659",
        "660"
      ]
    },
    {
      "vertices": [
        "467",
        "662",
        "661",
        "468"
      ],
      "normals": [
        "331",
        "331",
        "325",
        "325"
      ],
      "uvs": [
        "661",
        "662",
        "650",
        "649"
      ]
    },
    {
      "vertices": [
        "539",
        "730",
        "731",
        "540"
      ],
      "normals": [
        "326",
        "326",
        "332",
        "332"
      ],
      "uvs": [
        "652",
        "651",
        "663",
        "664"
      ]
    },
    {
      "vertices": [
        "409",
        "444",
        "443",
        "410"
      ],
      "normals": [
        "327",
        "327",
        "333",
        "333"
      ],
      "uvs": [
        "654",
        "653",
        "665",
        "666"
      ]
    },
    {
      "vertices": [
        "577",
        "769",
        "768",
        "576"
      ],
      "normals": [
        "334",
        "334",
        "328",
        "328"
      ],
      "uvs": [
        "667",
        "668",
        "656",
        "655"
      ]
    },
    {
      "vertices": [
        "512",
        "704",
        "703",
        "511"
      ],
      "normals": [
        "329",
        "329",
        "335",
        "335"
      ],
      "uvs": [
        "658",
        "657",
        "669",
        "670"
      ]
    },
    {
      "vertices": [
        "596",
        "630",
        "631",
        "597"
      ],
      "normals": [
        "330",
        "330",
        "336",
        "336"
      ],
      "uvs": [
        "660",
        "659",
        "671",
        "672"
      ]
    },
    {
      "vertices": [
        "466",
        "663",
        "662",
        "467"
      ],
      "normals": [
        "337",
        "337",
        "331",
        "331"
      ],
      "uvs": [
        "673",
        "674",
        "662",
        "661"
      ]
    },
    {
      "vertices": [
        "540",
        "731",
        "732",
        "541"
      ],
      "normals": [
        "332",
        "332",
        "338",
        "338"
      ],
      "uvs": [
        "664",
        "663",
        "675",
        "676"
      ]
    },
    {
      "vertices": [
        "410",
        "443",
        "442",
        "411"
      ],
      "normals": [
        "333",
        "333",
        "339",
        "339"
      ],
      "uvs": [
        "666",
        "665",
        "677",
        "678"
      ]
    },
    {
      "vertices": [
        "578",
        "612",
        "769",
        "577"
      ],
      "normals": [
        "211",
        "211",
        "334",
        "334"
      ],
      "uvs": [
        "422",
        "421",
        "668",
        "667"
      ]
    },
    {
      "vertices": [
        "511",
        "703",
        "702",
        "510"
      ],
      "normals": [
        "335",
        "335",
        "340",
        "340"
      ],
      "uvs": [
        "670",
        "669",
        "679",
        "680"
      ]
    },
    {
      "vertices": [
        "597",
        "631",
        "632",
        "598"
      ],
      "normals": [
        "336",
        "336",
        "341",
        "341"
      ],
      "uvs": [
        "672",
        "671",
        "681",
        "682"
      ]
    },
    {
      "vertices": [
        "465",
        "664",
        "663",
        "466"
      ],
      "normals": [
        "342",
        "342",
        "337",
        "337"
      ],
      "uvs": [
        "683",
        "684",
        "674",
        "673"
      ]
    },
    {
      "vertices": [
        "541",
        "732",
        "733",
        "542"
      ],
      "normals": [
        "338",
        "338",
        "343",
        "343"
      ],
      "uvs": [
        "676",
        "675",
        "685",
        "686"
      ]
    },
    {
      "vertices": [
        "411",
        "442",
        "441",
        "412"
      ],
      "normals": [
        "339",
        "339",
        "344",
        "344"
      ],
      "uvs": [
        "678",
        "677",
        "687",
        "688"
      ]
    },
    {
      "vertices": [
        "510",
        "702",
        "701",
        "509"
      ],
      "normals": [
        "340",
        "340",
        "345",
        "345"
      ],
      "uvs": [
        "680",
        "679",
        "689",
        "690"
      ]
    },
    {
      "vertices": [
        "598",
        "632",
        "633",
        "599"
      ],
      "normals": [
        "341",
        "341",
        "346",
        "346"
      ],
      "uvs": [
        "682",
        "681",
        "691",
        "692"
      ]
    },
    {
      "vertices": [
        "464",
        "665",
        "664",
        "465"
      ],
      "normals": [
        "347",
        "347",
        "342",
        "342"
      ],
      "uvs": [
        "693",
        "694",
        "684",
        "683"
      ]
    },
    {
      "vertices": [
        "542",
        "733",
        "734",
        "543"
      ],
      "normals": [
        "343",
        "343",
        "348",
        "348"
      ],
      "uvs": [
        "686",
        "685",
        "695",
        "696"
      ]
    },
    {
      "vertices": [
        "412",
        "441",
        "440",
        "413"
      ],
      "normals": [
        "344",
        "344",
        "349",
        "349"
      ],
      "uvs": [
        "688",
        "687",
        "697",
        "698"
      ]
    },
    {
      "vertices": [
        "509",
        "701",
        "700",
        "508"
      ],
      "normals": [
        "345",
        "345",
        "350",
        "350"
      ],
      "uvs": [
        "690",
        "689",
        "699",
        "700"
      ]
    },
    {
      "vertices": [
        "599",
        "633",
        "634",
        "600"
      ],
      "normals": [
        "346",
        "346",
        "351",
        "351"
      ],
      "uvs": [
        "692",
        "691",
        "701",
        "702"
      ]
    },
    {
      "vertices": [
        "463",
        "666",
        "665",
        "464"
      ],
      "normals": [
        "352",
        "352",
        "347",
        "347"
      ],
      "uvs": [
        "703",
        "704",
        "694",
        "693"
      ]
    },
    {
      "vertices": [
        "543",
        "734",
        "735",
        "544"
      ],
      "normals": [
        "348",
        "348",
        "353",
        "353"
      ],
      "uvs": [
        "696",
        "695",
        "705",
        "706"
      ]
    },
    {
      "vertices": [
        "413",
        "440",
        "439",
        "414"
      ],
      "normals": [
        "349",
        "349",
        "354",
        "354"
      ],
      "uvs": [
        "698",
        "697",
        "707",
        "708"
      ]
    },
    {
      "vertices": [
        "508",
        "700",
        "699",
        "507"
      ],
      "normals": [
        "350",
        "350",
        "355",
        "355"
      ],
      "uvs": [
        "700",
        "699",
        "709",
        "710"
      ]
    },
    {
      "vertices": [
        "600",
        "634",
        "635",
        "601"
      ],
      "normals": [
        "351",
        "351",
        "356",
        "356"
      ],
      "uvs": [
        "702",
        "701",
        "711",
        "712"
      ]
    },
    {
      "vertices": [
        "462",
        "667",
        "666",
        "463"
      ],
      "normals": [
        "357",
        "357",
        "352",
        "352"
      ],
      "uvs": [
        "713",
        "714",
        "704",
        "703"
      ]
    },
    {
      "vertices": [
        "544",
        "735",
        "736",
        "545"
      ],
      "normals": [
        "353",
        "353",
        "358",
        "358"
      ],
      "uvs": [
        "706",
        "705",
        "715",
        "716"
      ]
    },
    {
      "vertices": [
        "414",
        "439",
        "438",
        "415"
      ],
      "normals": [
        "354",
        "354",
        "359",
        "359"
      ],
      "uvs": [
        "708",
        "707",
        "717",
        "718"
      ]
    },
    {
      "vertices": [
        "507",
        "699",
        "698",
        "506"
      ],
      "normals": [
        "355",
        "355",
        "360",
        "360"
      ],
      "uvs": [
        "710",
        "709",
        "719",
        "720"
      ]
    },
    {
      "vertices": [
        "601",
        "635",
        "636",
        "602"
      ],
      "normals": [
        "356",
        "356",
        "361",
        "361"
      ],
      "uvs": [
        "712",
        "711",
        "721",
        "722"
      ]
    },
    {
      "vertices": [
        "461",
        "668",
        "667",
        "462"
      ],
      "normals": [
        "362",
        "362",
        "357",
        "357"
      ],
      "uvs": [
        "723",
        "724",
        "714",
        "713"
      ]
    },
    {
      "vertices": [
        "545",
        "736",
        "737",
        "546"
      ],
      "normals": [
        "358",
        "358",
        "363",
        "363"
      ],
      "uvs": [
        "716",
        "715",
        "725",
        "726"
      ]
    },
    {
      "vertices": [
        "415",
        "438",
        "437",
        "416"
      ],
      "normals": [
        "359",
        "359",
        "364",
        "364"
      ],
      "uvs": [
        "718",
        "717",
        "727",
        "728"
      ]
    },
    {
      "vertices": [
        "506",
        "698",
        "697",
        "505"
      ],
      "normals": [
        "360",
        "360",
        "365",
        "365"
      ],
      "uvs": [
        "720",
        "719",
        "729",
        "730"
      ]
    },
    {
      "vertices": [
        "602",
        "636",
        "637",
        "603"
      ],
      "normals": [
        "361",
        "361",
        "366",
        "366"
      ],
      "uvs": [
        "722",
        "721",
        "731",
        "732"
      ]
    },
    {
      "vertices": [
        "460",
        "669",
        "668",
        "461"
      ],
      "normals": [
        "367",
        "367",
        "362",
        "362"
      ],
      "uvs": [
        "733",
        "734",
        "724",
        "723"
      ]
    },
    {
      "vertices": [
        "546",
        "737",
        "738",
        "547"
      ],
      "normals": [
        "363",
        "363",
        "368",
        "368"
      ],
      "uvs": [
        "726",
        "725",
        "735",
        "736"
      ]
    },
    {
      "vertices": [
        "416",
        "437",
        "436",
        "417"
      ],
      "normals": [
        "364",
        "364",
        "369",
        "369"
      ],
      "uvs": [
        "728",
        "727",
        "737",
        "738"
      ]
    },
    {
      "vertices": [
        "505",
        "697",
        "696",
        "504"
      ],
      "normals": [
        "365",
        "365",
        "370",
        "370"
      ],
      "uvs": [
        "730",
        "729",
        "739",
        "740"
      ]
    },
    {
      "vertices": [
        "603",
        "637",
        "638",
        "604"
      ],
      "normals": [
        "366",
        "366",
        "371",
        "371"
      ],
      "uvs": [
        "732",
        "731",
        "741",
        "742"
      ]
    },
    {
      "vertices": [
        "459",
        "670",
        "669",
        "460"
      ],
      "normals": [
        "372",
        "372",
        "367",
        "367"
      ],
      "uvs": [
        "743",
        "744",
        "734",
        "733"
      ]
    },
    {
      "vertices": [
        "547",
        "738",
        "644",
        "516"
      ],
      "normals": [
        "368",
        "368",
        "224",
        "224"
      ],
      "uvs": [
        "736",
        "735",
        "448",
        "447"
      ]
    },
    {
      "vertices": [
        "417",
        "436",
        "435",
        "418"
      ],
      "normals": [
        "369",
        "369",
        "373",
        "373"
      ],
      "uvs": [
        "738",
        "737",
        "745",
        "746"
      ]
    },
    {
      "vertices": [
        "504",
        "696",
        "695",
        "503"
      ],
      "normals": [
        "370",
        "370",
        "374",
        "374"
      ],
      "uvs": [
        "740",
        "739",
        "747",
        "748"
      ]
    },
    {
      "vertices": [
        "604",
        "638",
        "639",
        "605"
      ],
      "normals": [
        "371",
        "371",
        "375",
        "375"
      ],
      "uvs": [
        "742",
        "741",
        "749",
        "750"
      ]
    },
    {
      "vertices": [
        "458",
        "671",
        "670",
        "459"
      ],
      "normals": [
        "376",
        "376",
        "372",
        "372"
      ],
      "uvs": [
        "751",
        "752",
        "744",
        "743"
      ]
    },
    {
      "vertices": [
        "418",
        "435",
        "611",
        "419"
      ],
      "normals": [
        "373",
        "373",
        "377",
        "377"
      ],
      "uvs": [
        "746",
        "745",
        "753",
        "754"
      ]
    },
    {
      "vertices": [
        "503",
        "695",
        "694",
        "502"
      ],
      "normals": [
        "374",
        "374",
        "378",
        "378"
      ],
      "uvs": [
        "748",
        "747",
        "755",
        "756"
      ]
    },
    {
      "vertices": [
        "605",
        "639",
        "640",
        "606"
      ],
      "normals": [
        "375",
        "375",
        "379",
        "379"
      ],
      "uvs": [
        "750",
        "749",
        "757",
        "758"
      ]
    },
    {
      "vertices": [
        "457",
        "672",
        "671",
        "458"
      ],
      "normals": [
        "380",
        "380",
        "376",
        "376"
      ],
      "uvs": [
        "759",
        "760",
        "752",
        "751"
      ]
    },
    {
      "vertices": [
        "419",
        "611",
        "450",
        "388"
      ],
      "normals": [
        "377",
        "377",
        "228",
        "228"
      ],
      "uvs": [
        "754",
        "753",
        "456",
        "455"
      ]
    },
    {
      "vertices": [
        "502",
        "694",
        "693",
        "501"
      ],
      "normals": [
        "378",
        "378",
        "381",
        "381"
      ],
      "uvs": [
        "756",
        "755",
        "761",
        "762"
      ]
    },
    {
      "vertices": [
        "606",
        "640",
        "641",
        "607"
      ],
      "normals": [
        "379",
        "379",
        "382",
        "382"
      ],
      "uvs": [
        "758",
        "757",
        "763",
        "764"
      ]
    },
    {
      "vertices": [
        "456",
        "673",
        "672",
        "457"
      ],
      "normals": [
        "383",
        "383",
        "380",
        "380"
      ],
      "uvs": [
        "765",
        "766",
        "760",
        "759"
      ]
    },
    {
      "vertices": [
        "501",
        "693",
        "692",
        "500"
      ],
      "normals": [
        "381",
        "381",
        "384",
        "384"
      ],
      "uvs": [
        "762",
        "761",
        "767",
        "768"
      ]
    },
    {
      "vertices": [
        "607",
        "641",
        "642",
        "608"
      ],
      "normals": [
        "382",
        "382",
        "193",
        "193"
      ],
      "uvs": [
        "764",
        "763",
        "386",
        "385"
      ]
    },
    {
      "vertices": [
        "455",
        "674",
        "673",
        "456"
      ],
      "normals": [
        "196",
        "196",
        "383",
        "383"
      ],
      "uvs": [
        "392",
        "391",
        "766",
        "765"
      ]
    },
    {
      "vertices": [
        "500",
        "692",
        "691",
        "499"
      ],
      "normals": [
        "384",
        "384",
        "197",
        "197"
      ],
      "uvs": [
        "768",
        "767",
        "394",
        "393"
      ]
    },
    {
      "vertices": [
        "867",
        "803",
        "801",
        "800"
      ],
      "normals": [
        "385",
        "385",
        "386",
        "386"
      ],
      "uvs": [
        "769",
        "770",
        "771",
        "772"
      ]
    },
    {
      "vertices": [
        "866",
        "786",
        "803",
        "867"
      ],
      "normals": [
        "387",
        "387",
        "385",
        "385"
      ],
      "uvs": [
        "773",
        "774",
        "770",
        "769"
      ]
    },
    {
      "vertices": [
        "865",
        "787",
        "786",
        "866"
      ],
      "normals": [
        "388",
        "388",
        "387",
        "387"
      ],
      "uvs": [
        "775",
        "776",
        "774",
        "773"
      ]
    },
    {
      "vertices": [
        "864",
        "788",
        "787",
        "865"
      ],
      "normals": [
        "389",
        "389",
        "388",
        "388"
      ],
      "uvs": [
        "777",
        "778",
        "776",
        "775"
      ]
    },
    {
      "vertices": [
        "863",
        "789",
        "788",
        "864"
      ],
      "normals": [
        "390",
        "390",
        "389",
        "389"
      ],
      "uvs": [
        "779",
        "780",
        "778",
        "777"
      ]
    },
    {
      "vertices": [
        "862",
        "790",
        "789",
        "863"
      ],
      "normals": [
        "391",
        "391",
        "390",
        "390"
      ],
      "uvs": [
        "781",
        "782",
        "780",
        "779"
      ]
    },
    {
      "vertices": [
        "861",
        "791",
        "790",
        "862"
      ],
      "normals": [
        "392",
        "392",
        "391",
        "391"
      ],
      "uvs": [
        "783",
        "784",
        "782",
        "781"
      ]
    },
    {
      "vertices": [
        "860",
        "792",
        "791",
        "861"
      ],
      "normals": [
        "393",
        "393",
        "392",
        "392"
      ],
      "uvs": [
        "785",
        "786",
        "784",
        "783"
      ]
    },
    {
      "vertices": [
        "859",
        "793",
        "792",
        "860"
      ],
      "normals": [
        "394",
        "394",
        "393",
        "393"
      ],
      "uvs": [
        "787",
        "788",
        "786",
        "785"
      ]
    },
    {
      "vertices": [
        "858",
        "794",
        "793",
        "859"
      ],
      "normals": [
        "395",
        "395",
        "394",
        "394"
      ],
      "uvs": [
        "789",
        "790",
        "788",
        "787"
      ]
    },
    {
      "vertices": [
        "857",
        "795",
        "794",
        "858"
      ],
      "normals": [
        "396",
        "396",
        "395",
        "395"
      ],
      "uvs": [
        "791",
        "792",
        "790",
        "789"
      ]
    },
    {
      "vertices": [
        "856",
        "796",
        "795",
        "857"
      ],
      "normals": [
        "397",
        "397",
        "396",
        "396"
      ],
      "uvs": [
        "793",
        "794",
        "792",
        "791"
      ]
    },
    {
      "vertices": [
        "855",
        "797",
        "796",
        "856"
      ],
      "normals": [
        "398",
        "398",
        "397",
        "397"
      ],
      "uvs": [
        "795",
        "796",
        "794",
        "793"
      ]
    },
    {
      "vertices": [
        "854",
        "798",
        "797",
        "855"
      ],
      "normals": [
        "399",
        "399",
        "398",
        "398"
      ],
      "uvs": [
        "797",
        "798",
        "796",
        "795"
      ]
    },
    {
      "vertices": [
        "853",
        "771",
        "798",
        "854"
      ],
      "normals": [
        "400",
        "400",
        "399",
        "399"
      ],
      "uvs": [
        "799",
        "800",
        "798",
        "797"
      ]
    },
    {
      "vertices": [
        "852",
        "772",
        "771",
        "853"
      ],
      "normals": [
        "401",
        "401",
        "400",
        "400"
      ],
      "uvs": [
        "801",
        "802",
        "800",
        "799"
      ]
    },
    {
      "vertices": [
        "851",
        "773",
        "772",
        "852"
      ],
      "normals": [
        "402",
        "402",
        "401",
        "401"
      ],
      "uvs": [
        "803",
        "804",
        "802",
        "801"
      ]
    },
    {
      "vertices": [
        "850",
        "774",
        "773",
        "851"
      ],
      "normals": [
        "403",
        "403",
        "402",
        "402"
      ],
      "uvs": [
        "805",
        "806",
        "807",
        "808"
      ]
    },
    {
      "vertices": [
        "849",
        "775",
        "774",
        "850"
      ],
      "normals": [
        "404",
        "404",
        "403",
        "403"
      ],
      "uvs": [
        "809",
        "810",
        "806",
        "805"
      ]
    },
    {
      "vertices": [
        "848",
        "776",
        "775",
        "849"
      ],
      "normals": [
        "405",
        "405",
        "404",
        "404"
      ],
      "uvs": [
        "811",
        "812",
        "810",
        "809"
      ]
    },
    {
      "vertices": [
        "847",
        "777",
        "776",
        "848"
      ],
      "normals": [
        "406",
        "406",
        "405",
        "405"
      ],
      "uvs": [
        "813",
        "814",
        "812",
        "811"
      ]
    },
    {
      "vertices": [
        "846",
        "778",
        "777",
        "847"
      ],
      "normals": [
        "407",
        "407",
        "406",
        "406"
      ],
      "uvs": [
        "815",
        "816",
        "814",
        "813"
      ]
    },
    {
      "vertices": [
        "845",
        "779",
        "778",
        "846"
      ],
      "normals": [
        "408",
        "408",
        "407",
        "407"
      ],
      "uvs": [
        "817",
        "818",
        "816",
        "815"
      ]
    },
    {
      "vertices": [
        "844",
        "780",
        "779",
        "845"
      ],
      "normals": [
        "409",
        "409",
        "408",
        "408"
      ],
      "uvs": [
        "819",
        "820",
        "818",
        "817"
      ]
    },
    {
      "vertices": [
        "843",
        "781",
        "780",
        "844"
      ],
      "normals": [
        "410",
        "410",
        "409",
        "409"
      ],
      "uvs": [
        "821",
        "822",
        "820",
        "819"
      ]
    },
    {
      "vertices": [
        "842",
        "782",
        "781",
        "843"
      ],
      "normals": [
        "411",
        "411",
        "410",
        "410"
      ],
      "uvs": [
        "823",
        "824",
        "822",
        "821"
      ]
    },
    {
      "vertices": [
        "841",
        "783",
        "782",
        "842"
      ],
      "normals": [
        "412",
        "412",
        "411",
        "411"
      ],
      "uvs": [
        "825",
        "826",
        "824",
        "823"
      ]
    },
    {
      "vertices": [
        "840",
        "784",
        "783",
        "841"
      ],
      "normals": [
        "413",
        "413",
        "412",
        "412"
      ],
      "uvs": [
        "827",
        "828",
        "826",
        "825"
      ]
    },
    {
      "vertices": [
        "839",
        "785",
        "784",
        "840"
      ],
      "normals": [
        "414",
        "414",
        "413",
        "413"
      ],
      "uvs": [
        "829",
        "830",
        "828",
        "827"
      ]
    },
    {
      "vertices": [
        "838",
        "799",
        "785",
        "839"
      ],
      "normals": [
        "415",
        "415",
        "414",
        "414"
      ],
      "uvs": [
        "831",
        "832",
        "830",
        "829"
      ]
    },
    {
      "vertices": [
        "837",
        "802",
        "799",
        "838"
      ],
      "normals": [
        "416",
        "416",
        "415",
        "415"
      ],
      "uvs": [
        "833",
        "834",
        "832",
        "831"
      ]
    },
    {
      "vertices": [
        "800",
        "801",
        "802",
        "837"
      ],
      "normals": [
        "386",
        "386",
        "416",
        "416"
      ],
      "uvs": [
        "772",
        "771",
        "834",
        "833"
      ]
    },
    {
      "vertices": [
        "804",
        "805",
        "836",
        "898"
      ],
      "normals": [
        "417",
        "417",
        "418",
        "418"
      ],
      "uvs": [
        "835",
        "836",
        "837",
        "838"
      ]
    },
    {
      "vertices": [
        "898",
        "836",
        "835",
        "897"
      ],
      "normals": [
        "418",
        "418",
        "419",
        "419"
      ],
      "uvs": [
        "838",
        "837",
        "839",
        "840"
      ]
    },
    {
      "vertices": [
        "897",
        "835",
        "834",
        "896"
      ],
      "normals": [
        "419",
        "419",
        "420",
        "420"
      ],
      "uvs": [
        "840",
        "839",
        "841",
        "842"
      ]
    },
    {
      "vertices": [
        "896",
        "834",
        "833",
        "895"
      ],
      "normals": [
        "420",
        "420",
        "421",
        "421"
      ],
      "uvs": [
        "842",
        "841",
        "843",
        "844"
      ]
    },
    {
      "vertices": [
        "895",
        "833",
        "832",
        "894"
      ],
      "normals": [
        "421",
        "421",
        "422",
        "422"
      ],
      "uvs": [
        "844",
        "843",
        "845",
        "846"
      ]
    },
    {
      "vertices": [
        "894",
        "832",
        "831",
        "893"
      ],
      "normals": [
        "422",
        "422",
        "423",
        "423"
      ],
      "uvs": [
        "846",
        "845",
        "847",
        "848"
      ]
    },
    {
      "vertices": [
        "893",
        "831",
        "830",
        "892"
      ],
      "normals": [
        "423",
        "423",
        "424",
        "424"
      ],
      "uvs": [
        "848",
        "847",
        "849",
        "850"
      ]
    },
    {
      "vertices": [
        "892",
        "830",
        "829",
        "891"
      ],
      "normals": [
        "424",
        "424",
        "425",
        "425"
      ],
      "uvs": [
        "850",
        "849",
        "851",
        "852"
      ]
    },
    {
      "vertices": [
        "891",
        "829",
        "828",
        "890"
      ],
      "normals": [
        "425",
        "425",
        "426",
        "426"
      ],
      "uvs": [
        "852",
        "851",
        "853",
        "854"
      ]
    },
    {
      "vertices": [
        "890",
        "828",
        "827",
        "889"
      ],
      "normals": [
        "426",
        "426",
        "427",
        "427"
      ],
      "uvs": [
        "854",
        "853",
        "855",
        "856"
      ]
    },
    {
      "vertices": [
        "889",
        "827",
        "826",
        "888"
      ],
      "normals": [
        "427",
        "427",
        "428",
        "428"
      ],
      "uvs": [
        "856",
        "855",
        "857",
        "858"
      ]
    },
    {
      "vertices": [
        "888",
        "826",
        "825",
        "887"
      ],
      "normals": [
        "428",
        "428",
        "429",
        "429"
      ],
      "uvs": [
        "858",
        "857",
        "859",
        "860"
      ]
    },
    {
      "vertices": [
        "887",
        "825",
        "824",
        "886"
      ],
      "normals": [
        "429",
        "429",
        "430",
        "430"
      ],
      "uvs": [
        "860",
        "859",
        "861",
        "862"
      ]
    },
    {
      "vertices": [
        "886",
        "824",
        "823",
        "885"
      ],
      "normals": [
        "430",
        "430",
        "431",
        "431"
      ],
      "uvs": [
        "862",
        "861",
        "863",
        "864"
      ]
    },
    {
      "vertices": [
        "885",
        "823",
        "822",
        "884"
      ],
      "normals": [
        "431",
        "431",
        "432",
        "432"
      ],
      "uvs": [
        "864",
        "863",
        "865",
        "866"
      ]
    },
    {
      "vertices": [
        "884",
        "822",
        "821",
        "883"
      ],
      "normals": [
        "432",
        "432",
        "433",
        "433"
      ],
      "uvs": [
        "867",
        "868",
        "869",
        "870"
      ]
    },
    {
      "vertices": [
        "883",
        "821",
        "820",
        "882"
      ],
      "normals": [
        "433",
        "433",
        "434",
        "434"
      ],
      "uvs": [
        "870",
        "869",
        "871",
        "872"
      ]
    },
    {
      "vertices": [
        "882",
        "820",
        "819",
        "881"
      ],
      "normals": [
        "434",
        "434",
        "435",
        "435"
      ],
      "uvs": [
        "872",
        "871",
        "873",
        "874"
      ]
    },
    {
      "vertices": [
        "881",
        "819",
        "818",
        "880"
      ],
      "normals": [
        "435",
        "435",
        "436",
        "436"
      ],
      "uvs": [
        "874",
        "873",
        "875",
        "876"
      ]
    },
    {
      "vertices": [
        "880",
        "818",
        "817",
        "879"
      ],
      "normals": [
        "436",
        "436",
        "437",
        "437"
      ],
      "uvs": [
        "876",
        "875",
        "877",
        "878"
      ]
    },
    {
      "vertices": [
        "879",
        "817",
        "816",
        "878"
      ],
      "normals": [
        "437",
        "437",
        "438",
        "439"
      ],
      "uvs": [
        "878",
        "877",
        "879",
        "880"
      ]
    },
    {
      "vertices": [
        "878",
        "816",
        "815",
        "877"
      ],
      "normals": [
        "439",
        "438",
        "440",
        "440"
      ],
      "uvs": [
        "880",
        "879",
        "881",
        "882"
      ]
    },
    {
      "vertices": [
        "877",
        "815",
        "814",
        "876"
      ],
      "normals": [
        "440",
        "440",
        "441",
        "441"
      ],
      "uvs": [
        "882",
        "881",
        "883",
        "884"
      ]
    },
    {
      "vertices": [
        "876",
        "814",
        "813",
        "875"
      ],
      "normals": [
        "441",
        "441",
        "442",
        "442"
      ],
      "uvs": [
        "884",
        "883",
        "885",
        "886"
      ]
    },
    {
      "vertices": [
        "875",
        "813",
        "812",
        "874"
      ],
      "normals": [
        "442",
        "442",
        "443",
        "443"
      ],
      "uvs": [
        "886",
        "885",
        "887",
        "888"
      ]
    },
    {
      "vertices": [
        "874",
        "812",
        "811",
        "873"
      ],
      "normals": [
        "443",
        "443",
        "444",
        "444"
      ],
      "uvs": [
        "888",
        "887",
        "889",
        "890"
      ]
    },
    {
      "vertices": [
        "873",
        "811",
        "810",
        "872"
      ],
      "normals": [
        "444",
        "444",
        "445",
        "445"
      ],
      "uvs": [
        "890",
        "889",
        "891",
        "892"
      ]
    },
    {
      "vertices": [
        "872",
        "810",
        "809",
        "871"
      ],
      "normals": [
        "445",
        "445",
        "446",
        "446"
      ],
      "uvs": [
        "892",
        "891",
        "893",
        "894"
      ]
    },
    {
      "vertices": [
        "871",
        "809",
        "808",
        "870"
      ],
      "normals": [
        "446",
        "446",
        "447",
        "448"
      ],
      "uvs": [
        "894",
        "893",
        "895",
        "896"
      ]
    },
    {
      "vertices": [
        "870",
        "808",
        "807",
        "869"
      ],
      "normals": [
        "448",
        "447",
        "449",
        "449"
      ],
      "uvs": [
        "896",
        "895",
        "897",
        "898"
      ]
    },
    {
      "vertices": [
        "869",
        "807",
        "806",
        "868"
      ],
      "normals": [
        "449",
        "449",
        "450",
        "450"
      ],
      "uvs": [
        "898",
        "897",
        "899",
        "900"
      ]
    },
    {
      "vertices": [
        "868",
        "806",
        "805",
        "804"
      ],
      "normals": [
        "450",
        "450",
        "417",
        "417"
      ],
      "uvs": [
        "900",
        "899",
        "836",
        "835"
      ]
    },
    {
      "vertices": [
        "1027",
        "928",
        "929",
        "931"
      ],
      "normals": [
        "451",
        "452",
        "452",
        "451"
      ],
      "uvs": [
        "901",
        "902",
        "903",
        "904"
      ]
    },
    {
      "vertices": [
        "1026",
        "1027",
        "931",
        "914"
      ],
      "normals": [
        "453",
        "451",
        "451",
        "453"
      ],
      "uvs": [
        "905",
        "901",
        "904",
        "906"
      ]
    },
    {
      "vertices": [
        "1025",
        "1026",
        "914",
        "915"
      ],
      "normals": [
        "454",
        "453",
        "453",
        "454"
      ],
      "uvs": [
        "907",
        "905",
        "906",
        "908"
      ]
    },
    {
      "vertices": [
        "1024",
        "1025",
        "915",
        "916"
      ],
      "normals": [
        "455",
        "454",
        "454",
        "455"
      ],
      "uvs": [
        "909",
        "907",
        "908",
        "910"
      ]
    },
    {
      "vertices": [
        "1023",
        "1024",
        "916",
        "917"
      ],
      "normals": [
        "456",
        "455",
        "455",
        "456"
      ],
      "uvs": [
        "911",
        "909",
        "910",
        "912"
      ]
    },
    {
      "vertices": [
        "1022",
        "1023",
        "917",
        "918"
      ],
      "normals": [
        "457",
        "456",
        "456",
        "457"
      ],
      "uvs": [
        "913",
        "911",
        "912",
        "914"
      ]
    },
    {
      "vertices": [
        "1021",
        "1022",
        "918",
        "919"
      ],
      "normals": [
        "458",
        "457",
        "457",
        "458"
      ],
      "uvs": [
        "915",
        "913",
        "914",
        "916"
      ]
    },
    {
      "vertices": [
        "1020",
        "1021",
        "919",
        "920"
      ],
      "normals": [
        "459",
        "458",
        "458",
        "459"
      ],
      "uvs": [
        "917",
        "915",
        "916",
        "918"
      ]
    },
    {
      "vertices": [
        "1019",
        "1020",
        "920",
        "921"
      ],
      "normals": [
        "460",
        "459",
        "459",
        "460"
      ],
      "uvs": [
        "919",
        "917",
        "918",
        "920"
      ]
    },
    {
      "vertices": [
        "1018",
        "1019",
        "921",
        "922"
      ],
      "normals": [
        "461",
        "460",
        "460",
        "461"
      ],
      "uvs": [
        "921",
        "919",
        "920",
        "922"
      ]
    },
    {
      "vertices": [
        "1017",
        "1018",
        "922",
        "923"
      ],
      "normals": [
        "462",
        "461",
        "461",
        "462"
      ],
      "uvs": [
        "923",
        "921",
        "922",
        "924"
      ]
    },
    {
      "vertices": [
        "1016",
        "1017",
        "923",
        "924"
      ],
      "normals": [
        "463",
        "462",
        "462",
        "463"
      ],
      "uvs": [
        "925",
        "923",
        "924",
        "926"
      ]
    },
    {
      "vertices": [
        "1015",
        "1016",
        "924",
        "925"
      ],
      "normals": [
        "464",
        "463",
        "463",
        "464"
      ],
      "uvs": [
        "927",
        "925",
        "926",
        "928"
      ]
    },
    {
      "vertices": [
        "1014",
        "1015",
        "925",
        "926"
      ],
      "normals": [
        "465",
        "464",
        "464",
        "465"
      ],
      "uvs": [
        "929",
        "927",
        "928",
        "930"
      ]
    },
    {
      "vertices": [
        "1013",
        "1014",
        "926",
        "899"
      ],
      "normals": [
        "466",
        "465",
        "465",
        "466"
      ],
      "uvs": [
        "931",
        "929",
        "930",
        "932"
      ]
    },
    {
      "vertices": [
        "1012",
        "1013",
        "899",
        "900"
      ],
      "normals": [
        "467",
        "466",
        "466",
        "467"
      ],
      "uvs": [
        "933",
        "931",
        "932",
        "934"
      ]
    },
    {
      "vertices": [
        "1011",
        "1012",
        "900",
        "901"
      ],
      "normals": [
        "468",
        "467",
        "467",
        "468"
      ],
      "uvs": [
        "935",
        "933",
        "934",
        "936"
      ]
    },
    {
      "vertices": [
        "1010",
        "1011",
        "901",
        "902"
      ],
      "normals": [
        "469",
        "468",
        "468",
        "469"
      ],
      "uvs": [
        "937",
        "938",
        "939",
        "940"
      ]
    },
    {
      "vertices": [
        "1009",
        "1010",
        "902",
        "903"
      ],
      "normals": [
        "470",
        "469",
        "469",
        "470"
      ],
      "uvs": [
        "941",
        "937",
        "940",
        "942"
      ]
    },
    {
      "vertices": [
        "1008",
        "1009",
        "903",
        "904"
      ],
      "normals": [
        "471",
        "470",
        "470",
        "471"
      ],
      "uvs": [
        "943",
        "941",
        "942",
        "944"
      ]
    },
    {
      "vertices": [
        "1007",
        "1008",
        "904",
        "905"
      ],
      "normals": [
        "472",
        "471",
        "471",
        "472"
      ],
      "uvs": [
        "945",
        "943",
        "944",
        "946"
      ]
    },
    {
      "vertices": [
        "1006",
        "1007",
        "905",
        "906"
      ],
      "normals": [
        "473",
        "472",
        "472",
        "473"
      ],
      "uvs": [
        "947",
        "945",
        "946",
        "948"
      ]
    },
    {
      "vertices": [
        "1005",
        "1006",
        "906",
        "907"
      ],
      "normals": [
        "474",
        "473",
        "473",
        "474"
      ],
      "uvs": [
        "949",
        "947",
        "948",
        "950"
      ]
    },
    {
      "vertices": [
        "1004",
        "1005",
        "907",
        "908"
      ],
      "normals": [
        "475",
        "474",
        "474",
        "475"
      ],
      "uvs": [
        "951",
        "949",
        "950",
        "952"
      ]
    },
    {
      "vertices": [
        "1003",
        "1004",
        "908",
        "909"
      ],
      "normals": [
        "476",
        "475",
        "475",
        "476"
      ],
      "uvs": [
        "953",
        "951",
        "952",
        "954"
      ]
    },
    {
      "vertices": [
        "1002",
        "1003",
        "909",
        "910"
      ],
      "normals": [
        "477",
        "476",
        "476",
        "477"
      ],
      "uvs": [
        "955",
        "953",
        "954",
        "956"
      ]
    },
    {
      "vertices": [
        "1001",
        "1002",
        "910",
        "911"
      ],
      "normals": [
        "478",
        "477",
        "477",
        "478"
      ],
      "uvs": [
        "957",
        "955",
        "956",
        "958"
      ]
    },
    {
      "vertices": [
        "1000",
        "1001",
        "911",
        "912"
      ],
      "normals": [
        "479",
        "478",
        "478",
        "479"
      ],
      "uvs": [
        "959",
        "957",
        "958",
        "960"
      ]
    },
    {
      "vertices": [
        "999",
        "1000",
        "912",
        "913"
      ],
      "normals": [
        "480",
        "479",
        "479",
        "480"
      ],
      "uvs": [
        "961",
        "959",
        "960",
        "962"
      ]
    },
    {
      "vertices": [
        "998",
        "999",
        "913",
        "927"
      ],
      "normals": [
        "481",
        "480",
        "480",
        "481"
      ],
      "uvs": [
        "963",
        "961",
        "962",
        "964"
      ]
    },
    {
      "vertices": [
        "997",
        "998",
        "927",
        "930"
      ],
      "normals": [
        "482",
        "481",
        "481",
        "482"
      ],
      "uvs": [
        "965",
        "963",
        "964",
        "966"
      ]
    },
    {
      "vertices": [
        "928",
        "997",
        "930",
        "929"
      ],
      "normals": [
        "452",
        "482",
        "482",
        "452"
      ],
      "uvs": [
        "902",
        "965",
        "966",
        "903"
      ]
    },
    {
      "vertices": [
        "964",
        "1058",
        "996",
        "965"
      ],
      "normals": [
        "483",
        "484",
        "484",
        "483"
      ],
      "uvs": [
        "967",
        "968",
        "969",
        "970"
      ]
    },
    {
      "vertices": [
        "1058",
        "1057",
        "995",
        "996"
      ],
      "normals": [
        "484",
        "485",
        "485",
        "484"
      ],
      "uvs": [
        "968",
        "971",
        "972",
        "969"
      ]
    },
    {
      "vertices": [
        "1057",
        "1056",
        "994",
        "995"
      ],
      "normals": [
        "485",
        "486",
        "486",
        "485"
      ],
      "uvs": [
        "971",
        "973",
        "974",
        "972"
      ]
    },
    {
      "vertices": [
        "1056",
        "1055",
        "993",
        "994"
      ],
      "normals": [
        "486",
        "487",
        "487",
        "486"
      ],
      "uvs": [
        "973",
        "975",
        "976",
        "974"
      ]
    },
    {
      "vertices": [
        "1055",
        "1054",
        "992",
        "993"
      ],
      "normals": [
        "487",
        "488",
        "488",
        "487"
      ],
      "uvs": [
        "975",
        "977",
        "978",
        "976"
      ]
    },
    {
      "vertices": [
        "1054",
        "1053",
        "991",
        "992"
      ],
      "normals": [
        "488",
        "489",
        "489",
        "488"
      ],
      "uvs": [
        "977",
        "979",
        "980",
        "978"
      ]
    },
    {
      "vertices": [
        "1053",
        "1052",
        "990",
        "991"
      ],
      "normals": [
        "489",
        "490",
        "490",
        "489"
      ],
      "uvs": [
        "979",
        "981",
        "982",
        "980"
      ]
    },
    {
      "vertices": [
        "1052",
        "1051",
        "989",
        "990"
      ],
      "normals": [
        "490",
        "491",
        "491",
        "490"
      ],
      "uvs": [
        "981",
        "983",
        "984",
        "982"
      ]
    },
    {
      "vertices": [
        "1051",
        "1050",
        "988",
        "989"
      ],
      "normals": [
        "491",
        "492",
        "492",
        "491"
      ],
      "uvs": [
        "983",
        "985",
        "986",
        "984"
      ]
    },
    {
      "vertices": [
        "1050",
        "1049",
        "987",
        "988"
      ],
      "normals": [
        "492",
        "493",
        "493",
        "492"
      ],
      "uvs": [
        "985",
        "987",
        "988",
        "986"
      ]
    },
    {
      "vertices": [
        "1049",
        "1048",
        "986",
        "987"
      ],
      "normals": [
        "493",
        "494",
        "494",
        "493"
      ],
      "uvs": [
        "987",
        "989",
        "990",
        "988"
      ]
    },
    {
      "vertices": [
        "1048",
        "1047",
        "985",
        "986"
      ],
      "normals": [
        "494",
        "495",
        "495",
        "494"
      ],
      "uvs": [
        "989",
        "991",
        "992",
        "990"
      ]
    },
    {
      "vertices": [
        "1047",
        "1046",
        "984",
        "985"
      ],
      "normals": [
        "495",
        "496",
        "496",
        "495"
      ],
      "uvs": [
        "991",
        "993",
        "994",
        "992"
      ]
    },
    {
      "vertices": [
        "1046",
        "1045",
        "983",
        "984"
      ],
      "normals": [
        "496",
        "497",
        "497",
        "496"
      ],
      "uvs": [
        "993",
        "995",
        "996",
        "994"
      ]
    },
    {
      "vertices": [
        "1045",
        "1044",
        "982",
        "983"
      ],
      "normals": [
        "497",
        "498",
        "498",
        "497"
      ],
      "uvs": [
        "995",
        "997",
        "998",
        "996"
      ]
    },
    {
      "vertices": [
        "1044",
        "1043",
        "981",
        "982"
      ],
      "normals": [
        "498",
        "499",
        "499",
        "498"
      ],
      "uvs": [
        "999",
        "1000",
        "1001",
        "1002"
      ]
    },
    {
      "vertices": [
        "1043",
        "1042",
        "980",
        "981"
      ],
      "normals": [
        "499",
        "500",
        "500",
        "499"
      ],
      "uvs": [
        "1000",
        "1003",
        "1004",
        "1001"
      ]
    },
    {
      "vertices": [
        "1042",
        "1041",
        "979",
        "980"
      ],
      "normals": [
        "500",
        "501",
        "501",
        "500"
      ],
      "uvs": [
        "1003",
        "1005",
        "1006",
        "1004"
      ]
    },
    {
      "vertices": [
        "1041",
        "1040",
        "978",
        "979"
      ],
      "normals": [
        "501",
        "502",
        "502",
        "501"
      ],
      "uvs": [
        "1005",
        "1007",
        "1008",
        "1006"
      ]
    },
    {
      "vertices": [
        "1040",
        "1039",
        "977",
        "978"
      ],
      "normals": [
        "502",
        "503",
        "503",
        "502"
      ],
      "uvs": [
        "1007",
        "1009",
        "1010",
        "1008"
      ]
    },
    {
      "vertices": [
        "1039",
        "1038",
        "976",
        "977"
      ],
      "normals": [
        "503",
        "504",
        "505",
        "503"
      ],
      "uvs": [
        "1009",
        "1011",
        "1012",
        "1010"
      ]
    },
    {
      "vertices": [
        "1038",
        "1037",
        "975",
        "976"
      ],
      "normals": [
        "504",
        "506",
        "506",
        "505"
      ],
      "uvs": [
        "1011",
        "1013",
        "1014",
        "1012"
      ]
    },
    {
      "vertices": [
        "1037",
        "1036",
        "974",
        "975"
      ],
      "normals": [
        "506",
        "507",
        "507",
        "506"
      ],
      "uvs": [
        "1013",
        "1015",
        "1016",
        "1014"
      ]
    },
    {
      "vertices": [
        "1036",
        "1035",
        "973",
        "974"
      ],
      "normals": [
        "507",
        "508",
        "508",
        "507"
      ],
      "uvs": [
        "1015",
        "1017",
        "1018",
        "1016"
      ]
    },
    {
      "vertices": [
        "1035",
        "1034",
        "972",
        "973"
      ],
      "normals": [
        "508",
        "509",
        "509",
        "508"
      ],
      "uvs": [
        "1017",
        "1019",
        "1020",
        "1018"
      ]
    },
    {
      "vertices": [
        "1034",
        "1033",
        "971",
        "972"
      ],
      "normals": [
        "509",
        "510",
        "510",
        "509"
      ],
      "uvs": [
        "1019",
        "1021",
        "1022",
        "1020"
      ]
    },
    {
      "vertices": [
        "1033",
        "1032",
        "970",
        "971"
      ],
      "normals": [
        "510",
        "511",
        "511",
        "510"
      ],
      "uvs": [
        "1021",
        "1023",
        "1024",
        "1022"
      ]
    },
    {
      "vertices": [
        "1032",
        "1031",
        "969",
        "970"
      ],
      "normals": [
        "511",
        "512",
        "512",
        "511"
      ],
      "uvs": [
        "1023",
        "1025",
        "1026",
        "1024"
      ]
    },
    {
      "vertices": [
        "1031",
        "1030",
        "968",
        "969"
      ],
      "normals": [
        "512",
        "513",
        "513",
        "512"
      ],
      "uvs": [
        "1025",
        "1027",
        "1028",
        "1026"
      ]
    },
    {
      "vertices": [
        "1030",
        "1029",
        "967",
        "968"
      ],
      "normals": [
        "513",
        "514",
        "514",
        "513"
      ],
      "uvs": [
        "1027",
        "1029",
        "1030",
        "1028"
      ]
    },
    {
      "vertices": [
        "1029",
        "1028",
        "966",
        "967"
      ],
      "normals": [
        "514",
        "515",
        "515",
        "514"
      ],
      "uvs": [
        "1029",
        "1031",
        "1032",
        "1030"
      ]
    },
    {
      "vertices": [
        "1028",
        "964",
        "965",
        "966"
      ],
      "normals": [
        "515",
        "483",
        "483",
        "515"
      ],
      "uvs": [
        "1031",
        "967",
        "970",
        "1032"
      ]
    },
    {
      "vertices": [
        "959",
        "958",
        "1084",
        "1085"
      ],
      "normals": [
        "516",
        "517",
        "517",
        "516"
      ],
      "uvs": [
        "1033",
        "1034",
        "1035",
        "1036"
      ]
    },
    {
      "vertices": [
        "948",
        "1074",
        "1075",
        "949"
      ],
      "normals": [
        "518",
        "518",
        "519",
        "519"
      ],
      "uvs": [
        "1037",
        "1038",
        "1039",
        "1040"
      ]
    },
    {
      "vertices": [
        "1073",
        "1074",
        "948",
        "947"
      ],
      "normals": [
        "520",
        "518",
        "518",
        "520"
      ],
      "uvs": [
        "1041",
        "1038",
        "1037",
        "1042"
      ]
    },
    {
      "vertices": [
        "957",
        "956",
        "1082",
        "1083"
      ],
      "normals": [
        "521",
        "522",
        "522",
        "521"
      ],
      "uvs": [
        "1043",
        "1044",
        "1045",
        "1046"
      ]
    },
    {
      "vertices": [
        "1072",
        "1073",
        "947",
        "946"
      ],
      "normals": [
        "523",
        "520",
        "520",
        "523"
      ],
      "uvs": [
        "1047",
        "1048",
        "1049",
        "1050"
      ]
    },
    {
      "vertices": [
        "938",
        "937",
        "1063",
        "1064"
      ],
      "normals": [
        "524",
        "525",
        "525",
        "524"
      ],
      "uvs": [
        "1051",
        "1052",
        "1053",
        "1054"
      ]
    },
    {
      "vertices": [
        "1078",
        "1079",
        "953",
        "952"
      ],
      "normals": [
        "526",
        "527",
        "527",
        "526"
      ],
      "uvs": [
        "1055",
        "1056",
        "1057",
        "1058"
      ]
    },
    {
      "vertices": [
        "1063",
        "937",
        "936",
        "1062"
      ],
      "normals": [
        "525",
        "525",
        "528",
        "528"
      ],
      "uvs": [
        "1053",
        "1052",
        "1059",
        "1060"
      ]
    },
    {
      "vertices": [
        "963",
        "962",
        "1088",
        "1089"
      ],
      "normals": [
        "529",
        "530",
        "530",
        "529"
      ],
      "uvs": [
        "1061",
        "1062",
        "1063",
        "1064"
      ]
    },
    {
      "vertices": [
        "935",
        "934",
        "1060",
        "1061"
      ],
      "normals": [
        "531",
        "532",
        "532",
        "531"
      ],
      "uvs": [
        "1065",
        "1066",
        "1067",
        "1068"
      ]
    },
    {
      "vertices": [
        "1071",
        "1072",
        "946",
        "945"
      ],
      "normals": [
        "533",
        "523",
        "523",
        "533"
      ],
      "uvs": [
        "1069",
        "1047",
        "1050",
        "1070"
      ]
    },
    {
      "vertices": [
        "1069",
        "1070",
        "944",
        "943"
      ],
      "normals": [
        "534",
        "535",
        "535",
        "534"
      ],
      "uvs": [
        "1071",
        "1072",
        "1073",
        "1074"
      ]
    },
    {
      "vertices": [
        "1079",
        "1080",
        "954",
        "953"
      ],
      "normals": [
        "527",
        "536",
        "536",
        "527"
      ],
      "uvs": [
        "1056",
        "1075",
        "1076",
        "1057"
      ]
    },
    {
      "vertices": [
        "1065",
        "939",
        "938",
        "1064"
      ],
      "normals": [
        "537",
        "537",
        "524",
        "524"
      ],
      "uvs": [
        "1077",
        "1078",
        "1051",
        "1054"
      ]
    },
    {
      "vertices": [
        "1070",
        "1071",
        "945",
        "944"
      ],
      "normals": [
        "535",
        "533",
        "533",
        "535"
      ],
      "uvs": [
        "1072",
        "1069",
        "1070",
        "1073"
      ]
    },
    {
      "vertices": [
        "933",
        "1090",
        "932",
        "1059"
      ],
      "normals": [
        "538",
        "539",
        "539",
        "538"
      ],
      "uvs": [
        "1079",
        "1080",
        "1081",
        "1082"
      ]
    },
    {
      "vertices": [
        "940",
        "939",
        "1065",
        "1066"
      ],
      "normals": [
        "540",
        "537",
        "537",
        "540"
      ],
      "uvs": [
        "1083",
        "1078",
        "1077",
        "1084"
      ]
    },
    {
      "vertices": [
        "960",
        "959",
        "1085",
        "1086"
      ],
      "normals": [
        "541",
        "516",
        "516",
        "541"
      ],
      "uvs": [
        "1085",
        "1033",
        "1036",
        "1086"
      ]
    },
    {
      "vertices": [
        "1068",
        "1069",
        "943",
        "942"
      ],
      "normals": [
        "542",
        "534",
        "534",
        "542"
      ],
      "uvs": [
        "1087",
        "1071",
        "1074",
        "1088"
      ]
    },
    {
      "vertices": [
        "934",
        "933",
        "1059",
        "1060"
      ],
      "normals": [
        "532",
        "538",
        "538",
        "532"
      ],
      "uvs": [
        "1066",
        "1079",
        "1082",
        "1067"
      ]
    },
    {
      "vertices": [
        "1090",
        "963",
        "1089",
        "932"
      ],
      "normals": [
        "539",
        "529",
        "529",
        "539"
      ],
      "uvs": [
        "1080",
        "1061",
        "1064",
        "1081"
      ]
    },
    {
      "vertices": [
        "956",
        "955",
        "1081",
        "1082"
      ],
      "normals": [
        "522",
        "543",
        "543",
        "522"
      ],
      "uvs": [
        "1044",
        "1089",
        "1090",
        "1045"
      ]
    },
    {
      "vertices": [
        "1066",
        "1067",
        "941",
        "940"
      ],
      "normals": [
        "540",
        "544",
        "544",
        "540"
      ],
      "uvs": [
        "1084",
        "1091",
        "1092",
        "1083"
      ]
    },
    {
      "vertices": [
        "961",
        "960",
        "1086",
        "1087"
      ],
      "normals": [
        "545",
        "541",
        "541",
        "545"
      ],
      "uvs": [
        "1093",
        "1085",
        "1086",
        "1094"
      ]
    },
    {
      "vertices": [
        "936",
        "935",
        "1061",
        "1062"
      ],
      "normals": [
        "528",
        "531",
        "531",
        "528"
      ],
      "uvs": [
        "1059",
        "1065",
        "1068",
        "1060"
      ]
    },
    {
      "vertices": [
        "1080",
        "1081",
        "955",
        "954"
      ],
      "normals": [
        "536",
        "543",
        "543",
        "536"
      ],
      "uvs": [
        "1075",
        "1090",
        "1089",
        "1076"
      ]
    },
    {
      "vertices": [
        "1077",
        "1078",
        "952",
        "951"
      ],
      "normals": [
        "546",
        "526",
        "526",
        "546"
      ],
      "uvs": [
        "1095",
        "1055",
        "1058",
        "1096"
      ]
    },
    {
      "vertices": [
        "958",
        "957",
        "1083",
        "1084"
      ],
      "normals": [
        "517",
        "521",
        "521",
        "517"
      ],
      "uvs": [
        "1034",
        "1043",
        "1046",
        "1035"
      ]
    },
    {
      "vertices": [
        "1075",
        "1076",
        "950",
        "949"
      ],
      "normals": [
        "519",
        "547",
        "547",
        "519"
      ],
      "uvs": [
        "1039",
        "1097",
        "1098",
        "1040"
      ]
    },
    {
      "vertices": [
        "1067",
        "1068",
        "942",
        "941"
      ],
      "normals": [
        "544",
        "542",
        "542",
        "544"
      ],
      "uvs": [
        "1091",
        "1087",
        "1088",
        "1092"
      ]
    },
    {
      "vertices": [
        "962",
        "961",
        "1087",
        "1088"
      ],
      "normals": [
        "530",
        "545",
        "545",
        "530"
      ],
      "uvs": [
        "1062",
        "1093",
        "1094",
        "1063"
      ]
    },
    {
      "vertices": [
        "1076",
        "1077",
        "951",
        "950"
      ],
      "normals": [
        "547",
        "546",
        "546",
        "547"
      ],
      "uvs": [
        "1097",
        "1095",
        "1096",
        "1098"
      ]
    },
    {
      "vertices": [
        "1118",
        "1149",
        "1148",
        "1117"
      ],
      "normals": [
        "548",
        "548",
        "549",
        "549"
      ],
      "uvs": [
        "1099",
        "1100",
        "1101",
        "1102"
      ]
    },
    {
      "vertices": [
        "1107",
        "1108",
        "1139",
        "1138"
      ],
      "normals": [
        "550",
        "551",
        "551",
        "550"
      ],
      "uvs": [
        "1103",
        "1104",
        "1105",
        "1106"
      ]
    },
    {
      "vertices": [
        "1137",
        "1106",
        "1107",
        "1138"
      ],
      "normals": [
        "552",
        "552",
        "550",
        "550"
      ],
      "uvs": [
        "1107",
        "1108",
        "1103",
        "1106"
      ]
    },
    {
      "vertices": [
        "1116",
        "1147",
        "1146",
        "1115"
      ],
      "normals": [
        "553",
        "553",
        "554",
        "554"
      ],
      "uvs": [
        "1109",
        "1110",
        "1111",
        "1112"
      ]
    },
    {
      "vertices": [
        "1136",
        "1105",
        "1106",
        "1137"
      ],
      "normals": [
        "555",
        "555",
        "552",
        "552"
      ],
      "uvs": [
        "1113",
        "1114",
        "1115",
        "1116"
      ]
    },
    {
      "vertices": [
        "1097",
        "1128",
        "1127",
        "1096"
      ],
      "normals": [
        "556",
        "556",
        "557",
        "557"
      ],
      "uvs": [
        "1117",
        "1118",
        "1119",
        "1120"
      ]
    },
    {
      "vertices": [
        "1142",
        "1111",
        "1112",
        "1143"
      ],
      "normals": [
        "558",
        "558",
        "559",
        "559"
      ],
      "uvs": [
        "1121",
        "1122",
        "1123",
        "1124"
      ]
    },
    {
      "vertices": [
        "1127",
        "1126",
        "1095",
        "1096"
      ],
      "normals": [
        "557",
        "560",
        "560",
        "557"
      ],
      "uvs": [
        "1119",
        "1125",
        "1126",
        "1120"
      ]
    },
    {
      "vertices": [
        "1122",
        "1153",
        "1152",
        "1121"
      ],
      "normals": [
        "561",
        "561",
        "562",
        "562"
      ],
      "uvs": [
        "1127",
        "1128",
        "1129",
        "1130"
      ]
    },
    {
      "vertices": [
        "1094",
        "1125",
        "1124",
        "1093"
      ],
      "normals": [
        "563",
        "563",
        "564",
        "564"
      ],
      "uvs": [
        "1131",
        "1132",
        "1133",
        "1134"
      ]
    },
    {
      "vertices": [
        "1135",
        "1104",
        "1105",
        "1136"
      ],
      "normals": [
        "565",
        "565",
        "555",
        "555"
      ],
      "uvs": [
        "1135",
        "1136",
        "1114",
        "1113"
      ]
    },
    {
      "vertices": [
        "1133",
        "1102",
        "1103",
        "1134"
      ],
      "normals": [
        "566",
        "566",
        "567",
        "567"
      ],
      "uvs": [
        "1137",
        "1138",
        "1139",
        "1140"
      ]
    },
    {
      "vertices": [
        "1143",
        "1112",
        "1113",
        "1144"
      ],
      "normals": [
        "559",
        "559",
        "568",
        "568"
      ],
      "uvs": [
        "1124",
        "1123",
        "1141",
        "1142"
      ]
    },
    {
      "vertices": [
        "1129",
        "1128",
        "1097",
        "1098"
      ],
      "normals": [
        "569",
        "556",
        "556",
        "569"
      ],
      "uvs": [
        "1143",
        "1118",
        "1117",
        "1144"
      ]
    },
    {
      "vertices": [
        "1134",
        "1103",
        "1104",
        "1135"
      ],
      "normals": [
        "567",
        "567",
        "565",
        "565"
      ],
      "uvs": [
        "1140",
        "1139",
        "1136",
        "1135"
      ]
    },
    {
      "vertices": [
        "1092",
        "1123",
        "1091",
        "1154"
      ],
      "normals": [
        "570",
        "570",
        "571",
        "571"
      ],
      "uvs": [
        "1145",
        "1146",
        "1147",
        "1148"
      ]
    },
    {
      "vertices": [
        "1099",
        "1130",
        "1129",
        "1098"
      ],
      "normals": [
        "572",
        "572",
        "569",
        "569"
      ],
      "uvs": [
        "1149",
        "1150",
        "1143",
        "1144"
      ]
    },
    {
      "vertices": [
        "1119",
        "1150",
        "1149",
        "1118"
      ],
      "normals": [
        "573",
        "573",
        "548",
        "548"
      ],
      "uvs": [
        "1151",
        "1152",
        "1100",
        "1099"
      ]
    },
    {
      "vertices": [
        "1132",
        "1101",
        "1102",
        "1133"
      ],
      "normals": [
        "574",
        "574",
        "566",
        "566"
      ],
      "uvs": [
        "1153",
        "1154",
        "1138",
        "1137"
      ]
    },
    {
      "vertices": [
        "1093",
        "1124",
        "1123",
        "1092"
      ],
      "normals": [
        "564",
        "564",
        "570",
        "570"
      ],
      "uvs": [
        "1134",
        "1133",
        "1146",
        "1145"
      ]
    },
    {
      "vertices": [
        "1154",
        "1091",
        "1153",
        "1122"
      ],
      "normals": [
        "571",
        "571",
        "561",
        "561"
      ],
      "uvs": [
        "1148",
        "1147",
        "1128",
        "1127"
      ]
    },
    {
      "vertices": [
        "1115",
        "1146",
        "1145",
        "1114"
      ],
      "normals": [
        "554",
        "554",
        "575",
        "575"
      ],
      "uvs": [
        "1112",
        "1111",
        "1155",
        "1156"
      ]
    },
    {
      "vertices": [
        "1130",
        "1099",
        "1100",
        "1131"
      ],
      "normals": [
        "572",
        "572",
        "576",
        "576"
      ],
      "uvs": [
        "1150",
        "1149",
        "1157",
        "1158"
      ]
    },
    {
      "vertices": [
        "1120",
        "1151",
        "1150",
        "1119"
      ],
      "normals": [
        "577",
        "577",
        "573",
        "573"
      ],
      "uvs": [
        "1159",
        "1160",
        "1152",
        "1151"
      ]
    },
    {
      "vertices": [
        "1095",
        "1126",
        "1125",
        "1094"
      ],
      "normals": [
        "560",
        "560",
        "563",
        "563"
      ],
      "uvs": [
        "1126",
        "1125",
        "1132",
        "1131"
      ]
    },
    {
      "vertices": [
        "1144",
        "1113",
        "1114",
        "1145"
      ],
      "normals": [
        "568",
        "568",
        "575",
        "575"
      ],
      "uvs": [
        "1142",
        "1141",
        "1156",
        "1155"
      ]
    },
    {
      "vertices": [
        "1141",
        "1110",
        "1111",
        "1142"
      ],
      "normals": [
        "578",
        "578",
        "558",
        "558"
      ],
      "uvs": [
        "1161",
        "1162",
        "1122",
        "1121"
      ]
    },
    {
      "vertices": [
        "1117",
        "1148",
        "1147",
        "1116"
      ],
      "normals": [
        "549",
        "549",
        "553",
        "553"
      ],
      "uvs": [
        "1102",
        "1101",
        "1110",
        "1109"
      ]
    },
    {
      "vertices": [
        "1139",
        "1108",
        "1109",
        "1140"
      ],
      "normals": [
        "551",
        "551",
        "579",
        "579"
      ],
      "uvs": [
        "1105",
        "1104",
        "1163",
        "1164"
      ]
    },
    {
      "vertices": [
        "1131",
        "1100",
        "1101",
        "1132"
      ],
      "normals": [
        "576",
        "576",
        "574",
        "574"
      ],
      "uvs": [
        "1158",
        "1157",
        "1154",
        "1153"
      ]
    },
    {
      "vertices": [
        "1121",
        "1152",
        "1151",
        "1120"
      ],
      "normals": [
        "562",
        "562",
        "577",
        "577"
      ],
      "uvs": [
        "1130",
        "1129",
        "1160",
        "1159"
      ]
    },
    {
      "vertices": [
        "1140",
        "1109",
        "1110",
        "1141"
      ],
      "normals": [
        "579",
        "579",
        "578",
        "578"
      ],
      "uvs": [
        "1164",
        "1163",
        "1162",
        "1161"
      ]
    },
    {
      "vertices": [
        "1312",
        "1311",
        "1343",
        "1344"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1165",
        "1166",
        "1167",
        "1168"
      ]
    },
    {
      "vertices": [
        "1285",
        "1284",
        "1316",
        "1317"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1169",
        "1170",
        "1171",
        "1172"
      ]
    },
    {
      "vertices": [
        "1305",
        "1304",
        "1336",
        "1337"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1173",
        "1174",
        "1175",
        "1176"
      ]
    },
    {
      "vertices": [
        "1298",
        "1297",
        "1329",
        "1330"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1177",
        "1178",
        "1179",
        "1180"
      ]
    },
    {
      "vertices": [
        "1291",
        "1290",
        "1322",
        "1323"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1181",
        "1182",
        "1183",
        "1184"
      ]
    },
    {
      "vertices": [
        "1311",
        "1310",
        "1342",
        "1343"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1166",
        "1185",
        "1186",
        "1167"
      ]
    },
    {
      "vertices": [
        "1304",
        "1303",
        "1335",
        "1336"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1174",
        "1187",
        "1188",
        "1175"
      ]
    },
    {
      "vertices": [
        "1297",
        "1296",
        "1328",
        "1329"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1178",
        "1189",
        "1190",
        "1179"
      ]
    },
    {
      "vertices": [
        "1284",
        "1283",
        "1315",
        "1316"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1170",
        "1191",
        "1192",
        "1171"
      ]
    },
    {
      "vertices": [
        "1290",
        "1289",
        "1321",
        "1322"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1182",
        "1193",
        "1194",
        "1183"
      ]
    },
    {
      "vertices": [
        "1310",
        "1309",
        "1341",
        "1342"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1185",
        "1195",
        "1196",
        "1186"
      ]
    },
    {
      "vertices": [
        "1303",
        "1302",
        "1334",
        "1335"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1187",
        "1197",
        "1198",
        "1188"
      ]
    },
    {
      "vertices": [
        "1296",
        "1295",
        "1327",
        "1328"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1189",
        "1199",
        "1200",
        "1190"
      ]
    },
    {
      "vertices": [
        "1289",
        "1288",
        "1320",
        "1321"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1193",
        "1201",
        "1202",
        "1194"
      ]
    },
    {
      "vertices": [
        "1309",
        "1308",
        "1340",
        "1341"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1195",
        "1203",
        "1204",
        "1196"
      ]
    },
    {
      "vertices": [
        "1302",
        "1301",
        "1333",
        "1334"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1197",
        "1205",
        "1206",
        "1198"
      ]
    },
    {
      "vertices": [
        "1295",
        "1294",
        "1326",
        "1327"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1199",
        "1207",
        "1208",
        "1200"
      ]
    },
    {
      "vertices": [
        "1288",
        "1287",
        "1319",
        "1320"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1201",
        "1209",
        "1210",
        "1202"
      ]
    },
    {
      "vertices": [
        "1308",
        "1307",
        "1339",
        "1340"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1203",
        "1211",
        "1212",
        "1204"
      ]
    },
    {
      "vertices": [
        "1283",
        "1314",
        "1346",
        "1315"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1191",
        "1213",
        "1214",
        "1192"
      ]
    },
    {
      "vertices": [
        "1301",
        "1300",
        "1332",
        "1333"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1205",
        "1215",
        "1216",
        "1206"
      ]
    },
    {
      "vertices": [
        "1294",
        "1293",
        "1325",
        "1326"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1207",
        "1217",
        "1218",
        "1208"
      ]
    },
    {
      "vertices": [
        "1314",
        "1313",
        "1345",
        "1346"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1213",
        "1219",
        "1220",
        "1214"
      ]
    },
    {
      "vertices": [
        "1287",
        "1286",
        "1318",
        "1319"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1209",
        "1221",
        "1222",
        "1210"
      ]
    },
    {
      "vertices": [
        "1307",
        "1306",
        "1338",
        "1339"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1211",
        "1223",
        "1224",
        "1212"
      ]
    },
    {
      "vertices": [
        "1300",
        "1299",
        "1331",
        "1332"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1215",
        "1225",
        "1226",
        "1216"
      ]
    },
    {
      "vertices": [
        "1293",
        "1292",
        "1324",
        "1325"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1217",
        "1227",
        "1228",
        "1218"
      ]
    },
    {
      "vertices": [
        "1313",
        "1312",
        "1344",
        "1345"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1219",
        "1165",
        "1168",
        "1220"
      ]
    },
    {
      "vertices": [
        "1286",
        "1285",
        "1317",
        "1318"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1221",
        "1169",
        "1172",
        "1222"
      ]
    },
    {
      "vertices": [
        "1306",
        "1305",
        "1337",
        "1338"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1223",
        "1173",
        "1176",
        "1224"
      ]
    },
    {
      "vertices": [
        "1299",
        "1298",
        "1330",
        "1331"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1225",
        "1229",
        "1230",
        "1226"
      ]
    },
    {
      "vertices": [
        "1292",
        "1291",
        "1323",
        "1324"
      ],
      "normals": [
        "580",
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1227",
        "1181",
        "1184",
        "1228"
      ]
    },
    {
      "vertices": [
        "1376",
        "1408",
        "1407",
        "1375"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1231",
        "1232",
        "1233",
        "1234"
      ]
    },
    {
      "vertices": [
        "1349",
        "1381",
        "1380",
        "1348"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1235",
        "1236",
        "1237",
        "1238"
      ]
    },
    {
      "vertices": [
        "1369",
        "1401",
        "1400",
        "1368"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1239",
        "1240",
        "1241",
        "1242"
      ]
    },
    {
      "vertices": [
        "1362",
        "1394",
        "1393",
        "1361"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1243",
        "1244",
        "1245",
        "1246"
      ]
    },
    {
      "vertices": [
        "1355",
        "1387",
        "1386",
        "1354"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1247",
        "1248",
        "1249",
        "1250"
      ]
    },
    {
      "vertices": [
        "1375",
        "1407",
        "1406",
        "1374"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1234",
        "1233",
        "1251",
        "1252"
      ]
    },
    {
      "vertices": [
        "1368",
        "1400",
        "1399",
        "1367"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1242",
        "1241",
        "1253",
        "1254"
      ]
    },
    {
      "vertices": [
        "1361",
        "1393",
        "1392",
        "1360"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1246",
        "1245",
        "1255",
        "1256"
      ]
    },
    {
      "vertices": [
        "1348",
        "1380",
        "1379",
        "1347"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1238",
        "1237",
        "1257",
        "1258"
      ]
    },
    {
      "vertices": [
        "1354",
        "1386",
        "1385",
        "1353"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1250",
        "1249",
        "1259",
        "1260"
      ]
    },
    {
      "vertices": [
        "1374",
        "1406",
        "1405",
        "1373"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1252",
        "1251",
        "1261",
        "1262"
      ]
    },
    {
      "vertices": [
        "1367",
        "1399",
        "1398",
        "1366"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1254",
        "1253",
        "1263",
        "1264"
      ]
    },
    {
      "vertices": [
        "1360",
        "1392",
        "1391",
        "1359"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1256",
        "1255",
        "1265",
        "1266"
      ]
    },
    {
      "vertices": [
        "1353",
        "1385",
        "1384",
        "1352"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1260",
        "1259",
        "1267",
        "1268"
      ]
    },
    {
      "vertices": [
        "1373",
        "1405",
        "1404",
        "1372"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1262",
        "1261",
        "1269",
        "1270"
      ]
    },
    {
      "vertices": [
        "1366",
        "1398",
        "1397",
        "1365"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1264",
        "1263",
        "1271",
        "1272"
      ]
    },
    {
      "vertices": [
        "1359",
        "1391",
        "1390",
        "1358"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1266",
        "1265",
        "1273",
        "1274"
      ]
    },
    {
      "vertices": [
        "1352",
        "1384",
        "1383",
        "1351"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1268",
        "1267",
        "1275",
        "1276"
      ]
    },
    {
      "vertices": [
        "1372",
        "1404",
        "1403",
        "1371"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1270",
        "1269",
        "1277",
        "1278"
      ]
    },
    {
      "vertices": [
        "1347",
        "1379",
        "1410",
        "1378"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1258",
        "1257",
        "1279",
        "1280"
      ]
    },
    {
      "vertices": [
        "1365",
        "1397",
        "1396",
        "1364"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1272",
        "1271",
        "1281",
        "1282"
      ]
    },
    {
      "vertices": [
        "1358",
        "1390",
        "1389",
        "1357"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1274",
        "1273",
        "1283",
        "1284"
      ]
    },
    {
      "vertices": [
        "1378",
        "1410",
        "1409",
        "1377"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1280",
        "1279",
        "1285",
        "1286"
      ]
    },
    {
      "vertices": [
        "1351",
        "1383",
        "1382",
        "1350"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1276",
        "1275",
        "1287",
        "1288"
      ]
    },
    {
      "vertices": [
        "1371",
        "1403",
        "1402",
        "1370"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1278",
        "1277",
        "1289",
        "1290"
      ]
    },
    {
      "vertices": [
        "1364",
        "1396",
        "1395",
        "1363"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1282",
        "1281",
        "1291",
        "1292"
      ]
    },
    {
      "vertices": [
        "1357",
        "1389",
        "1388",
        "1356"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1284",
        "1283",
        "1293",
        "1294"
      ]
    },
    {
      "vertices": [
        "1377",
        "1409",
        "1408",
        "1376"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1286",
        "1285",
        "1232",
        "1231"
      ]
    },
    {
      "vertices": [
        "1350",
        "1382",
        "1381",
        "1349"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1288",
        "1287",
        "1236",
        "1235"
      ]
    },
    {
      "vertices": [
        "1370",
        "1402",
        "1401",
        "1369"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1290",
        "1289",
        "1240",
        "1239"
      ]
    },
    {
      "vertices": [
        "1363",
        "1395",
        "1394",
        "1362"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1292",
        "1291",
        "1295",
        "1296"
      ]
    },
    {
      "vertices": [
        "1356",
        "1388",
        "1387",
        "1355"
      ],
      "normals": [
        "581",
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1294",
        "1293",
        "1248",
        "1247"
      ]
    },
    {
      "vertices": [
        "1166",
        "1165",
        "1196",
        "1197"
      ],
      "normals": [
        "582",
        "583",
        "583",
        "582"
      ],
      "uvs": [
        "1297",
        "1298",
        "1299",
        "1300"
      ]
    },
    {
      "vertices": [
        "1186",
        "1185",
        "1216",
        "1217"
      ],
      "normals": [
        "584",
        "585",
        "585",
        "584"
      ],
      "uvs": [
        "1301",
        "1302",
        "1303",
        "1304"
      ]
    },
    {
      "vertices": [
        "1159",
        "1158",
        "1189",
        "1190"
      ],
      "normals": [
        "586",
        "587",
        "587",
        "586"
      ],
      "uvs": [
        "1305",
        "1306",
        "1307",
        "1308"
      ]
    },
    {
      "vertices": [
        "1179",
        "1178",
        "1209",
        "1210"
      ],
      "normals": [
        "588",
        "589",
        "589",
        "588"
      ],
      "uvs": [
        "1309",
        "1310",
        "1311",
        "1312"
      ]
    },
    {
      "vertices": [
        "1172",
        "1171",
        "1202",
        "1203"
      ],
      "normals": [
        "590",
        "591",
        "591",
        "590"
      ],
      "uvs": [
        "1313",
        "1314",
        "1315",
        "1316"
      ]
    },
    {
      "vertices": [
        "1165",
        "1164",
        "1195",
        "1196"
      ],
      "normals": [
        "583",
        "592",
        "592",
        "583"
      ],
      "uvs": [
        "1298",
        "1317",
        "1318",
        "1299"
      ]
    },
    {
      "vertices": [
        "1185",
        "1184",
        "1215",
        "1216"
      ],
      "normals": [
        "585",
        "593",
        "593",
        "585"
      ],
      "uvs": [
        "1302",
        "1319",
        "1320",
        "1303"
      ]
    },
    {
      "vertices": [
        "1158",
        "1157",
        "1188",
        "1189"
      ],
      "normals": [
        "587",
        "594",
        "594",
        "587"
      ],
      "uvs": [
        "1306",
        "1321",
        "1322",
        "1307"
      ]
    },
    {
      "vertices": [
        "1178",
        "1177",
        "1208",
        "1209"
      ],
      "normals": [
        "589",
        "595",
        "595",
        "589"
      ],
      "uvs": [
        "1310",
        "1323",
        "1324",
        "1311"
      ]
    },
    {
      "vertices": [
        "1171",
        "1170",
        "1201",
        "1202"
      ],
      "normals": [
        "591",
        "596",
        "596",
        "591"
      ],
      "uvs": [
        "1314",
        "1325",
        "1326",
        "1315"
      ]
    },
    {
      "vertices": [
        "1164",
        "1163",
        "1194",
        "1195"
      ],
      "normals": [
        "592",
        "597",
        "597",
        "592"
      ],
      "uvs": [
        "1317",
        "1327",
        "1328",
        "1318"
      ]
    },
    {
      "vertices": [
        "1184",
        "1183",
        "1214",
        "1215"
      ],
      "normals": [
        "593",
        "598",
        "598",
        "593"
      ],
      "uvs": [
        "1319",
        "1329",
        "1330",
        "1320"
      ]
    },
    {
      "vertices": [
        "1157",
        "1156",
        "1155",
        "1188"
      ],
      "normals": [
        "594",
        "599",
        "599",
        "594"
      ],
      "uvs": [
        "1321",
        "1331",
        "1332",
        "1322"
      ]
    },
    {
      "vertices": [
        "1177",
        "1176",
        "1207",
        "1208"
      ],
      "normals": [
        "595",
        "600",
        "600",
        "595"
      ],
      "uvs": [
        "1323",
        "1333",
        "1334",
        "1324"
      ]
    },
    {
      "vertices": [
        "1170",
        "1169",
        "1200",
        "1201"
      ],
      "normals": [
        "596",
        "601",
        "601",
        "596"
      ],
      "uvs": [
        "1325",
        "1335",
        "1336",
        "1326"
      ]
    },
    {
      "vertices": [
        "1163",
        "1162",
        "1193",
        "1194"
      ],
      "normals": [
        "597",
        "602",
        "602",
        "597"
      ],
      "uvs": [
        "1337",
        "1338",
        "1339",
        "1340"
      ]
    },
    {
      "vertices": [
        "1183",
        "1182",
        "1213",
        "1214"
      ],
      "normals": [
        "598",
        "603",
        "603",
        "598"
      ],
      "uvs": [
        "1329",
        "1341",
        "1342",
        "1330"
      ]
    },
    {
      "vertices": [
        "1176",
        "1175",
        "1206",
        "1207"
      ],
      "normals": [
        "600",
        "604",
        "604",
        "600"
      ],
      "uvs": [
        "1333",
        "1343",
        "1344",
        "1334"
      ]
    },
    {
      "vertices": [
        "1169",
        "1168",
        "1199",
        "1200"
      ],
      "normals": [
        "601",
        "605",
        "605",
        "601"
      ],
      "uvs": [
        "1335",
        "1345",
        "1346",
        "1336"
      ]
    },
    {
      "vertices": [
        "1162",
        "1161",
        "1192",
        "1193"
      ],
      "normals": [
        "602",
        "606",
        "606",
        "602"
      ],
      "uvs": [
        "1338",
        "1347",
        "1348",
        "1339"
      ]
    },
    {
      "vertices": [
        "1182",
        "1181",
        "1212",
        "1213"
      ],
      "normals": [
        "603",
        "607",
        "607",
        "603"
      ],
      "uvs": [
        "1341",
        "1349",
        "1350",
        "1342"
      ]
    },
    {
      "vertices": [
        "1175",
        "1174",
        "1205",
        "1206"
      ],
      "normals": [
        "604",
        "608",
        "608",
        "604"
      ],
      "uvs": [
        "1343",
        "1351",
        "1352",
        "1344"
      ]
    },
    {
      "vertices": [
        "1168",
        "1167",
        "1198",
        "1199"
      ],
      "normals": [
        "605",
        "609",
        "609",
        "605"
      ],
      "uvs": [
        "1345",
        "1353",
        "1354",
        "1346"
      ]
    },
    {
      "vertices": [
        "1161",
        "1160",
        "1191",
        "1192"
      ],
      "normals": [
        "606",
        "610",
        "610",
        "606"
      ],
      "uvs": [
        "1347",
        "1355",
        "1356",
        "1348"
      ]
    },
    {
      "vertices": [
        "1181",
        "1180",
        "1211",
        "1212"
      ],
      "normals": [
        "607",
        "611",
        "611",
        "607"
      ],
      "uvs": [
        "1349",
        "1357",
        "1358",
        "1350"
      ]
    },
    {
      "vertices": [
        "1156",
        "1187",
        "1218",
        "1155"
      ],
      "normals": [
        "599",
        "612",
        "612",
        "599"
      ],
      "uvs": [
        "1331",
        "1359",
        "1360",
        "1332"
      ]
    },
    {
      "vertices": [
        "1174",
        "1173",
        "1204",
        "1205"
      ],
      "normals": [
        "608",
        "613",
        "613",
        "608"
      ],
      "uvs": [
        "1351",
        "1361",
        "1362",
        "1352"
      ]
    },
    {
      "vertices": [
        "1167",
        "1166",
        "1197",
        "1198"
      ],
      "normals": [
        "609",
        "582",
        "582",
        "609"
      ],
      "uvs": [
        "1353",
        "1297",
        "1300",
        "1354"
      ]
    },
    {
      "vertices": [
        "1187",
        "1186",
        "1217",
        "1218"
      ],
      "normals": [
        "612",
        "584",
        "584",
        "612"
      ],
      "uvs": [
        "1359",
        "1301",
        "1304",
        "1360"
      ]
    },
    {
      "vertices": [
        "1160",
        "1159",
        "1190",
        "1191"
      ],
      "normals": [
        "610",
        "586",
        "586",
        "610"
      ],
      "uvs": [
        "1355",
        "1305",
        "1308",
        "1356"
      ]
    },
    {
      "vertices": [
        "1180",
        "1179",
        "1210",
        "1211"
      ],
      "normals": [
        "611",
        "588",
        "588",
        "611"
      ],
      "uvs": [
        "1357",
        "1309",
        "1312",
        "1358"
      ]
    },
    {
      "vertices": [
        "1173",
        "1172",
        "1203",
        "1204"
      ],
      "normals": [
        "613",
        "590",
        "590",
        "613"
      ],
      "uvs": [
        "1361",
        "1313",
        "1316",
        "1362"
      ]
    },
    {
      "vertices": [
        "1230",
        "1261",
        "1260",
        "1229"
      ],
      "normals": [
        "582",
        "582",
        "583",
        "583"
      ],
      "uvs": [
        "1363",
        "1364",
        "1365",
        "1366"
      ]
    },
    {
      "vertices": [
        "1250",
        "1281",
        "1280",
        "1249"
      ],
      "normals": [
        "584",
        "584",
        "585",
        "585"
      ],
      "uvs": [
        "1367",
        "1368",
        "1369",
        "1370"
      ]
    },
    {
      "vertices": [
        "1223",
        "1254",
        "1253",
        "1222"
      ],
      "normals": [
        "586",
        "586",
        "587",
        "587"
      ],
      "uvs": [
        "1371",
        "1372",
        "1373",
        "1374"
      ]
    },
    {
      "vertices": [
        "1243",
        "1274",
        "1273",
        "1242"
      ],
      "normals": [
        "588",
        "588",
        "589",
        "589"
      ],
      "uvs": [
        "1375",
        "1376",
        "1377",
        "1378"
      ]
    },
    {
      "vertices": [
        "1236",
        "1267",
        "1266",
        "1235"
      ],
      "normals": [
        "590",
        "590",
        "591",
        "591"
      ],
      "uvs": [
        "1379",
        "1380",
        "1381",
        "1382"
      ]
    },
    {
      "vertices": [
        "1229",
        "1260",
        "1259",
        "1228"
      ],
      "normals": [
        "583",
        "583",
        "592",
        "592"
      ],
      "uvs": [
        "1366",
        "1365",
        "1383",
        "1384"
      ]
    },
    {
      "vertices": [
        "1249",
        "1280",
        "1279",
        "1248"
      ],
      "normals": [
        "585",
        "585",
        "593",
        "593"
      ],
      "uvs": [
        "1370",
        "1369",
        "1385",
        "1386"
      ]
    },
    {
      "vertices": [
        "1222",
        "1253",
        "1252",
        "1221"
      ],
      "normals": [
        "587",
        "587",
        "594",
        "594"
      ],
      "uvs": [
        "1374",
        "1373",
        "1387",
        "1388"
      ]
    },
    {
      "vertices": [
        "1242",
        "1273",
        "1272",
        "1241"
      ],
      "normals": [
        "589",
        "589",
        "595",
        "595"
      ],
      "uvs": [
        "1378",
        "1377",
        "1389",
        "1390"
      ]
    },
    {
      "vertices": [
        "1235",
        "1266",
        "1265",
        "1234"
      ],
      "normals": [
        "591",
        "591",
        "596",
        "596"
      ],
      "uvs": [
        "1382",
        "1381",
        "1391",
        "1392"
      ]
    },
    {
      "vertices": [
        "1228",
        "1259",
        "1258",
        "1227"
      ],
      "normals": [
        "592",
        "592",
        "597",
        "597"
      ],
      "uvs": [
        "1384",
        "1383",
        "1393",
        "1394"
      ]
    },
    {
      "vertices": [
        "1248",
        "1279",
        "1278",
        "1247"
      ],
      "normals": [
        "593",
        "593",
        "598",
        "598"
      ],
      "uvs": [
        "1386",
        "1385",
        "1395",
        "1396"
      ]
    },
    {
      "vertices": [
        "1221",
        "1252",
        "1219",
        "1220"
      ],
      "normals": [
        "594",
        "594",
        "599",
        "599"
      ],
      "uvs": [
        "1388",
        "1387",
        "1397",
        "1398"
      ]
    },
    {
      "vertices": [
        "1241",
        "1272",
        "1271",
        "1240"
      ],
      "normals": [
        "595",
        "595",
        "600",
        "600"
      ],
      "uvs": [
        "1390",
        "1389",
        "1399",
        "1400"
      ]
    },
    {
      "vertices": [
        "1234",
        "1265",
        "1264",
        "1233"
      ],
      "normals": [
        "596",
        "596",
        "601",
        "601"
      ],
      "uvs": [
        "1392",
        "1391",
        "1401",
        "1402"
      ]
    },
    {
      "vertices": [
        "1227",
        "1258",
        "1257",
        "1226"
      ],
      "normals": [
        "597",
        "597",
        "602",
        "602"
      ],
      "uvs": [
        "1403",
        "1404",
        "1405",
        "1406"
      ]
    },
    {
      "vertices": [
        "1247",
        "1278",
        "1277",
        "1246"
      ],
      "normals": [
        "598",
        "598",
        "603",
        "603"
      ],
      "uvs": [
        "1396",
        "1395",
        "1407",
        "1408"
      ]
    },
    {
      "vertices": [
        "1240",
        "1271",
        "1270",
        "1239"
      ],
      "normals": [
        "600",
        "600",
        "604",
        "604"
      ],
      "uvs": [
        "1400",
        "1399",
        "1409",
        "1410"
      ]
    },
    {
      "vertices": [
        "1233",
        "1264",
        "1263",
        "1232"
      ],
      "normals": [
        "601",
        "601",
        "605",
        "605"
      ],
      "uvs": [
        "1402",
        "1401",
        "1411",
        "1412"
      ]
    },
    {
      "vertices": [
        "1226",
        "1257",
        "1256",
        "1225"
      ],
      "normals": [
        "602",
        "602",
        "606",
        "606"
      ],
      "uvs": [
        "1406",
        "1405",
        "1413",
        "1414"
      ]
    },
    {
      "vertices": [
        "1246",
        "1277",
        "1276",
        "1245"
      ],
      "normals": [
        "603",
        "603",
        "607",
        "607"
      ],
      "uvs": [
        "1408",
        "1407",
        "1415",
        "1416"
      ]
    },
    {
      "vertices": [
        "1239",
        "1270",
        "1269",
        "1238"
      ],
      "normals": [
        "604",
        "604",
        "608",
        "608"
      ],
      "uvs": [
        "1410",
        "1409",
        "1417",
        "1418"
      ]
    },
    {
      "vertices": [
        "1232",
        "1263",
        "1262",
        "1231"
      ],
      "normals": [
        "605",
        "605",
        "609",
        "609"
      ],
      "uvs": [
        "1412",
        "1411",
        "1419",
        "1420"
      ]
    },
    {
      "vertices": [
        "1225",
        "1256",
        "1255",
        "1224"
      ],
      "normals": [
        "606",
        "606",
        "610",
        "610"
      ],
      "uvs": [
        "1414",
        "1413",
        "1421",
        "1422"
      ]
    },
    {
      "vertices": [
        "1245",
        "1276",
        "1275",
        "1244"
      ],
      "normals": [
        "607",
        "607",
        "611",
        "611"
      ],
      "uvs": [
        "1416",
        "1415",
        "1423",
        "1424"
      ]
    },
    {
      "vertices": [
        "1220",
        "1219",
        "1282",
        "1251"
      ],
      "normals": [
        "599",
        "599",
        "612",
        "612"
      ],
      "uvs": [
        "1398",
        "1397",
        "1425",
        "1426"
      ]
    },
    {
      "vertices": [
        "1238",
        "1269",
        "1268",
        "1237"
      ],
      "normals": [
        "608",
        "608",
        "613",
        "613"
      ],
      "uvs": [
        "1418",
        "1417",
        "1427",
        "1428"
      ]
    },
    {
      "vertices": [
        "1231",
        "1262",
        "1261",
        "1230"
      ],
      "normals": [
        "609",
        "609",
        "582",
        "582"
      ],
      "uvs": [
        "1420",
        "1419",
        "1364",
        "1363"
      ]
    },
    {
      "vertices": [
        "1251",
        "1282",
        "1281",
        "1250"
      ],
      "normals": [
        "612",
        "612",
        "584",
        "584"
      ],
      "uvs": [
        "1426",
        "1425",
        "1368",
        "1367"
      ]
    },
    {
      "vertices": [
        "1224",
        "1255",
        "1254",
        "1223"
      ],
      "normals": [
        "610",
        "610",
        "586",
        "586"
      ],
      "uvs": [
        "1422",
        "1421",
        "1372",
        "1371"
      ]
    },
    {
      "vertices": [
        "1244",
        "1275",
        "1274",
        "1243"
      ],
      "normals": [
        "611",
        "611",
        "588",
        "588"
      ],
      "uvs": [
        "1424",
        "1423",
        "1376",
        "1375"
      ]
    },
    {
      "vertices": [
        "1237",
        "1268",
        "1267",
        "1236"
      ],
      "normals": [
        "613",
        "613",
        "590",
        "590"
      ],
      "uvs": [
        "1428",
        "1427",
        "1380",
        "1379"
      ]
    },
    {
      "vertices": [
        "1509",
        "1413",
        "1414",
        "1510"
      ],
      "normals": [
        "614",
        "615",
        "616",
        "617"
      ],
      "uvs": [
        "1429",
        "1430",
        "1431",
        "1432"
      ]
    },
    {
      "vertices": [
        "1510",
        "1414",
        "1415",
        "1511"
      ],
      "normals": [
        "617",
        "616",
        "618",
        "619"
      ],
      "uvs": [
        "1432",
        "1431",
        "1433",
        "1434"
      ]
    },
    {
      "vertices": [
        "1511",
        "1415",
        "1416",
        "1512"
      ],
      "normals": [
        "619",
        "618",
        "620",
        "621"
      ],
      "uvs": [
        "1434",
        "1433",
        "1435",
        "1436"
      ]
    },
    {
      "vertices": [
        "1512",
        "1416",
        "1417",
        "1513"
      ],
      "normals": [
        "621",
        "620",
        "622",
        "623"
      ],
      "uvs": [
        "1436",
        "1435",
        "1437",
        "1438"
      ]
    },
    {
      "vertices": [
        "1513",
        "1417",
        "1418",
        "1514"
      ],
      "normals": [
        "623",
        "622",
        "624",
        "625"
      ],
      "uvs": [
        "1438",
        "1437",
        "1439",
        "1440"
      ]
    },
    {
      "vertices": [
        "1514",
        "1418",
        "1419",
        "1515"
      ],
      "normals": [
        "625",
        "624",
        "626",
        "627"
      ],
      "uvs": [
        "1440",
        "1439",
        "1441",
        "1442"
      ]
    },
    {
      "vertices": [
        "1515",
        "1419",
        "1420",
        "1516"
      ],
      "normals": [
        "627",
        "626",
        "628",
        "629"
      ],
      "uvs": [
        "1442",
        "1441",
        "1443",
        "1444"
      ]
    },
    {
      "vertices": [
        "1516",
        "1420",
        "1421",
        "1517"
      ],
      "normals": [
        "629",
        "628",
        "630",
        "631"
      ],
      "uvs": [
        "1444",
        "1443",
        "1445",
        "1446"
      ]
    },
    {
      "vertices": [
        "1517",
        "1421",
        "1422",
        "1518"
      ],
      "normals": [
        "631",
        "630",
        "632",
        "633"
      ],
      "uvs": [
        "1446",
        "1445",
        "1447",
        "1448"
      ]
    },
    {
      "vertices": [
        "1518",
        "1422",
        "1423",
        "1519"
      ],
      "normals": [
        "633",
        "632",
        "634",
        "635"
      ],
      "uvs": [
        "1448",
        "1447",
        "1449",
        "1450"
      ]
    },
    {
      "vertices": [
        "1519",
        "1423",
        "1424",
        "1520"
      ],
      "normals": [
        "635",
        "634",
        "636",
        "637"
      ],
      "uvs": [
        "1450",
        "1449",
        "1451",
        "1452"
      ]
    },
    {
      "vertices": [
        "1520",
        "1424",
        "1425",
        "1521"
      ],
      "normals": [
        "637",
        "636",
        "638",
        "639"
      ],
      "uvs": [
        "1452",
        "1451",
        "1453",
        "1454"
      ]
    },
    {
      "vertices": [
        "1521",
        "1425",
        "1426",
        "1522"
      ],
      "normals": [
        "639",
        "638",
        "640",
        "641"
      ],
      "uvs": [
        "1454",
        "1453",
        "1455",
        "1456"
      ]
    },
    {
      "vertices": [
        "1522",
        "1426",
        "1427",
        "1523"
      ],
      "normals": [
        "641",
        "640",
        "642",
        "643"
      ],
      "uvs": [
        "1456",
        "1455",
        "1457",
        "1458"
      ]
    },
    {
      "vertices": [
        "1523",
        "1427",
        "1428",
        "1524"
      ],
      "normals": [
        "643",
        "642",
        "644",
        "645"
      ],
      "uvs": [
        "1458",
        "1457",
        "1459",
        "1460"
      ]
    },
    {
      "vertices": [
        "1524",
        "1428",
        "1429",
        "1525"
      ],
      "normals": [
        "645",
        "644",
        "646",
        "647"
      ],
      "uvs": [
        "1461",
        "1462",
        "1463",
        "1464"
      ]
    },
    {
      "vertices": [
        "1525",
        "1429",
        "1430",
        "1526"
      ],
      "normals": [
        "647",
        "646",
        "648",
        "649"
      ],
      "uvs": [
        "1464",
        "1463",
        "1465",
        "1466"
      ]
    },
    {
      "vertices": [
        "1526",
        "1430",
        "1431",
        "1527"
      ],
      "normals": [
        "649",
        "648",
        "650",
        "651"
      ],
      "uvs": [
        "1466",
        "1465",
        "1467",
        "1468"
      ]
    },
    {
      "vertices": [
        "1527",
        "1431",
        "1432",
        "1528"
      ],
      "normals": [
        "651",
        "650",
        "652",
        "653"
      ],
      "uvs": [
        "1468",
        "1467",
        "1469",
        "1470"
      ]
    },
    {
      "vertices": [
        "1528",
        "1432",
        "1433",
        "1529"
      ],
      "normals": [
        "653",
        "652",
        "654",
        "655"
      ],
      "uvs": [
        "1470",
        "1469",
        "1471",
        "1472"
      ]
    },
    {
      "vertices": [
        "1529",
        "1433",
        "1434",
        "1530"
      ],
      "normals": [
        "655",
        "654",
        "656",
        "657"
      ],
      "uvs": [
        "1472",
        "1471",
        "1473",
        "1474"
      ]
    },
    {
      "vertices": [
        "1530",
        "1434",
        "1435",
        "1531"
      ],
      "normals": [
        "657",
        "656",
        "658",
        "659"
      ],
      "uvs": [
        "1474",
        "1473",
        "1475",
        "1476"
      ]
    },
    {
      "vertices": [
        "1531",
        "1435",
        "1436",
        "1532"
      ],
      "normals": [
        "659",
        "658",
        "660",
        "661"
      ],
      "uvs": [
        "1476",
        "1475",
        "1477",
        "1478"
      ]
    },
    {
      "vertices": [
        "1532",
        "1436",
        "1437",
        "1533"
      ],
      "normals": [
        "661",
        "660",
        "662",
        "663"
      ],
      "uvs": [
        "1478",
        "1477",
        "1479",
        "1480"
      ]
    },
    {
      "vertices": [
        "1533",
        "1437",
        "1438",
        "1534"
      ],
      "normals": [
        "663",
        "662",
        "664",
        "665"
      ],
      "uvs": [
        "1480",
        "1479",
        "1481",
        "1482"
      ]
    },
    {
      "vertices": [
        "1534",
        "1438",
        "1439",
        "1535"
      ],
      "normals": [
        "665",
        "664",
        "666",
        "667"
      ],
      "uvs": [
        "1482",
        "1481",
        "1483",
        "1484"
      ]
    },
    {
      "vertices": [
        "1535",
        "1439",
        "1440",
        "1536"
      ],
      "normals": [
        "667",
        "666",
        "668",
        "669"
      ],
      "uvs": [
        "1484",
        "1483",
        "1485",
        "1486"
      ]
    },
    {
      "vertices": [
        "1536",
        "1440",
        "1441",
        "1537"
      ],
      "normals": [
        "669",
        "668",
        "670",
        "671"
      ],
      "uvs": [
        "1486",
        "1485",
        "1487",
        "1488"
      ]
    },
    {
      "vertices": [
        "1537",
        "1441",
        "1442",
        "1538"
      ],
      "normals": [
        "671",
        "670",
        "672",
        "673"
      ],
      "uvs": [
        "1488",
        "1487",
        "1489",
        "1490"
      ]
    },
    {
      "vertices": [
        "1538",
        "1442",
        "1443",
        "1539"
      ],
      "normals": [
        "673",
        "672",
        "674",
        "675"
      ],
      "uvs": [
        "1490",
        "1489",
        "1491",
        "1492"
      ]
    },
    {
      "vertices": [
        "1539",
        "1443",
        "1444",
        "1540"
      ],
      "normals": [
        "675",
        "674",
        "676",
        "677"
      ],
      "uvs": [
        "1492",
        "1491",
        "1493",
        "1494"
      ]
    },
    {
      "vertices": [
        "1540",
        "1444",
        "1413",
        "1509"
      ],
      "normals": [
        "677",
        "676",
        "615",
        "614"
      ],
      "uvs": [
        "1494",
        "1493",
        "1430",
        "1429"
      ]
    },
    {
      "vertices": [
        "1638",
        "1476",
        "1445",
        "1607"
      ],
      "normals": [
        "591",
        "678",
        "679",
        "590"
      ],
      "uvs": [
        "1495",
        "1496",
        "1497",
        "1498"
      ]
    },
    {
      "vertices": [
        "1637",
        "1475",
        "1476",
        "1638"
      ],
      "normals": [
        "596",
        "680",
        "678",
        "591"
      ],
      "uvs": [
        "1499",
        "1500",
        "1496",
        "1495"
      ]
    },
    {
      "vertices": [
        "1636",
        "1474",
        "1475",
        "1637"
      ],
      "normals": [
        "601",
        "681",
        "680",
        "596"
      ],
      "uvs": [
        "1501",
        "1502",
        "1500",
        "1499"
      ]
    },
    {
      "vertices": [
        "1635",
        "1473",
        "1474",
        "1636"
      ],
      "normals": [
        "605",
        "682",
        "681",
        "601"
      ],
      "uvs": [
        "1503",
        "1504",
        "1502",
        "1501"
      ]
    },
    {
      "vertices": [
        "1634",
        "1472",
        "1473",
        "1635"
      ],
      "normals": [
        "609",
        "683",
        "682",
        "605"
      ],
      "uvs": [
        "1505",
        "1506",
        "1504",
        "1503"
      ]
    },
    {
      "vertices": [
        "1633",
        "1471",
        "1472",
        "1634"
      ],
      "normals": [
        "582",
        "684",
        "683",
        "609"
      ],
      "uvs": [
        "1507",
        "1508",
        "1506",
        "1505"
      ]
    },
    {
      "vertices": [
        "1632",
        "1470",
        "1471",
        "1633"
      ],
      "normals": [
        "583",
        "685",
        "684",
        "582"
      ],
      "uvs": [
        "1509",
        "1510",
        "1508",
        "1507"
      ]
    },
    {
      "vertices": [
        "1631",
        "1469",
        "1470",
        "1632"
      ],
      "normals": [
        "592",
        "686",
        "685",
        "583"
      ],
      "uvs": [
        "1511",
        "1512",
        "1510",
        "1509"
      ]
    },
    {
      "vertices": [
        "1630",
        "1468",
        "1469",
        "1631"
      ],
      "normals": [
        "597",
        "687",
        "686",
        "592"
      ],
      "uvs": [
        "1513",
        "1514",
        "1512",
        "1511"
      ]
    },
    {
      "vertices": [
        "1629",
        "1467",
        "1468",
        "1630"
      ],
      "normals": [
        "602",
        "688",
        "687",
        "597"
      ],
      "uvs": [
        "1515",
        "1516",
        "1514",
        "1513"
      ]
    },
    {
      "vertices": [
        "1628",
        "1466",
        "1467",
        "1629"
      ],
      "normals": [
        "606",
        "689",
        "688",
        "602"
      ],
      "uvs": [
        "1517",
        "1518",
        "1516",
        "1515"
      ]
    },
    {
      "vertices": [
        "1627",
        "1465",
        "1466",
        "1628"
      ],
      "normals": [
        "610",
        "690",
        "689",
        "606"
      ],
      "uvs": [
        "1519",
        "1520",
        "1518",
        "1517"
      ]
    },
    {
      "vertices": [
        "1626",
        "1464",
        "1465",
        "1627"
      ],
      "normals": [
        "586",
        "691",
        "690",
        "610"
      ],
      "uvs": [
        "1521",
        "1522",
        "1520",
        "1519"
      ]
    },
    {
      "vertices": [
        "1625",
        "1463",
        "1464",
        "1626"
      ],
      "normals": [
        "587",
        "692",
        "691",
        "586"
      ],
      "uvs": [
        "1523",
        "1524",
        "1522",
        "1521"
      ]
    },
    {
      "vertices": [
        "1624",
        "1462",
        "1463",
        "1625"
      ],
      "normals": [
        "594",
        "693",
        "692",
        "587"
      ],
      "uvs": [
        "1525",
        "1526",
        "1524",
        "1523"
      ]
    },
    {
      "vertices": [
        "1623",
        "1461",
        "1462",
        "1624"
      ],
      "normals": [
        "599",
        "694",
        "693",
        "594"
      ],
      "uvs": [
        "1527",
        "1528",
        "1526",
        "1525"
      ]
    },
    {
      "vertices": [
        "1622",
        "1460",
        "1461",
        "1623"
      ],
      "normals": [
        "612",
        "695",
        "694",
        "599"
      ],
      "uvs": [
        "1529",
        "1530",
        "1528",
        "1527"
      ]
    },
    {
      "vertices": [
        "1621",
        "1459",
        "1460",
        "1622"
      ],
      "normals": [
        "584",
        "696",
        "695",
        "612"
      ],
      "uvs": [
        "1531",
        "1532",
        "1533",
        "1534"
      ]
    },
    {
      "vertices": [
        "1620",
        "1458",
        "1459",
        "1621"
      ],
      "normals": [
        "585",
        "697",
        "696",
        "584"
      ],
      "uvs": [
        "1535",
        "1536",
        "1532",
        "1531"
      ]
    },
    {
      "vertices": [
        "1619",
        "1457",
        "1458",
        "1620"
      ],
      "normals": [
        "593",
        "698",
        "697",
        "585"
      ],
      "uvs": [
        "1537",
        "1538",
        "1536",
        "1535"
      ]
    },
    {
      "vertices": [
        "1618",
        "1456",
        "1457",
        "1619"
      ],
      "normals": [
        "598",
        "699",
        "698",
        "593"
      ],
      "uvs": [
        "1539",
        "1540",
        "1538",
        "1537"
      ]
    },
    {
      "vertices": [
        "1617",
        "1455",
        "1456",
        "1618"
      ],
      "normals": [
        "603",
        "700",
        "699",
        "598"
      ],
      "uvs": [
        "1541",
        "1542",
        "1540",
        "1539"
      ]
    },
    {
      "vertices": [
        "1616",
        "1454",
        "1455",
        "1617"
      ],
      "normals": [
        "607",
        "701",
        "700",
        "603"
      ],
      "uvs": [
        "1543",
        "1544",
        "1542",
        "1541"
      ]
    },
    {
      "vertices": [
        "1615",
        "1453",
        "1454",
        "1616"
      ],
      "normals": [
        "611",
        "702",
        "701",
        "607"
      ],
      "uvs": [
        "1545",
        "1546",
        "1544",
        "1543"
      ]
    },
    {
      "vertices": [
        "1614",
        "1452",
        "1453",
        "1615"
      ],
      "normals": [
        "588",
        "703",
        "702",
        "611"
      ],
      "uvs": [
        "1547",
        "1548",
        "1546",
        "1545"
      ]
    },
    {
      "vertices": [
        "1613",
        "1451",
        "1452",
        "1614"
      ],
      "normals": [
        "589",
        "704",
        "703",
        "588"
      ],
      "uvs": [
        "1549",
        "1550",
        "1548",
        "1547"
      ]
    },
    {
      "vertices": [
        "1612",
        "1450",
        "1451",
        "1613"
      ],
      "normals": [
        "595",
        "705",
        "704",
        "589"
      ],
      "uvs": [
        "1551",
        "1552",
        "1550",
        "1549"
      ]
    },
    {
      "vertices": [
        "1611",
        "1449",
        "1450",
        "1612"
      ],
      "normals": [
        "600",
        "706",
        "705",
        "595"
      ],
      "uvs": [
        "1553",
        "1554",
        "1552",
        "1551"
      ]
    },
    {
      "vertices": [
        "1610",
        "1448",
        "1449",
        "1611"
      ],
      "normals": [
        "604",
        "707",
        "706",
        "600"
      ],
      "uvs": [
        "1555",
        "1556",
        "1554",
        "1553"
      ]
    },
    {
      "vertices": [
        "1609",
        "1447",
        "1448",
        "1610"
      ],
      "normals": [
        "608",
        "708",
        "707",
        "604"
      ],
      "uvs": [
        "1557",
        "1558",
        "1556",
        "1555"
      ]
    },
    {
      "vertices": [
        "1608",
        "1446",
        "1447",
        "1609"
      ],
      "normals": [
        "613",
        "709",
        "708",
        "608"
      ],
      "uvs": [
        "1559",
        "1560",
        "1558",
        "1557"
      ]
    },
    {
      "vertices": [
        "1607",
        "1445",
        "1446",
        "1608"
      ],
      "normals": [
        "590",
        "679",
        "709",
        "613"
      ],
      "uvs": [
        "1498",
        "1497",
        "1560",
        "1559"
      ]
    },
    {
      "vertices": [
        "1476",
        "1508",
        "1477",
        "1445"
      ],
      "normals": [
        "678",
        "710",
        "711",
        "679"
      ],
      "uvs": [
        "1496",
        "1561",
        "1562",
        "1497"
      ]
    },
    {
      "vertices": [
        "1475",
        "1507",
        "1508",
        "1476"
      ],
      "normals": [
        "680",
        "712",
        "710",
        "678"
      ],
      "uvs": [
        "1500",
        "1563",
        "1561",
        "1496"
      ]
    },
    {
      "vertices": [
        "1474",
        "1506",
        "1507",
        "1475"
      ],
      "normals": [
        "681",
        "713",
        "712",
        "680"
      ],
      "uvs": [
        "1502",
        "1564",
        "1563",
        "1500"
      ]
    },
    {
      "vertices": [
        "1473",
        "1505",
        "1506",
        "1474"
      ],
      "normals": [
        "682",
        "714",
        "713",
        "681"
      ],
      "uvs": [
        "1504",
        "1565",
        "1564",
        "1502"
      ]
    },
    {
      "vertices": [
        "1472",
        "1504",
        "1505",
        "1473"
      ],
      "normals": [
        "683",
        "715",
        "714",
        "682"
      ],
      "uvs": [
        "1506",
        "1566",
        "1565",
        "1504"
      ]
    },
    {
      "vertices": [
        "1471",
        "1503",
        "1504",
        "1472"
      ],
      "normals": [
        "684",
        "716",
        "715",
        "683"
      ],
      "uvs": [
        "1508",
        "1567",
        "1566",
        "1506"
      ]
    },
    {
      "vertices": [
        "1470",
        "1502",
        "1503",
        "1471"
      ],
      "normals": [
        "685",
        "717",
        "716",
        "684"
      ],
      "uvs": [
        "1510",
        "1568",
        "1567",
        "1508"
      ]
    },
    {
      "vertices": [
        "1469",
        "1501",
        "1502",
        "1470"
      ],
      "normals": [
        "686",
        "718",
        "717",
        "685"
      ],
      "uvs": [
        "1512",
        "1569",
        "1568",
        "1510"
      ]
    },
    {
      "vertices": [
        "1468",
        "1500",
        "1501",
        "1469"
      ],
      "normals": [
        "687",
        "719",
        "718",
        "686"
      ],
      "uvs": [
        "1514",
        "1570",
        "1569",
        "1512"
      ]
    },
    {
      "vertices": [
        "1467",
        "1499",
        "1500",
        "1468"
      ],
      "normals": [
        "688",
        "720",
        "719",
        "687"
      ],
      "uvs": [
        "1516",
        "1571",
        "1570",
        "1514"
      ]
    },
    {
      "vertices": [
        "1466",
        "1498",
        "1499",
        "1467"
      ],
      "normals": [
        "689",
        "721",
        "720",
        "688"
      ],
      "uvs": [
        "1518",
        "1572",
        "1571",
        "1516"
      ]
    },
    {
      "vertices": [
        "1465",
        "1497",
        "1498",
        "1466"
      ],
      "normals": [
        "690",
        "722",
        "721",
        "689"
      ],
      "uvs": [
        "1520",
        "1573",
        "1572",
        "1518"
      ]
    },
    {
      "vertices": [
        "1464",
        "1496",
        "1497",
        "1465"
      ],
      "normals": [
        "691",
        "723",
        "722",
        "690"
      ],
      "uvs": [
        "1522",
        "1574",
        "1573",
        "1520"
      ]
    },
    {
      "vertices": [
        "1463",
        "1495",
        "1496",
        "1464"
      ],
      "normals": [
        "692",
        "724",
        "723",
        "691"
      ],
      "uvs": [
        "1524",
        "1575",
        "1574",
        "1522"
      ]
    },
    {
      "vertices": [
        "1462",
        "1494",
        "1495",
        "1463"
      ],
      "normals": [
        "693",
        "725",
        "724",
        "692"
      ],
      "uvs": [
        "1526",
        "1576",
        "1575",
        "1524"
      ]
    },
    {
      "vertices": [
        "1461",
        "1493",
        "1494",
        "1462"
      ],
      "normals": [
        "694",
        "726",
        "725",
        "693"
      ],
      "uvs": [
        "1528",
        "1577",
        "1576",
        "1526"
      ]
    },
    {
      "vertices": [
        "1460",
        "1492",
        "1493",
        "1461"
      ],
      "normals": [
        "695",
        "727",
        "726",
        "694"
      ],
      "uvs": [
        "1530",
        "1578",
        "1577",
        "1528"
      ]
    },
    {
      "vertices": [
        "1459",
        "1491",
        "1492",
        "1460"
      ],
      "normals": [
        "696",
        "728",
        "727",
        "695"
      ],
      "uvs": [
        "1532",
        "1579",
        "1580",
        "1533"
      ]
    },
    {
      "vertices": [
        "1458",
        "1490",
        "1491",
        "1459"
      ],
      "normals": [
        "697",
        "729",
        "728",
        "696"
      ],
      "uvs": [
        "1536",
        "1581",
        "1579",
        "1532"
      ]
    },
    {
      "vertices": [
        "1457",
        "1489",
        "1490",
        "1458"
      ],
      "normals": [
        "698",
        "730",
        "729",
        "697"
      ],
      "uvs": [
        "1538",
        "1582",
        "1581",
        "1536"
      ]
    },
    {
      "vertices": [
        "1456",
        "1488",
        "1489",
        "1457"
      ],
      "normals": [
        "699",
        "731",
        "730",
        "698"
      ],
      "uvs": [
        "1540",
        "1583",
        "1582",
        "1538"
      ]
    },
    {
      "vertices": [
        "1455",
        "1487",
        "1488",
        "1456"
      ],
      "normals": [
        "700",
        "732",
        "731",
        "699"
      ],
      "uvs": [
        "1542",
        "1584",
        "1583",
        "1540"
      ]
    },
    {
      "vertices": [
        "1454",
        "1486",
        "1487",
        "1455"
      ],
      "normals": [
        "701",
        "733",
        "732",
        "700"
      ],
      "uvs": [
        "1544",
        "1585",
        "1584",
        "1542"
      ]
    },
    {
      "vertices": [
        "1453",
        "1485",
        "1486",
        "1454"
      ],
      "normals": [
        "702",
        "734",
        "733",
        "701"
      ],
      "uvs": [
        "1546",
        "1586",
        "1585",
        "1544"
      ]
    },
    {
      "vertices": [
        "1452",
        "1484",
        "1485",
        "1453"
      ],
      "normals": [
        "703",
        "735",
        "734",
        "702"
      ],
      "uvs": [
        "1548",
        "1587",
        "1586",
        "1546"
      ]
    },
    {
      "vertices": [
        "1451",
        "1483",
        "1484",
        "1452"
      ],
      "normals": [
        "704",
        "736",
        "735",
        "703"
      ],
      "uvs": [
        "1550",
        "1588",
        "1587",
        "1548"
      ]
    },
    {
      "vertices": [
        "1450",
        "1482",
        "1483",
        "1451"
      ],
      "normals": [
        "705",
        "737",
        "736",
        "704"
      ],
      "uvs": [
        "1552",
        "1589",
        "1588",
        "1550"
      ]
    },
    {
      "vertices": [
        "1449",
        "1481",
        "1482",
        "1450"
      ],
      "normals": [
        "706",
        "738",
        "737",
        "705"
      ],
      "uvs": [
        "1554",
        "1590",
        "1589",
        "1552"
      ]
    },
    {
      "vertices": [
        "1448",
        "1480",
        "1481",
        "1449"
      ],
      "normals": [
        "707",
        "739",
        "738",
        "706"
      ],
      "uvs": [
        "1556",
        "1591",
        "1590",
        "1554"
      ]
    },
    {
      "vertices": [
        "1447",
        "1479",
        "1480",
        "1448"
      ],
      "normals": [
        "708",
        "740",
        "739",
        "707"
      ],
      "uvs": [
        "1558",
        "1592",
        "1591",
        "1556"
      ]
    },
    {
      "vertices": [
        "1446",
        "1478",
        "1479",
        "1447"
      ],
      "normals": [
        "709",
        "741",
        "740",
        "708"
      ],
      "uvs": [
        "1560",
        "1593",
        "1592",
        "1558"
      ]
    },
    {
      "vertices": [
        "1445",
        "1477",
        "1478",
        "1446"
      ],
      "normals": [
        "679",
        "711",
        "741",
        "709"
      ],
      "uvs": [
        "1497",
        "1562",
        "1593",
        "1560"
      ]
    },
    {
      "vertices": [
        "1508",
        "1540",
        "1509",
        "1477"
      ],
      "normals": [
        "710",
        "677",
        "614",
        "711"
      ],
      "uvs": [
        "1561",
        "1494",
        "1429",
        "1562"
      ]
    },
    {
      "vertices": [
        "1507",
        "1539",
        "1540",
        "1508"
      ],
      "normals": [
        "712",
        "675",
        "677",
        "710"
      ],
      "uvs": [
        "1563",
        "1492",
        "1494",
        "1561"
      ]
    },
    {
      "vertices": [
        "1506",
        "1538",
        "1539",
        "1507"
      ],
      "normals": [
        "713",
        "673",
        "675",
        "712"
      ],
      "uvs": [
        "1564",
        "1490",
        "1492",
        "1563"
      ]
    },
    {
      "vertices": [
        "1505",
        "1537",
        "1538",
        "1506"
      ],
      "normals": [
        "714",
        "671",
        "673",
        "713"
      ],
      "uvs": [
        "1565",
        "1488",
        "1490",
        "1564"
      ]
    },
    {
      "vertices": [
        "1504",
        "1536",
        "1537",
        "1505"
      ],
      "normals": [
        "715",
        "669",
        "671",
        "714"
      ],
      "uvs": [
        "1566",
        "1486",
        "1488",
        "1565"
      ]
    },
    {
      "vertices": [
        "1503",
        "1535",
        "1536",
        "1504"
      ],
      "normals": [
        "716",
        "667",
        "669",
        "715"
      ],
      "uvs": [
        "1567",
        "1484",
        "1486",
        "1566"
      ]
    },
    {
      "vertices": [
        "1502",
        "1534",
        "1535",
        "1503"
      ],
      "normals": [
        "717",
        "665",
        "667",
        "716"
      ],
      "uvs": [
        "1568",
        "1482",
        "1484",
        "1567"
      ]
    },
    {
      "vertices": [
        "1501",
        "1533",
        "1534",
        "1502"
      ],
      "normals": [
        "718",
        "663",
        "665",
        "717"
      ],
      "uvs": [
        "1569",
        "1480",
        "1482",
        "1568"
      ]
    },
    {
      "vertices": [
        "1500",
        "1532",
        "1533",
        "1501"
      ],
      "normals": [
        "719",
        "661",
        "663",
        "718"
      ],
      "uvs": [
        "1570",
        "1478",
        "1480",
        "1569"
      ]
    },
    {
      "vertices": [
        "1499",
        "1531",
        "1532",
        "1500"
      ],
      "normals": [
        "720",
        "659",
        "661",
        "719"
      ],
      "uvs": [
        "1571",
        "1476",
        "1478",
        "1570"
      ]
    },
    {
      "vertices": [
        "1498",
        "1530",
        "1531",
        "1499"
      ],
      "normals": [
        "721",
        "657",
        "659",
        "720"
      ],
      "uvs": [
        "1572",
        "1474",
        "1476",
        "1571"
      ]
    },
    {
      "vertices": [
        "1497",
        "1529",
        "1530",
        "1498"
      ],
      "normals": [
        "722",
        "655",
        "657",
        "721"
      ],
      "uvs": [
        "1573",
        "1472",
        "1474",
        "1572"
      ]
    },
    {
      "vertices": [
        "1496",
        "1528",
        "1529",
        "1497"
      ],
      "normals": [
        "723",
        "653",
        "655",
        "722"
      ],
      "uvs": [
        "1574",
        "1470",
        "1472",
        "1573"
      ]
    },
    {
      "vertices": [
        "1495",
        "1527",
        "1528",
        "1496"
      ],
      "normals": [
        "724",
        "651",
        "653",
        "723"
      ],
      "uvs": [
        "1575",
        "1468",
        "1470",
        "1574"
      ]
    },
    {
      "vertices": [
        "1494",
        "1526",
        "1527",
        "1495"
      ],
      "normals": [
        "725",
        "649",
        "651",
        "724"
      ],
      "uvs": [
        "1576",
        "1466",
        "1468",
        "1575"
      ]
    },
    {
      "vertices": [
        "1493",
        "1525",
        "1526",
        "1494"
      ],
      "normals": [
        "726",
        "647",
        "649",
        "725"
      ],
      "uvs": [
        "1577",
        "1464",
        "1466",
        "1576"
      ]
    },
    {
      "vertices": [
        "1492",
        "1524",
        "1525",
        "1493"
      ],
      "normals": [
        "727",
        "645",
        "647",
        "726"
      ],
      "uvs": [
        "1578",
        "1461",
        "1464",
        "1577"
      ]
    },
    {
      "vertices": [
        "1491",
        "1523",
        "1524",
        "1492"
      ],
      "normals": [
        "728",
        "643",
        "645",
        "727"
      ],
      "uvs": [
        "1579",
        "1458",
        "1460",
        "1580"
      ]
    },
    {
      "vertices": [
        "1490",
        "1522",
        "1523",
        "1491"
      ],
      "normals": [
        "729",
        "641",
        "643",
        "728"
      ],
      "uvs": [
        "1581",
        "1456",
        "1458",
        "1579"
      ]
    },
    {
      "vertices": [
        "1489",
        "1521",
        "1522",
        "1490"
      ],
      "normals": [
        "730",
        "639",
        "641",
        "729"
      ],
      "uvs": [
        "1582",
        "1454",
        "1456",
        "1581"
      ]
    },
    {
      "vertices": [
        "1488",
        "1520",
        "1521",
        "1489"
      ],
      "normals": [
        "731",
        "637",
        "639",
        "730"
      ],
      "uvs": [
        "1583",
        "1452",
        "1454",
        "1582"
      ]
    },
    {
      "vertices": [
        "1487",
        "1519",
        "1520",
        "1488"
      ],
      "normals": [
        "732",
        "635",
        "637",
        "731"
      ],
      "uvs": [
        "1584",
        "1450",
        "1452",
        "1583"
      ]
    },
    {
      "vertices": [
        "1486",
        "1518",
        "1519",
        "1487"
      ],
      "normals": [
        "733",
        "633",
        "635",
        "732"
      ],
      "uvs": [
        "1585",
        "1448",
        "1450",
        "1584"
      ]
    },
    {
      "vertices": [
        "1485",
        "1517",
        "1518",
        "1486"
      ],
      "normals": [
        "734",
        "631",
        "633",
        "733"
      ],
      "uvs": [
        "1586",
        "1446",
        "1448",
        "1585"
      ]
    },
    {
      "vertices": [
        "1484",
        "1516",
        "1517",
        "1485"
      ],
      "normals": [
        "735",
        "629",
        "631",
        "734"
      ],
      "uvs": [
        "1587",
        "1444",
        "1446",
        "1586"
      ]
    },
    {
      "vertices": [
        "1483",
        "1515",
        "1516",
        "1484"
      ],
      "normals": [
        "736",
        "627",
        "629",
        "735"
      ],
      "uvs": [
        "1588",
        "1442",
        "1444",
        "1587"
      ]
    },
    {
      "vertices": [
        "1482",
        "1514",
        "1515",
        "1483"
      ],
      "normals": [
        "737",
        "625",
        "627",
        "736"
      ],
      "uvs": [
        "1589",
        "1440",
        "1442",
        "1588"
      ]
    },
    {
      "vertices": [
        "1481",
        "1513",
        "1514",
        "1482"
      ],
      "normals": [
        "738",
        "623",
        "625",
        "737"
      ],
      "uvs": [
        "1590",
        "1438",
        "1440",
        "1589"
      ]
    },
    {
      "vertices": [
        "1480",
        "1512",
        "1513",
        "1481"
      ],
      "normals": [
        "739",
        "621",
        "623",
        "738"
      ],
      "uvs": [
        "1591",
        "1436",
        "1438",
        "1590"
      ]
    },
    {
      "vertices": [
        "1479",
        "1511",
        "1512",
        "1480"
      ],
      "normals": [
        "740",
        "619",
        "621",
        "739"
      ],
      "uvs": [
        "1592",
        "1434",
        "1436",
        "1591"
      ]
    },
    {
      "vertices": [
        "1478",
        "1510",
        "1511",
        "1479"
      ],
      "normals": [
        "741",
        "617",
        "619",
        "740"
      ],
      "uvs": [
        "1593",
        "1432",
        "1434",
        "1592"
      ]
    },
    {
      "vertices": [
        "1477",
        "1509",
        "1510",
        "1478"
      ],
      "normals": [
        "711",
        "614",
        "617",
        "741"
      ],
      "uvs": [
        "1562",
        "1429",
        "1432",
        "1593"
      ]
    },
    {
      "vertices": [
        "1541",
        "1542",
        "1412"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1595",
        "1596"
      ]
    },
    {
      "vertices": [
        "1541",
        "1543",
        "1542"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1597",
        "1595"
      ]
    },
    {
      "vertices": [
        "1541",
        "1544",
        "1543"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1598",
        "1597"
      ]
    },
    {
      "vertices": [
        "1541",
        "1545",
        "1544"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1599",
        "1598"
      ]
    },
    {
      "vertices": [
        "1541",
        "1546",
        "1545"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1600",
        "1599"
      ]
    },
    {
      "vertices": [
        "1541",
        "1547",
        "1546"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1601",
        "1600"
      ]
    },
    {
      "vertices": [
        "1541",
        "1548",
        "1547"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1602",
        "1601"
      ]
    },
    {
      "vertices": [
        "1541",
        "1549",
        "1548"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1603",
        "1602"
      ]
    },
    {
      "vertices": [
        "1541",
        "1550",
        "1549"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1604",
        "1603"
      ]
    },
    {
      "vertices": [
        "1541",
        "1551",
        "1550"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1605",
        "1604"
      ]
    },
    {
      "vertices": [
        "1541",
        "1552",
        "1551"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1606",
        "1605"
      ]
    },
    {
      "vertices": [
        "1541",
        "1553",
        "1552"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1607",
        "1606"
      ]
    },
    {
      "vertices": [
        "1541",
        "1554",
        "1553"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1608",
        "1607"
      ]
    },
    {
      "vertices": [
        "1541",
        "1555",
        "1554"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1609",
        "1608"
      ]
    },
    {
      "vertices": [
        "1541",
        "1556",
        "1555"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1610",
        "1609"
      ]
    },
    {
      "vertices": [
        "1541",
        "1557",
        "1556"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1611",
        "1610"
      ]
    },
    {
      "vertices": [
        "1541",
        "1558",
        "1557"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1612",
        "1611"
      ]
    },
    {
      "vertices": [
        "1541",
        "1559",
        "1558"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1613",
        "1612"
      ]
    },
    {
      "vertices": [
        "1541",
        "1560",
        "1559"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1614",
        "1613"
      ]
    },
    {
      "vertices": [
        "1541",
        "1561",
        "1560"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1615",
        "1614"
      ]
    },
    {
      "vertices": [
        "1541",
        "1562",
        "1561"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1616",
        "1615"
      ]
    },
    {
      "vertices": [
        "1541",
        "1563",
        "1562"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1617",
        "1616"
      ]
    },
    {
      "vertices": [
        "1541",
        "1564",
        "1563"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1618",
        "1617"
      ]
    },
    {
      "vertices": [
        "1541",
        "1565",
        "1564"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1619",
        "1618"
      ]
    },
    {
      "vertices": [
        "1541",
        "1566",
        "1565"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1620",
        "1619"
      ]
    },
    {
      "vertices": [
        "1541",
        "1567",
        "1566"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1621",
        "1620"
      ]
    },
    {
      "vertices": [
        "1541",
        "1568",
        "1567"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1622",
        "1621"
      ]
    },
    {
      "vertices": [
        "1541",
        "1569",
        "1568"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1623",
        "1622"
      ]
    },
    {
      "vertices": [
        "1541",
        "1570",
        "1569"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1624",
        "1623"
      ]
    },
    {
      "vertices": [
        "1541",
        "1571",
        "1570"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1625",
        "1624"
      ]
    },
    {
      "vertices": [
        "1541",
        "1572",
        "1571"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1626",
        "1625"
      ]
    },
    {
      "vertices": [
        "1541",
        "1412",
        "1572"
      ],
      "normals": [
        "580",
        "580",
        "580"
      ],
      "uvs": [
        "1594",
        "1596",
        "1626"
      ]
    },
    {
      "vertices": [
        "1703",
        "1704",
        "1576",
        "1575"
      ],
      "normals": [
        "742",
        "743",
        "744",
        "745"
      ],
      "uvs": [
        "1627",
        "1628",
        "1629",
        "1630"
      ]
    },
    {
      "vertices": [
        "1704",
        "1705",
        "1577",
        "1576"
      ],
      "normals": [
        "743",
        "746",
        "747",
        "744"
      ],
      "uvs": [
        "1628",
        "1631",
        "1632",
        "1629"
      ]
    },
    {
      "vertices": [
        "1705",
        "1706",
        "1578",
        "1577"
      ],
      "normals": [
        "746",
        "748",
        "749",
        "747"
      ],
      "uvs": [
        "1631",
        "1633",
        "1634",
        "1632"
      ]
    },
    {
      "vertices": [
        "1706",
        "1707",
        "1579",
        "1578"
      ],
      "normals": [
        "748",
        "750",
        "751",
        "749"
      ],
      "uvs": [
        "1633",
        "1635",
        "1636",
        "1634"
      ]
    },
    {
      "vertices": [
        "1707",
        "1708",
        "1580",
        "1579"
      ],
      "normals": [
        "750",
        "752",
        "753",
        "751"
      ],
      "uvs": [
        "1635",
        "1637",
        "1638",
        "1636"
      ]
    },
    {
      "vertices": [
        "1708",
        "1709",
        "1581",
        "1580"
      ],
      "normals": [
        "752",
        "754",
        "755",
        "753"
      ],
      "uvs": [
        "1637",
        "1639",
        "1640",
        "1638"
      ]
    },
    {
      "vertices": [
        "1709",
        "1710",
        "1582",
        "1581"
      ],
      "normals": [
        "754",
        "756",
        "757",
        "755"
      ],
      "uvs": [
        "1639",
        "1641",
        "1642",
        "1640"
      ]
    },
    {
      "vertices": [
        "1710",
        "1711",
        "1583",
        "1582"
      ],
      "normals": [
        "756",
        "758",
        "759",
        "757"
      ],
      "uvs": [
        "1641",
        "1643",
        "1644",
        "1642"
      ]
    },
    {
      "vertices": [
        "1711",
        "1712",
        "1584",
        "1583"
      ],
      "normals": [
        "758",
        "760",
        "761",
        "759"
      ],
      "uvs": [
        "1643",
        "1645",
        "1646",
        "1644"
      ]
    },
    {
      "vertices": [
        "1712",
        "1713",
        "1585",
        "1584"
      ],
      "normals": [
        "760",
        "762",
        "763",
        "761"
      ],
      "uvs": [
        "1645",
        "1647",
        "1648",
        "1646"
      ]
    },
    {
      "vertices": [
        "1713",
        "1714",
        "1586",
        "1585"
      ],
      "normals": [
        "762",
        "764",
        "765",
        "763"
      ],
      "uvs": [
        "1647",
        "1649",
        "1650",
        "1648"
      ]
    },
    {
      "vertices": [
        "1714",
        "1715",
        "1587",
        "1586"
      ],
      "normals": [
        "764",
        "766",
        "767",
        "765"
      ],
      "uvs": [
        "1649",
        "1651",
        "1652",
        "1650"
      ]
    },
    {
      "vertices": [
        "1715",
        "1716",
        "1588",
        "1587"
      ],
      "normals": [
        "766",
        "768",
        "769",
        "767"
      ],
      "uvs": [
        "1651",
        "1653",
        "1654",
        "1652"
      ]
    },
    {
      "vertices": [
        "1716",
        "1717",
        "1589",
        "1588"
      ],
      "normals": [
        "768",
        "770",
        "771",
        "769"
      ],
      "uvs": [
        "1653",
        "1655",
        "1656",
        "1654"
      ]
    },
    {
      "vertices": [
        "1717",
        "1718",
        "1590",
        "1589"
      ],
      "normals": [
        "770",
        "772",
        "773",
        "771"
      ],
      "uvs": [
        "1655",
        "1657",
        "1658",
        "1656"
      ]
    },
    {
      "vertices": [
        "1718",
        "1719",
        "1591",
        "1590"
      ],
      "normals": [
        "772",
        "774",
        "775",
        "773"
      ],
      "uvs": [
        "1659",
        "1660",
        "1661",
        "1662"
      ]
    },
    {
      "vertices": [
        "1719",
        "1720",
        "1592",
        "1591"
      ],
      "normals": [
        "774",
        "776",
        "777",
        "775"
      ],
      "uvs": [
        "1660",
        "1663",
        "1664",
        "1661"
      ]
    },
    {
      "vertices": [
        "1720",
        "1721",
        "1593",
        "1592"
      ],
      "normals": [
        "776",
        "778",
        "779",
        "777"
      ],
      "uvs": [
        "1663",
        "1665",
        "1666",
        "1664"
      ]
    },
    {
      "vertices": [
        "1721",
        "1722",
        "1594",
        "1593"
      ],
      "normals": [
        "778",
        "780",
        "781",
        "779"
      ],
      "uvs": [
        "1665",
        "1667",
        "1668",
        "1666"
      ]
    },
    {
      "vertices": [
        "1722",
        "1723",
        "1595",
        "1594"
      ],
      "normals": [
        "780",
        "782",
        "783",
        "781"
      ],
      "uvs": [
        "1667",
        "1669",
        "1670",
        "1668"
      ]
    },
    {
      "vertices": [
        "1723",
        "1724",
        "1596",
        "1595"
      ],
      "normals": [
        "782",
        "784",
        "785",
        "783"
      ],
      "uvs": [
        "1669",
        "1671",
        "1672",
        "1670"
      ]
    },
    {
      "vertices": [
        "1724",
        "1725",
        "1597",
        "1596"
      ],
      "normals": [
        "784",
        "786",
        "787",
        "785"
      ],
      "uvs": [
        "1671",
        "1673",
        "1674",
        "1672"
      ]
    },
    {
      "vertices": [
        "1725",
        "1726",
        "1598",
        "1597"
      ],
      "normals": [
        "786",
        "788",
        "789",
        "787"
      ],
      "uvs": [
        "1673",
        "1675",
        "1676",
        "1674"
      ]
    },
    {
      "vertices": [
        "1726",
        "1727",
        "1599",
        "1598"
      ],
      "normals": [
        "788",
        "790",
        "791",
        "789"
      ],
      "uvs": [
        "1675",
        "1677",
        "1678",
        "1676"
      ]
    },
    {
      "vertices": [
        "1727",
        "1728",
        "1600",
        "1599"
      ],
      "normals": [
        "790",
        "792",
        "793",
        "791"
      ],
      "uvs": [
        "1677",
        "1679",
        "1680",
        "1678"
      ]
    },
    {
      "vertices": [
        "1728",
        "1729",
        "1601",
        "1600"
      ],
      "normals": [
        "792",
        "794",
        "795",
        "793"
      ],
      "uvs": [
        "1679",
        "1681",
        "1682",
        "1680"
      ]
    },
    {
      "vertices": [
        "1729",
        "1730",
        "1602",
        "1601"
      ],
      "normals": [
        "794",
        "796",
        "797",
        "795"
      ],
      "uvs": [
        "1681",
        "1683",
        "1684",
        "1682"
      ]
    },
    {
      "vertices": [
        "1730",
        "1731",
        "1603",
        "1602"
      ],
      "normals": [
        "796",
        "798",
        "799",
        "797"
      ],
      "uvs": [
        "1683",
        "1685",
        "1686",
        "1684"
      ]
    },
    {
      "vertices": [
        "1731",
        "1732",
        "1604",
        "1603"
      ],
      "normals": [
        "798",
        "800",
        "801",
        "799"
      ],
      "uvs": [
        "1685",
        "1687",
        "1688",
        "1686"
      ]
    },
    {
      "vertices": [
        "1732",
        "1733",
        "1605",
        "1604"
      ],
      "normals": [
        "800",
        "802",
        "803",
        "801"
      ],
      "uvs": [
        "1687",
        "1689",
        "1690",
        "1688"
      ]
    },
    {
      "vertices": [
        "1733",
        "1734",
        "1606",
        "1605"
      ],
      "normals": [
        "802",
        "804",
        "805",
        "803"
      ],
      "uvs": [
        "1689",
        "1691",
        "1692",
        "1690"
      ]
    },
    {
      "vertices": [
        "1734",
        "1703",
        "1575",
        "1606"
      ],
      "normals": [
        "804",
        "742",
        "745",
        "805"
      ],
      "uvs": [
        "1691",
        "1627",
        "1630",
        "1692"
      ]
    },
    {
      "vertices": [
        "1638",
        "1607",
        "1639",
        "1670"
      ],
      "normals": [
        "591",
        "590",
        "806",
        "807"
      ],
      "uvs": [
        "1693",
        "1694",
        "1695",
        "1696"
      ]
    },
    {
      "vertices": [
        "1637",
        "1638",
        "1670",
        "1669"
      ],
      "normals": [
        "596",
        "591",
        "807",
        "808"
      ],
      "uvs": [
        "1697",
        "1693",
        "1696",
        "1698"
      ]
    },
    {
      "vertices": [
        "1636",
        "1637",
        "1669",
        "1668"
      ],
      "normals": [
        "601",
        "596",
        "808",
        "809"
      ],
      "uvs": [
        "1699",
        "1697",
        "1698",
        "1700"
      ]
    },
    {
      "vertices": [
        "1635",
        "1636",
        "1668",
        "1667"
      ],
      "normals": [
        "605",
        "601",
        "809",
        "810"
      ],
      "uvs": [
        "1701",
        "1699",
        "1700",
        "1702"
      ]
    },
    {
      "vertices": [
        "1634",
        "1635",
        "1667",
        "1666"
      ],
      "normals": [
        "609",
        "605",
        "810",
        "811"
      ],
      "uvs": [
        "1703",
        "1701",
        "1702",
        "1704"
      ]
    },
    {
      "vertices": [
        "1633",
        "1634",
        "1666",
        "1665"
      ],
      "normals": [
        "582",
        "609",
        "811",
        "812"
      ],
      "uvs": [
        "1705",
        "1703",
        "1704",
        "1706"
      ]
    },
    {
      "vertices": [
        "1632",
        "1633",
        "1665",
        "1664"
      ],
      "normals": [
        "583",
        "582",
        "812",
        "813"
      ],
      "uvs": [
        "1707",
        "1705",
        "1706",
        "1708"
      ]
    },
    {
      "vertices": [
        "1631",
        "1632",
        "1664",
        "1663"
      ],
      "normals": [
        "592",
        "583",
        "813",
        "814"
      ],
      "uvs": [
        "1709",
        "1707",
        "1708",
        "1710"
      ]
    },
    {
      "vertices": [
        "1630",
        "1631",
        "1663",
        "1662"
      ],
      "normals": [
        "597",
        "592",
        "814",
        "815"
      ],
      "uvs": [
        "1711",
        "1709",
        "1710",
        "1712"
      ]
    },
    {
      "vertices": [
        "1629",
        "1630",
        "1662",
        "1661"
      ],
      "normals": [
        "602",
        "597",
        "815",
        "816"
      ],
      "uvs": [
        "1713",
        "1711",
        "1712",
        "1714"
      ]
    },
    {
      "vertices": [
        "1628",
        "1629",
        "1661",
        "1660"
      ],
      "normals": [
        "606",
        "602",
        "816",
        "817"
      ],
      "uvs": [
        "1715",
        "1713",
        "1714",
        "1716"
      ]
    },
    {
      "vertices": [
        "1627",
        "1628",
        "1660",
        "1659"
      ],
      "normals": [
        "610",
        "606",
        "817",
        "818"
      ],
      "uvs": [
        "1717",
        "1715",
        "1716",
        "1718"
      ]
    },
    {
      "vertices": [
        "1626",
        "1627",
        "1659",
        "1658"
      ],
      "normals": [
        "586",
        "610",
        "818",
        "819"
      ],
      "uvs": [
        "1719",
        "1717",
        "1718",
        "1720"
      ]
    },
    {
      "vertices": [
        "1625",
        "1626",
        "1658",
        "1657"
      ],
      "normals": [
        "587",
        "586",
        "819",
        "820"
      ],
      "uvs": [
        "1721",
        "1719",
        "1720",
        "1722"
      ]
    },
    {
      "vertices": [
        "1624",
        "1625",
        "1657",
        "1656"
      ],
      "normals": [
        "594",
        "587",
        "820",
        "821"
      ],
      "uvs": [
        "1723",
        "1721",
        "1722",
        "1724"
      ]
    },
    {
      "vertices": [
        "1623",
        "1624",
        "1656",
        "1655"
      ],
      "normals": [
        "599",
        "594",
        "821",
        "822"
      ],
      "uvs": [
        "1725",
        "1723",
        "1724",
        "1726"
      ]
    },
    {
      "vertices": [
        "1622",
        "1623",
        "1655",
        "1654"
      ],
      "normals": [
        "612",
        "599",
        "822",
        "823"
      ],
      "uvs": [
        "1727",
        "1725",
        "1726",
        "1728"
      ]
    },
    {
      "vertices": [
        "1621",
        "1622",
        "1654",
        "1653"
      ],
      "normals": [
        "584",
        "612",
        "823",
        "824"
      ],
      "uvs": [
        "1729",
        "1730",
        "1731",
        "1732"
      ]
    },
    {
      "vertices": [
        "1620",
        "1621",
        "1653",
        "1652"
      ],
      "normals": [
        "585",
        "584",
        "824",
        "825"
      ],
      "uvs": [
        "1733",
        "1729",
        "1732",
        "1734"
      ]
    },
    {
      "vertices": [
        "1619",
        "1620",
        "1652",
        "1651"
      ],
      "normals": [
        "593",
        "585",
        "825",
        "826"
      ],
      "uvs": [
        "1735",
        "1733",
        "1734",
        "1736"
      ]
    },
    {
      "vertices": [
        "1618",
        "1619",
        "1651",
        "1650"
      ],
      "normals": [
        "598",
        "593",
        "826",
        "827"
      ],
      "uvs": [
        "1737",
        "1735",
        "1736",
        "1738"
      ]
    },
    {
      "vertices": [
        "1617",
        "1618",
        "1650",
        "1649"
      ],
      "normals": [
        "603",
        "598",
        "827",
        "828"
      ],
      "uvs": [
        "1739",
        "1737",
        "1738",
        "1740"
      ]
    },
    {
      "vertices": [
        "1616",
        "1617",
        "1649",
        "1648"
      ],
      "normals": [
        "607",
        "603",
        "828",
        "829"
      ],
      "uvs": [
        "1741",
        "1739",
        "1740",
        "1742"
      ]
    },
    {
      "vertices": [
        "1615",
        "1616",
        "1648",
        "1647"
      ],
      "normals": [
        "611",
        "607",
        "829",
        "830"
      ],
      "uvs": [
        "1743",
        "1741",
        "1742",
        "1744"
      ]
    },
    {
      "vertices": [
        "1614",
        "1615",
        "1647",
        "1646"
      ],
      "normals": [
        "588",
        "611",
        "830",
        "831"
      ],
      "uvs": [
        "1745",
        "1743",
        "1744",
        "1746"
      ]
    },
    {
      "vertices": [
        "1613",
        "1614",
        "1646",
        "1645"
      ],
      "normals": [
        "589",
        "588",
        "831",
        "832"
      ],
      "uvs": [
        "1747",
        "1745",
        "1746",
        "1748"
      ]
    },
    {
      "vertices": [
        "1612",
        "1613",
        "1645",
        "1644"
      ],
      "normals": [
        "595",
        "589",
        "832",
        "833"
      ],
      "uvs": [
        "1749",
        "1747",
        "1748",
        "1750"
      ]
    },
    {
      "vertices": [
        "1611",
        "1612",
        "1644",
        "1643"
      ],
      "normals": [
        "600",
        "595",
        "833",
        "834"
      ],
      "uvs": [
        "1751",
        "1749",
        "1750",
        "1752"
      ]
    },
    {
      "vertices": [
        "1610",
        "1611",
        "1643",
        "1642"
      ],
      "normals": [
        "604",
        "600",
        "834",
        "835"
      ],
      "uvs": [
        "1753",
        "1751",
        "1752",
        "1754"
      ]
    },
    {
      "vertices": [
        "1609",
        "1610",
        "1642",
        "1641"
      ],
      "normals": [
        "608",
        "604",
        "835",
        "836"
      ],
      "uvs": [
        "1755",
        "1753",
        "1754",
        "1756"
      ]
    },
    {
      "vertices": [
        "1608",
        "1609",
        "1641",
        "1640"
      ],
      "normals": [
        "613",
        "608",
        "836",
        "837"
      ],
      "uvs": [
        "1757",
        "1755",
        "1756",
        "1758"
      ]
    },
    {
      "vertices": [
        "1607",
        "1608",
        "1640",
        "1639"
      ],
      "normals": [
        "590",
        "613",
        "837",
        "806"
      ],
      "uvs": [
        "1694",
        "1757",
        "1758",
        "1695"
      ]
    },
    {
      "vertices": [
        "1670",
        "1639",
        "1671",
        "1702"
      ],
      "normals": [
        "807",
        "806",
        "838",
        "839"
      ],
      "uvs": [
        "1696",
        "1695",
        "1759",
        "1760"
      ]
    },
    {
      "vertices": [
        "1669",
        "1670",
        "1702",
        "1701"
      ],
      "normals": [
        "808",
        "807",
        "839",
        "840"
      ],
      "uvs": [
        "1698",
        "1696",
        "1760",
        "1761"
      ]
    },
    {
      "vertices": [
        "1668",
        "1669",
        "1701",
        "1700"
      ],
      "normals": [
        "809",
        "808",
        "840",
        "841"
      ],
      "uvs": [
        "1700",
        "1698",
        "1761",
        "1762"
      ]
    },
    {
      "vertices": [
        "1667",
        "1668",
        "1700",
        "1699"
      ],
      "normals": [
        "810",
        "809",
        "841",
        "842"
      ],
      "uvs": [
        "1702",
        "1700",
        "1762",
        "1763"
      ]
    },
    {
      "vertices": [
        "1666",
        "1667",
        "1699",
        "1698"
      ],
      "normals": [
        "811",
        "810",
        "842",
        "843"
      ],
      "uvs": [
        "1704",
        "1702",
        "1763",
        "1764"
      ]
    },
    {
      "vertices": [
        "1665",
        "1666",
        "1698",
        "1697"
      ],
      "normals": [
        "812",
        "811",
        "843",
        "844"
      ],
      "uvs": [
        "1706",
        "1704",
        "1764",
        "1765"
      ]
    },
    {
      "vertices": [
        "1664",
        "1665",
        "1697",
        "1696"
      ],
      "normals": [
        "813",
        "812",
        "844",
        "845"
      ],
      "uvs": [
        "1708",
        "1706",
        "1765",
        "1766"
      ]
    },
    {
      "vertices": [
        "1663",
        "1664",
        "1696",
        "1695"
      ],
      "normals": [
        "814",
        "813",
        "845",
        "846"
      ],
      "uvs": [
        "1710",
        "1708",
        "1766",
        "1767"
      ]
    },
    {
      "vertices": [
        "1662",
        "1663",
        "1695",
        "1694"
      ],
      "normals": [
        "815",
        "814",
        "846",
        "847"
      ],
      "uvs": [
        "1712",
        "1710",
        "1767",
        "1768"
      ]
    },
    {
      "vertices": [
        "1661",
        "1662",
        "1694",
        "1693"
      ],
      "normals": [
        "816",
        "815",
        "847",
        "848"
      ],
      "uvs": [
        "1714",
        "1712",
        "1768",
        "1769"
      ]
    },
    {
      "vertices": [
        "1660",
        "1661",
        "1693",
        "1692"
      ],
      "normals": [
        "817",
        "816",
        "848",
        "849"
      ],
      "uvs": [
        "1716",
        "1714",
        "1769",
        "1770"
      ]
    },
    {
      "vertices": [
        "1659",
        "1660",
        "1692",
        "1691"
      ],
      "normals": [
        "818",
        "817",
        "849",
        "850"
      ],
      "uvs": [
        "1718",
        "1716",
        "1770",
        "1771"
      ]
    },
    {
      "vertices": [
        "1658",
        "1659",
        "1691",
        "1690"
      ],
      "normals": [
        "819",
        "818",
        "850",
        "851"
      ],
      "uvs": [
        "1720",
        "1718",
        "1771",
        "1772"
      ]
    },
    {
      "vertices": [
        "1657",
        "1658",
        "1690",
        "1689"
      ],
      "normals": [
        "820",
        "819",
        "851",
        "852"
      ],
      "uvs": [
        "1722",
        "1720",
        "1772",
        "1773"
      ]
    },
    {
      "vertices": [
        "1656",
        "1657",
        "1689",
        "1688"
      ],
      "normals": [
        "821",
        "820",
        "852",
        "853"
      ],
      "uvs": [
        "1724",
        "1722",
        "1773",
        "1774"
      ]
    },
    {
      "vertices": [
        "1655",
        "1656",
        "1688",
        "1687"
      ],
      "normals": [
        "822",
        "821",
        "853",
        "854"
      ],
      "uvs": [
        "1726",
        "1724",
        "1774",
        "1775"
      ]
    },
    {
      "vertices": [
        "1654",
        "1655",
        "1687",
        "1686"
      ],
      "normals": [
        "823",
        "822",
        "854",
        "855"
      ],
      "uvs": [
        "1728",
        "1726",
        "1775",
        "1776"
      ]
    },
    {
      "vertices": [
        "1653",
        "1654",
        "1686",
        "1685"
      ],
      "normals": [
        "824",
        "823",
        "855",
        "856"
      ],
      "uvs": [
        "1732",
        "1731",
        "1777",
        "1778"
      ]
    },
    {
      "vertices": [
        "1652",
        "1653",
        "1685",
        "1684"
      ],
      "normals": [
        "825",
        "824",
        "856",
        "857"
      ],
      "uvs": [
        "1734",
        "1732",
        "1778",
        "1779"
      ]
    },
    {
      "vertices": [
        "1651",
        "1652",
        "1684",
        "1683"
      ],
      "normals": [
        "826",
        "825",
        "857",
        "858"
      ],
      "uvs": [
        "1736",
        "1734",
        "1779",
        "1780"
      ]
    },
    {
      "vertices": [
        "1650",
        "1651",
        "1683",
        "1682"
      ],
      "normals": [
        "827",
        "826",
        "858",
        "859"
      ],
      "uvs": [
        "1738",
        "1736",
        "1780",
        "1781"
      ]
    },
    {
      "vertices": [
        "1649",
        "1650",
        "1682",
        "1681"
      ],
      "normals": [
        "828",
        "827",
        "859",
        "860"
      ],
      "uvs": [
        "1740",
        "1738",
        "1781",
        "1782"
      ]
    },
    {
      "vertices": [
        "1648",
        "1649",
        "1681",
        "1680"
      ],
      "normals": [
        "829",
        "828",
        "860",
        "861"
      ],
      "uvs": [
        "1742",
        "1740",
        "1782",
        "1783"
      ]
    },
    {
      "vertices": [
        "1647",
        "1648",
        "1680",
        "1679"
      ],
      "normals": [
        "830",
        "829",
        "861",
        "862"
      ],
      "uvs": [
        "1744",
        "1742",
        "1783",
        "1784"
      ]
    },
    {
      "vertices": [
        "1646",
        "1647",
        "1679",
        "1678"
      ],
      "normals": [
        "831",
        "830",
        "862",
        "863"
      ],
      "uvs": [
        "1746",
        "1744",
        "1784",
        "1785"
      ]
    },
    {
      "vertices": [
        "1645",
        "1646",
        "1678",
        "1677"
      ],
      "normals": [
        "832",
        "831",
        "863",
        "864"
      ],
      "uvs": [
        "1748",
        "1746",
        "1785",
        "1786"
      ]
    },
    {
      "vertices": [
        "1644",
        "1645",
        "1677",
        "1676"
      ],
      "normals": [
        "833",
        "832",
        "864",
        "865"
      ],
      "uvs": [
        "1750",
        "1748",
        "1786",
        "1787"
      ]
    },
    {
      "vertices": [
        "1643",
        "1644",
        "1676",
        "1675"
      ],
      "normals": [
        "834",
        "833",
        "865",
        "866"
      ],
      "uvs": [
        "1752",
        "1750",
        "1787",
        "1788"
      ]
    },
    {
      "vertices": [
        "1642",
        "1643",
        "1675",
        "1674"
      ],
      "normals": [
        "835",
        "834",
        "866",
        "867"
      ],
      "uvs": [
        "1754",
        "1752",
        "1788",
        "1789"
      ]
    },
    {
      "vertices": [
        "1641",
        "1642",
        "1674",
        "1673"
      ],
      "normals": [
        "836",
        "835",
        "867",
        "868"
      ],
      "uvs": [
        "1756",
        "1754",
        "1789",
        "1790"
      ]
    },
    {
      "vertices": [
        "1640",
        "1641",
        "1673",
        "1672"
      ],
      "normals": [
        "837",
        "836",
        "868",
        "869"
      ],
      "uvs": [
        "1758",
        "1756",
        "1790",
        "1791"
      ]
    },
    {
      "vertices": [
        "1639",
        "1640",
        "1672",
        "1671"
      ],
      "normals": [
        "806",
        "837",
        "869",
        "838"
      ],
      "uvs": [
        "1695",
        "1758",
        "1791",
        "1759"
      ]
    },
    {
      "vertices": [
        "1702",
        "1671",
        "1703",
        "1734"
      ],
      "normals": [
        "839",
        "838",
        "742",
        "804"
      ],
      "uvs": [
        "1760",
        "1759",
        "1627",
        "1691"
      ]
    },
    {
      "vertices": [
        "1701",
        "1702",
        "1734",
        "1733"
      ],
      "normals": [
        "840",
        "839",
        "804",
        "802"
      ],
      "uvs": [
        "1761",
        "1760",
        "1691",
        "1689"
      ]
    },
    {
      "vertices": [
        "1700",
        "1701",
        "1733",
        "1732"
      ],
      "normals": [
        "841",
        "840",
        "802",
        "800"
      ],
      "uvs": [
        "1762",
        "1761",
        "1689",
        "1687"
      ]
    },
    {
      "vertices": [
        "1699",
        "1700",
        "1732",
        "1731"
      ],
      "normals": [
        "842",
        "841",
        "800",
        "798"
      ],
      "uvs": [
        "1763",
        "1762",
        "1687",
        "1685"
      ]
    },
    {
      "vertices": [
        "1698",
        "1699",
        "1731",
        "1730"
      ],
      "normals": [
        "843",
        "842",
        "798",
        "796"
      ],
      "uvs": [
        "1764",
        "1763",
        "1685",
        "1683"
      ]
    },
    {
      "vertices": [
        "1697",
        "1698",
        "1730",
        "1729"
      ],
      "normals": [
        "844",
        "843",
        "796",
        "794"
      ],
      "uvs": [
        "1765",
        "1764",
        "1683",
        "1681"
      ]
    },
    {
      "vertices": [
        "1696",
        "1697",
        "1729",
        "1728"
      ],
      "normals": [
        "845",
        "844",
        "794",
        "792"
      ],
      "uvs": [
        "1766",
        "1765",
        "1681",
        "1679"
      ]
    },
    {
      "vertices": [
        "1695",
        "1696",
        "1728",
        "1727"
      ],
      "normals": [
        "846",
        "845",
        "792",
        "790"
      ],
      "uvs": [
        "1767",
        "1766",
        "1679",
        "1677"
      ]
    },
    {
      "vertices": [
        "1694",
        "1695",
        "1727",
        "1726"
      ],
      "normals": [
        "847",
        "846",
        "790",
        "788"
      ],
      "uvs": [
        "1768",
        "1767",
        "1677",
        "1675"
      ]
    },
    {
      "vertices": [
        "1693",
        "1694",
        "1726",
        "1725"
      ],
      "normals": [
        "848",
        "847",
        "788",
        "786"
      ],
      "uvs": [
        "1769",
        "1768",
        "1675",
        "1673"
      ]
    },
    {
      "vertices": [
        "1692",
        "1693",
        "1725",
        "1724"
      ],
      "normals": [
        "849",
        "848",
        "786",
        "784"
      ],
      "uvs": [
        "1770",
        "1769",
        "1673",
        "1671"
      ]
    },
    {
      "vertices": [
        "1691",
        "1692",
        "1724",
        "1723"
      ],
      "normals": [
        "850",
        "849",
        "784",
        "782"
      ],
      "uvs": [
        "1771",
        "1770",
        "1671",
        "1669"
      ]
    },
    {
      "vertices": [
        "1690",
        "1691",
        "1723",
        "1722"
      ],
      "normals": [
        "851",
        "850",
        "782",
        "780"
      ],
      "uvs": [
        "1772",
        "1771",
        "1669",
        "1667"
      ]
    },
    {
      "vertices": [
        "1689",
        "1690",
        "1722",
        "1721"
      ],
      "normals": [
        "852",
        "851",
        "780",
        "778"
      ],
      "uvs": [
        "1773",
        "1772",
        "1667",
        "1665"
      ]
    },
    {
      "vertices": [
        "1688",
        "1689",
        "1721",
        "1720"
      ],
      "normals": [
        "853",
        "852",
        "778",
        "776"
      ],
      "uvs": [
        "1774",
        "1773",
        "1665",
        "1663"
      ]
    },
    {
      "vertices": [
        "1687",
        "1688",
        "1720",
        "1719"
      ],
      "normals": [
        "854",
        "853",
        "776",
        "774"
      ],
      "uvs": [
        "1775",
        "1774",
        "1663",
        "1660"
      ]
    },
    {
      "vertices": [
        "1686",
        "1687",
        "1719",
        "1718"
      ],
      "normals": [
        "855",
        "854",
        "774",
        "772"
      ],
      "uvs": [
        "1776",
        "1775",
        "1660",
        "1659"
      ]
    },
    {
      "vertices": [
        "1685",
        "1686",
        "1718",
        "1717"
      ],
      "normals": [
        "856",
        "855",
        "772",
        "770"
      ],
      "uvs": [
        "1778",
        "1777",
        "1657",
        "1655"
      ]
    },
    {
      "vertices": [
        "1684",
        "1685",
        "1717",
        "1716"
      ],
      "normals": [
        "857",
        "856",
        "770",
        "768"
      ],
      "uvs": [
        "1779",
        "1778",
        "1655",
        "1653"
      ]
    },
    {
      "vertices": [
        "1683",
        "1684",
        "1716",
        "1715"
      ],
      "normals": [
        "858",
        "857",
        "768",
        "766"
      ],
      "uvs": [
        "1780",
        "1779",
        "1653",
        "1651"
      ]
    },
    {
      "vertices": [
        "1682",
        "1683",
        "1715",
        "1714"
      ],
      "normals": [
        "859",
        "858",
        "766",
        "764"
      ],
      "uvs": [
        "1781",
        "1780",
        "1651",
        "1649"
      ]
    },
    {
      "vertices": [
        "1681",
        "1682",
        "1714",
        "1713"
      ],
      "normals": [
        "860",
        "859",
        "764",
        "762"
      ],
      "uvs": [
        "1782",
        "1781",
        "1649",
        "1647"
      ]
    },
    {
      "vertices": [
        "1680",
        "1681",
        "1713",
        "1712"
      ],
      "normals": [
        "861",
        "860",
        "762",
        "760"
      ],
      "uvs": [
        "1783",
        "1782",
        "1647",
        "1645"
      ]
    },
    {
      "vertices": [
        "1679",
        "1680",
        "1712",
        "1711"
      ],
      "normals": [
        "862",
        "861",
        "760",
        "758"
      ],
      "uvs": [
        "1784",
        "1783",
        "1645",
        "1643"
      ]
    },
    {
      "vertices": [
        "1678",
        "1679",
        "1711",
        "1710"
      ],
      "normals": [
        "863",
        "862",
        "758",
        "756"
      ],
      "uvs": [
        "1785",
        "1784",
        "1643",
        "1641"
      ]
    },
    {
      "vertices": [
        "1677",
        "1678",
        "1710",
        "1709"
      ],
      "normals": [
        "864",
        "863",
        "756",
        "754"
      ],
      "uvs": [
        "1786",
        "1785",
        "1641",
        "1639"
      ]
    },
    {
      "vertices": [
        "1676",
        "1677",
        "1709",
        "1708"
      ],
      "normals": [
        "865",
        "864",
        "754",
        "752"
      ],
      "uvs": [
        "1787",
        "1786",
        "1639",
        "1637"
      ]
    },
    {
      "vertices": [
        "1675",
        "1676",
        "1708",
        "1707"
      ],
      "normals": [
        "866",
        "865",
        "752",
        "750"
      ],
      "uvs": [
        "1788",
        "1787",
        "1637",
        "1635"
      ]
    },
    {
      "vertices": [
        "1674",
        "1675",
        "1707",
        "1706"
      ],
      "normals": [
        "867",
        "866",
        "750",
        "748"
      ],
      "uvs": [
        "1789",
        "1788",
        "1635",
        "1633"
      ]
    },
    {
      "vertices": [
        "1673",
        "1674",
        "1706",
        "1705"
      ],
      "normals": [
        "868",
        "867",
        "748",
        "746"
      ],
      "uvs": [
        "1790",
        "1789",
        "1633",
        "1631"
      ]
    },
    {
      "vertices": [
        "1672",
        "1673",
        "1705",
        "1704"
      ],
      "normals": [
        "869",
        "868",
        "746",
        "743"
      ],
      "uvs": [
        "1791",
        "1790",
        "1631",
        "1628"
      ]
    },
    {
      "vertices": [
        "1671",
        "1672",
        "1704",
        "1703"
      ],
      "normals": [
        "838",
        "869",
        "743",
        "742"
      ],
      "uvs": [
        "1759",
        "1791",
        "1628",
        "1627"
      ]
    },
    {
      "vertices": [
        "1735",
        "1574",
        "1736"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1793",
        "1794"
      ]
    },
    {
      "vertices": [
        "1735",
        "1736",
        "1737"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1794",
        "1795"
      ]
    },
    {
      "vertices": [
        "1735",
        "1737",
        "1738"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1795",
        "1796"
      ]
    },
    {
      "vertices": [
        "1735",
        "1738",
        "1739"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1796",
        "1797"
      ]
    },
    {
      "vertices": [
        "1735",
        "1739",
        "1740"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1797",
        "1798"
      ]
    },
    {
      "vertices": [
        "1735",
        "1740",
        "1741"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1798",
        "1799"
      ]
    },
    {
      "vertices": [
        "1735",
        "1741",
        "1742"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1799",
        "1800"
      ]
    },
    {
      "vertices": [
        "1735",
        "1742",
        "1743"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1800",
        "1801"
      ]
    },
    {
      "vertices": [
        "1735",
        "1743",
        "1744"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1801",
        "1802"
      ]
    },
    {
      "vertices": [
        "1735",
        "1744",
        "1745"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1802",
        "1803"
      ]
    },
    {
      "vertices": [
        "1735",
        "1745",
        "1746"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1803",
        "1804"
      ]
    },
    {
      "vertices": [
        "1735",
        "1746",
        "1747"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1804",
        "1805"
      ]
    },
    {
      "vertices": [
        "1735",
        "1747",
        "1748"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1805",
        "1806"
      ]
    },
    {
      "vertices": [
        "1735",
        "1748",
        "1749"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1806",
        "1807"
      ]
    },
    {
      "vertices": [
        "1735",
        "1749",
        "1750"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1807",
        "1808"
      ]
    },
    {
      "vertices": [
        "1735",
        "1750",
        "1751"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1808",
        "1809"
      ]
    },
    {
      "vertices": [
        "1735",
        "1751",
        "1752"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1809",
        "1810"
      ]
    },
    {
      "vertices": [
        "1735",
        "1752",
        "1753"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1810",
        "1811"
      ]
    },
    {
      "vertices": [
        "1735",
        "1753",
        "1754"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1811",
        "1812"
      ]
    },
    {
      "vertices": [
        "1735",
        "1754",
        "1755"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1812",
        "1813"
      ]
    },
    {
      "vertices": [
        "1735",
        "1755",
        "1756"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1813",
        "1814"
      ]
    },
    {
      "vertices": [
        "1735",
        "1756",
        "1757"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1814",
        "1815"
      ]
    },
    {
      "vertices": [
        "1735",
        "1757",
        "1758"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1815",
        "1816"
      ]
    },
    {
      "vertices": [
        "1735",
        "1758",
        "1759"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1816",
        "1817"
      ]
    },
    {
      "vertices": [
        "1735",
        "1759",
        "1760"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1817",
        "1818"
      ]
    },
    {
      "vertices": [
        "1735",
        "1760",
        "1761"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1818",
        "1819"
      ]
    },
    {
      "vertices": [
        "1735",
        "1761",
        "1762"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1819",
        "1820"
      ]
    },
    {
      "vertices": [
        "1735",
        "1762",
        "1763"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1820",
        "1821"
      ]
    },
    {
      "vertices": [
        "1735",
        "1763",
        "1764"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1821",
        "1822"
      ]
    },
    {
      "vertices": [
        "1735",
        "1764",
        "1765"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1822",
        "1823"
      ]
    },
    {
      "vertices": [
        "1735",
        "1765",
        "1766"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1823",
        "1824"
      ]
    },
    {
      "vertices": [
        "1735",
        "1766",
        "1574"
      ],
      "normals": [
        "581",
        "581",
        "581"
      ],
      "uvs": [
        "1792",
        "1824",
        "1793"
      ]
    }
  ]
}
},{}]},{},[1])

