//bugs:
//no 8 bit; byte size option
//account for negative numbers in width function?
var code;
var code2;
var originalcode;
var pointer;
var codepos;
var delay = 1;
var tape;
var loop;
var numLeft;
var atBreakpoint;
var charmap;
var waiting = false;
var mintapelength = 10;
var tapelength = 100;
var tapelengthShown = 20;
var dynamic = false;
var inputqueue;
var windowwidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var emsize;

function initCode() {
  emsize = parseFloat(getComputedStyle(document.getElementById("body")).fontSize);

  //this function initializes the machine's state
  atBreakpoint = false;
  if (document.getElementById("dynamicoption").checked) {
    dynamic = true;
    tapelength = tapelengthShown;
  } else {
    dynamic = false;
    tapelength = Math.max(document.getElementById("staticlengthfield").value, tapelengthShown);
  }
  //take out useless characters
  originalcode = document.getElementById("code").value;
  code = originalcode;
  var readditional = "";
  if (document.getElementById("breakpointoption").checked) {
    readditional = readditional.concat(";");
  }
  var regex = new RegExp("[^+-.,\\>\\<\\[\\]".concat(readditional, "]"), "g");
  var regex2 = new RegExp("[^+-.,\\>\\<\\[\\]".concat(readditional, "]"), "g");

  code = originalcode.replace(regex, "");
  code2 = originalcode.replace(regex2, "0").replace(/[^0]/g, "1");

  //the charmap helps with highlighting code during runtime
  charmap = [];
  for (var i = 0; i < code2.length; i++) {
    if (code2.charAt(i) == 1) {
      charmap[charmap.length] = i;
    }
  }

  pointer = 0;
  codepos = 0;
  tape = [];

  for (var j = 0; j < Math.max(tapelength, tapelengthShown); j++) {
    tape[j] = 0;
  }
  inputqueue = [];
  var codeinput;
  if (document.getElementById("exclaimoption").checked) {
    if (originalcode.includes("!")) {
      codeinput = Array.from(originalcode.split(/!(.+)/)[1]);
      for (var k = 0; k < codeinput.length; k++) {
        tape[k] = codeinput[k].charCodeAt();
      }
    }
  } else if (document.getElementById("questoption").checked) {
    if (originalcode.includes("?")) {
      codeinput = Array.from(originalcode.split(/\?(.+)/)[1]);
      for (var l = 0; l < codeinput.length; l++) {
        inputqueue[l] = codeinput[l].charCodeAt();
      }
    }
  }
  document.getElementById("output").innerHTML = inputqueue;
}

function codeStep() {
  //this is the function which does most of the work of the interpreter.
  delay = document.getElementById("delayslider").value;
  //stop if we are done with the code
  if (codepos >= code.length) {
    stopButton();
  }
  if (pointer >= tapelength && dynamic) {
    tape[pointer] = 0;
    tapelength++;
  }
  if (pointer >= tapelength) {
    pointer = 0;
  }
  if (pointer < 0) {
    pointer = tapelength - 1;
  }

  //do something different based on which character it is
  //this can probably be optimized quite a bit
  switch (code[codepos]) {
    case '>':
      pointer++;
      codepos++;
      if (pointer >= tapelength && dynamic) {
        tape[pointer] = 0;
      }
      break;
    case '<':
      pointer--;
      codepos++;
      break;
    case '+':
      tape[pointer] = tape[pointer] + 1;
      codepos++;
      break;
    case '-':
      tape[pointer] = tape[pointer] - 1;
      codepos++;
      break;
    case '.':
      document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + String.fromCharCode(tape[pointer]);
      codepos++;
      break;
    case ']':
      if (tape[pointer] !== 0 || tape[pointer] === undefined) {
        numLeft = 1;
        while (numLeft > 0) {
          codepos--;
          document.getElementById("tapecell" + String(pointer)).style.color = "blue";
          if (code[codepos] == ']') {
            numLeft++;
          }
          if (code[codepos] == '[') {
            numLeft--;
          }
        }
      } else {
        codepos++;
      }
      break;
    case '[':
      if (tape[pointer] === 0) {
        numLeft = 1;
        while (numLeft > 0) {
          codepos++;
          if (code[codepos] == '[') {
            numLeft++;
          }
          if (code[codepos] == ']') {
            numLeft--;
          }
        }
        break;
      } else {
        codepos++;
      }
      break;
    case ',':
      if (inputqueue.length < 1) {
        document.getElementById("inputbox").hidden = false;
        document.getElementById("input").focus();
        var inputbox = document.getElementById("input");
        if (inputbox.value !== "") {
          tape[pointer] = inputbox.value.charCodeAt();
          document.getElementById("inputbox").hidden = true;
          inputbox.value = "";
          codepos++;
          waiting = false;
        } else {
          waiting = true;
        }
      } else {
        tape[pointer] = inputqueue[0];
        inputqueue.splice(0, 1);
        codepos++;
      }
      break;
    case ';': //breakpoint
      atBreakpoint = true;
      pauseButton();
      codepos++;
      break;
    default:
      codepos++;
      break;
  }
}

function codeLoop() {
  //is the loop to interpret the bf code
  //could be improved
  refactorWidths();
  delay = document.getElementById("delayslider").value;
  clearInterval(loop);
  if (atBreakpoint !== true) {
    loop = setInterval(function() {
      codeStep();
      codeLoop();

    }, delay);
  }
  display();

}

