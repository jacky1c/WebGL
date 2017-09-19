/*
Floor: 10 X 10 rectangle, centered at the (0, 0, 0), perpendicular to y-axis
Sphere: radius = 1, centered at (0, 1, 0)
Building 1: 1 X 3 X 1, centered at (1.5, 1.5, 0.0)
Building 2: 1 X 1.5 X 1, centered at (-1.5, 0.75, 0.0)
Building 3: 2 X 1 X 1, centered at (0.0, 0.5, 1.5)
Building 4: 2 X 1 X 1, centered at (0.0, 0.5, -1.5) (behind in the diagram)

1. Generate an animation by “flying” the camera from point L0 to L1 along a linear path.
L0 = (-6.0, 8.0, 6.0)
L1 = (6.0, 8.0, 6.0)
The center of the scene: At = (0.0, 0.75, 0.0)

2. The camera is to fly in a circular spiral path from S0 to S1around the scene.
S0 = (0.0, 5.0, 10.0)
S1 = (0.0, 0.0, 10.0)
The radius of the circle: R = 10.0
The center of the scene: At = (0.0, 0.75, 0.0)

*/

// This variable will store the WebGL rendering context
var gl;

//Variables for Transformation Matrices
var mv = new mat4();
var p  = new mat4();
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

// Define color variables
var Black= flatten(vec4 (0, 0, 0, 1));
var White= flatten(vec4(1, 1, 1, 1));
var Red= flatten(vec4(1, 0, 0, 1));
var Green = flatten(vec4 (0, 1, 0, 1));
var Blue= flatten(vec4(0, 0, 1, 1));
var Lightred = flatten(vec4(1.0, 0.5, 0.5, 1.0));
var Lightgreen = flatten(vec4(0.5, 1.0, 0.5, 1.0));
var Lightblue =  flatten(vec4(0.5, 0.5, 1.0, 1.0));
var Orange= flatten(vec4 (1, 0.7, 0.3,1));
var Grass = flatten(vec4(0.16, 0.65, 0.22, 1.0));
var Pink = flatten(vec4(1.0, 204/255, 1.0, 1.0));
var LightGrey = flatten(vec4(0.7, 0.7, 0.7, 1.0));
var DarkGrey = flatten(vec4(0.3, 0.3, 0.3, 1.0));
// Index of vertices in vertex buffer

var planeStart = 0;
var planeVertices = 6;
var solidCubeStart = 6;
var solidCubeVertices = 36; // solid cube has 36 vertices
var wireCubeVertices = 30; // wire cube has 30 vertices
var sphereVertices = 0;

// Stack of points information
var sphere = [];
var points = [];


// vec3
var normals = [];

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
	gl.clearColor(0.5, 0.7, 0.7, 1.0);

	//  Load shaders and initialize attribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Set up data to draw
	// Done globally in this program...
	SetUpGround();
	console.log("points size = " + points.length);//12
	console.log("normals size = " + normals.length);
	SetUpBuildings();
	console.log("points size = " + points.length);//276
	console.log("normals size = " + normals.length);
	SetUpSphere();
	console.log("points size = " + points.length);//3348
	console.log("normals size = " + normals.length);
	SetUpAxis();
	console.log("points size = " + points.length);//3348
	console.log("normals size = " + normals.length);

	//***Vertices***
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
	gl.bufferData( gl.ARRAY_BUFFER,  flatten(points), gl.STATIC_DRAW );
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer( program.vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0 );
	gl.enableVertexAttribArray( program.vPosition );

	//***Normals***
    normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER,  flatten(normals), gl.STATIC_DRAW );
    program.vNormal = gl.getAttribLocation(program, "vNormal");

    bindBuffersToShader();


	// Get addresses of shader uniforms
	projLoc = gl.getUniformLocation(program, "p");
	mvLoc = gl.getUniformLocation(program, "mv");
	//program.zOffset = gl.getUniformLocation(program, "zOffset");

	//Set up viewport
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	//Set up projection matrix
	p = perspective(45.0, canvas.width/canvas.height, 0.1, 100.0);
	gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(p));

	// //Get and set light uniforms
    light = [];   // array of light property locations (defined globally)
    var n = 1;    // number of lights - adjust to match shader
    for (var i = 0; i < n; i++)
    {
        light[i] = {};   // initialize this light object
        light[i].diffuse = gl.getUniformLocation(program,"light["+i+"].diffuse");
        light[i].ambient = gl.getUniformLocation(program,"light["+i+"].ambient");
        light[i].position = gl.getUniformLocation(program,"light["+i+"].position");

        //initialize light 0 to default of white light coming from position relative to objects
        if (i == 0)
        {
            gl.uniform4fv(light[i].diffuse, LightGrey);
            gl.uniform4fv(light[i].ambient, vec4(0.5, 0.5, 0.5, 1.0));
            gl.uniform4fv(light[i].position,vec4(0.0, 5.0, 0.0, 0.0)); // directional source
        }
        else{ // set the second light's initial state to match the first light's initial state
        	gl.uniform4fv(light[i].diffuse, White);
            gl.uniform4fv(light[i].ambient, vec4(0.0, 0.0, 0.0, 1.0)); // ambient changed to black
            gl.uniform4fv(light[i].position,vec4(0.0, 6.0, 0.0, 1.0)); // positional source
        }

    }

	// Get and set material uniforms
    material = {};
    material.diffuse = gl.getUniformLocation(program, "material.diffuse");
    material.ambient = gl.getUniformLocation(program, "material.ambient");

    //Get and set other lighting state
    lighting = gl.getUniformLocation(program, "lighting");
    uColor = gl.getUniformLocation(program, "uColor");

    urgl = new uofrGraphics();
    urgl.connectShader(program, "vPosition", "vNormal", "stub");

	requestAnimFrame(render);
};

