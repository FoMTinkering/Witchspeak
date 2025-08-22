


function vMult(v1, v2) {
    var vres = [];
    for (var i=0; i<v1.length; i++) {
        vres.push(v1[i]*v2[i]);
    }
    return Array(...vres);
}

function vAdd(v1, v2) {
    var vres = [];
    for (var i=0; i<v1.length; i++) {
        vres.push(v1[i]+v2[i]);
    }
    return Array(...vres);
}

function darken(colour, value) {
    var [R,G,B] = [colour.substring(0,2), colour.substring(2,4), colour.substring(4,6)];
    var [bgR, bgG, bgB] = [colourCode.backgroundColour.substring(0,2), colourCode.backgroundColour.substring(2,4), colourCode.backgroundColour.substring(4,6)];
    var newColour = "";
    var v = 1;
    [R,G,B].forEach(c=>{
        var normal = (parseInt(c,16)/255);
        v = Math.min(v, 0.25*(1+3*(1-normal)*value));
    });
    [...Array(3).keys()].forEach(i=>{
        c = [R,G,B][i];
        bgC = [bgR, bgG, bgB][i]
        c = Math.round((parseInt(c,16)*v+parseInt(bgC,16))/2).toString(16);
        if (c.length == 1)
            c = "0"+c;
        newColour += c;
    });
    return newColour;
}


function spacing(vx, vy) {
    return (n) => {
        var spaces = [];
        [...Array(n).keys()].forEach((step) => {
            spaces.push(Array(vx*(step+1), vy*(step+1)))
        });
        return spaces;
    }
}

const re = /\*?\([^\)]*\)/g;

const glossary = {
    "characters": {
        "1": [Array(-1, 0)],
        "2": [Array(-1, 0), Array(-2, 0)],
        "3": [Array(-1, 0), Array(-2, 0), Array(-3, 0)],
        "4": [Array(-1, 0), Array(-2, 0), Array(-2, -1)],
        "5": [Array(-1, 0), Array(-2, 0), Array(-3, 0), Array(-3, -1)],
        "6": [Array(-1, 0), Array(-2, 0), Array(-2, -1), Array(-2, -2)],
        "7": [Array(-1, 0), Array(-2, 0), Array(-3, 0), Array(-3, -1), Array(-3, -2)],
        "8": [Array(-1, 0), Array(-2, 0), Array(-3, 0), Array(-3, -1), Array(-3, -2), Array(-2, -2)],
        "9": [Array(-1, 1), Array(-2, 1), Array(-3, 1)],
        "A": [Array(-1, 0), Array(-2, 0), Array(-2, 1), Array(-2, 2), Array(1, 0), Array(2, 0), Array(2, 1), Array(2, 2)],
        "B": [Array(-1, 0), Array(-2, 0), Array(-2, 1), Array(-2, 2), Array(-1, 2), Array(1, 0), Array(2, 0), Array(2, 1), Array(2, 2), Array(1, 2)],
        "C": [Array(-1, 0), Array(-2, 0), Array(-3, 0), Array(-3, 1), Array(-3, 2), Array(1, 0), Array(2, 0), Array(2, 1), Array(2, 2)],
        "a": [Array(1, 0)],
        "b": [Array(1, 0), Array(2, 0)],
        "c": [Array(1, 1)],
        "'": [Array(-2, -1)],
    },
    "spacings": {"^": spacing(-1, 1), "|": spacing(-1, 0), ".": spacing(0, 1)},
};

const colourCode = {
    "characters": {
        "1": "af00ff",
        "2": "af00ff",
        "3": "0800ff",
        "4": "0800ff",
        "5": "0800ff",
        "6": "0800ff",
        "7": "0800ff",
        "8": "0800ff",
        "9": "00a0ff",
        "A":"00a0ff",
        "B": "00a0ff",
        "C": "00a0ff",
        "a": "ff0000",
        "b": "ff0000",
        "c": "ffad00",
        "'": "ffad00",
    },
    "spacings": {"^": "ff3dff", "|": "ff3dff", ".": "ffffff"},
    "shadingAmount":0.5,
    "backgroundColour":"000000"
};

