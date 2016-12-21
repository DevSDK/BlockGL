"use strict";

const infoDiv = document.getElementById("info");

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
		infoDiv.innerHTML = resultCode.replace(/\n/mg, "<br>\n");
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
<xml><block type="procedures_defnoreturn" x="20" y="100"><field name="NAME">initialize</field><comment pinned="false" h="50" w="200">To initialize the stuff</comment></block><block type="procedures_defnoreturn" x="220" y="260"><field name="NAME">render</field><comment pinned="false" h="50" w="200">A callback for the rendering loop</comment><statement name="STACK"><block type="set_clear_color"><field name="clear_color">#ffcc00</field><field name="alpha">1</field><next><block type="clear_buffer"><field name="buffer">COLOR_BUFFER_BIT</field><next><block type="create_buffer"><value name="buffer_variable"><block type="variables_get"><field name="VAR">vertex_buffer</field></block></value><next><block type="bind_buffer"><field name="buffer">vertex_buffer</field><field name="target">ARRAY_BUFFER</field><next><block type="buffer_data"><field name="target">ARRAY_BUFFER</field><field name="array_type">Float32Array</field><field name="usage">STATIC_DRAW</field><statement name="data"><block type="vertex"><field name="x">-0.5</field><field name="y">0.5</field><field name="z">0</field><next><block type="vertex"><field name="x">-0.5</field><field name="y">-0.5</field><field name="z">0</field><next><block type="vertex"><field name="x">0.5</field><field name="y">-0.5</field><field name="z">0</field></block></next></block></next></block></statement></block></next></block></next></block></next></block></next></block></statement></block></xml>
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
}
].forEach(blockInfo => {
		Blockly.Blocks[blockInfo.type] = {init: function() {
				this.jsonInit(blockInfo);
			}};
	});

const hexColorCodeToFloatVector = colorHex => colorHex
	.substr(1).match(/.{2}/g).map(rgbHex => parseInt(rgbHex, 16) / 255);
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
				+ `new ${dropdown_array_type}([${statements_data}].filter(e => e !== undefined)), `
				+ `gl.${dropdown_usage});\n`;
		},
		"vertex": function(block) {
			var number_x = block.getFieldValue('x');
			var number_y = block.getFieldValue('y');
			var number_z = block.getFieldValue('z');

			return `${number_x}, ${number_y}, ${number_z}, `;
		}
	});
