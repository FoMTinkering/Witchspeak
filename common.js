// temporary variable, should eventually be replaced with combobox (on page creation below)
var activeColormap = "peachy";
var colorInputToggle = 0;
var use_shading = false;

function onChangeColorSetting(obj) {
    var color_setting = obj.value
    obj.blur();

    var customColor = document.getElementById("custom-color");
    var cmapSelect = document.getElementById("colormap-select");
    switch (color_setting) {
        case "custom":
            cmapSelect.style.width = "0px";
            cmapSelect.style.opacity = "0";

            customColor.style.visibility = "visible";
            customColor.style.width = "25px";
            customColor.style.opacity = "1";

            var new_color = customColor.value.substring(1);
            [cmaps.custom.colors[0], cmaps.custom.colors[1]] = [new_color, new_color];
            colorCode.mainlineColor = new_color;
            break;
        case "glyph":
        case "pixel":
            customColor.style.width = "0px";
            customColor.style.opacity = "0";

            cmapSelect.style.visibility = "visible";
            cmapSelect.style.width = "80px";
            cmapSelect.style.opacity = "1";
            colorCode.mainlineColor = evaluateCmap(cmaps[activeColormap], 0);
            break;
        default:
            cmapSelect.style.width = "0px";
            cmapSelect.style.opacity = "0";
            customColor.style.width = "0px";
            customColor.style.opacity = "0";
            colorCode.mainlineColor = "ffffff";
    }
    attemptCompute(true);
}

function onShowShadingChange(obj) {
    var slider = document.getElementById("shade-amount");
    if(obj.checked) {
        slider.style.visibility = "visible";
        slider.style.width = "100px";
        slider.style.opacity = "1";
    }
    else
    {
        slider.style.width = "0px";
        slider.style.opacity = "0";
    }
    use_shading = obj.checked;
    attemptCompute(true);
}

function onChangeShadeValue(obj) {
    colorCode.shadingAmount = obj.value;
    attemptCompute(true);
}

function onChangeBackground(obj) {
    colorCode.backgroundColor = obj.value.substring(1);
    document.getElementById("canvas-container").style.backgroundColor = colorCode.backgroundColor;
    document.getElementById("gradient-decor").style.backgroundImage = "linear-gradient(0deg, rgb(15, 10, 36), #"+colorCode.backgroundColor+")";
    attemptCompute(true);
}

function onChangeCMap(obj) {
    activeColormap = obj.value;
    colorCode.mainlineColor = evaluateCmap(cmaps[activeColormap], 0);
    attemptCompute(true);
}

function toggleOnClick(obj) {
    colorInputToggle = obj.value = Math.abs(obj.value-1);
    var activeColor = "aliceblue";
    var inactiveColor = "rgb(176, 167, 212)";
    var inactiveBorderColor = "rgb(15, 10, 36)";

    var state = colorInputToggle == 0;
    var labels = document.getElementsByClassName("switch-label");
    labels[0].style.color = state ? activeColor:inactiveColor;
    labels[0].style.borderColor = state ? activeColor:inactiveBorderColor;
    labels[1].style.color = state ? inactiveColor:activeColor;
    labels[1].style.borderColor = state ? inactiveBorderColor:activeColor;

    var operators = document.getElementsByClassName("format-button");
    for(var i=0; i<operators.length; i++) {
        operators[i].style.color = operators[i].style.borderColor = (state ? inactiveColor:activeColor);
        operators[i].style.pointerEvents = state ? "none":"all";
    }

    var elements = document.getElementsByClassName("color-swatch");
    for (var i=0; i<elements.length; i++) {
        elements[i].style.zIndex = state ? 1:0;
    }

    elements = document.getElementsByClassName("input-button");
    for (var i=0; i<elements.length; i++) {
        elements[i].style.zIndex = state ? 0:1;
    }

    buttonType = state ? "color select":"glyph input";
}

function onToggleUpdate(obj) {
    obj.value = colorInputToggle;
}

function goNextGlyph() {
    continueLastGlyph = false;
}

