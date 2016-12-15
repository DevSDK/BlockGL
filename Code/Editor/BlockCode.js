"use strict";

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

BlockGL.workspace.addChangeListener(event => {
		let resultCode = Blockly.JavaScript.workspaceToCode(BlockGL.workspace);
		document.getElementById("Info").textContent = resultCode.replace(/\n/mg);
		BlockGL.render = new Function(`
				const gl = BlockGL.gl;
				try
				{
					${resultCode}
				}
				catch(error)
				{
					console.error("An error occurred: ", error);
				}
			`);
	});


//////////////////////////////////////////////////
//////////////////// Rendering

function resetWebGLCanvas()
{
	BlockGL.render = _ => _;
	BlockGL.gl = null;

	const canvas_old = document.getElementById("glcanvas");
	const container = canvas_old.parentNode;
	container.removeChild(canvas_old);
	const canvas_new = document.createElement("CANVAS");
	canvas_new.setAttribute("width", "640");
	canvas_new.setAttribute("height", "480");
	container.appendChild(canvas_new);

	try
	{
		BlockGL.gl = canvas_new.getContext("webgl")
			|| canvas_new.getContext("experimental-webgl");
	}
	catch(error) {}

	if(!BlockGL.gl)
	{
		alert("Unable to initialize WebGL. Your browser may not support it.");
		return;
	}

	BlockGL.gl.createProgram();
	BlockGL.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	BlockGL.gl.enable(BlockGL.gl.DEPTH_TEST);
	BlockGL.gl.depthFunc(BlockGL.gl.LEQUAL);
	BlockGL.gl.clear(BlockGL.gl.COLOR_BUFFER_BIT | BlockGL.gl.DEPTH_BUFFER_BIT);
}

BlockGL.renderingTimestamps = [];
BlockGL.timestampQueueCapacity = 100;
function renderingLoop(timestamp)
{
	BlockGL.renderingTimestamps.push(timestamp);
	if(BlockGL.renderingTimestamps.length > BlockGL.timestampQueueCapacity)
	{
		BlockGL.renderingTimestamps.shift();
		BlockGL.fps = BlockGL.timestampQueueCapacity
			/ ((BlockGL.renderingTimestamps[BlockGL.timestampQueueCapacity - 1]
				- BlockGL.renderingTimestamps[0]) / 1000);
		console.info("RENDER -- FPS: ", BlockGL.fps);
	}

	BlockGL.render();
	window.requestAnimationFrame(renderingLoop);
}

window.addEventListener("load", _ => {
		resetWebGLCanvas();
		window.requestAnimationFrame(renderingLoop);
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
		}
	});