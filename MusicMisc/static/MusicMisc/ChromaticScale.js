'use strict';

var Deque = require("collections/deque");

var ChromaticScaleValues = [
    ["B#", "C"]
    , ["B##", "C#", "Db"]
    , ["C##", "D", "Ebb"]
    , ["D#", "Eb", "Fbb"]
    , ["D##", "E", "Fb"]
    , ["E#", "F", "Gbb"]
    , ["E##", "F#", "Gb"]
    , ["F##", "G", "Abb"]
    , ["G#", "Ab"]
    , ["G##", "A", "Bbb"]
    , ["A#", "Bb", "Cbb"]
    , ["A##", "B", "Cb"]
];

var ChromaticScale = new Deque(ChromaticScaleValues);

function GetModes() {
	return {
        "Ionian (Major)": new Mode("Ionian (Major)", [2,2,1,2,2,2,1])
        , "Dorian": new Mode("Dorian", [2,1,2,2,2,1,2])
        , "Phrygian": new Mode("Phrygian", [1,2,2,2,1,2,2])
        , "Lydian": new Mode("Lydian", [2,2,2,1,2,2,1])
        , "Mixolydian": new Mode("Mixolydian", [2,2,1,2,2,1,2])
        , "Aeolian (Minor)": new Mode("Aeolian (Minor)", [2,1,2,2,1,2,2])
        , "Locrian": new Mode("Locrian", [1,2,2,1,2,2,2])
    };
}
var Modes = GetModes();

var ChromaticBaseNoteValues = ["C","D","E","F","G","A","B"];
var ChromaticBaseNotes = new Deque(ChromaticBaseNoteValues);

var Utils = {};
Utils.AlterSymbolFromValue = function(alterValue_) {
    var result;
    switch(alterValue_.toString()) {
        case "0":
            result = ""
            break;
        case "1":
            result = "#"
            break;
        case "2":
            result = "x"
            break;
        case "-1":
            result = "b"
            break;
        case "-2":
            result = "bb"
            break;
        default:
            throw new Error("Invalid Argument: alterValue_ '" + alterValue_ + "' not expected");
    }
    return result;
}
Utils.AlterValueFromSymbol = function(symbol_) {
    // if undefined or empty string then return 0.  I'm choosing not to worry about
    //   all the other possible falsy values.  That's out of scope for this small project
    if (!symbol_)
        return 0;
    
    var result;
    switch(symbol_) {
        case "#":
            result = 1;
            break;
        case "x":
        case "##":
            result = 2;
            break;
        case "b":
            result = -1;
            break;
        case "bb":
            result = -2;
            break;
        default:
            throw new Error("Invalid Argument: symbol_ '" + symbol_ + "' not expected");
    }
    return result;
}
Utils.LetterAndAlterToAlteredNote = function(letter_, alterValue_) {
    if (typeof alterValue_ === 'undefined') {
        alterValue_ = 0;
    }
    var alterSymbol = Utils.AlterSymbolFromValue(alterValue_);
    return letter_ + alterSymbol;
}
Utils.GetAlterValueFromAlteredNote = function(alteredNote_) {
    var result = 0;
    if (alteredNote_.length > 1) {
        result = Utils.AlterValueFromSymbol(alteredNote_.slice(1));
    }
    
    return result;
}
Utils.GetScaleDegreeFromKeyAndNote = function(key_, alteredNote_) {
    var baseLetter = alteredNote_[0];
    var tempDiatonicScale = key_.DiatonicScale.toArray();
    var i = 0;
    var foundNote = null;
    
    while ((foundNote === null) && (i < tempDiatonicScale.length)) {
        if (tempDiatonicScale[i].indexOf(baseLetter) != -1) {
            foundNote = tempDiatonicScale[i];
        }
        else {
            i = i + 1;
        }
    }
    
    if (foundNote === null) {
        throw new Error("note: '" + baseLetter + "' was not found");
    }
    
    var foundAlterValue = Utils.GetAlterValueFromAlteredNote(foundNote);
    var givenAlterValue = Utils.GetAlterValueFromAlteredNote(alteredNote_);
    var differenceAlterValue = givenAlterValue - foundAlterValue;
    var differenceAlterSymbol = Utils.AlterSymbolFromValue(differenceAlterValue);
    
    return (i + 1).toString() + differenceAlterSymbol;
}
Utils.DiatonicScaleFromTonicAndMode = function(tonic_, mode_) {
    var tempChromaticScale = Utils.ChromaticScaleFromTonic(tonic_);
    var tempChromaticBaseNotes = Utils.ChromaticBaseNotesFromTonic(tonic_);
    
    var tempDiatonicScale = new Deque();
    for (var i = 0; i < 7; i++) {
        tempDiatonicScale.push(
            Utils._findNoteFromBase(tempChromaticScale.peek(), tempChromaticBaseNotes.peek())
        );
        for (var j = 0; j < mode_.Pattern[i]; j++) {
            tempChromaticScale.push(tempChromaticScale.shift());
        }
        tempChromaticBaseNotes.push(tempChromaticBaseNotes.shift());
    }
    
    return tempDiatonicScale;
}
Utils.ChromaticScaleFromTonic = function(tonic_) {
    var i = 0;
    var found = false;
    
    var tempChromaticScale = new Deque(ChromaticScaleValues);
    while ((!found) && (i < tempChromaticScale.length)) {
        var notes = tempChromaticScale.peek();
        found = (notes.indexOf(tonic_) != -1);
        i = i + 1;
        
        if (!found) {
            //rotates one
            tempChromaticScale.push(tempChromaticScale.shift());
        }
    }
    
    return tempChromaticScale;
}
Utils.ChromaticBaseNotesFromTonic = function(tonic_) {
    var i = 0;
    var found = false;
    var tempChromaticBaseNotes = new Deque(ChromaticBaseNoteValues);
    while ((!found) && (i < tempChromaticBaseNotes.length)) {
        if (tempChromaticBaseNotes.peek() !== tonic_[0]) {
            tempChromaticBaseNotes.push(tempChromaticBaseNotes.shift());
        }
        i = i + 1;
    }
    
    return tempChromaticBaseNotes;
}
Utils._findNoteFromBase = function(listNotes_, baseLetter_) {
    var result = null;
    var found = null;
    var i = 0;
    while ((!found) && (i < listNotes_.length)) {
        found = (listNotes_[i][0] == baseLetter_);
        if (!found) {
            i = i + 1;
        }
    }
    
    if (found) {
        result = listNotes_[i];
    }
    
    return result;
}

function Mode(name_, pattern_) {
    this.Name = name_;
    this.Pattern = pattern_;
}
Mode.prototype.toString = function() {
    return "Name: " + this.Name + "\r\nPattern: " + this.Pattern;
}

function Key(tonic_, mode_) {
    this.Tonic = tonic_;
    this.Mode = mode_;
    this.DiatonicScale = Utils.DiatonicScaleFromTonicAndMode(tonic_, mode_);
}
Key.prototype.toString = function() {
    return "Tonic: " + this.Tonic
        + "\r\nMode.Name: " + this.Mode.Name
        + "\r\nMode.Pattern: " + this.Mode.Pattern;
}

module.exports.ChromaticScale = new Deque(ChromaticScaleValues);
module.exports.ChromaticBaseNotes = new Deque(ChromaticBaseNoteValues);
module.exports.Utils = Utils;
module.exports.Mode = Mode;
module.exports.Key = Key;
module.exports.Modes = Modes;