function doBranch() {
    var currentGlyph = buttonGlyphs[buttonGlyphs.length-1];
    if (typeof(currentGlyph[currentGlyph.length-1]) != "object")
        return;
    buttonBranch = false;
}

function refreshGlyph() {
    buttonGlyphs = [];
    continueLastGlyph = false;
    processButtonGlyph();
}

function undoLastGlyph() {
    var len = buttonGlyphs.length;
    if (len > 0) {
        var popped = buttonGlyphs.pop(-1);
        if(len > 2) {
            var last = buttonGlyphs[len-2]
            if (last == ("/") || last == ("*/")) {
                buttonGlyphs.pop(-1);
                if (popped.includes("*"))
                    buttonGlyphs[len-2].pop(0); // remove "*" at start of glyph
            }
        }
    }
    continueLastGlyph = buttonGlyphs.length > 0;
    processButtonGlyph();
}

function undoLastInput() {
    var len = buttonGlyphs.length;
    if (len > 0) {
        var glyph = buttonGlyphs[len-1];
        var subGlyph = null
        if(typeof(subGlyph = glyph[glyph.length-1]) == "object") {
            var removal = subGlyph[subGlyph.length-1].pop(-1);
            if(subGlyph[subGlyph.length-1].length == 0)
                subGlyph.pop(-1);
            if(subGlyph.length > 0) {
                processButtonGlyph();
                return;
            }
            else {
                glyph.pop(-2);
            }
        }
        glyph.pop(-1);
        if(glyph.length == 1 && glyph[0] == '.') {
            buttonGlyphs.pop(-1);
            if(len > 2) {
                var last = buttonGlyphs[len-2]
                if (last == ("/") || last == ("*/")) {
                    buttonGlyphs.pop(-1);
                    if (last == "*/") {
                        buttonGlyphs[len-3].splice(0, 1);
                    }
                }
            }
        }
    }
    continueLastGlyph = buttonGlyphs.length > 0;
    processButtonGlyph();
}

function toggleSplit() {
    var index = -1;
    var toggleState = false;
    for(var i=buttonGlyphs.length-1; i>=0; i--) {
        if(buttonGlyphs[i] == ('/')) {
            toggleState = true;
            index = i;
            break;
        }
        else if(buttonGlyphs[i] == ('*/'))
        {
            toggleState = false;
            index = i;
            break;
        }
    }

    if(toggleState) {
        buttonGlyphs[index].splice(buttonGlyphs[index].lastIndexOf("/"), 1, "*/");
    }
    else {
        buttonGlyphs[index].splice(buttonGlyphs[index].lastIndexOf("*/"), 1, "/");
        for(var i=index; i>=0; i--) {
            if(buttonGlyphs[i].includes('*')) {
                buttonGlyphs[i].splice(0, 1);
            }
        }
    }
    processButtonGlyph();
}

function switchSide() {
    var currentGlyph = buttonGlyphs[buttonGlyphs.length-1];
    if(currentGlyph == '/' || currentGlyph == '*/') {
        toggleSplit();
        return;
    }

    if (!continueLastGlyph) { // allows (/.54) and the likes to be valid
        buttonGlyphs.push([]);
        buttonGlyphs.push(["/"]);
        return;
    }

    var validGlyph = true;
    if (buttonGlyphs.length > 1) {
        if (buttonGlyphs[buttonGlyphs.length-2].includes("/") || buttonGlyphs[buttonGlyphs.length-2].includes("*/")) {
            toggleSplit();
            validGlyph = false;
        }
    }

    currentGlyph.forEach(ch => {
        if ((typeof(ch) == "object") & (ch.length != 2)) {
            validGlyph = false;
        }
    });
    if (validGlyph) {
        buttonGlyphs.push(["/"]); // making this "*/" forces the immediate switching
        continueLastGlyph = false;
    }
}


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