//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
// parameters for fly option
var	eyeX = -6.0;
var	eyeY = 8.0;
var	eyeZ = 6.0;
var flyoption = 1;
var resume = false;
var stoppoint;
var theta;
var radius = 10;

function render()
{
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.POLYGON_OFFSET_FILL);

	// Set initial view
	var eye = vec3(eyeX, eyeY, eyeZ); // best pos
	var at =  vec3(0.0, 0.75, 0.0);
	var up =  vec3(0.0, 1.0, 0.0);

	mv = lookAt(eye,at,up);

	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(mv));

	// turn lighting on
	gl.uniform1i(lighting, 1);

	//draw the grass ground
	gl.uniform4fv(material.diffuse, Grass);
	gl.uniform4fv(material.ambient, Grass);
	gl.polygonOffset(1, 1);
	gl.drawArrays(gl.TRIANGLES, planeStart, planeVertices);

	//draw Building 1: 1 X 3 X 1, centered at (1.5, 1.5, 0.0)
	gl.uniform4fv(material.diffuse, Lightred);
	gl.uniform4fv(material.ambient, Lightred);
	gl.polygonOffset(1, 1);
	gl.drawArrays(gl.TRIANGLES, solidCubeStart, 36);
	gl.uniform1i(lighting, 0);
	gl.uniform4fv(uColor, Black);
	gl.drawArrays(gl.LINE_STRIP, solidCubeStart+36, 30);
	gl.uniform1i(lighting, 1);

	//draw Building 2: 1 X 1.5 X 1, centered at (-1.5, 0.75, 0.0)
	gl.uniform4fv(material.diffuse, Lightblue);
	gl.uniform4fv(material.ambient, Lightblue);
	gl.polygonOffset(1, 1);
	gl.drawArrays(gl.TRIANGLES, solidCubeStart+66, 36);
	gl.uniform1i(lighting, 0);
	gl.uniform4fv(uColor, Black);
	gl.drawArrays(gl.LINE_STRIP, solidCubeStart+102, 30);
	gl.uniform1i(lighting, 1);

	//draw Building 3: 2 X 1 X 1, centered at (0.0, 0.5, 1.5)
	gl.uniform4fv(material.diffuse, Orange);
	gl.uniform4fv(material.ambient, Orange);
	gl.polygonOffset(1, 1);
	gl.drawArrays(gl.TRIANGLES, solidCubeStart+132, 36);
	gl.uniform1i(lighting, 0);
	gl.uniform4fv(uColor, Black);
	gl.drawArrays(gl.LINE_STRIP, solidCubeStart+168, 30);
	gl.uniform1i(lighting, 1);

	//draw Building 4: 2 X 1 X 1, centered at (0.0, 0.5, -1.5)
	gl.uniform4fv(material.diffuse, Lightgreen);
	gl.uniform4fv(material.ambient, Lightgreen);
	gl.polygonOffset(1, 1);
	gl.drawArrays(gl.TRIANGLES, solidCubeStart+198, 36);
	gl.uniform1i(lighting, 0);
	gl.uniform4fv(uColor, Black);
	gl.drawArrays(gl.LINE_STRIP, solidCubeStart+234, 30);
	gl.uniform1i(lighting, 1);

	//draw Sphere radius = 1, centered at (0, 1, 0)
	gl.uniform4fv(material.diffuse, Pink);
	gl.uniform4fv(material.ambient, Pink);
	gl.polygonOffset(1, 1);
	var sphere1 = mult(mv, translate(0,1,0));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphere1));
	gl.drawArrays(gl.TRIANGLES, solidCubeStart+264, sphereVertices);


	// turn lighting off
	gl.uniform1i(lighting, 0);
	// draw axis
// 	gl.uniform4fv(uColor, Green);
// 	gl.drawArrays(gl.LINES, solidCubeStart+264+sphereVertices, 2);
// 	gl.uniform4fv(uColor, Red);
// 	gl.drawArrays(gl.LINES, solidCubeStart+266+sphereVertices, 2);
// 	gl.uniform4fv(uColor, Blue);
// 	gl.drawArrays(gl.LINES, solidCubeStart+268+sphereVertices, 2);

	// turn lighting on
	gl.uniform1i(lighting, 1);



	if(resume){
		if(flyoption == 1){ // fly option1
			eyeX += 0.05;
			if(eyeX > 6.0)
				eyeX = -6.0;
		}
		else if(flyoption == 2){ // fly option2
			eyeX = radius*Math.sin(radians(theta));
			eyeZ = radius*Math.cos(radians(theta));
			eyeY -= 0.005;
			theta += 0.36;
			if(eyeY < 0){
				theta = 0.0;
				eyeY = 5.0;
			}
		}
	}
	else{ // pause or start
		//stoppoint = flyoption;
	}

	requestAnimFrame(render);
}