// set default "." spacing
var defaultSpacing = 3;
glossary["characters"]["."] = glossary["spacings"]["."](defaultSpacing);

class Reading {
    constructor(sentence, maxGlyphHeight = 11, shading = false) {
        this.sentence = sentence;
        this.h = maxGlyphHeight;
        this.errorLog = null;
        this.shading = shading;
        try {
            this.makeGlyphList();
        } catch (err) {
            this.errorLog = "invalidGlyphs";
        }
        var parsed = this.sentence.split("-");
        if (!parsed[0].includes("("))
            this.start = Number(parsed[0]);
        else
            this.start = 0
        if (!parsed[parsed.length-1].includes("("))
            this.end = Number(parsed[parsed.length-1]);
        else
            this.end = 0
        

        if (this.errorLog != null) {
            return;
        }
        this.glyphPairingsList = this.makeGlyphList();
        this.length = 0;
        this.glyphPairingsLengths().forEach(n=>this.length+=n);
        // +1 to length to allow the c character to be placed at the end
        this.length += this.start+1;
        this.readingToGlyph();
    }

    makeGlyphList() {
        var glyphPairingsList = [];
        var glyphWords = this.sentence.match(re);
        if (glyphWords === null)
            return [];
        glyphWords.forEach((glyphWord) => {
            var split = glyphWord[0] == "*";
            if (split)
                glyphWord = glyphWord.substring(1);
            var currentWords = glyphWord.substring(1,glyphWord.length-1).split("/");
            if (currentWords.length == 2)
                var [topWord, bottomWord] = currentWords;
            else
                var [topWord, bottomWord] = [currentWords[0], ""];
            var topGlyph = new Glyph(topWord);
            var bottomGlyph = new Glyph(bottomWord, true);
            glyphPairingsList.push([topGlyph, bottomGlyph, split]);
        });
        return glyphPairingsList;
    }

    glyphPairingsLengths() {
        var lengths = [];
        this.glyphPairingsList.forEach((pairing) => {
            var [topGlyph, bottomGlyph, split] = pairing;
            lengths.push(Math.max(
                topGlyph.length,
                bottomGlyph.length + defaultSpacing * (!split & (topGlyph.length*bottomGlyph.length!=0))
            ));
        })
        return lengths;
    }

    readingToGlyph() {
        var x,y; // can't unpack vecs into grid coordinates so I use these instead
        var topGlyph, bottomGlyph, split;
        var topBranchLength, bottomBranchLength;
        var oldcursor;

        var cursor = this.start;
        this.grid = Array.from(Array(2*height+1), () => new Array(this.length).fill(colourCode.backgroundColour));
        if (cursor != 0) {
            [...Array(cursor).keys()].forEach((col)=>{
                if (this.shading & (this.grid[this.h-1][col] == colourCode.backgroundColour))
                    this.grid[this.h-1][col] = darken("ffffff", colourCode.shadingAmount);
                this.grid[this.h][col] = "ffffff";
            });
        }
        for (var pairingNumber=0; pairingNumber<this.glyphPairingsList.length; pairingNumber++) {
            [topGlyph, bottomGlyph, split] = this.glyphPairingsList[pairingNumber];
            oldcursor = cursor;

            [...Array(topGlyph.pixels.length).keys()].forEach(i => {
                var p = topGlyph.pixels[i];
                var c = topGlyph.colours[i];
                if (c == undefined)
                    return;
                [x,y] = vAdd(p,Array(this.h,cursor));
                if (this.shading & (this.grid[x-1][y] == colourCode.backgroundColour))
                    this.grid[x-1][y] = darken(c, colourCode.shadingAmount);
                this.grid[x][y] = c;
            });
            topBranchLength = topGlyph.length;

            if(!split & (topGlyph.length*bottomGlyph.length != 0))
                cursor += defaultSpacing;

            [...Array(bottomGlyph.pixels.length).keys()].forEach(i => {
                var p = bottomGlyph.pixels[i];
                var c = bottomGlyph.colours[i];
                if (c == undefined)
                    return;
                [x,y] = vAdd(p,Array(this.h,cursor));
                if (this.shading & (this.grid[x-1][y] == colourCode.backgroundColour)) 
                    this.grid[x-1][y] = darken(c, colourCode.shadingAmount);
                this.grid[x][y] = c;
            });
            bottomBranchLength = bottomGlyph.length;

            cursor = Math.max(oldcursor + topBranchLength, cursor + bottomBranchLength);
            
            if (pairingNumber == (this.glyphPairingsList.length-1))
                var end = Math.abs(this.end);
            else
                var end = 0;
            [...Array(cursor-end-oldcursor).keys()].forEach((c)=>{
                var col = c+oldcursor;
                if (this.shading & (this.grid[this.h-1][col] == colourCode.backgroundColour))
                    this.grid[this.h-1][col] = darken("ffffff", colourCode.shadingAmount);
                this.grid[this.h][col] = "ffffff";
            })
        }   
    }

}