function darken(color, value) {
    var [R,G,B] = [color.substring(0,2), color.substring(2,4), color.substring(4,6)];
    var [bgR, bgG, bgB] = [colorCode.backgroundColor.substring(0,2), colorCode.backgroundColor.substring(2,4), colorCode.backgroundColor.substring(4,6)];
    var newColor = "";
    var v = 0;
    [R,G,B].forEach(c=>{
        var normal = (parseInt(c,16)/255);
        v += 0.25*(1+3*(1-0.75*normal)*value);
    });
    if (v<0)
        v = 0;
    v = (v/6);
    [...Array(3).keys()].forEach(i=>{
        c = [R,G,B][i];
        bgC = [bgR, bgG, bgB][i]
        c = Math.round(parseInt(c,16)*v+parseInt(bgC,16)*(1-v)).toString(16);
        if (c.length == 1)
            c = "0"+c;
        newColor += c;
    });
    return newColor;
}

// function darken(color, value) {
//     var [R,G,B] = [color.substring(0,2), color.substring(2,4), color.substring(4,6)];
//     var newColor = "";
//     [...Array(3).keys()].forEach(i=>{
//         c = Math.round(parseInt([R,G,B][i],16)*value).toString(16);
//         if (c.length == 1)
//             c = "0"+c;
//         newColor += c;
//     });
//     return newColor;
// }


function findMax(arr) {
    var m = 0;
    if (arr.length == 0)
        return null;
    for (var row = 0; row < arr.length; row++) {
        if (arr[row].length == 0)
            return null;
        for (var col = 0; col < arr[row].length; col++)
            if (typeof(arr[row][col]) == "number")
                m = Math.max(m, arr[row][col]);
    }
    if (m>0)
        return m;
    else
        return 1;
}

function mixColor(colorA, colorB, mixFactor) {
    var [aR, aG, aB] = [colorA.substring(0,2), colorA.substring(2,4), colorA.substring(4,6)];
    var [bR, bG, bB] = [colorB.substring(0,2), colorB.substring(2,4), colorB.substring(4,6)];
    var newColor = "";
    [...Array(3).keys()].forEach(i=>{
        aC = [aR, aG, aB][i];
        bC = [bR, bG, bB][i];
        c = Math.round(parseInt(aC,16)*(1-mixFactor) + parseInt(bC,16)*mixFactor).toString(16);
        if (c.length == 1)
            c = "0"+c;
        newColor += c;
    });
    return newColor;
}

function evaluateCmap(cmap, v) {
    idx = cmap.values.length-1;
    for (i=0; i<cmap.values.length; i++) {
        var entry = cmap.values[i];
        if (v < entry) {
            idx = i;
            break;
        }
    }
    var [a, b] = [cmap.values[idx-1], cmap.values[idx]];
    var mixFactor = (v-a)/(b-a);
    return mixColor(cmap.colors[idx-1], cmap.colors[idx], mixFactor);
}

function cmapPropagate(arr, cmap) {
    range = findMax(arr);
    for (var row = 0; row < arr.length; row++) {
        for (var col = 0; col < arr[row].length; col++) {
            if (typeof(arr[row][col]) == "number") {
                arr[row][col] = evaluateCmap(cmap, arr[row][col]/range);
            }
        }
    }
    return arr;
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
    "spacings": {"^": spacing(-1, 1), "|": spacing(-1, 0), ".": spacing(0, 1), "i": spacing(0, -1)},
};

const colorCode = {
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
        "A": "00a0ff",
        "B": "00a0ff",
        "C": "00a0ff",
        "a": "ff0000",
        "b": "ff0000",
        "c": "ffad00",
        "'": "ffad00",
    },
    "spacings": {"^": "ff3dff", "|": "ff3dff", ".": "ffffff", "i": "00ff00"},
    "shadingAmount":0.5,
    "backgroundColor":"000000",
    "mainlineColor":"ffffff"
};

