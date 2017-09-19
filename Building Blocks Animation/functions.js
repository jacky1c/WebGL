//----------------------------------------------------------------------------
// Bind vertex buffer and normal buffer
//----------------------------------------------------------------------------
function bindBuffersToShader()
{
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer( program.vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer( program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0 );
    gl.enableVertexAttribArray( program.vNormal);  
}

//----------------------------------------------------------------------------
// Return the normal vector (vec3) of a surface(triangle)
//----------------------------------------------------------------------------
function normal(a, b, c)
{	
	var x = vec4(0,0,0,0);
	var y = vec4(0,0,0,0);
	x = subtract(vec4(b), vec4(a));
	y = subtract(vec4(c), vec4(a));
	
	x = normalize(x);
	y = normalize(y);
	
    var result = cross(x, y);
    
    result = normalize(result);
    
    normals.push(result); 
    normals.push(result); 
    normals.push(result); 
}

//----------------------------------------------------------------------------
// Generate ground plan in the scene
//----------------------------------------------------------------------------
function SetUpGround(){
	// axis vertices
// 	points.push([ 5.0, 0.0, 0.0, 1.0]); //x axis is green
// 	points.push([-5.0, 0.0, 0.0, 1.0]);
// 	points.push([ 0.0, 5.0, 0.0, 1.0]); //y axis is red
// 	points.push([ 0.0,-5.0, 0.0, 1.0]); 
// 	points.push([ 0.0, 0.0, 5.0, 1.0]); //z axis is blue
// 	points.push([ 0.0, 0.0,-5.0, 1.0]);

	// ground plane	in counter clock wise, facing up
	points.push([-3, 0, 3, 1]);
	points.push([ 3, 0, 3, 1]);
	points.push([ 3, 0,-3, 1]); 
	
	normal(vec4(-3, 0, 3, 1), vec4(3, 0, 3, 1), vec4(3, 0,-3, 1));
	
	points.push([-3, 0,-3, 1]);
	points.push([-3, 0, 3, 1]);  
	points.push([ 3, 0,-3, 1]); 
	
	normal(vec4(-3, 0,-3, 1), vec4(-3, 0, 3, 1), vec4(3, 0,-3, 1));
}

//----------------------------------------------------------------------------
// Generate xyz-axis
//----------------------------------------------------------------------------
function SetUpAxis(){
	// axis vertices
	points.push([ 5.0, 0.0, 0.0, 1.0]); //x axis is green
	points.push([-5.0, 0.0, 0.0, 1.0]);
	points.push([ 0.0, 5.0, 0.0, 1.0]); //y axis is red
	points.push([ 0.0,-5.0, 0.0, 1.0]); 
	points.push([ 0.0, 0.0, 5.0, 1.0]); //z axis is blue
	points.push([ 0.0, 0.0,-5.0, 1.0]);
}

//----------------------------------------------------------------------------
// Add vertices of 4 building blocks to points stack
//----------------------------------------------------------------------------
function SetUpBuildings(){
	/******* Generate buildings ********/
	// Building 1: 1 X 3 X 1, centered at (1.5, 1.5, 0.0)
	var building1 = GenerateBlock(1,2,0,3,-0.5,0.5);
	points = points.concat(building1);
	
	//Building 2: 1 X 1.5 X 1, centered at (-1.5, 0.75, 0.0)
	var building2 = GenerateBlock(-2,-1,0,1.5,-0.5,0.5);
	points = points.concat(building2);
	
	//Building 3: 2 X 1 X 1, centered at (0.0, 0.5, 1.5)
	var building3 = GenerateBlock(-1,1,0,1,1,2);
	points = points.concat(building3);
	
	//Building 4: 2 X 1 X 1, centered at (0.0, 0.5, -1.5) 
	var building4 = GenerateBlock(-1,1,0,1,-2,-1);
	points = points.concat(building4);
	
}

//----------------------------------------------------------------------------
// Add vertices of a sphere with radius 1 to points stack
//----------------------------------------------------------------------------
function SetUpSphere(){
	/******* Generate sphere ********/
	var va = normalize(vec4(1,1,1,1),true);
	var vb = normalize(vec4(1,-1,-1,1),true);
	var vc = normalize(vec4(-1,1,-1,1),true);
	var vd = normalize(vec4(-1,-1,1,1),true);
	tetrahedron(va, vb, vc, vd, 6);
	var r = Math.sqrt(Math.pow(sphere[0][0],2)+Math.pow(sphere[0][1],2)+Math.pow(sphere[0][2],2));
	points = points.concat(sphere);
}

//----------------------------------------------------------------------------
// Return a building block given 2 vertices of the block
//----------------------------------------------------------------------------
function GenerateBlock (x0, x1, y0, y1, z0, z1){
	var cubeVerts = [
		[ x1, y1, z1, 1], //0
		[ x1, y1, z0, 1], //1
		[ x1, y0, z1, 1], //2
		[ x1, y0, z0, 1], //3
		[ x0, y1, z1, 1], //4
		[ x0, y1, z0, 1], //5
		[ x0, y0, z1, 1], //6
		[ x0, y0, z0, 1], //7
	];
	var cubeLookups = [
		//Solid Cube - use TRIANGLES, starts at 30, 36 vertices
			0,4,6, //front
			0,6,2,
			1,0,2, //right
			1,2,3, 
			5,1,3, //back
			5,3,7,
			4,5,7, //left
			4,7,6,
			4,0,1, //top
			4,1,5,
			6,7,3, //bottom
			6,3,2,
		//Wire Cube - use LINE_STRIP, starts at 0, 30 vertices
			0,4,6,2,0, //front
			1,0,2,3,1, //right
			5,1,3,7,5, //back
			4,5,7,6,4, //right
			4,0,1,5,4, //top
			6,7,3,2,6, //bottom
	];
	var result = [];
	//console.log("cubeLookups.length "+cubeLookups.length);
	for (var i =0; i < cubeLookups.length; i++)
	{
		result.push(cubeVerts[cubeLookups[i]]);
	}
	
	// calculate normal. Each surface facing outward
	for (var i =0; i < cubeLookups.length; i+=3)
	{
		normal(cubeVerts[cubeLookups[i]], cubeVerts[cubeLookups[i+1]], cubeVerts[cubeLookups[i+2]]);
	}
	return result;
}

//----------------------------------------------------------------------------
// Return a sphere witch radius 1
//----------------------------------------------------------------------------
function tetrahedron (a, b, c, d, n){
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}
function divideTriangle(a, b, c, count){
	if(count>0){
		var ab = normalize(mix(a, b, 0.5), true);
		var ac = normalize(mix(a, c, 0.5), true);
		var bc = normalize(mix(b, c, 0.5), true);
		divideTriangle(a, ab, ac, count-1);
		divideTriangle(ab, b, bc, count-1);
		divideTriangle(bc, c, ac, count-1);
		divideTriangle(ab, bc, ac, count-1);
	}
	else{
		triangle(a, b, c);
	}
}
function triangle(a, b, c){
	sphere.push(a);
	sphere.push(b);
	sphere.push(c);
	normal(a,b,c);
	sphereVertices += 3;
}