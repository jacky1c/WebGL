/*
 * Demonstrate lighting.
 *
 * Adapted for WebGL by Alex Clarke, 2016, updated 2017
 */


//----------------------------------------------------------------------------
// Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;
var obj;

var red = [1.0, 0.0, 0.0, 1.0];
var green = [0.0, 1.0, 0.0, 1.0];
var blue = [0.0, 0.0, 1.0, 1.0];
var lightred = [1.0, 0.5, 0.5, 1.0];
var lightgreen = [0.5, 1.0, 0.5, 1.0];
var lightblue = [0.5, 0.5, 1.0, 1.0];
var white = [1.0, 1.0, 1.0, 1.0];
var black = [0.0, 0.0, 0.0, 1.0];
var bgLightColor = [58.0/255.0, 194.0/255.0, 255.0/255.0, 1.0];
var radioactiveGreen = [93.0/255.0, 202.0/255.0, 49.0/255.0, 1.0];
//Variables for Transformation Matrices
var mv = new mat4();
var p = new mat4();
var mvLoc, projLoc;

//Variables for Lighting
var light;
var material;
var lighting;
var uColor;

//You will need to rebind these buffers
//and point attributes at them after calling uofrGraphics draw functions
var vertexBuffer, normalBuffer;
var program;

//sphere subdivisions
var rez = 10;

function bindBuffersToShader(obj) {
   gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexObject);
   gl.vertexAttribPointer(program.vPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vPosition);

   gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalObject);
   gl.vertexAttribPointer(program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vNormal);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexObject);
}

function setLightMode(event)
{
    var type =(event.srcElement || event.target);
    if (type.value == "hemi")
		gl.uniform1i(light.hemisphere, 1);
	else
		gl.uniform1i(light.hemisphere, 0);
};

//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------

