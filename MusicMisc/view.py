from django.shortcuts import render
from django.http import HttpResponse
from MusicMisc.modify_musicxml import MusicXML
import xml.etree.cElementTree as ET
import io
from django.core.servers.basehttp import FileWrapper

def modifyMusicXML(request):
    # gather data
    removeFingerings = request.POST["Fingerings"]
    removeRehearsalLetters = request.POST["RehearsalLetters"]
    insertScaleDegrees = request.POST["ScaleDegrees"]
    setStaffSpacing = request.POST["StaffSpacing"]
    myFile = ""
    myFileName = ""
    myFileContent_type = ""
    if ("File" in request.FILES):
        myFile = request.FILES["File"]
        myFileName = myFile.name
        myFileContent_type = myFile.content_type
        
    
    # log data
    print('Post data:\n  Fingerings: ' + removeFingerings + '\n  RehearsalLetters: ' + removeRehearsalLetters + '\n  ScaleDegrees: ' + insertScaleDegrees + '\n  StaffSpacing: ' + setStaffSpacing + '\n  File: ' + myFileName + '\n  content: ' + myFileContent_type)
    
    if (myFile):
        mxml = MusicXML(myFile)
        
        if (removeFingerings == "true"):
            mxml.RemoveAllFingerings()
        if (removeRehearsalLetters == "true"):
            mxml.RemoveAllRehearsalLetters()
        if (insertScaleDegrees == "true"):
            mxml.InsertScaleDegrees()
        if (setStaffSpacing == "true"):
            mxml.SetStaffSpacing()
        
        xmlbuffer = io.StringIO()
        mxml.WriteToFile(xmlbuffer)
        
        response = HttpResponse(content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="OutputMusicXML.xml"'
        response.write(xmlbuffer.getvalue())
        
        return response
    
def index(request):
    return render(request, 'MusicMisc/view.html')
