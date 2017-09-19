
var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // First, initialize the corners of our gasket with three points.
    // Here I make the triangle close to a equilateral triangle
    var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  0.366 ),
        vec2(  0.5, -0.5 )
    ];

	// divide each line [NumTimesToSubdivide] times
    divideLine( vertices[0], vertices[1], NumTimesToSubdivide);
    divideLine( vertices[1], vertices[2], NumTimesToSubdivide);
    divideLine( vertices[2], vertices[0], NumTimesToSubdivide);

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.68, 0.96, 1 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

// Function: triangle( a, b, c )
// Purpose: push 3 points of the triangle into points stack
function triangle(a, b, c){
    points.push(a, b, c);
}

// Function: divideLine(a, b, count)
// Input: 2 points of a line(a-b) and counter(count)
// Purpose: divide the given line into 4 connected sub-lines which seem like this:
//    ----   =>   -^-
// Note that when we break the line into 4 sub-lines, we will have 5 points and we intend
// to form a equilateral triangle with the 3 new points.
// Algorithm:
//  Base case: if counter is 0, push 2 points in points stack
//  General case:
//  	decrement counter
// 		get the 3 new points which are vertices of the new equilateral triangle
// 		recursively call divideLine(a, b, count) to divide 4 sub-lines
function divideLine(a, b, count)
{

    // check for end of recursion
    if ( count === 0 ) {
        points.push(a, b);
    }
    else {
    	// decrement count
        --count;

        // get the sub triangles based on 2 vertices of the bigger triangle
        var ab = []; // ab is 3 vertices of a sub-triangle
        ab = subTriangle(a, b);

        // three new triangles
        divideLine(a, ab[0], count);
        divideLine(ab[0], ab[1], count);
        divideLine(ab[1], ab[2], count);
        divideLine(ab[2], b, count);

    }
}

// Function: subTriangle(u, v)
// Input: 2 end points of a line
// Purpose: divide the given line into 4 connected sub-lines which seem like this:
//    ----   =>   -^-
// Output: return the coordinates of 3 new points
// Denote the point closer to u as u1
// Deonte the point closer to v as v1
// Denote the point which is not on the line u-v as uv
// Algorithm:
//  u1 and v1 are 2 points which divide u-v into 3 equal length pieces so it's easy to
//  find the coordinate of them by using mix function
//  Formula to calculate the coordinate of uv:
//  uv[x] = 0.5 * (v[x] + u[x] + (u[y]-v[y])/sqrt(3))
//  uv[y] = 0.5 * (v[y] + u[y] + (v[x]-u[x])/sqrt(3))
//  Now the coordinate of 3 new points are found, we need to return them as an array
function subTriangle(u, v){
	// exception handling
    if(typeof(u)=='number'&&typeof(v)=='number') {
      throw "parameters should be vectors";
    }
    if ( u.length != 2 ) {
        throw "first vector should be 2D";
    }
    if ( v.length != 2 ) {
        throw "second vector should be 2D";
    }

	// Points u1 and v1 divides line segment (u->v) evenly into three sections
	// u1 is closer to u and v1 is closer to v
	// Point uv satisfies that triangle uv-u1-v1 has equal side length and
	// point uv is on the left hand side of u->v
	// formula to calculate the coordinate of uv:
	// uv[x] = 0.5 * (v[x] + u[x] + (u[y]-v[y])/sqrt(3))
	// uv[y] = 0.5 * (v[y] + u[y] + (v[x]-u[x])/sqrt(3))
	var u1 = mix(u, v, 1/3);
	var v1 = mix(u, v, 2/3);
	var uv = new Float32Array(u.length);
	uv[0] = 0.5*v[0] + 0.5*u[0] + (u[1]-v[1])/2/Math.pow(3, 0.5);
	uv[1] = 0.5*v[1] + 0.5*u[1] + (v[0]-u[0])/2/Math.pow(3, 0.5);
	uv.type = u.type;

	// Generate the result
	var result = [];
	result = [u1, uv, v1];
    return result;
}

// Function: render()
// Purpose: render all the points in points stack into triangles
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINE_LOOP, 0, points.length );
}
