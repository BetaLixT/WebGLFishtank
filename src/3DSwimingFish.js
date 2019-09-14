var gl;
var program;
var objectsToDraw	= [];
var addingFish 		= false;
var angle 			= 0;
var slider 			= document.getElementById("angleSlider");



/*
 * function driver
 *
 * DESC   : This function controlls the execution
 *          flow of this script
 *
 */
window.onload = function driver()
{	
	initialize();
	startInteractiveSession();
	
};



function startInteractiveSession()
{
	var bufferId 						= gl.createBuffer();
	var vPosition 						= gl.getAttribLocation( program, "vPosition" );
	var vColor 							= gl.getAttribLocation(program, "vVertexColor");
	var canvas 							= document.getElementById( "gl-canvas" );
	var matWorldUniformLocation 		= gl.getUniformLocation(program, "mWorld");
	var worldMatrix 					= [];	
	var vecTranslationUniformLocation 	= gl.getUniformLocation(program, "vtranslation");
	var vecSpawnUniformLocation 		= gl.getUniformLocation(program, "vSpawn")
	var vecScaleUniformLocation 		= gl.getUniformLocation(program, "vScale");
	var FSIZE 							= Float32Array.BYTES_PER_ELEMENT;
	
	


	/*
	 * fucntion drawScene()
	 *
	 * Desc	: This funtion is the main render loop
	 *		  of the program
	 *
	 */
	function drawScene()
	{
		
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		
		objectsToDraw.forEach(function(object)
		{
			
			// --- Filling buffer with data and associating with shader attributes
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferData( gl.ARRAY_BUFFER, object.vertexData, gl.STATIC_DRAW );
			// Position
			gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, FSIZE * 6, 0 );
			gl.enableVertexAttribArray( vPosition );
			// Color
			gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
			gl.enableVertexAttribArray(vColor);
	

			
			// --- Updating Matrices
			if ((object.translationState  +  object.u_spawn[12] > 0.8 && object.translationState > 0) || 
				(object.translationState +  object.u_spawn[12] < -0.8 && object.translationState < 0))
				object.u_translationChange *= -1;
			object.translationState += object.u_translationChange;
			
			if (object.u_translationChange > 0)
				gl.uniformMatrix4fv(vecScaleUniformLocation, gl.FALSE, [
					object.scale,	0.0, 			0.0, 			0.0,
					0.0, 			object.scale, 	0.0, 			0.0,
					0.0, 			0.0, 			object.scale, 	0.0,
					0.0, 			0.0, 			0.0, 			1.0]);
			else
				gl.uniformMatrix4fv(vecScaleUniformLocation, gl.FALSE, [
					-object.scale,	0.0, 			0.0, 			0.0,
					0.0, 			object.scale, 	0.0, 			0.0,
					0.0, 			0.0, 			object.scale, 	0.0,
					0.0, 			0.0, 			0.0, 			1.0]);

			worldMatrix = [
				Math.cos(angle),	0, 	Math.sin(angle),		0,
				0,					1,	0,						0,
				-Math.sin(angle), 	0 ,	Math.cos(angle),		0,
				0,					0,	0,						1];



			// -- Setting shader uniforms
			// Spawn
			gl.uniformMatrix4fv(vecSpawnUniformLocation, gl.FALSE, new Float32Array(object.u_spawn));
			// Translation
			gl.uniformMatrix4fv(vecTranslationUniformLocation, gl.FALSE,
			[ 1.0, 0.0, 0.0, 0.0, 
			  0.0, 1.0, 0.0, 0.0,
			  0.0, 0.0, 1.0, 0.0,
			  object.translationState, 0.0, 0.0, 1.0]);
			// World
			gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
			


			// --- Draw Object
			gl.drawArrays( gl.TRIANGLES, 0 , object.vertexData.length/6);
			
		});
		requestAnimFrame(drawScene);
	};
	



	// ---- User interaction functions
	/*
	 * This funtion will wait for the slider to change
	 * and will change the camera z axis angle
	 */
	slider.oninput = function() {
		angle = ((this.value) * (Math.PI))/180;
	};
		
	


	/*
	 * This funtion will wait for the mouse down
	 * and will spawn a new fish
	 */
	canvas.onmousedown = function (ev)
	{
		addingFish = true;


		// --- Creating new fish object
		var xClick = ((ev.clientX - (canvas.width/2) - canvas.offsetLeft)/(canvas.width/2)) * 1;
		var yClick = ((ev.clientY - (canvas.height/2) - canvas.offsetTop)) / (-(canvas.height/2)) * 1;
		
		var fishUniforms = {
		vertexData: new Float32Array(fishVert),
		u_spawn:   [1.0, 0.0, 0.0, 0.0,
				   0.0, 1.0, 0.0, 0.0,
				   0.0, 0.0, 1.0, 0.0,
				   xClick, yClick, Math.random() * 2 - 1, 1.0],
		scale: Math.random() * .3 + .25,
		u_translationChange: 0.0,
		translationState: 0.0
		};



		// --- Setting random color
		var rr = Math.random(); var gg = Math.random(); var bb = Math.random();
		for (var i = 0; i <= fishUniforms.vertexData.length / 6; i++)
		{
			if ( fishUniforms.vertexData[3 * (i * 2 + 1)] != 0 && fishUniforms.vertexData[3 * (i * 2 + 1)] != 1)
			{
				fishUniforms.vertexData[3 * (i * 2 + 1)] = rr;
				fishUniforms.vertexData[(3 * (i * 2 + 1)) + 1] = gg;
				fishUniforms.vertexData[(3 * (i * 2 + 1)) + 2] = bb;
			}
		}

		objectsToDraw = objectsToDraw.concat(fishUniforms);
		
	}
	



	/*
	 * This funtion will listen for the mouse movement
	 * drag the fish spawned by mouse down
	 */
	canvas.onmousemove = function (ev)
	{
		if (addingFish == true)
		{
			var xClick = ((ev.clientX - (canvas.width/2) - canvas.offsetLeft)/(canvas.width/2)) * 1;
			var yClick = ((ev.clientY - (canvas.height/2) - canvas.offsetTop)) / (-(canvas.height/2)) * 1;
			
			objectsToDraw[(objectsToDraw.length) - 1].u_spawn[12] = xClick;
			objectsToDraw[(objectsToDraw.length) - 1].u_spawn[13] = yClick;  
		}
	}
	



	/*
	 * This funtion will wait for the mouse up
	 * and release fish adding a constant translation
	 */
	canvas.onmouseup = function (ev)
	{
		if (addingFish == true)
		{
			var xClick = ((ev.clientX - (canvas.width/2) - canvas.offsetLeft)/(canvas.width/2)) * 1;
			var yClick = ((ev.clientY - (canvas.height/2) - canvas.offsetTop)) / (-(canvas.height/2)) * 1;
			

			// --- Updating fish object
			objectsToDraw[(objectsToDraw.length) - 1].u_spawn[12] = xClick;
			objectsToDraw[(objectsToDraw.length) - 1].u_spawn[13] = yClick;  
			objectsToDraw[(objectsToDraw.length) - 1].u_translationChange = Math.random() * -.01 - .001;
			
			addingFish = false;
			console.log(xClick + ' ' + yClick);
			console.log(canvas.offsetTop);
		}
	};





	// --- Starting render loop
	requestAnimFrame(drawScene);
}