class Glyph {
    constructor(word, flip=false) {
        this.word = word;
        this.length = 0;
        this.vertChar = null;
        if (flip)
            this.flip = Array(-1,1);
        else
            this.flip = Array(1,1);
        this.length = 0;
        this.pixels = [];
        this.colours = [];
        if (this.glyphType() == "SimpleGlyph")
            var pixels = this.computePixelsSimple();
        else
            var pixels = this.computePixelsComplex();
        pixels.forEach((p) => {
            this.pixels.push(vMult(p,this.flip))
        });
    }

    glyphType() {
        var complex = false;
        ["^", "|"].forEach((ch) => {
            if (this.word.includes(ch)) {
                complex = true;
                this.vertChar = ch;
            }
        });
        if (complex) 
            return "ComplexGlyph";
        else
            return "SimpleGlyph";
    }

    computePixelsSimple() {
        var colours = [];
        var pixels = [];
        var word = this.word;
        if (word.length == 0)
            return pixels;

        if (word[0] == "'") {
            this.pixels.push(Array(-6,0));
            colours.push(colourCode.characters["'"]);
            word = word.substring(1);
        }

        var branchSpacing;
        switch (word[0]) {
            case ".":
                branchSpacing = 4;
                break;
            case "0":
                branchSpacing = 4;
                break;
            case "1":
                branchSpacing = 5;
                break;
            default:
                throw new Error(word);
        }
        
        glossary.spacings["^"](branchSpacing).forEach((p) => {
            colours.push(colourCode.spacings["^"]);
            pixels.push(p);
        });
        var position = Array(-branchSpacing, branchSpacing);

        var instant = false;
        Array(...word.substring(1)).forEach((ch) => {
            if (ch == "i") {
                instant = true;
                return; // acts like continue in a forEach
            }
            if (instant)
                instant = false;
            else {
                glossary.spacings["."](defaultSpacing).forEach((p) => {
                    colours.push(colourCode.spacings["."]);
                    pixels.push(vAdd(position,p));
                });
                position = vAdd(position, Array(0,defaultSpacing));
            }

            glossary.characters[ch].forEach((p) => {
                colours.push(colourCode.characters[ch]);
                pixels.push(vAdd(position,p));
            });
        });
        this.length = Math.max(...pixels.map((p) => p[1]));
        this.colours = colours;
        return pixels;
    }

