"use strict";

let Code = {};
Code.workspace = Blockly.inject("blocklyDiv", {
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

Code.blocklyArea = document.getElementById("blocklyArea");
Code.blocklyDiv = document.getElementById("blocklyDiv");
Code.onresize = function() {
		let element = Code.blocklyArea;
		let x = 0;
		let y = 0;
		do {
			x += element.offsetLeft;
			y += element.offsetTop;
			element = element.offsetParent;
		} while(element);
		Code.blocklyDiv.style.left = x + 'px';
		Code.blocklyDiv.style.top = y + 'px';
		Code.blocklyDiv.style.width = Code.blocklyArea.offsetWidth + 'px';
		Code.blocklyDiv.style.height = Code.blocklyArea.offsetHeight + 'px';
		Blockly.svgResize(Code.workspace);
	};
window.addEventListener("resize", Code.onresize, false);
Code.onresize();



Code.workspace.addChangeListener(event => {
		document.getElementById("Info").textContent
		= Blockly.JavaScript.workspaceToCode(Code.workspace);
	});

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