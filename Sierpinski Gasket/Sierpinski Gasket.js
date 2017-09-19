
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
    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];
	
	// Divide the original triangle [NumTimesToSubdivide] times
    divideTriangle( vertices[0], vertices[1], vertices[2], NumTimesToSubdivide);

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
function triangle( a, b, c ){
    points.push( a, b, c );
}

// Function: divideTriangle( a, b, c, count )
// Input: 3 vertices of a triangle(a, b, c) and divide-triangle counter(count)
// Purpose: divide the triangle a-b-c [count] times
// Algorithm:
// 	Base case:
// 		if [count] is 0, we simply push the vertices of the triangle in points stack
// 	General case:
// 		decrement [count]
//  	perturb the midpoint of each side and we get 3 new points 
// 		each 2 new points and an old point form a new triangle
// 		now we recursively call divideTriangle( a, b, c, count) function to divide new 3 triangles
function divideTriangle( a, b, c, count ){
    // Base case:
    // if [count] is 0, we simply push the vertices of the triangle in points stack
    if ( count === 0 ) {
        triangle( a, b, c );
    }
    // General case:
    else {
    	// decrement count
    	--count;
    	
        //perturb the sides
        var ab = perturb( a, b); // ab is the new point on side a-b
        var ac = perturb( a, c); // ac is the new point on side a-c
        var bc = perturb( b, c); // bc is the new point on side b-c     

        // three new triangles
        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

// Function: perturb(u, v)
// Input: coordinate of 2 points(u, v)
// Output: return the perturbed midpoint of the line u-v
// Algorithm:
//  Calculate the length of u-v, denoted by L
//  Set a range of the perturbation (-L/4, L/4)
//  perturbed midpoint[x] = midpoint[x] + perturbation[x]
//  perturbed midpoint[y] = midpoint[y] + perturbation[y]
function perturb(u, v){
	// exception handling
    if(typeof(u)=='number'&&typeof(v)=='number') {
      throw "parameters should be vectors";
    }
    if ( u.length != v.length ) {
        throw "vector dimension mismatch";
    }
    
	// calculate the distance(L) between u and v
	var L = 0;
	for ( var i = 0; i < u.length; ++i ) {
        L += Math.pow(u[i]-v[i], 2);
    } 
	L = Math.pow(L, 0.5);
	
	// divide L by 4
	L/=4;
	
	// Perturbing midpoint of u and v
	var result = new Float32Array(u.length);
    for ( var i = 0; i < u.length; ++i ) {
		// calculate the amount of displacement in interval (-L/4, L/4)
		var d = (Math.random() * L) - L/2; 
		// result[x] = midpoint[x] + displacement
        result[i] = (u[i] + v[i])/2 + d;
    }
    result.type = u.type;
    return result;
}

// Function: render()
// Purpose: render all the points in points stack into triangles
function render(){
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