window.onload = function init() {
   // Set up a WebGL Rendering Context in an HTML5 Canvas
   var canvas = document.getElementById("gl-canvas");
   gl = WebGLUtils.setupWebGL(canvas);
   if (!gl) {
      alert("WebGL isn't available");
   }

   //  Configure WebGL
   //  eg. - set a clear color
   //      - turn on depth testing
   gl.clearColor(0.0, 0.0, 0.0, 0.0);
   gl.enable(gl.DEPTH_TEST);

   //  Load shaders and initialize attribute buffers
   program = initShaders(gl, "vertex-shader", "fragment-shader");
   gl.useProgram(program);

   // Load the data into GPU data buffers and
   // Associate shader attributes with corresponding data buffers
   //***Vertices***
   program.vPosition = gl.getAttribLocation(program, "vPosition");
   gl.enableVertexAttribArray(program.vPosition);

   //***Normals***
   program.vNormal = gl.getAttribLocation(program, "vNormal");
   gl.enableVertexAttribArray(program.vNormal);

   //** uofrGraphics setup
   // relies on position and normal arrays
   // stub is used instead of the simple diffuse colour that
   // uofrGraphics was designed for, since we will be using
   // a more complex shader
   // uofrGraphics loads and binds its own buffers, so
   // watch out if you mix it with your own hand written geometry...
   urgl = new uofrGraphics();
   urgl.connectShader(program, "vPosition", "vNormal", "stub");

   //** start loading an obj.
   // The obj's buffers will need to be bound to draw them
   // see bindBuffersToShader() function for details.
   obj = loadObj(gl, "BatmanArmoured.obj");


   // Get addresses of transformation uniforms
   projLoc = gl.getUniformLocation(program, "p");
   mvLoc = gl.getUniformLocation(program, "mv");

   //Set up viewport
   gl.viewportWidth = canvas.width;
   gl.viewportHeight = canvas.height;
   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

   //Set up projection matrix
   p = perspective(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
   gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(p));


   // Get and set light uniforms
   light = []; // array of light property locations (defined globally)
   var n = 1; // number of lights - adjust to match shader
   for (var i = 0; i < n; i++) {
      light[i] = {}; // initialize this light object
      light[i].diffuse = gl.getUniformLocation(program, "light[" + i + "].diffuse");
      light[i].specular = gl.getUniformLocation(program, "light[" + i + "].specular");
      light[i].ambient = gl.getUniformLocation(program, "light[" + i + "].ambient");
      light[i].position = gl.getUniformLocation(program, "light[" + i + "].position");

      //initialize light 0 to default of white light coming from viewer
      if (i == 0) {
         gl.uniform4fv(light[i].diffuse, radioactiveGreen);
         gl.uniform4fv(light[i].specular, vec4(131.0/255.0, 255.0/255.0, 131.0/255.0, 1.0));
         gl.uniform4fv(light[i].ambient, radioactiveGreen);
         light[0].pos = vec4( -2,2,0,1);
         gl.uniform4fv(light[i].position, light[0].pos);
      } else //disable all other lights
      {
         gl.uniform4fv(light[i].diffuse, black);
         gl.uniform4fv(light[i].specular, black);
         gl.uniform4fv(light[i].ambient, black);
         gl.uniform4fv(light[i].position, black);
      }
   }

	// the following code from L5-2.html
	// Get and set light uniforms
	global = {};
    global.top = gl.getUniformLocation(program,"global.top");
    global.bottom = gl.getUniformLocation(program,"global.bottom");
    global.direction = gl.getUniformLocation(program,"global.direction");
    global.hemisphere = gl.getUniformLocation(program, "global.hemisphere");
    gl.uniform4fv(global.top, bgLightColor);
    gl.uniform4fv(global.bottom, vec4(3.0/255.0, 0.0, 30.6/255.0, 1.0));
    //light.direction is set by text boxes and placed in world with lookAt in render function
    global.dir = vec4(0,1,0,0);
    gl.uniform1i(global.hemisphere, 1);

    //match UI to default settings
	document.getElementById("topColor").jscolor.fromRGB(58, 194, 255);
	document.getElementById("bottomColor").jscolor.fromRGB(3.06, 0, 30.6);

	document.getElementById("dx").onchange = function(event)
	{
		global.dir[0]=(event.srcElement || event.target).value;
		console.log("global.dir[0]: " + global.dir[0]);
		//document.getElementById("directionval").innerHTML = global.dir[0];
	};
	document.getElementById("dy").onchange = function(event)
	{
		global.dir[1]=(event.srcElement || event.target).value;
		//document.getElementById("directionval").innerHTML = global.dir[1];
	};
	document.getElementById("dz").onchange = function(event)
	{
		global.dir[2]=(event.srcElement || event.target).value;
		//document.getElementById("directionval").innerHTML = global.dir[2];
	};
	document.getElementById("dx").value = global.dir[0];
	document.getElementById("dy").value = global.dir[1];
	document.getElementById("dz").value = global.dir[2];

	var toggleOptions = document.getElementsByName("toggle");

	for (var i = 0; i < toggleOptions.length; i++)
	{
		toggleOptions[i].onchange = setLightMode;
	}
	// end of code from L5-2.html

   // Get and set material uniforms
   material = {};
   material.diffuse = gl.getUniformLocation(program, "material.diffuse");
   material.specular = gl.getUniformLocation(program, "material.specular");
   material.ambient = gl.getUniformLocation(program, "material.ambient");
   material.shininess = gl.getUniformLocation(program, "material.shininess");

   //var diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
   var diffuseColor = radioactiveGreen;
   gl.uniform4fv(material.diffuse, diffuseColor);
   gl.uniform4fv(material.ambient, diffuseColor);
   gl.uniform4fv(material.specular, bgLightColor);
   gl.uniform1f(material.shininess, 10.0);

   // Get and set other shader state
   lighting = gl.getUniformLocation(program, "lighting");
   uColor = gl.getUniformLocation(program, "uColor");
   gl.uniform1i(lighting, 1);
   gl.uniform4fv(uColor, white);

   // ** setup event listeners and UI
   // Specular shininess slider
   document.getElementById("shininess").onchange = function (event) {
      var shininess = (event.srcElement || event.target).value;
      document.getElementById("shininessval").innerHTML = shininess;
      gl.uniform1f(material.shininess, shininess);
   };
   document.getElementById("shininess").value = 10;
   document.getElementById("shininessval").innerHTML = 10;

   // Sphere resolution slider
   document.getElementById("rez").onchange = function (event) {
      rez = (event.srcElement || event.target).value;
      document.getElementById("rezval").innerHTML = rez;
   };
   document.getElementById("rez").value = rez;
   document.getElementById("rezval").innerHTML = rez;

   // Diffuse colour picker - set initial value
   document.getElementById("diffuseColor").jscolor.fromRGB(diffuseColor[0] * 255, diffuseColor[1] * 255, diffuseColor[2] * 255);

   // Specular colour picker - set initial value
   document.getElementById("specularColor").jscolor.fromRGB(131, 255, 131);

   requestAnimFrame(animate);
};

