// Main namespace
(function() {

    // All possible templates.  To add templates, add them here
    // each template is an array of object with x,y coords and width/height, all in percentages
    // margins are added by the builder function later
    // scaling for editor display is handled by css
    var templates = [
        [ // 4 squares
            {
                x : 0,
                y : 0,
                width : 50,
                height : 50
            },
            {
                x : 50,
                y : 0,
                width : 50,
                height : 50
            },
            {
                x : 0,
                y : 50,
                width : 50,
                height : 50
            },
            {
                x : 50,
                y : 50,
                width : 50,
                height : 50
            }
        ],
        [ // 2 verts, 1 horiz, 1 large vert
            {
                x : 0,
                y : 0,
                width : 33.33,
                height : 50
            },
            {
                x : 33.33,
                y : 0,
                width : 33.33,
                height : 50
            },
            {
                x : 0,
                y : 50,
                width : 66.66,
                height : 50
            },
            {
                x : 66.66,
                y : 0,
                width : 33.33,
                height : 100
            }
        ],
        [
            {
                x : 0,
                y : 0,
                width : 50,
                height : 33.33
            },
            {
                x : 0,
                y : 33.33,
                width : 50,
                height : 33.33
            },
            {
                x : 0,
                y : 66.66,
                width : 50,
                height : 33.33
            },
            {
                x : 50,
                y : 0,
                width : 50,
                height : 100
            }
        ]
    ];
    var canvases = []; // stores canvas objects, as defined in the Canvas class below
    var activeCanvasObj = null; // will store the chosen canvas
    var activeCtx;

    // settings
    var MARGIN_SIZE = 10;
    var IMG_WIDTH = 1000;  // final saved collage size
    var IMG_HEIGHT = 1000;
    var DEFAULT_IMG_COLOR = "#CCCCCC";
    var IMG_BG_COLOR = "FFFFFF";
    var ZOOM_RATE = .01;

    // internal usage
    var state = 0; // 0 = choosing template, 1 = editing
    var uploader = document.getElementById("file-upload");
    var reader = new FileReader();



    // --------------------------
    //  Classes
    // --------------------------
    // this.varName = public var, var varName = private var
    var Canvas = function ( template ) {
        var _ = this;
        this.template = template;
        this.canvas = document.createElement("canvas");
        this.canvas.width = IMG_WIDTH;
        this.canvas.height = IMG_HEIGHT;
        var ctx = this.canvas.getContext("2d");
        // build sections
        var imgSections = [];
        for( var i = 0; i < template.length; i++ ){
            var img = {};
            img.x = template[i].x / 100 * (IMG_WIDTH - MARGIN_SIZE) + MARGIN_SIZE;
            img.y = template[i].y / 100 * (IMG_HEIGHT - MARGIN_SIZE) + MARGIN_SIZE;
            img.width = template[i].width / 100 * (IMG_WIDTH - MARGIN_SIZE) - MARGIN_SIZE;
            img.height = template[i].height / 100 * (IMG_HEIGHT - MARGIN_SIZE) - MARGIN_SIZE;
            imgSections[i] = img;
        }
        // section control
        var selectedImg;
        var lastMousePos = { x : 0 , y : 0 };
        var mousePos = { x : 0 , y : 0 };
        var mouseDown = false;
        var dragging = false;
        var distBetweenTouches = 0;

        // draw the canvas
        this.draw = function() {
            // first, fill background
            ctx.save();
            ctx.fillStyle = IMG_BG_COLOR;
            ctx.fillRect(0,0,IMG_WIDTH,IMG_HEIGHT);
            ctx.restore();

            for( var i = 0; i < imgSections.length; i++ ){
                var sec = imgSections[i];
                ctx.save();
                ctx.fillStyle = DEFAULT_IMG_COLOR;
                // build the rect for clipping
                ctx.beginPath();
                ctx.rect( sec.x , sec.y , sec.width , sec.height );
                ctx.closePath();
                ctx.fill();
                // mask next calls
                ctx.clip();
                if( sec.img ){
                    ctx.drawImage( sec.img , sec.pos.x , sec.pos.y , sec.img.width * sec.pos.scale , sec.img.height * sec.pos.scale );
                }

                // reset
                ctx.restore();
            }
        }

        // control images
        var centerImg = function( i ) {
            var sec = imgSections[i]
            var img = sec.img;
            var width = img.width;
            var height = img.height;
            var pos = {}; // positioner
            pos.scale = Math.max(sec.height/height,sec.width/width);

            pos.x = (sec.width - width*pos.scale)/2 + sec.x;
            pos.y = (sec.height - height*pos.scale)/2 + sec.y;

            sec.pos = pos;

            _.draw();
        }
        var resizeImg = function( i , delta ) {
            var sec = imgSections[i];
            var img = sec.img;
            var pos = sec.pos;
            var oldW = img.width * pos.scale;
            var oldH = img.height * pos.scale;
            var oldX = pos.x;
            var oldY = pos.y;

            pos.scale += delta;
            if( pos.scale < .1 )
                pos.scale = .1;

            var newW = img.width * pos.scale;
            var newH = img.height * pos.scale;
            var deltaW = newW - oldW;
            var deltaH = newH - oldH;
            pos.x = oldX - (deltaW/2);
            pos.y = oldY - (deltaH/2);

            _.draw();
        }
        this.clearImages = function() {
            for( i = 0; i < imgSections.length; i++ ){
                imgSections[i].img = null;
            }
            _.draw();
        }

        // contain the canvas element and return it
        this.getElement = function() {
            var div = document.createElement('div');
            div.className = "canvasContainer";
            div.appendChild(_.canvas);
            return div;
        }

        // define uploaded image
        _.onFileUpload = function ( e ) {
            var f = e.target.files[0];

            // save base64 of img
            reader.onload = function(e) {
                var img = new Image();
                img.src = e.target.result;
                imgSections[selectedImg].img = img;
                centerImg(selectedImg);
            };
            // read it in
            reader.readAsDataURL(f);
        }

        // listeners
        var onClick = function ( e ) {
            if( state == 0 ){
                // selecting template state
                state = 1;
                _.canvas.parentElement.className = _.canvas.parentElement.className + " active";

                for( i = 0; i < canvases.length; i++ ){
                    if( canvases[i] != _ ){
                        canvases[i].canvas.parentElement.className = canvases[i].canvas.parentElement.className + " inactive";
                    }
                }

                var interface = document.getElementById("interface");
                interface.className += " state1";

                uploader.addEventListener("change",_.onFileUpload);

                activeCanvasObj = _;
            }
            else {
                // template selected
		          mousePos = getRelativePosition( e );
                var i = getImgSectionByMousePos();
                if( i != -1 && !imgSections[i].img ){
                    selectedImg = i;
                    uploader.click();
                }
            }
        }
        var onMouseMove = function ( e ) {
	       e.preventDefault(); //for touch devices, stop scrolling
            mousePos = getRelativePosition( e );

            if( dragging && ( !e.changedTouches || e.changedTouches.length < 2 ) ){
                sec = imgSections[selectedImg];
                var deltaX = mousePos.x - lastMousePos.x;
                var deltaY = mousePos.y - lastMousePos.y;

                sec.pos.x += deltaX;
                sec.pos.y += deltaY;

                _.draw();
            }
            // pinch for zoom
            else if( imgSections[selectedImg].img && e.changedTouches.length >= 2 ){
                var touchRelPos = [ getRelativePosition( e.changedTouches[0] ) , getRelativePosition( e.changedTouches[1] ) ];
                var deltaX = touchRelPos[1].x - touchRelPos[0].x;
                var deltaY = touchRelPos[1].y - touchRelPos[0].y;
                var newDist = Math.sqrt( deltaX*deltaX + deltaY+deltaY );
                if( distBetweenTouches != 0 ){
                    var delta = ( newDist - distBetweenTouches ) * ZOOM_RATE;
                    resizeImg( selectedImg , delta );
                }
                distBetweenTouches = newDist;
            }

            lastMousePos = mousePos;
        }
        var onMouseDown = function ( e ) {
	       mousePos = getRelativePosition( e );
	       lastMousePos = mousePos;
            mouseDown = true;

            if( !dragging ){
                var sec;
                var i = getImgSectionByMousePos();
                if( i != -1 ){
                    sec = imgSections[i];
                    if( sec.img ){
                        dragging = true;
                        selectedImg = i;
                    }
                }
                else
                    return;
            }
        }
        var onMouseUp = function ( e ) {
            if( !e.changedTouches || e.changedTouches.length < 2 ){
                mouseDown = false;
                dragging = false;
            }
            distBetweenTouches = 0;
        }
        var onMouseWheel = function ( e ) {
            var i = getImgSectionByMousePos();
            if( i != -1 && imgSections[i].img ){
                resizeImg( i , e.wheelDelta * ZOOM_RATE / 100 );
            }
            e.preventDefault();
        }

        // mousepos
        var getRelativePosition = function ( e ){
            // get click pos
			var obj = _.canvas;
			var curleft = curtop = 0;
			if (obj.offsetParent) {
				curleft = obj.offsetLeft
				curtop = obj.offsetTop
				while (obj = obj.offsetParent) {
					curleft += obj.offsetLeft
					curtop += obj.offsetTop
				}
			}

			// get only first touch's position.  This can be overridden by sending the specific touch as e
			if( e.changedTouches && e.changedTouches[0] )
				e = e.changedTouches[0];

			var mouseX = e.pageX - curleft;
			var mouseY = e.pageY - curtop;

            var scale = _.canvas.clientWidth / IMG_WIDTH;

            return { x : mouseX / scale , y : mouseY / scale };
        }
        var getImgSectionByMousePos = function () {
            for( i = 0; i < imgSections.length; i++ ){
                var sec = imgSections[i];
                if( mousePos.x > sec.x && mousePos.x < sec.x + sec.width && mousePos.y > sec.y && mousePos.y < sec.y + sec.height ){
                    return i;
                }
            }
            return -1;
        }

        // add the listeners
        this.addListeners = function () {
            _.canvas.addEventListener("click", onClick);
            _.canvas.addEventListener("mousemove", onMouseMove);
            _.canvas.addEventListener("touchmove", onMouseMove);
            _.canvas.addEventListener("mousedown", onMouseDown);
            _.canvas.addEventListener("touchstart", onMouseDown);
            document.body.addEventListener("mouseup", onMouseUp); // end dragging even if dragged off the canvas
            _.canvas.addEventListener("touchend", onMouseUp); // touch devices call touchend on the element where touch started, not where it ended...for some reason
            _.canvas.addEventListener("mousewheel", onMouseWheel);
            _.canvas.addEventListener("DOMmouseScroll", onMouseWheel); // firefox
        }
        this.addListeners();
    }

    // --------------------------
    //  HTML Templating
    // --------------------------
    var buildHTMLFromTemplate = function ( data , templateID ) {
        /*
         * Pass an object with the vars needed for the template
        */
        var template = document.getElementById(templateID).textContent;
        if( !template )
            template = document.getElementById(templateID).innerText; // IE fallback

        var output = template.replace(/\{\{(\w+)\}\}/g,function($0,$1){
            return data[$1];
        });

        return output;
    }


    // --------------------------
    //  Interface control
    // --------------------------
    var backToStage1 = function ( e ) {
        state = 0;
        for( var i = 0; i < canvases.length; i++ ){
            canvases[i].canvas.parentElement.className = canvases[i].canvas.parentElement.className.replace(/\s*\b(in)?active\b/g,'');
        }
        activeCanvasObj.clearImages();

        var interface = document.getElementById("interface");
        interface.className = interface.className.replace(/\s*\bstate1\b/g,"");

        uploader.removeEventListener("change",activeCanvasObj.onFileUpload);

        e.preventDefault();
    }
    document.getElementById("backToTemplates").addEventListener("click",backToStage1);


    // --------------------------
    //  Run
    // --------------------------
    var section = document.getElementById("allTemplates");
    for( i = 0; i < templates.length; i++ ){
        canvases.push(new Canvas(templates[i]));

        // temp object for getting the one we want
        section.appendChild( canvases[i].getElement() );

        canvases[i].draw();
    }

}());




// Avoid `console` errors in browsers that lack a console. From HTML5 boilerplate's plugins.js
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());