    computePixelsComplex() {
        var colours = [];
        function processBranch(branch) {
            branch.forEach((ch)=>{
                if (ch == "i") {
                    instant = true;
                    return;
                }
                if (instant)
                    instant = false;
                else {
                    glossary.spacings["."](defaultSpacing).forEach((p) => {
                        colours.push(colourCode.spacings["."]);
                        pixels.push(vAdd(position,p));
                    });
                    position = vAdd(position, Array(0,defaultSpacing));
                }
                glossary.characters[ch].forEach((p) => {
                    colours.push(colourCode.characters[ch]);
                    pixels.push(vAdd(position,p));
                });
            });
        }
        var branchSpacings;
        var pixels = [];
        var word = this.word;
        if (word.length == 0)
            return pixels;

        if (word[0] == "'") {
            colours.push(colourCode.characters["'"]);
            this.pixels.push(Array(-6,0));
            word = word.substring(1);
        }

        var vertCharIdx = word.indexOf(this.vertChar);
        var secondaryBranch = word.substring(vertCharIdx+1);
        var [topBranch, bottomBranch] = this.postBranching(secondaryBranch);
        var highTopBranch = ["2","4","6"].some(ch => topBranch.includes(ch));
        var lowBottomBranch = ["b"].some((ch) => bottomBranch.includes(ch));
        if (highTopBranch & lowBottomBranch)
            throw new Error("branch error");
        else if (highTopBranch)
            branchSpacings = [3,2];
        else if (lowBottomBranch)
            branchSpacings = [4,2];
        else
            branchSpacings = [3,3];
        glossary.spacings["^"](branchSpacings[0]).forEach((p)=>{
            colours.push(colourCode.spacings["^"]);
            pixels.push(p);
        });
        var position = Array(-branchSpacings[0], branchSpacings[0]);
        var instant = false;

        processBranch(
            Array(...word.substring(1,vertCharIdx))
        );
        
        if (!instant) {
            glossary.spacings["."](defaultSpacing).forEach((p)=>{
                colours.push(colourCode.spacings["."]);
                pixels.push(vAdd(position,p));
            });
            position = vAdd(position, Array(0,defaultSpacing));
        }
        var preBranchPosition = Array(...position);
        var vertSpacing = glossary.spacings[this.vertChar](branchSpacings[1]+1);
        vertSpacing.forEach((p)=>{
            colours.push(colourCode.spacings[this.vertChar]);
            pixels.push(vAdd(position,p));
        });

        position = vAdd(position,vertSpacing[branchSpacings[1]]);

        glossary.spacings["."](defaultSpacing).forEach((p)=>{
            colours.push(colourCode.spacings["."]);
            pixels.push(vAdd(position,p));
        });

        instant = false;
        processBranch(
            Array(...topBranch)
        );

        position = preBranchPosition;

        instant = false;
        processBranch(
            Array(...bottomBranch)
        );

        this.length = Math.max(...pixels.map((p) => p[1]));
        this.colours = colours;
        return pixels;
    }

    postBranching(chars) {
        var [A,B] = [chars.includes("["), chars.includes("]")];
        var [both, none] = [(A&B), (!A&!B)];
        if (!both & !none)
            throw new Error("invalid branching : invalid brackets");
        if (none) {
            if (chars.length != 2)
                throw new Error("invalid branching : missing brackets");
            else
                return Array(...chars);
        } else {
            var before = chars.substring(0,chars.indexOf("["));
            var inside = chars.substring(chars.indexOf("[")+1,chars.indexOf("]"));
            var after = chars.substring(chars.indexOf("]")+1);
            if (after.substring(after.indexOf("]")+1).includes("]"))
                throw new Error("invalid branching : too many branches")
            if (((before.length == 0) + (inside.length == 0)+(after.length == 0)) > 1)
                throw new Error("invalid branching : needs more characters");
            if (before.length == 0) {
                if (after[0] == "[")
                    return [inside, after.substring(1,after.length-1)];
                else
                    return [inside, after];
            } else {
                return [before, inside];
            }
        }
    }
    
}



function drawPixels() {
    for (var row = 0; row < (2*height+1); row++) {
        for (var col = 0; col < grid[0].length; col++) {
            ctx.fillStyle = "#"+grid[row][col];
            ctx.fillRect(col * step, row * step, step, step);
        }
    }
}

function clearGrid() {
    for (var row = 0; row < (2*height+1); row++) {
        for (var col = 0; col < 192; col++) {
            ctx.fillStyle = "black";
            ctx.fillRect(col * step, row * step, step, step);
        }
    }
}

