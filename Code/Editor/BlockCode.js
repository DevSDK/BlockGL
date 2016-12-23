"use strict";

const infoDiv = document.querySelector("#info");
const codeOut = document.querySelector("#info code");

const BlockGL = {};
BlockGL.workspace = Blockly.inject("blocklyDiv", {
		media: "../../media/",
		toolbox: document.getElementById("toolbox"),
		grid: {
				spacing: 40,
				length: 3,
				colour: "#CCC",
				snap: true
			},
		trashcan: true,
		zoom: {
				controls: true,
				wheel: true
			}
	});

Blockly.WorkspaceSvg.prototype.preloadAudio_ = _ => _;
BlockGL.blocklyArea = document.getElementById("blocklyArea");
BlockGL.blocklyDiv = document.getElementById("blocklyDiv");
BlockGL.onresize = _ => {
		let element = BlockGL.blocklyArea;
		let x = 0;
		let y = 0;
		do
		{
			x += element.offsetLeft;
			y += element.offsetTop;
			element = element.offsetParent;
		} while(element);
		BlockGL.blocklyDiv.style.left = x + "px";
		BlockGL.blocklyDiv.style.top = y + "px";
		BlockGL.blocklyDiv.style.width = BlockGL.blocklyArea.offsetWidth + "px";
		BlockGL.blocklyDiv.style.height = BlockGL.blocklyArea.offsetHeight + "px";
		Blockly.svgResize(BlockGL.workspace);
	};
window.addEventListener("resize", BlockGL.onresize);
BlockGL.onresize();

let initialized = false;
BlockGL.workspace.addChangeListener(event => {
		let resultCode = Blockly.JavaScript.workspaceToCode(BlockGL.workspace);
		codeOut.textContent = resultCode;
		resetWebGLCanvas();
		(new Function(`
			const gl = BlockGL.gl;
			try
			{
				${resultCode}

				initialize();
				BlockGL.render = render;
			}
			catch(error)
			{
				console.error("An error occurred: ", error);
			}
		`))();
	});


//////////////////////////////////////////////////
//////////////////// Rendering

function resetWebGLCanvas()
{
	BlockGL.render = _ => _;
	BlockGL.gl = null;

	const canvas_old = document.getElementById("glCanvas");
	const container = canvas_old.parentNode;
	container.removeChild(canvas_old);
	const canvas_new = document.createElement("CANVAS");
	canvas_new.setAttribute("id", "glcanvas");
	canvas_new.setAttribute("width", "640");
	canvas_new.setAttribute("height", "480");
	canvas_new.setAttribute("id", "glCanvas");
	container.insertBefore(canvas_new, infoDiv);

	try
	{
		BlockGL.gl = canvas_new.getContext("webgl")
			|| canvas_new.getContext("experimental-webgl");
	}
	catch(error)
	{
		console.error("getContext failed: ", error);
	}

	if(!BlockGL.gl)
	{
		alert("Unable to initialize WebGL. Your browser may not support it.");
		return;
	}

	console.info("reset");
}

BlockGL.renderingTimestamps = [];
BlockGL.timestampQueueCapacity = 100;
Object.defineProperty(BlockGL, "fps", {
		get: function() {
			return this.timestampQueueCapacity
				/ ((
					this.renderingTimestamps[this.timestampQueueCapacity - 1]
					- this.renderingTimestamps[0]
				) / 1000);
		}
	});
function renderingLoop(timestamp)
{
	BlockGL.renderingTimestamps.push(timestamp);
	if(BlockGL.renderingTimestamps.length > BlockGL.timestampQueueCapacity)
	{
		BlockGL.renderingTimestamps.shift();
	}

	BlockGL.render();
	window.requestAnimationFrame(renderingLoop);
}