function runButton() {
  //delay = document.getElementById("delayslider").value;
  initCode();
  //loop = setInterval(codeStep, delay);
  codeLoop();
  //loop = setTimeout(codeStep(false),delay);
  document.getElementById("run").className = "button: hidden";
  document.getElementById("stepinit").className = "button: hidden";
  document.getElementById("step").className = "button: hidden";
  document.getElementById("stop").className = "button";
  document.getElementById("pause").className = "button";

  //document.getElementById("codecontainer").innerHTML ="<p id='code'>".concat(originalcode,"</p>");
}

function pauseButton() {
  clearInterval(loop);
  document.getElementById("pause").className = "button: hidden";
  document.getElementById("step").className = "button";
  document.getElementById("continue").className = "button";
}

function stepButton() {
  codeStep();
  refactorWidths();
  display();
  atBreakpoint = false;
}

function stepInitButton() {
  initCode();
  codeStep();
  refactorWidths();
  display();
  document.getElementById("step").className = "button";
  document.getElementById("stepinit").className = "button: hidden";
  document.getElementById("run").className = "button: hidden";
  document.getElementById("continue").className = "button";
}

function continueButton() {
  //loop = setInterval(codeStep, delay);
  //loop = setTimeout(codeStep(true),delay);
  //codeStep(true);
  atBreakpoint = false;
  codeLoop();
  document.getElementById("pause").className = "button";
  document.getElementById("step").className = "button: hidden";
  document.getElementById("stop").className = "button";
  document.getElementById("continue").className = "button: hidden";
}

function stopButton() {
  clearInterval(loop);
  document.getElementById("stop").className = "button: hidden";
  document.getElementById("continue").className = "button: hidden";
  document.getElementById("run").className = "button";
  document.getElementById("step").className = "button: hidden";
  document.getElementById("stepinit").className = "button";
  document.getElementById("pause").className = "button: hidden";
  document.getElementById("inputbox").hidden = true;
  atBreakpoint = true;
}

function staticToggle() {
  //toggle the visibility of the "static size" textbox
  var box = document.getElementById("staticlengthbox");
  if (box.style.display == "none") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
  document.getElementById("output").innerHTML = "text";
}


function showToolTip(text, event) {
  var tooltip = document.getElementById("tooltip1");

  var mouseX = event.clientX;
  var mouseY = event.clientY;

  var x = mouseX;
  var y = mouseY;

  tooltip.innerHTML = text;
  tooltip.display = "block";
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}

function clearToolTip() {
  document.getElementById("tooltip1").style.left = "-100vw";
  document.getElementById("tooltip1").style.top = "-100vh";
}

function refactorWidths() {
  windowwidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  while (getWidth(tape, tapelengthShown, getBuffer()) < windowwidth / emsize) {

    if (tapelengthShown >= mintapelength) {
      tapelengthShown = tapelengthShown + 1; //Math.max(tapelengthShown + 1, 4);
      document.getElementById("tapecontainer").hidden = false;
    } else {
      tapelengthShown = mintapelength;
      document.getElementById("tapecontainer").hidden = true;
      break;
    }
  }

  while (getWidth(tape, tapelengthShown, getBuffer()) >= windowwidth / emsize) {
    if (tapelengthShown > mintapelength) {
      tapelengthShown = tapelengthShown - 1;
      document.getElementById("tapecontainer").hidden = false;
    } else {
      tapelengthShown = mintapelength;
      document.getElementById("tapecontainer").hidden = true;
      break;
    }
  }

}

function display() {
  var buffer = getBuffer();
  var newinnerhtml = "";
  //do stuff with the display

  //change the <ul> which is the tape display
  for (var i = 0; i < tapelengthShown; i++) {
    newinnerhtml = newinnerhtml + "<li id='tapecell" + i + "'>" + tape[i + buffer] + "</li>";
  }

  document.getElementsByClassName("tape")[0].innerHTML = newinnerhtml;

  //highlight the pointed cell
  document.getElementById("tapecell" + String(pointer - buffer)).style.color = "#999922";
  document.getElementById("tapecell" + String(pointer - buffer)).style.border = "1px solid #999922";
  document.getElementById("tapecell" + String(pointer - buffer)).style.background = "#EEEE77";
  document.getElementById("tapecell" + String(pointer - buffer)).style.fontWeight = "bold";

  //document.getElementById("tapecell" + String(pointer - buffer + 1)).style.borderLeft = "none";

  //highlight the current spot in code
  if (waiting !== true) {
    document.getElementById("code").setSelectionRange(charmap[codepos], charmap[codepos] + 1);
    setTimeout(function() {
      document.getElementById("code").focus();
    }, 2 * delay);
  }



}

function getBuffer() {
  if (pointer >= tapelengthShown && pointer <= tapelength - tapelengthShown / 2) {
    return Math.floor(pointer - tapelengthShown / 2);
  } else if (pointer > tapelength - tapelengthShown / 2) {
    return Math.floor(tapelength - tapelengthShown);
  } else {
    return 0;
  }
}

function getWidth(tape, tapelengthShown, buffer) {
  return 1.03 * tapelengthShown - 0.008 * Math.pow(tapelengthShown, 2) + 0.00001 * Math.pow(tapelengthShown, 3) + 1.02 * tape.slice(buffer, buffer + tapelengthShown).join("").length + 0.32;
}