// ---- Initialization functions
/*
 * function initShaders
 *
 * IN   : vertexShaderId, fragmentShaderId
 * OUT  : program
 * DESC : Creates program from given vertex and fragment shaders
 * 		  Shaders are grabbed from html using given IDs
 */

function initShaders( vertexShaderId, fragmentShaderId )
{
    var vertShdr;
	var fragShdr;
	


	// --- Compiling vertex shader
    var vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) { 
        alert( "Unable to load vertex shader " + vertexShaderId );
        return -1;
    }
    else {
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertElem.text );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }



	// --- Compiling fragment shader
    var fragElem = document.getElementById( fragmentShaderId );
    if ( !fragElem ) { 
        alert( "Unable to load vertex shader " + fragmentShaderId );
        return -1;
    }
    else {
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragElem.text );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }



	// --- Creating program
    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    
    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}




/*
 *
 * function initialize
 *
 * DESC   : This function will get canvas information,
 *	   		configure WebGL and load shaders
 *
 */
function initialize()
{
	var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
		alert( "WebGL isn't available" ); 
	}
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.0, 0.62, 0.882, 1.0 );
	gl.clear( gl.COLOR_BUFFER_BIT );
	
	program = initShaders( "vertex-shader-body", "fragment-shader-body" );
	gl.useProgram(program);
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor( 0.0, 0.62, 0.882, 1.0 );
}