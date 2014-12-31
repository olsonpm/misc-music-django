from collections import deque

ChromaticScale = deque([
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
])

ChromaticBaseNotes = deque("CDEFGAB")

class Utils:
	@staticmethod
	def AlterSymbolFromValue(alterValue_):
		return {
			"0":""
			, "1":"#"
			, "2":"x"
			, "-1":"b"
			, "-2":"bb"
		}[str(alterValue_)]

	@staticmethod
	def AlterValueFromSymbol(symbol_):
		return {
			"#": 1
			, "x": 2
			, "b": -1
			, "bb": -2
		}.get(symbol_, 0)
		
	@staticmethod
	def LetterAndAlterToAlteredNote(letter_, alterValue_ = 0):
		alterValue_ = str(alterValue_)
		alterSymbol = Utils.AlterSymbolFromValue(alterValue_)
			
		return letter_ + alterSymbol
		
	@staticmethod
	def GetAlterValueFromAlteredNote(alteredNote_):
		result = 0
		if (len(alteredNote_) > 1):
			result = Utils.AlterValueFromSymbol(alteredNote_[1:])
		
		return result
		
	@staticmethod
	def GetScaleDegreeFromKeyAndNote(key_, alteredNote_):
		baseLetter = alteredNote_[0]
		tempDiatonicScale = deque(key_.DiatonicScale)
		i = 0
		foundNote = None
		while ((foundNote is None) and (i < len(tempDiatonicScale))):
			if (baseLetter in tempDiatonicScale[i]):
				foundNote = tempDiatonicScale[i]
			else:
				i = i + 1
		
		foundAlterValue = Utils.GetAlterValueFromAlteredNote(foundNote)
		givenAlterValue = Utils.GetAlterValueFromAlteredNote(alteredNote_)
		differenceAlterValue = givenAlterValue - foundAlterValue
		differenceAlterSymbol = Utils.AlterSymbolFromValue(differenceAlterValue)
		
		return str(i+1) + differenceAlterSymbol

	@staticmethod
	def _findNoteFromBase(listNotes, baseLetter):
		result = None
		found = False
		i = 0
		while ((not found) and (i < len(listNotes))):
			found = (listNotes[i][0] == baseLetter)
			if (not found):
				i = i + 1
		
		if (found):
			result = listNotes[i]
		
		return result
				
class Mode:
	def __init__(self, name_, pattern_):
		self.Name = name_
		self.Pattern = pattern_

Modes = {
	"Ionian": Mode("Ionian", [2,2,1,2,2,2,1])
	, "Dorian": Mode("Dorian", [2,1,2,2,2,1,2])
	, "Phrygian": Mode("Phrygian", [1,2,2,2,1,2,2])
	, "Lydian": Mode("Lydian", [2,2,2,1,2,2,1])
	, "Mixolydian": Mode("Mixolydian", [2,2,1,2,2,1,2])
	, "Aeolian": Mode("Aeolian", [2,1,2,2,1,2,2])
	, "Locrian": Mode("Locrian", [1,2,2,1,2,2,2])
	, "Phil": Mode("Phil", [2,2,1,2,1,2,2])
}

#Mode Aliases
Modes["Major"] = Mode("Major", Modes["Ionian"].Pattern)
Modes["Minor"] = Mode("Minor", Modes["Aeolian"].Pattern)
Modes["MajorPhil"] = Mode("MajorPhil", Modes["Phil"].Pattern)

class Key:
	def __init__(self, tonic_, mode_):
		self.Tonic = tonic_
		self.Mode = mode_
		self.DiatonicScale = self._initDiatonicScale()
		
	def __str__(self):
		return "Tonic: {0}" \
			"\r\nMode.Name: {1}" \
			"\r\nMode.Pattern: {2}" \
			"\r\nDiatonicScale: {3}".format(
				self.Tonic
				, self.Mode.Name
				, self.Mode.Pattern
				, self.DiatonicScale)

	def _initDiatonicScale(self):
		tempChromaticScale = self._initChromaticScale()
		tempChromaticBaseNotes = self._initChromaticBaseNotes()
		DiatonicScale = deque()
		for i in range(0, 7):
			DiatonicScale.append(Utils._findNoteFromBase(tempChromaticScale[0], tempChromaticBaseNotes[0]))
			tempChromaticScale.rotate(-(self.Mode.Pattern[i]))
			tempChromaticBaseNotes.rotate(-1)
			
		return DiatonicScale
		
	def _initChromaticScale(self):
		i = 0
		found = False
		tempChromaticScale = deque(ChromaticScale)
		while ((not found) and (i < len(tempChromaticScale))):
			notes = tempChromaticScale[0]
			found = (self.Tonic in notes)
			i = i + 1
			
			if (not found):
				tempChromaticScale.rotate(-1)
		
		return tempChromaticScale

	def _initChromaticBaseNotes(self):
		i = 0
		found = False
		tempChromaticBaseNotes = deque(ChromaticBaseNotes)
		while ((not found) and (i < len(tempChromaticBaseNotes))):
			if (tempChromaticBaseNotes[0] != self.Tonic[0]):
				tempChromaticBaseNotes.rotate(-1)
			i = i + 1
		
		return tempChromaticBaseNotes