window.addEventListener("load", _ => {
		resetWebGLCanvas();
		window.requestAnimationFrame(renderingLoop);

		Blockly.Xml.domToWorkspace(
			Blockly.Xml.textToDom(`
<xml><block type="procedures_defnoreturn" x="-500" y="-300"><field name="NAME">initialize</field><comment pinned="false" h="50" w="200">To initialize the stuff</comment><statement name="STACK"><block type="create_buffer"><value name="buffer_variable"><block type="variables_get"><field name="VAR">vertex buffer</field></block></value><next><block type="bind_buffer"><field name="buffer">vertex buffer</field><field name="target">ARRAY_BUFFER</field><next><block type="buffer_data"><field name="target">ARRAY_BUFFER</field><field name="array_type">Float32Array</field><field name="usage">STATIC_DRAW</field><statement name="data"><block type="vertex"><field name="x">-0.5</field><field name="y">0.5</field><field name="z">0</field><next><block type="vertex"><field name="x">-0.5</field><field name="y">-0.5</field><field name="z">0</field><next><block type="vertex"><field name="x">0.5</field><field name="y">-0.5</field><field name="z">0</field></block></next></block></next></block></statement><next><block type="unbind_buffer"><field name="target">ARRAY_BUFFER</field><next><block type="create_buffer"><value name="buffer_variable"><block type="variables_get"><field name="VAR">index buffer</field></block></value><next><block type="bind_buffer"><field name="buffer">index buffer</field><field name="target">ELEMENT_ARRAY_BUFFER</field><next><block type="buffer_data"><field name="target">ELEMENT_ARRAY_BUFFER</field><field name="array_type">Uint16Array</field><field name="usage">STATIC_DRAW</field><statement name="data"><block type="vertex"><field name="x">0</field><field name="y">1</field><field name="z">2</field></block></statement><next><block type="unbind_buffer"><field name="target">ELEMENT_ARRAY_BUFFER</field><next><block type="create_shader"><field name="type">VERTEX_SHADER</field><field name="shader">vertex shader</field><statement name="source"><block type="glsl_declare_variable"><field name="qualifier">attribute</field><field name="type">vec3</field><field name="variable_name">coordinates</field><next><block type="glsl_void_main"><statement name="function_body"><block type="glsl_assign"><field name="variable_name">gl_Position</field><value name="value"><block type="glsl_vector"><field name="type">vec4</field><field name="values">coordinates, 1.0</field></block></value></block></statement></block></next></block></statement><next><block type="create_shader"><field name="type">FRAGMENT_SHADER</field><field name="shader">fragment shader</field><statement name="source"><block type="glsl_void_main"><statement name="function_body"><block type="glsl_assign"><field name="variable_name">gl_FragColor</field><value name="value"><block type="glsl_vector"><field name="type">vec4</field><field name="values">0.0, 0.0, 0.0, 0.1</field></block></value></block></statement></block></statement><next><block type="create_program"><field name="program">shader program</field><next><block type="attach_shader"><field name="shader">vertex shader</field><field name="program">shader program</field><next><block type="attach_shader"><field name="shader">fragment shader</field><field name="program">shader program</field><next><block type="link_program"><field name="program">shader program</field><next><block type="use_program"><field name="program">shader program</field><next><block type="bind_buffer"><field name="buffer">vertex buffer</field><field name="target">ARRAY_BUFFER</field><next><block type="bind_buffer"><field name="buffer">index buffer</field><field name="target">ELEMENT_ARRAY_BUFFER</field><next><block type="get_attribute_location"><field name="name">coordinates</field><field name="program">shader program</field><field name="variable">coord</field><next><block type="vertex_attribute_pointer"><field name="index">coord</field><field name="size">3</field><field name="type">FLOAT</field><field name="stride">0</field><field name="offset">0</field><field name="normalized">FALSE</field><next><block type="enable_vertex_attribute_array"><field name="index">0</field><next><block type="set_clear_color"><field name="clear_color">#ffcc00</field><field name="alpha">1</field><next><block type="enable"><field name="capability">DEPTH_TEST</field><next><block type="clear_buffer"><field name="buffer">COLOR_BUFFER_BIT</field><next><block type="draw_elements"><field name="count">3</field><field name="mode">TRIANGLES</field><field name="type">UNSIGNED_SHORT</field><field name="offset">0</field></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></statement></block><block type="procedures_defnoreturn" x="-300" y="-300"><field name="NAME">render</field><comment pinned="false" h="50" w="200">A callback for the rendering loop</comment></block></xml>
`),
			BlockGL.workspace
		);
	});

//////////////////////////////////////////////////
//////////////////// Block settings

// Render 블럭, Start 블럭 따로 만들어야 함
// (Start 블럭 내용은 Render 블럭 내용과 달리 반복적으로 수행되면 안 되기 때문).
// 현재는 모든 블럭 내용이 Render 블럭 내에 있다고 가정함.

