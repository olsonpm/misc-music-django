from django.conf.urls import patterns, include, url
from MusicMisc import view

urlpatterns = patterns('',
	url(r'ModifyMusicXML', view.modifyMusicXML, name='ModifyMusicXML')
    , url(r'^$', view.index, name='index')
)
