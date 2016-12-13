
'use strict';

var Code = {};
Code.workspace = Blockly.inject('blocklyDiv',
        {media: '../../media/',
         toolbox: document.getElementById('toolbox'),
		 grid:
         {spacing: 40,
          length: 	3,
          colour: '#ccc',
          snap: true},
     trashcan: true,
		   zoom:
        {controls: true,
          wheel: true}
		});
  


  Code.blocklyArea = document.getElementById('blocklyArea');
  Code.blocklyDiv = document.getElementById('blocklyDiv');
  Code.onresize = function() {
    var element = Code.blocklyArea;
    var x = 0;
    var y = 0;
    do {
      y += element.offsetTop;
	  x += element.offsetLeft;
      element = element.offsetParent;
    } while (element);
    Code.blocklyDiv.style.left = x + 'px';
    Code.blocklyDiv.style.top = y + 'px';
    Code.blocklyDiv.style.width = Code.blocklyArea.offsetWidth + 'px';
    Code.blocklyDiv.style.height = Code.blocklyArea.offsetHeight + 'px';
	  Blockly.svgResize(Code.workspace);
  };
  window.addEventListener('resize', Code.onresize, false);
  Code.onresize();
	