Blockly.BlockSvg.START_HAT = true;
[ // blocks
	{
		"type": "create_program",
		"message0": "Create program %1",
		"args0": [
			{
				"type": "field_variable",
				"name": "gl_program",
				"variable": "variable"
			}
		],
		"inputsInline": true,
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "",
		"helpUrl": "http://www.example.com/"
	},
	{
		"type": "set_clear_color",
		"message0": "Set the clear color %1 ( alpha:  %2 )",
		"args0": [
			{
				"type": "field_colour",
				"name": "clear_color",
				"colour": "#000000"
			},
			{
				"type": "field_number",
				"name": "alpha",
				"value": 1,
				"min": 0,
				"max": 1,
				"precision": 0.000001
			}
		],
		"inputsInline": true,
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "",
		"helpUrl": "http://www.example.com/"
	},
	{
		"type": "enable",
		"message0": "Enable capability %1",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "capability",
				"options": [
					["DEPTH_TEST", "DEPTH_TEST"]
				]
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "",
		"helpUrl": "http://www.example.com/"
	},
	{
		"type": "set_depth_function",
		"message0": "Use %1 for depth buffer comparisons",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "depth_function",
				"options": [
					["NEVER", "NEVER"],
					["LEQUAL", "LEQUAL"]
				]
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "",
		"helpUrl": "http://www.example.com/"
	},
	{
		"type": "clear_buffer",
		"message0": "Clear the %1 buffer",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "buffer",
				"options": [
					["color","COLOR_BUFFER_BIT"],
					["depth","DEPTH_BUFFER_BIT"],
					["accumulation","ACCUM_BUFFER_BIT"],
					["stencil", "STENCIL_BUFFER_BIT"]
				]
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "",
		"helpUrl": "http://www.example.com/"
	},
{
  "type": "create_buffer",
  "message0": "Create a buffer %1",
  "args0": [
    {
      "type": "input_value",
      "name": "buffer_variable"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "bind_buffer",
  "message0": "Bind a buffer %1 to %2",
  "args0": [
    {
      "type": "field_variable",
      "name": "buffer",
      "variable": "buffer"
    },
    {
      "type": "field_dropdown",
      "name": "target",
      "options": [
        [
          "ARRAY_BUFFER",
          "ARRAY_BUFFER"
        ],
        [
          "ELEMENT_ARRAY_BUFFER",
          "ELEMENT_ARRAY_BUFFER"
        ],
        [
          "COPY_READ_BUFFER",
          "COPY_READ_BUFFER"
        ],
        [
          "COPY_WRITE_BUFFER",
          "COPY_WRITE_BUFFER"
        ],
        [
          "TRANSFORM_FEEDBACK_BUFFER",
          "TRANSFORM_FEEDBACK_BUFFER"
        ],
        [
          "UNIFORM_BUFFER",
          "UNIFORM_BUFFER"
        ],
        [
          "PIXEL_PACK_BUFFER",
          "PIXEL_PACK_BUFFER"
        ],
        [
          "PIXEL_UNPACK_BUFFER",
          "PIXEL_UNPACK_BUFFER"
        ]
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "unbind_buffer",
  "message0": "Unbind %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "target",
      "options": [
        [
          "ARRAY_BUFFER",
          "ARRAY_BUFFER"
        ],
        [
          "ELEMENT_ARRAY_BUFFER",
          "ELEMENT_ARRAY_BUFFER"
        ],
        [
          "COPY_READ_BUFFER",
          "COPY_READ_BUFFER"
        ],
        [
          "COPY_WRITE_BUFFER",
          "COPY_WRITE_BUFFER"
        ],
        [
          "TRANSFORM_FEEDBACK_BUFFER",
          "TRANSFORM_FEEDBACK_BUFFER"
        ],
        [
          "UNIFORM_BUFFER",
          "UNIFORM_BUFFER"
        ],
        [
          "PIXEL_PACK_BUFFER",
          "PIXEL_PACK_BUFFER"
        ],
        [
          "PIXEL_UNPACK_BUFFER",
          "PIXEL_UNPACK_BUFFER"
        ]
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "buffer_data",
  "message0": "Initialize %1 with %2 %3 %4 for %5",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "target",
      "options": [
        [
          "ARRAY_BUFFER",
          "ARRAY_BUFFER"
        ],
        [
          "ELEMENT_ARRAY_BUFFER",
          "ELEMENT_ARRAY_BUFFER"
        ],
        [
          "COPY_READ_BUFFER",
          "COPY_READ_BUFFER"
        ],
        [
          "COPY_WRITE_BUFFER",
          "COPY_WRITE_BUFFER"
        ],
        [
          "TRANSFORM_FEEDBACK_BUFFER",
          "TRANSFORM_FEEDBACK_BUFFER"
        ],
        [
          "UNIFORM_BUFFER",
          "UNIFORM_BUFFER"
        ],
        [
          "PIXEL_PACK_BUFFER",
          "PIXEL_PACK_BUFFER"
        ],
        [
          "PIXEL_UNPACK_BUFFER",
          "PIXEL_UNPACK_BUFFER"
        ]
      ]
    },
    {
      "type": "field_dropdown",
      "name": "array_type",
      "options": [
        [
          "Uint16Array",
          "Uint16Array"
        ],
        [
          "Float32Array",
          "Float32Array"
        ]
      ]
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "data"
    },
    {
      "type": "field_dropdown",
      "name": "usage",
      "options": [
        [
          "STATIC_DRAW",
          "STATIC_DRAW"
        ],
        [
          "DYNAMIC_DRAW",
          "DYNAMIC_DRAW"
        ],
        [
          "STREAM_DRAW",
          "STREAM_DRAW"
        ],
        [
          "STATIC_READ",
          "STATIC_READ"
        ],
        [
          "DYNAMIC_READ",
          "DYNAMIC_READ"
        ],
        [
          "STREAM_READ",
          "STREAM_READ"
        ],
        [
          "STATIC_COPY",
          "STATIC_COPY"
        ],
        [
          "DYNAMIC_COPY",
          "DYNAMIC_COPY"
        ],
        [
          "STREAM_COPY",
          "STREAM_COPY"
        ]
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "vertex",
  "message0": "x %1 | y %2 | z %3",
  "args0": [
    {
      "type": "field_number",
      "name": "x",
      "value": 0
    },
    {
      "type": "field_number",
      "name": "y",
      "value": 0
    },
    {
      "type": "field_number",
      "name": "z",
      "value": 0
    }
  ],
  "previousStatement": "Array",
  "nextStatement": "Array",
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "glsl_declare_variable",
  "message0": "GLSL: declare %1 %2 %3",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "qualifier",
      "options": [
        [
          "attribute",
          "attribute"
        ],
        [
          "uniform",
          "uniform"
        ],
        [
          "varying",
          "varying"
        ]
      ]
    },
    {
      "type": "field_dropdown",
      "name": "type",
      "options": [
        [
          "void",
          "void"
        ],
        [
          "bool",
          "bool"
        ],
        [
          "int",
          "int"
        ],
        [
          "float",
          "float"
        ],
        [
          "vec2",
          "vec2"
        ],
        [
          "vec3",
          "vec3"
        ],
        [
          "vec4",
          "vec4"
        ],
        [
          "bvec2",
          "bvec2"
        ],
        [
          "bvec3",
          "bvec3"
        ],
        [
          "bvec4",
          "bvec4"
        ],
        [
          "ivec2",
          "ivec2"
        ],
        [
          "ivec3",
          "ivec3"
        ],
        [
          "ivec4",
          "ivec4"
        ],
        [
          "mat2",
          "mat2"
        ],
        [
          "mat3",
          "mat3"
        ],
        [
          "mat3",
          "mat3"
        ],
        [
          "sampler2D",
          "sampler2D"
        ],
        [
          "samplerCube",
          "samplerCube"
        ]
      ]
    },
    {
      "type": "field_input",
      "name": "variable_name",
      "text": "VARIABLE NAME"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "glsl_void_main",
  "message0": "GLSL: void main(void) %1 %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "function_body"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "glsl_vector",
  "message0": "%1 %2",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "type",
      "options": [
        [
          "vec2",
          "vec2"
        ],
        [
          "vec3",
          "vec3"
        ],
        [
          "vec4",
          "vec4"
        ],
        [
          "bvec2",
          "bvec2"
        ],
        [
          "bvec3",
          "bvec3"
        ],
        [
          "bvec4",
          "bvec4"
        ],
        [
          "ivec2",
          "ivec2"
        ],
        [
          "ivec3",
          "ivec3"
        ],
        [
          "ivec4",
          "ivec4"
        ],
        [
          "mat2",
          "mat2"
        ],
        [
          "mat3",
          "mat3"
        ],
        [
          "mat4",
          "mat4"
        ]
      ]
    },
    {
      "type": "field_input",
      "name": "values",
      "text": "COMPONENTS"
    }
  ],
  "output": "vector",
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "glsl_assign",
  "message0": "Assign %1 to %2",
  "args0": [
    {
      "type": "input_value",
      "name": "value",
      "check": "vector"
    },
    {
      "type": "field_input",
      "name": "variable_name",
      "text": "VARIABLE_NAME"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "create_shader",
  "message0": "Create a %1 shader %2 %3 from source code %4",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "type",
      "options": [
        [
          "vertex",
          "VERTEX_SHADER"
        ],
        [
          "fragment",
          "FRAGMENT_SHADER"
        ]
      ]
    },
    {
      "type": "field_variable",
      "name": "shader",
      "variable": "shader"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "source"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "create_program",
  "message0": "Create a program %1",
  "args0": [
    {
      "type": "field_variable",
      "name": "program",
      "variable": "PROGRAM"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "attach_shader",
  "message0": "Attach a shader  %1 to a %2",
  "args0": [
    {
      "type": "field_variable",
      "name": "shader",
      "variable": "SHADER"
    },
    {
      "type": "field_variable",
      "name": "program",
      "variable": "PROGRAM"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "link_program",
  "message0": "Link a program %1",
  "args0": [
    {
      "type": "field_variable",
      "name": "program",
      "variable": "PROGRAM"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "use_program",
  "message0": "Use a program %1",
  "args0": [
    {
      "type": "field_variable",
      "name": "program",
      "variable": "PROGRAM"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "get_attribute_location",
  "message0": "Put the location of an attribute variable %1 %2 in a program %3 ,  to %4",
  "args0": [
    {
      "type": "field_input",
      "name": "name",
      "text": "ATTRIBUTE_VARIABLE_NAME"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_variable",
      "name": "program",
      "variable": "PROGRAM"
    },
    {
      "type": "field_variable",
      "name": "variable",
      "variable": "VARIABLE"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "vertex_attribute_pointer",
  "message0": "For a vertex attribute whose index is %1 , %2 specify the number of its components as %3 , %4 the data type of its each component as %5 , %6 the offset in bytes between %7 the beginning of consecutive vertex attributes as %8 , %9 the offset in bytes of the first component as %10 %11 and specify that fixed-point data values %12 %13 %14 when they're accessed",
  "args0": [
    {
      "type": "field_variable",
      "name": "index",
      "variable": "INDEX"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_number",
      "name": "size",
      "value": 3,
      "min": 0,
      "precision": 1
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_dropdown",
      "name": "type",
      "options": [
        [
          "byte",
          "BYTE"
        ],
        [
          "unsigned byte",
          "UNSIGNED_BYTE"
        ],
        [
          "short",
          "SHORT"
        ],
        [
          "unsigned short",
          "UNSIGNED_SHORT"
        ],
        [
          "float",
          "FLOAT"
        ]
      ]
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_number",
      "name": "stride",
      "value": 0,
      "min": 0,
      "precision": 1
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_number",
      "name": "offset",
      "value": 0,
      "min": 0,
      "precision": 1
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_dropdown",
      "name": "normalized",
      "options": [
        [
          "should be normalized",
          "TRUE"
        ],
        [
          "are to converted to fixed point values",
          "FALSE"
        ]
      ]
    },
    {
      "type": "input_dummy"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "enable_vertex_attribute_array",
  "message0": "Turn the generic vertex attribute array on %1 at a index position  %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "field_number",
      "name": "index",
      "value": 0,
      "min": 0,
      "precision": 1
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
},
{
  "type": "draw_elements",
  "message0": "Render %1 primitives from array data, %2 whose type are %3 %4 and the types of the values %5 of the element array buffer are unsigned %6 %7 and the offset in the element array buffer is %8",
  "args0": [
    {
      "type": "field_number",
      "name": "count",
      "value": 1,
      "min": 0,
      "precision": 1
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_dropdown",
      "name": "mode",
      "options": [
        [
          "POINTS",
          "POINTS"
        ],
        [
          "LINE_STRIP",
          "LINE_STRIP"
        ],
        [
          "LINE_LOOP",
          "LINE_LOOP"
        ],
        [
          "LINES",
          "LINES"
        ],
        [
          "TRIANGLE_STRIP",
          "TRIANGLE_STRIP"
        ],
        [
          "TRIANGLE_FAN",
          "TRIANGLE_FAN"
        ],
        [
          "TRIANGLES",
          "TRIANGLES"
        ]
      ]
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_dropdown",
      "name": "type",
      "options": [
        [
          "byte",
          "UNSIGNED_BYTE"
        ],
        [
          "short",
          "UNSIGNED_SHORT"
        ],
        [
          "int",
          "UNSIGNED_INT"
        ]
      ]
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "field_number",
      "name": "offset",
      "value": 0,
      "min": 0,
      "precision": 1
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 0,
  "tooltip": "",
  "helpUrl": "http://www.example.com/"
}
].forEach(blockInfo => {
		Blockly.Blocks[blockInfo.type] = {init: function() {
				this.jsonInit(blockInfo);
			}};
	});

const hexColorCodeToFloatVector = colorHex => colorHex
	.substr(1).match(/.{2}/g).map(rgbHex => parseInt(rgbHex, 16) / 255);
const indent = (code, nTab) => code
	.split('\n')
	.map(line => '\t'.repeat(nTab) + line)
	.join('\n');
const unindent = (code, nBacktab) => code
	.split('\n')
	.map(line => line.replace(new RegExp(`^\\t{0,${nBacktab}}`), ""))
	.join('\n');
Object.assign(Blockly.JavaScript, {
		"create_program": function(block) {
			const variable_gl_program = Blockly.JavaScript.variableDB_
				.getName(block.getFieldValue("gl_program"), Blockly.Variables.NAME_TYPE);

			return `${variable_gl_program} = gl.createProgram();\n`;
		},
		"set_clear_color": function(block) { //////////////////////////////// ALPHA 반영해야 함
			const colour_clear_color = block.getFieldValue("clear_color"); // #xxxxxx
			const number_alpha = block.getFieldValue("alpha");

			return `gl.clearColor(${hexColorCodeToFloatVector(colour_clear_color).join(", ")}, ${number_alpha});\n`;
		},
		"enable": function(block) {
			const dropdown_capability = block.getFieldValue("capability");

			return `gl.enable(gl.${dropdown_capability});\n`;
		},
		"set_depth_function": function(block) {
			const dropdown_depth_function = block.getFieldValue("depth_function");

			return `gl.depthFunc(gl.${dropdown_depth_function});\n`;
		},
		"clear_buffer": function(block) {
			const dropdown_buffer = block.getFieldValue('buffer');

			return `gl.clear(gl.${dropdown_buffer});\n`;
		},
		"create_buffer": function(block) {
			let value_buffer_variable = Blockly.JavaScript.valueToCode(block, "buffer_variable", Blockly.JavaScript.ORDER_ATOMIC);

			return `${value_buffer_variable} = gl.createBuffer();\n`;
		},
		"unbind_buffer": block => {
			const dropdown_target = block.getFieldValue("target");

			return `gl.bindBuffer(gl.${dropdown_target}, null);\n`;
		},
		"bind_buffer": function(block) {
			let variable_buffer = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("buffer"), Blockly.Variables.NAME_TYPE);
			let dropdown_target = block.getFieldValue("target");

			return `gl.bindBuffer(gl.${dropdown_target}, ${variable_buffer ? variable_buffer : null});\n`;
		},
		"buffer_data": function(block) {
			let dropdown_target = block.getFieldValue("target");
			let dropdown_array_type = block.getFieldValue("array_type");
			let statements_data = Blockly.JavaScript.statementToCode(block, "data");
			let dropdown_usage = block.getFieldValue("usage");

			return `gl.bufferData(gl.${dropdown_target}, `
				+ `new ${dropdown_array_type}([${statements_data.substring(0, statements_data.length - 2).trim()}]), `
				+ `gl.${dropdown_usage});\n`;
		},
		"vertex": function(block) {
			const number_x = block.getFieldValue('x');
			const number_y = block.getFieldValue('y');
			const number_z = block.getFieldValue('z');

			return `${number_x}, ${number_y}, ${number_z}, `;
		},
		"glsl_declare_variable": function(block) {
			const dropdown_qualifier = block.getFieldValue("qualifier");
			const dropdown_type = block.getFieldValue("type");
			const text_variable_name = block.getFieldValue("variable_name");

			return `${dropdown_qualifier} ${dropdown_type} ${text_variable_name};\n`;
		},
		"glsl_void_main": function(block) {
			const statements_function_body = Blockly.JavaScript.statementToCode(block, "function_body");

			return unindent(
				`void main(void)
				{
				  ${statements_function_body.trim()}
				}
			`, 4);
		},
		"glsl_vector": function(block) {
			const dropdown_type = block.getFieldValue("type");
			const text_values = block.getFieldValue("values");

			return [`${dropdown_type}(${text_values})`, Blockly.JavaScript.ORDER_ATOMIC];
		},
		"glsl_assign": function(block) {
			const value_value = Blockly.JavaScript.valueToCode(block, "value", Blockly.JavaScript.ORDER_ATOMIC);
			const text_variable_name = block.getFieldValue("variable_name");

			return `${text_variable_name} = ${value_value};\n`;
		},
		"create_shader": block => {
			const dropdown_type = block.getFieldValue("type");
			const variable_shader = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("shader"), Blockly.Variables.NAME_TYPE);
			const statements_source = Blockly.JavaScript.statementToCode(block, "source");

			return unindent(`
				let ${variable_shader} = gl.createShader(gl.${dropdown_type});
				gl.shaderSource(${variable_shader}, \`${statements_source}\`);
				gl.compileShader(${variable_shader});
				`, 4);
		},
		"create_program": function(block) {
			const variable_program = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("program"), Blockly.Variables.NAME_TYPE);

			return `${variable_program} = gl.createProgram();\n`;
		},
		"attach_shader": function(block) {
			const variable_shader = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("shader"), Blockly.Variables.NAME_TYPE);
			const variable_program = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("program"), Blockly.Variables.NAME_TYPE);

			return `gl.attachShader(${variable_program}, ${variable_shader});\n`;
		},
		"link_program": function(block) {
			const variable_program = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("program"), Blockly.Variables.NAME_TYPE);

			return `gl.linkProgram(${variable_program});\n`;
		},
		"use_program": function(block) {
			const variable_program = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("program"), Blockly.Variables.NAME_TYPE);

			return `gl.useProgram(${variable_program});\n`;
		},
		"get_attribute_location": function(block) {
			const text_name = block.getFieldValue("name"); // The attribute variable name
			const variable_program = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("program"), Blockly.Variables.NAME_TYPE);
			const variable_variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("variable"), Blockly.Variables.NAME_TYPE);

			return `${variable_variable} = gl.getAttribLocation(${variable_program}, \`${text_name}\`);\n`;
		},
		"vertex_attribute_pointer": function(block) {
			const variable_index = Blockly.JavaScript.variableDB_.getName(block.getFieldValue("index"), Blockly.Variables.NAME_TYPE);
			const number_size = block.getFieldValue("size"); // Must be 1, 2, 3, or 4.
			const dropdown_type = block.getFieldValue("type");
			const number_stride = block.getFieldValue("stride");
			const number_offset = block.getFieldValue("offset");
			const dropdown_normalized = block.getFieldValue("normalized");

			return `gl.vertexAttribPointer(${variable_index}, ${number_size}, gl.${dropdown_type}, gl.${dropdown_normalized}, ${number_stride}, ${number_offset});\n`;
		},
		"enable_vertex_attribute_array": function(block) {
			const number_index = block.getFieldValue("index");

			return `gl.enableVertexAttribArray(${number_index});\n`;
		},
		"draw_elements": function(block) {
			const dropdown_mode = block.getFieldValue("mode");
			const number_count = block.getFieldValue("count");
			const dropdown_type = block.getFieldValue("type");
			const number_offset = block.getFieldValue("offset");

			return `gl.drawElements(gl.${dropdown_mode}, ${number_count}, gl.${dropdown_type}, ${number_offset});\n`;
		}
	});