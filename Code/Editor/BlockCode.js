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

// Render ��, Start �� ���� ������ ��
// (Start �� ������ Render �� ����� �޸� �ݺ������� ����Ǹ� �� �Ǳ� ����).
// ����� ��� �� ������ Render �� ���� �ִٰ� ������.

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
		"set_clear_color": function(block) {
			const colour_clear_color = block.getFieldValue("clear_color"); // #xxxxxx
			const number_alpha = block.getFieldValue("alpha");

			return `gl.clearColor(${hexColorCodeToFloatVector(colour_clear_color).join(", ")}, ${number_alpha});\n`;
		}
	});