// Event listener for specular color picker - look in HTML to see where it is registered
function setSpecularColor(picker) {
   gl.uniform4f(material.specular, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
};

// Event listener for diffuse and ambient color picker - look in HTML to see where it is registered
function setDiffuseColor(picker) {
   gl.uniform4f(material.diffuse, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
   gl.uniform4f(material.ambient, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
};

function setTopColor(picker) {
	gl.uniform4f(global.top, picker.rgb[0]/255.0, picker.rgb[1]/255.0, picker.rgb[2]/255.0, 1);
	//console.log("picker: " + picker.rgb[0]+ ", " +picker.rgb[1] + ", " +picker.rgb[2]);
	// 206.55, 255, 246.925
};

function setBottomColor(picker) {
	gl.uniform4f(global.bottom, picker.rgb[0]/255.0, picker.rgb[1]/255.0, picker.rgb[2]/255.0, 1);
	console.log("picker: " + picker.rgb[0]+ ", " +picker.rgb[1] + ", " +picker.rgb[2]);
	// 3.059999999999989, 0, 30.599999999999998
};

//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
var rx = 0,  ry = 0;

function render()
{
   gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);


   //Set initial view
   var eye = vec3(0.0, 1.0, 6.0);
   var at = vec3(0.0, 1.0, 0.0);
   var up = vec3(0.0, 1.0, 0.0);

   mv = lookAt(eye, at, up);

   //Put light direction into world space
   gl.uniform4fv(global.direction, mult(transpose(mv), global.dir));
   //Position Light in World
   gl.uniform4fv(light[0].position, mult(transpose(mv), light[0].pos));

   var lightSphereTF = mult(mv, translate(light[0].pos[0], light[0].pos[1], light[0].pos[2] ));
   lightSphereTF = mult(lightSphereTF, scale(.1,.1,.1));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(lightSphereTF));
   gl.uniform1i(lighting, 0);
   urgl.drawSolidSphere(1, rez, rez);
   gl.uniform1i(lighting, 1);


   //rebind local buffers to shader
   //necessary if uofrGraphics draw functions are used
   if (obj.loaded)
   {
      bindBuffersToShader(obj);
      //draw obj
      var objTF = mult(mv, mult(translate(0, -1, 0), rotateY(ry)));
      gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(objTF));
      gl.drawElements(gl.TRIANGLES, obj.numIndices, gl.UNSIGNED_SHORT, 0);
   }

   var sphereTF = mult(mv, translate(-2, 0, 0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
   urgl.drawSolidSphere(1, rez, rez);

   sphereTF = mult(mv, translate(2, 0, 0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
   urgl.drawSolidSphere(1, rez, rez);

   ry += 0.5;

}


//----------------------------------------------------------------------------
// Animation and Rendering Event Functions
//----------------------------------------------------------------------------

//animate()
//updates and displays the model based on elapsed time
//sets up another animation event as soon as possible
var prevTime = 0;
function animate()
{
    requestAnimFrame(animate);

    //Do time corrected animation
    var curTime = new Date().getTime();
    if (prevTime != 0)
    {
       //Calculate elapsed time in seconds
       var timePassed = (curTime - prevTime)/1000.0;
       //Update any active animations
       handleKeys(timePassed);
    }
    prevTime = curTime;

    //Draw
    render();
}

//----------------------------------------------------------------------------
// Keyboard Event Functions
//----------------------------------------------------------------------------

//This array will hold the pressed or unpressed state of every key
var currentlyPressedKeys = [];

//Store current state of shift key
var shift;

document.onkeydown = function handleKeyDown(event) {
   currentlyPressedKeys[event.keyCode] = true;
   shift = event.shiftKey;

   //Get unshifted key character
   var c = event.keyCode;
   var key = String.fromCharCode(c);

	//Place key down detection code here
}

document.onkeyup = function handleKeyUp(event) {
   currentlyPressedKeys[event.keyCode] = false;
   shift = event.shiftKey;

   //Get unshifted key character
   var c = event.keyCode;
   var key = String.fromCharCode(c);

	//Place key up detection code here
}

//isPressed(c)
//Utility function to lookup whether a key is pressed
//Only works with unshifted key symbol
// ie: use "E" not "e"
//     use "5" not "%"
function isPressed(c)
{
   var code = c.charCodeAt(0);
   return currentlyPressedKeys[code];
}

//handleKeys(timePassed)
//Continuously called from animate to cause model updates based on
//any keys currently being held down
function handleKeys(timePassed)
{
   //Place continuous key actions here - anything that should continue while a key is
   //held

   //Calculate how much to move based on time since last update
   var s = 60.0; //degrees per second
   var d = s*timePassed; //degrees to rotate

   //Light Updates
   if (isPressed("A"))
   {
		light[0].pos[0] -= 0.04* d;
   }
   if (isPressed("D"))
   {
		light[0].pos[0] += 0.04* d;
   }
   if (isPressed("W"))
   {
		light[0].pos[2] -= 0.04* d;
   }
   if (isPressed("S"))
   {
		light[0].pos[2] += 0.04* d;
   }
   if (isPressed("Q"))
   {
		light[0].pos[1] -= 0.04* d;
   }
   if (isPressed("E"))
   {
		light[0].pos[1] += 0.04* d;
   }

}