function checkValid(sentence) {
    try {
        new Reading(sentence, 10);
    } catch (err) {
        return false;
    }
    return true;
}


function attemptCompute(ignore=false) {
    if (!ignore) { 
        // don't let user keypresses trigger Compute if textarea is not selected
        input = document.getElementById("input");    
        if (document.activeElement != input) 
            return "input are not selected";
    }
   var sentence = ""+input.innerHTML;
    if (!checkValid(sentence))
        return "invalid sentence";
    var reading = new Reading(sentence, 10, false); // true if shading checkbox is ticked
    grid = reading.grid;
    clearGrid();
    if (grid.length == 0)
        return "no length";
    drawPixels();
    canvas.style.left = 50-50*Math.min(reading.length/192, 1)+"%";
    return sentence;
}

function drawCScanvas(csCanvas) {
    var canvasCtx = csCanvas.getContext("2d");
    var ch = csCanvas.id.substring(7); // remove "canvas-"
    var csGrid = Array.from(Array(9), () => new Array(9).fill(colourCode.backgroundColour));
    [...Array(9).keys()].forEach(col=>{csGrid[4][col]="ffffff"});
    csGrid[4][4]="bbbbbb";
    var csPixels = [];
    if (Object.keys(glossary.spacings).includes(ch))
        glossary.spacings[ch](4).forEach(p=>{csPixels.push(vAdd(p,Array(4,4)))});
    else
        glossary.characters[ch].forEach(p=>{csPixels.push(vAdd(p,Array(4,4)))});
    csPixels.forEach(p=>{
        var [x,y] = p;
        if (Object.keys(glossary.spacings).includes(ch))
            csGrid[x][y] = colourCode.spacings[ch];
        else
            csGrid[x][y] = colourCode.characters[ch];
    });
    for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
            canvasCtx.fillStyle = "#"+csGrid[row][col];
            canvasCtx.fillRect(col * step, row * step, step, step);
        }
    }
}

function updateColors(colorswatch) {
    var ch = colorswatch.id.substring(12) // remove "colorswatch-"
    if (Object.keys(glossary.spacings).includes(ch))
        colourCode.spacings[ch] = colorswatch.value.substring(1); // removes "#"
    else
        colourCode.characters[ch] = colorswatch.value.substring(1);
    drawCScanvas(document.getElementById("canvas-"+ch));
    attemptCompute(true);
}


// code runs from here

var height = 11; // 10 for glyphs + 1 for shading 
var step = 10;

const canvas = document.getElementById("grid");
canvas.height = (2*height+1)*step;
canvas.width = 1920; // not sure about this
const ctx = canvas.getContext("2d");

input = document.getElementById("input");
input.addEventListener("keydown", (e) => {
    if (
        e.key.includes("Shift") |
        e.key.includes("Control") | 
        e.key.includes("Alt") |
        e.key.includes("Meta")
    )
        return;
    if (document.activeElement.id == "input") {
        setTimeout(
            () => {
                document.activeElement.defaultValue = document.activeElement.value;
                attemptCompute();
            }, 10
        )        
    }
})

// create the default glyph
attemptCompute(true);

var csList = document.getElementsByClassName("color-selector");
for (cs of csList) {
    ch = cs.id.substring(3); // removes "cs-""
    var csCanvas = document.createElement('canvas');
    // create canvas and set its width and height to accomodate the character
    csCanvas.width = 90;
    csCanvas.height = 90;
    csCanvas.style.width = csCanvas.width + "px";
    csCanvas.style.height = csCanvas.height + "px";
    csCanvas.id = "canvas-"+ch;
    drawCScanvas(csCanvas);
    cs.appendChild(csCanvas);

    // create invisible colorswatch over the canvas
    colorswatch = document.createElement("input");
    colorswatch.id = "colorswatch-"+ch;
    colorswatch.setAttribute("type", "color");
    colorswatch.setAttribute("value", "#"+colourCode.characters[ch]);
    colorswatch.setAttribute("oninput", "updateColors(this)");
    cs.appendChild(colorswatch);
}

