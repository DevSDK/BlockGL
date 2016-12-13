var gl; 
var ShaderProgram;
function start() {
  var canvas = document.getElementById("glcanvas");

  gl = initWebGL(canvas);      
  initShader();
  
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      
    gl.enable(gl.DEPTH_TEST);                              
    gl.depthFunc(gl.LEQUAL);                                
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      
  }
} 

function initShader()
{
	ShaderProgram = gl.createProgram();
}

function initWebGL(canvas) {
  gl = null;
  
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch(e) {}
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}	

