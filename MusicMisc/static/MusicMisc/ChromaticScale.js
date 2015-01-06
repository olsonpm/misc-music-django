'use strict';

var Deque = require("collections/deque");
require("collections/shim-array");

var concertA = 440;

function GetNewChromaticScale() {
    return new Deque([[new Note("B#"), new Note("C")]
    , [new Note("B##"), new Note("C#"), new Note("Db")]
    , [new Note("C##"), new Note("D"), new Note("Ebb")]
    , [new Note("D#"), new Note("Eb"), new Note("Fbb")]
    , [new Note("D##"), new Note("E"), new Note("Fb")]
    , [new Note("E#"), new Note("F"), new Note("Gbb")]
    , [new Note("E##"), new Note("F#"), new Note("Gb")]
    , [new Note("F##"), new Note("G"), new Note("Abb")]
    , [new Note("G#"), new Note("Ab")]
    , [new Note("G##"), new Note("A"), new Note("Bbb")]
    , [new Note("A#"), new Note("Bb"), new Note("Cbb")]
    , [new Note("A##"), new Note("B"), new Note("Cb")]]);
}

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

function GetChromaticBaseNoteValues() {
	return ["C","D","E","F","G","A","B"];
}
var ChromaticBaseNotes = new Deque(GetChromaticBaseNoteValues());

var Utils = {};
Utils.GetModePatternFromDiatonicScale = function(diatonicScale_) {
    var result = [];
    
    var tempChromaticScale = Utils.ChromaticScaleFromTonic(diatonicScale_.peek());
    var tempDiatonicScale = new Deque(diatonicScale_);
    tempDiatonicScale.push(tempDiatonicScale.shift());
    tempChromaticScale.push(tempChromaticScale.shift());
    var stepValue = 0;
    while (result.length < 7) {
        stepValue += 1;
        if (tempChromaticScale.peek().has(tempDiatonicScale.peek(), function(left, right) { return left.equals(right); })) {
            result.push(stepValue);
            stepValue = 0;
            tempDiatonicScale.shift();
        }
        tempChromaticScale.shift();
    }
    
    return result;
}
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
    if (alteredNote_.Name.length > 1) {
        result = Utils.AlterValueFromSymbol(alteredNote_.Name.slice(1));
    }
    
    return result;
}
Utils.GetScaleDegreeFromKeyAndNote = function(key_, alteredNote_) {
    var baseLetter = alteredNote_.Name[0];
    var tempDiatonicScale = key_.DiatonicScale.toArray();
    var i = 0;
    var foundNote = null;
    
    while ((foundNote === null) && (i < tempDiatonicScale.length)) {
        if (tempDiatonicScale[i].Name[0] === baseLetter) {
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
	var tempTonicNote = new Note(tonic_);
    var tempChromaticScale = Utils.ChromaticScaleFromTonic(tempTonicNote);
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
    
    var tempChromaticScale = new Deque(GetNewChromaticScale());
    while ((!found) && (i < tempChromaticScale.length)) {
        var notes = tempChromaticScale.peek();
        found = notes.has(tonic_, function(left, right) {
			return left.equals(right);
		});
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
    var tempChromaticBaseNotes = new Deque(GetChromaticBaseNoteValues());
    while ((!found) && (i < tempChromaticBaseNotes.length)) {
        if (tempChromaticBaseNotes.peek() !== tonic_[0]) {
            tempChromaticBaseNotes.push(tempChromaticBaseNotes.shift());
        }
        i = i + 1;
    }
    
    return tempChromaticBaseNotes;
}
Utils.AttachFrequenciesToDiatonicScale = function(diatonicScale_) {
    var tempDiatonicScaleArray = diatonicScale_.toArray();
    
    var found = false;
    var i = 0;
    // find note beginning with A.  This will be the frequency reference point
    //   with 440 hertz representing 'A'
    while (!found && i < tempDiatonicScaleArray.length) {
        found = (tempDiatonicScaleArray[i].Name[0] == 'A');
        if (!found) {
            i = i + 1;
        }
    }

    var curMode = Utils.GetModePatternFromDiatonicScale(diatonicScale_);
    // make sure to account for half step offsets from A (our scale might have A# or Abb instead of A)
    var halfStepCount = tempDiatonicScaleArray.length > 1
        ? Utils.AlterValueFromSymbol(tempDiatonicScaleArray[i].Name.slice(1))
        : 0;
    // set halfStepCounter equal to the number of half steps away from concert A.
    for (var j = 0; j < i; j++) {
        halfStepCount -= curMode[j];
    }
    
    for (var j = 0; j < tempDiatonicScaleArray.length; j++) {
        tempDiatonicScaleArray[j].frequency = 440 * Math.pow(2, halfStepCount/12);
        halfStepCount += curMode[j];
    }
    
    return diatonicScale_;
}
Utils.AttachPlayNoteToDiatonicScale = function(diatonicScale, playLengthSeconds) {
    var transitionStartTime = 0.01;
    var transitionEndTime = 0.1;
    var gainValue = 0.2;

    diatonicScale.forEach(function(note) {
        note.playNote = function(curNote, audioCtx){
            var oscillator = audioCtx.createOscillator();
            var gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.value = 0;
            oscillator.start(0);
            gainNode.gain.linearRampToValueAtTime(gainNode.gain.value, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + transitionStartTime);
            oscillator.frequency.value = curNote.frequency;
            oscillator.type = 'sine';
            $('.diatonic-scale').children('li').each(function() {
				if ($(this).text().trim() === curNote.Name) {
					$(this).addClass('active');
				}
			});
            
            setTimeout(function(curNote_, gainNode_, audioCtx_){ 
                gainNode_.gain.linearRampToValueAtTime(gainNode_.gain.value, audioCtx_.currentTime);
                gainNode_.gain.linearRampToValueAtTime(0, audioCtx_.currentTime + transitionEndTime);
                
				$('.diatonic-scale').children('li').each(function() {
					if ($(this).text().trim() === curNote.Name) {
						$(this).removeClass('active');
					}
				});
            }, (playLengthSeconds * 1000) + (transitionStartTime * 1000), curNote, gainNode, audioCtx);
        };
    });
}
Utils._findNoteFromBase = function(listNotes_, baseLetter_) {
    var result = null;
    var found = null;
    var i = 0;
    while ((!found) && (i < listNotes_.length)) {
        found = (listNotes_[i].Name[0] === baseLetter_);
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
    return "Mode\n  Name: " + this.Name + "\n  Pattern: " + this.Pattern;
}

function Key(tonic_, mode_) {
    this.Tonic = tonic_;
    this.Mode = mode_;
    this.DiatonicScale = Utils.DiatonicScaleFromTonicAndMode(tonic_, mode_);
}
Key.prototype.toString = function() {
    return "Key\n  Tonic: " + this.Tonic
        + "\n  Mode.Name: " + this.Mode.Name
        + "\n  Mode.Pattern: " + this.Mode.Pattern;
}

function Note(name_) {
    this.Name = name_;
}
Note.prototype.toString = function() {
	return 'Note\n  Name: ' + this.Name;
}
Note.prototype.equals = function(otherNote) {
	return (this.Name === otherNote.Name);
}

module.exports.GetNewChromaticScale = GetNewChromaticScale;
module.exports.ChromaticBaseNotes = new Deque(GetChromaticBaseNoteValues());
module.exports.Utils = Utils;
module.exports.Mode = Mode;
module.exports.Key = Key;
module.exports.Modes = Modes;
module.exports.Note = Note;
