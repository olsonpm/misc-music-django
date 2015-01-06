import xml.etree.cElementTree as ET
from queue import Queue
import os
import MusicMisc.ChromaticScale as CS

class MusicXML:
    def __init__(self, input):
        self.Tree = ET.parse(input)
        self.Root = self.Tree.getroot()

    def RemoveAllFingerings(self):
        MusicXML._removeAllFingerings(self.Root.findall('part/measure/note/notations/technical/fingering/../../..'))
    
    def RemoveAllRehearsalLetters(self):
        MusicXML._removeAllRehearsalLetters(self.Root.findall('part/measure/direction/direction-type/rehearsal/../../..'))
    
    # unsure of integer measurement
    def SetStaffSpacing(self, integer = 140):
        MusicXML._setStaffSpacing(self.Root.findall('part/measure/print/system-layout/system-distance'), integer)
    
    def InsertScaleDegrees(self):
        harmony = None
        for measure in self.Root.find('part').findall('measure'):
            tmpHarmony = measure.find('harmony')
            if (tmpHarmony is None and harmony is None):
                continue
            elif (tmpHarmony is not None):
                harmony = tmpHarmony
                
            harmonyKey = MusicXML._getHarmonyKeyFromHarmony(harmony)
            
            # iterate through notes and harmony
            for measureChild in list(measure):
                if (measureChild.tag not in ('harmony', 'note')):
                    continue
            
                if (measureChild.tag == 'note'):
                    MusicXML._insertScaleDegree(measure, measureChild, harmonyKey)
                elif (measureChild.tag == 'harmony'):
                    harmonyKey = MusicXML._getHarmonyKeyFromHarmony(measureChild)

    def WriteToFile(self, outFile):
        initXML = '''<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 2.0 Partwise//EN"
                                    "http://www.musicxml.org/dtds/partwise.dtd">\n'''
        
        if (isinstance(outFile, str)):
            with open(outFile, 'w') as f:
                f.write(initXML)
            
            with open(outFile, 'ab') as f:
                self.Tree.write(f, 'utf-8')
                
            print('wow?')
                
        else: # is file
            outFile.write(initXML)
            self.Tree.write(outFile, 'unicode')
            #outFile.seek(0)
    
    @staticmethod
    def _setStaffSpacing(systemDistances, integer):
        for systemDistance in systemDistances:
            systemDistance.text = str(integer)
    
    @staticmethod
    def _insertScaleDegree(measure, note, harmonyKey):
        noteLetter = note.findtext('pitch/step')
        if (noteLetter is None):
            return
        
        # init new element
        direction = ET.Element('direction', {
            "placement":"below"
        })
        directionType = ET.Element('direction-type')
        words = ET.Element('words', {
            "default-y":"-84"
        })
        
        noteAlter = "0"
        if (note.find('pitch/alter') is not None):
            noteAlter = note.findtext('pitch/alter')
            
        alteredNote = CS.Utils.LetterAndAlterToAlteredNote(noteLetter, noteAlter)
        scaleDegree = CS.Utils.GetScaleDegreeFromKeyAndNote(harmonyKey, alteredNote)
        words.text = scaleDegree
        
        # insert the new element
        directionType.append(words)
        direction.append(directionType)
        measure.insert(list(measure).index(note), direction)
    
    @staticmethod
    def _getHarmonyKeyFromHarmony(harmony):
        harmonyRoot = harmony.findtext('root/root-step')    
        harmonyAlter = harmony.findtext('root/root-alter')
        if (harmonyAlter is None):
            harmonyAlter = "0"
            
        tonic = CS.Utils.LetterAndAlterToAlteredNote(harmonyRoot, harmonyAlter)
        return CS.Key(tonic, CS.Modes["Major"])
    
    @staticmethod
    def _removeAllFingerings(notesWithFingerings):
        for note in notesWithFingerings:
            fifo = Queue()
            fifo.put(note)
            fifo.put(fifo.queue[0].find('notations'))
            fifo.put(fifo.queue[1].find('technical[fingering]'))
            fifo.put(fifo.queue[2].find('fingering'))
            _removeElementRecursive(fifo)
            
    @staticmethod
    def _removeAllRehearsalLetters(measures):
        for measure in measures:
            fifo = Queue()
            fifo.put(measure)
            fifo.put(fifo.queue[0].find('direction'))
            fifo.put(fifo.queue[1].find('direction-type[rehearsal]'))
            fifo.put(fifo.queue[2].find('rehearsal'))
            _removeElementRecursive(fifo)
            

# Belongs in an xml utils library, but putting this here for now
def _removeElementRecursive(fifo):
    if (fifo.qsize() > 2):
        parent = fifo.get()
        child = _removeElementRecursive(fifo)
        if (len(list(child)) == 0):
            parent.remove(child)
    else:
        parent = fifo.get()
        child = fifo.get()
        parent.remove(child)
        
    return parent