const cmaps = {
    "default": {
        "values": [0, 1],
        "colors": ["555555","ffffff"]
    },
    "peachy": {
        "values": [0, 0.15, 0.35, 0.75, 1],
        "colors": ["d096e2","ffc6d9","ffe1c6","fff7ae","f6ae42"]
    },
    "tea": {
        "values": [0, 0.25, 0.5, 0.75, 1],
        "colors": ["d3fad6","d1efb5","edeba0","c3c48d","928c6f"]
    },
    "tropical": {
        "values": [0, 0.25, 0.5, 0.75, 1],
        "colors" : ["9cfffa","acf39d","b0c592","a97c73","af3e4d"]
    },
    "gloomy": {
        "values": [0, 0.25, 0.5, 0.75, 1],
        "colors" : ["533747","5f506b","6a6b83","76949f","86bbbd"]
    },
    "bubblegum": {
        "values": [0, 0.5, 0.75, 1],
        "colors": ["d84797","d2fdff","3abeff","26ffe6"]
    },
    "magma" : {
        "values": [0, 0.2, 0.55, 0.75, 1],
        "colors": ["524cff","8447ff","d972ff","ffb2e6","ecbe4a"]
    },
    "rainbow": {
        "values": [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        "colors": ["ff0000","ff9900","ccff00","33ff00","00ff66","00ffff","0066ff","3300ff","cc00ff","ff0099","ff0000"]
    },
    "custom": {
        "values": [0, 1],
        "colors": ["ffffff","ffffff"]
    }
}

// set default "." spacing
var defaultSpacing = 3;
glossary["characters"]["."] = glossary["spacings"]["."](defaultSpacing);

class Reading {
    constructor(sentence, maxGlyphHeight = 11, shading = false, colorType="default", cmap = "default") {
        this.sentence = sentence;
        this.h = maxGlyphHeight;
        this.errorLog = null;
        this.shading = shading;
        this.colorType = colorType;
        this.cmap = cmap;
        this.range = null; // only used to compute glyph-display shading
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
        if (this.colorType == "glyph") {
            this.range = findMax(this.grid);
            this.grid = cmapPropagate(this.grid, cmaps[this.cmap]);
        }
        else if (this.colorType == "custom")
            this.grid = cmapPropagate(this.grid, cmaps.custom);
        if (this.shading)
            this.shadeGlyphs();
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
            var topGlyph = new Glyph(topWord, false, this.colorType, this.cmap);
            var bottomGlyph = new Glyph(bottomWord, true, this.colorType, this.cmap);
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
        this.grid = Array.from(Array(2*height+1), () => new Array(this.length).fill(colorCode.backgroundColor));
        if (cursor != 0) {
            [...Array(cursor).keys()].forEach((col)=>{
                this.grid[this.h][col] = "ffffff";
            });
        }
        for (var pairingNumber=0; pairingNumber<this.glyphPairingsList.length; pairingNumber++) {
            [topGlyph, bottomGlyph, split] = this.glyphPairingsList[pairingNumber];
            oldcursor = cursor;

            [...Array(topGlyph.pixels.length).keys()].forEach(i => {
                var p = topGlyph.pixels[i];
                var c = topGlyph.colors[i];
                if (c == undefined)
                    return;
                else if (c == 0) {
                    c = pairingNumber;
                }
                [x,y] = vAdd(p,Array(this.h,cursor));
                this.grid[x][y] = c;
            });
            topBranchLength = topGlyph.length;

            if(!split & (topGlyph.length*bottomGlyph.length != 0))
                cursor += defaultSpacing;

            [...Array(bottomGlyph.pixels.length).keys()].forEach(i => {
                var p = bottomGlyph.pixels[i];
                var c = bottomGlyph.colors[i];
                if (c == undefined)
                    return;
                else if (c == 0) {
                    c = pairingNumber;
                }
                [x,y] = vAdd(p,Array(this.h,cursor));
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
                this.grid[this.h][col] = colorCode.mainlineColor;
            })
        }   
    }

    shadeGlyphs() {
        var x,y; // can't unpack vecs into grid coordinates so I use these instead
        var topGlyph, bottomGlyph, split;
        var topBranchLength, bottomBranchLength;
        var oldcursor;

        var cursor = this.start;
        if (cursor != 0) {
            [...Array(cursor).keys()].forEach((col)=>{
                if (this.shading & (this.grid[this.h-1][col] == colorCode.backgroundColor))
                    this.grid[this.h-1][col] = darken("ffffff", colorCode.shadingAmount);
            });
        }
        for (var pairingNumber=0; pairingNumber<this.glyphPairingsList.length; pairingNumber++) {
            [topGlyph, bottomGlyph, split] = this.glyphPairingsList[pairingNumber];
            oldcursor = cursor;

            [...Array(topGlyph.pixels.length).keys()].forEach(i => {
                var p = topGlyph.pixels[i];
                var c = topGlyph.colors[i];
                if (c == undefined)
                    return;
                else if (c == 0) {
                    c = pairingNumber;
                }
                if (typeof(c) == "number") {
                    switch (this.colorType) {
                        case "glyph":
                            c = evaluateCmap(cmaps[this.cmap], c/this.range);
                            break;
                        case "custom":
                            c = evaluateCmap(cmaps.custom, c);
                            break;
                        case "pixels":
                            c = evaluateCmap(cmaps[this.cmap], c/bottomGlyph.pixels.length);
                            break;
                        default:
                            throw new Error("failed to find a valid colorType while shading");
                    }
                } 
                [x,y] = vAdd(p,Array(this.h,cursor));
                if (this.shading & (this.grid[x-1][y] == colorCode.backgroundColor))
                    this.grid[x-1][y] = darken(c, colorCode.shadingAmount);
            });
            topBranchLength = topGlyph.length;

            if(!split & (topGlyph.length*bottomGlyph.length != 0))
                cursor += defaultSpacing;

            [...Array(bottomGlyph.pixels.length).keys()].forEach(i => {
                var p = bottomGlyph.pixels[i];
                var c = bottomGlyph.colors[i];
                if (c == undefined)
                    return;
                else if (c == 0) {
                    c = pairingNumber;
                }
                if (typeof(c) == "number") {
                    switch (this.colorType) {
                        case "glyph":
                            c = evaluateCmap(cmaps[this.cmap], c/this.range);
                            break;
                        case "custom":
                            c = evaluateCmap(cmaps.custom, c);
                            break;
                        case "pixels":
                            c = evaluateCmap(cmaps[this.cmap], c/bottomGlyph.pixels.length);
                            break;
                        default:
                            throw new Error("failed to find a valid colorType while shading");
                    }
                }
                [x,y] = vAdd(p,Array(this.h,cursor));
                if (this.shading & (this.grid[x-1][y] == colorCode.backgroundColor)) 
                    this.grid[x-1][y] = darken(c, colorCode.shadingAmount);
            });
            bottomBranchLength = bottomGlyph.length;

            cursor = Math.max(oldcursor + topBranchLength, cursor + bottomBranchLength);
            
            if (pairingNumber == (this.glyphPairingsList.length-1))
                var end = Math.abs(this.end);
            else
                var end = 0;
            [...Array(cursor-end-oldcursor).keys()].forEach((c)=>{
                var col = c+oldcursor;
                if (this.shading & (this.grid[this.h-1][col] == colorCode.backgroundColor))
                    this.grid[this.h-1][col] = darken(colorCode.mainlineColor, colorCode.shadingAmount);
            })
        }   
    }
}


class Glyph {
    constructor(word, flip=false, colorType="default", cmap="default") {
        this.word = word;
        this.length = 0;
        this.vertChar = null;
        this.colorType = colorType;
        this.cmap = cmap;
        if (flip)
            this.flip = Array(-1,1);
        else
            this.flip = Array(1,1);
        this.length = 0;
        this.pixels = [];
        this.colors = [];
        if (this.glyphType() == "SimpleGlyph")
            var pixels = this.computePixelsSimple();
        else
            var pixels = this.computePixelsComplex();
        pixels.forEach((p) => {
            this.pixels.push(vMult(p,this.flip))
        });
        if (this.colorType == "pixel")
            this.colors = cmapPropagate([this.colors], cmaps[this.cmap])[0];
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
        var colors = [];
        var colorType = this.colorType;
        function addColor(ch) {
            switch (colorType) {
                case "custom":
                    colors.push(1);
                    break;
                case "pixel":
                    colors.push(totalChars);
                    totalChars += 1;
                    break;
                case "glyph":
                    colors.push(0);
                    break;
                default:
                    if (Object.keys(colorCode.spacings).includes(ch))
                        colors.push(colorCode.spacings[ch]);
                    else
                        colors.push(colorCode.characters[ch]);
            }
        }
        var pixels = [];
        var word = this.word;
        var totalChars = 0;
        if (word.length == 0)
            return pixels;

        if (word[0] == "'") {
            this.pixels.push(Array(-6,0));
            addColor("'");
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
            addColor("^");
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
                    addColor(".");
                    pixels.push(vAdd(position,p));
                });
                position = vAdd(position, Array(0,defaultSpacing));
            }

            glossary.characters[ch].forEach((p) => {
                addColor(ch);
                pixels.push(vAdd(position,p));
            });
        });
        this.length = Math.max(...pixels.map((p) => p[1]));
        this.colors = colors;
        return pixels;
    }

    computePixelsComplex() {
        var colors = [];
        var colorType = this.colorType;
        function addColor(ch) {
            switch (colorType) {
                case "custom":
                    colors.push(1);
                    break;
                case "pixel":
                    colors.push(totalChars);
                    totalChars += 1;
                    break;
                case "glyph":
                    colors.push(0);
                    break;
                default:
                    if (Object.keys(colorCode.spacings).includes(ch))
                        colors.push(colorCode.spacings[ch]);
                    else
                        colors.push(colorCode.characters[ch]);
            }
        }

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
                        addColor(".");
                        pixels.push(vAdd(position,p));
                    });
                    position = vAdd(position, Array(0,defaultSpacing));
                }
                glossary.characters[ch].forEach((p) => {
                    addColor(ch);
                    pixels.push(vAdd(position,p));
                });
            });
        }
        var branchSpacings;
        var pixels = [];
        var totalChars = 0;
        var word = this.word;
        if (word.length == 0)
            return pixels;

        if (word[0] == "'") {
            addColor("'");
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
            addColor("^");
            pixels.push(p);
        });
        var position = Array(-branchSpacings[0], branchSpacings[0]);
        var instant = false;

        processBranch(
            Array(...word.substring(1,vertCharIdx))
        );
        
        if (!instant) {
            glossary.spacings["."](defaultSpacing).forEach((p)=>{
                addColor(".");
                pixels.push(vAdd(position,p));
            });
            position = vAdd(position, Array(0,defaultSpacing));
        }
        var preBranchPosition = Array(...position);
        var vertSpacing = glossary.spacings[this.vertChar](branchSpacings[1]+1);
        vertSpacing.forEach((p)=>{
            addColor(this.vertChar);
            pixels.push(vAdd(position,p));
        });

        position = vAdd(position,vertSpacing[branchSpacings[1]]);

        glossary.spacings["."](defaultSpacing).forEach((p)=>{
            addColor(".");
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
        this.colors = colors;
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

function addText(text) {
    buttonGlyphs = [];
    continueLastGlyph = false;

    var glyphs = text.match(re);
    if(glyphs == null)
        glyphs = [];

    if(text.lastIndexOf(')') < text.lastIndexOf('(')) {
        if(text.lastIndexOf(')') < text.lastIndexOf('*')) {
            glyphs.push(text.substring(text.lastIndexOf('*')));
        }
        else
            glyphs.push(text.substring(text.lastIndexOf('(')));
    }

    if(glyphs.length == 0)
        return;

    glyphs.forEach((glyph) => {
        console.log(glyph);
        if(glyph.length <= 0)
            return;

        var offset = glyph.includes(')') ? 0:1;
        var asterisk = (glyph[0] == '*');
        var content = glyph.substring(asterisk ? 2:1, glyph.length-1+offset);
        var stacked = content.indexOf('/');
        if(stacked != -1) {
            if(stacked != 0)
                addInternal(content.substring(0, stacked));
            switchSide();
            continueLastGlyph = false;
        }
        addInternal(content.substring(stacked+1));
        continueLastGlyph = (offset == 1);
    });
}

function addInternal(text) {
    if(text.length == 0)
        return;

    var complex = -1;
    complex = text.indexOf('^')
    if(complex == -1)
        complex = text.indexOf('|');

    if(complex != -1) {
        for(var i=0; i<complex; i++) {
            if(i==0 && text[i] == '.')
                continue;
            tryAppendCharacter(text[i]);
        }

        tryAppendCharacter(text[complex]);        
        if(complex < text.length-1 && text[complex+1] == '[') {
            var index = complex+2;
            while(index < text.length && text[index] != ']') {
                tryAppendCharacter(text[index]);
                index++;
            }
            if(index >= text.length)
                return;
            buttonBranch = false;
            
            if(index < text.length-1 && text[index+1] == '[') {
                index = index+2;
                while(index < text.length && text[index] != ']') {
                    tryAppendCharacter(text[index]);
                    index++;
                }
            }
            else {
                index = index+1;
                while(index < text.length) {
                    tryAppendCharacter(text[index]);
                    index++;
                }
            }
        }
        else if(text.includes('['))
        {
            var index = complex+1;
            while(index < text.length && text[index] != '[') {
                tryAppendCharacter(text[index]);
                index++;
            }
            buttonBranch = false;
            
            index = index+1;
            while(index < text.length && text[index] != ']') {
                tryAppendCharacter(text[index]);
                index++;
            }
        }
        else {
            tryAppendCharacter(text[complex+1]);
            buttonBranch = false;
            tryAppendCharacter(text[complex+2]);
        }
    }
    else {
        for(var i=0; i<text.length; i++) {
            if(i==0 && text[i] == '.')
                continue;

            tryAppendCharacter(text[i]);
        }
    }
}

function tryAppendCharacter(ch) {
    if (!continueLastGlyph) {
        buttonGlyphs.push([".", ch]);
        continueLastGlyph = true;
    }
    else {
        var currentGlyph = buttonGlyphs[buttonGlyphs.length-1]; // [".", ch, ...]
        var lastChar = currentGlyph[currentGlyph.length-1]; // ...
        var hasObject = false;
        currentGlyph.forEach(ch => {
            if (typeof(ch) == "object")
                hasObject = true;
        })
        if (["|", "^"].includes(lastChar) & !hasObject) {
            currentGlyph.push([[ch]])
            buttonBranch = true; // needs to be set to false before switching again
        } else if (typeof(lastChar) == "object") {
            if (["|", "^"].includes(ch))
                throw new Error("cannot make glyph with more than two branches");
            if (lastChar.length <= 2) {
                if (buttonBranch) 
                    lastChar[lastChar.length-1].push(ch);
                else {
                    if (lastChar.length == 1) {
                        lastChar.push([ch]);
                        buttonBranch = true;
                    }
                }
            }
        } else {
            currentGlyph.push(ch);
        }
    }
}

function addCharacter(button) {
    var ch = button.id.substring(7) // remove "button-"
    tryAppendCharacter(ch);
    processButtonGlyph();
    
}

function processButtonGlyph() {
    var glyphText = ""
    var bottomSplit = false;
    // prepare *-split glyphs
    [...Array(buttonGlyphs.length).keys()].forEach(i => {
        glyph = buttonGlyphs[i];
        if (glyph == "*/") {
            if (!buttonGlyphs[i-1].includes("*"))
                buttonGlyphs[i-1].splice(0,0,"*");
        }            
    })
    buttonGlyphs.forEach(glyph => {
        if (glyph.includes("/") || glyph.includes("*/")) {
            glyphText = glyphText.substring(0,glyphText.length-2) + "/";
            bottomSplit = true;
            return;
        }
        if (glyph[0] == "*") // can't happen with a bottom split
            glyphText += "*";
        if (!bottomSplit)
            glyphText += "(";
        glyph.forEach(ch => {
            if (ch == "*")
                return;
            if (typeof(ch) == "object") {
                ch.forEach(branch => {
                    if (branch.length == 1)
                        glyphText += branch[0];
                    else {
                        glyphText += "[";
                        branch.forEach(subCh => {
                            glyphText += subCh;
                        });
                        glyphText += "]";
                    }
                })
            } else {
                glyphText += ch;
            }
        });
        glyphText += ")-";
        bottomSplit = false;
    });
    input.value = input.defaultValue = glyphText;
    attemptCompute(true);
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
            ctx.fillStyle = "#"+colorCode.backgroundColor;
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

        addText(input.innerHTML);
    }
   var sentence = ""+input.innerHTML;
    if (!checkValid(sentence))
        return "invalid sentence";
    var reading = new Reading(sentence, 10, use_shading, useColor.value, activeColormap); // replace activeColormap with cmap selector combobox value
    grid = reading.grid;
    clearGrid();
    if (grid.length == 0)
        return "no length";
    drawPixels();
    canvas.style.left = 50-50*Math.min(reading.length/192, 1)+"%";

    document.getElementById("download-button").href = canvas.toDataURL();

    return sentence;
}

function drawCScanvas(csCanvas) {
    var canvasCtx = csCanvas.getContext("2d");
    var ch = csCanvas.id.substring(7); // remove "canvas-"
    var csGrid = Array.from(Array(9), () => new Array(9).fill("000000"));
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
            csGrid[x][y] = colorCode.spacings[ch];
        else
            csGrid[x][y] = colorCode.characters[ch];
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
        colorCode.spacings[ch] = colorswatch.value.substring(1); // removes "#"
    else
        colorCode.characters[ch] = colorswatch.value.substring(1);
    drawCScanvas(document.getElementById("canvas-"+ch));
    attemptCompute(true);
}


// code runs from here

var height = 11; // 10 for glyphs + 1 for shading 
var step = 10;

const canvas = document.getElementById("grid");
const useColor = document.getElementById("use-color");
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

color_setting = document.getElementById("custom-color");
color_setting.addEventListener('transitionend', () => {
    if(color_setting.style.width == "0px") {
        color_setting.style.visibility = "hidden";
        color_setting.style.opacity = "0";
    }
});
color_setting.addEventListener("input", (e) => {
    var new_color = color_setting.value.substring(1);
    [cmaps.custom.colors[0], cmaps.custom.colors[1]] = [new_color, new_color];
    colorCode.mainlineColor = new_color;
    attemptCompute(true);
})

var shader_setting = document.getElementById("shade-amount");
shader_setting.addEventListener('transitioned', () => {
    if(shader_setting.opacity == "0")
    {
        shader_setting.visibility = "hidden";
    }
});

var cmapSelect = document.getElementById("colormap-select");
for (const [key, value] of Object.entries(cmaps)) {
    if (key == "custom")
        continue;
    var cmp = document.createElement('option');
    cmp.value = key;
    cmp.innerHTML = key[0].toUpperCase() + key.substring(1);
    cmapSelect.appendChild(cmp);
}
cmapSelect.value = activeColormap;
cmapSelect.addEventListener('transitionend', () => {
    if(cmapSelect.style.width == "0px") {
        cmapSelect.style.visibility = "hidden";
        cmapSelect.style.opacity = "0";
    }
});

// create the default glyph
attemptCompute(true);


// set buttonType to color select, this should be a checkbox or switch or something
var buttonType = "color select";

// create empty list of glyphs determined by button presses 
// these will be parsed if the buttonType is "glyph input"
var buttonGlyphs = [];
var continueLastGlyph = false;
var buttonBranch = false;

// create the buttons' color swatches
var csList = document.getElementsByClassName("color-selector");
for (cs of csList) {
    ch = cs.id.substring(3); // removes "cs-""

    // create canvas and set its width and height to accomodate the character
    var csCanvas = document.createElement('canvas');
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
    colorswatch.setAttribute("class", "color-swatch");
    colorswatch.setAttribute("type", "color");
    colorswatch.setAttribute("value", "#"+colorCode.characters[ch]);
    colorswatch.setAttribute("oninput", "updateColors(this)");
    colorswatch.style.zIndex = 1;
    cs.appendChild(colorswatch);

    // create button over the canvas
    button = document.createElement("button");
    button.id = "button-"+ch;
    button.setAttribute("class", "input-button");
    button.setAttribute("onclick", "addCharacter(this)");
    button.style.zIndex = 0;
    cs.appendChild(button);
}

addText(input.innerHTML);