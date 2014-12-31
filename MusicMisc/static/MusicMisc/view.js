'use strict';

var CS = require('./ChromaticScale');

var musicMisc = angular.module('musicMisc', []);

musicMisc.controller('MusicMiscController', function ($scope) {
      console.log('MusicMiscCtrl ran');
    })
    .directive('diatonicScale', function() {
        function linkFn(scope, element, attrs) {
            scope.modes = CS.Modes;
            
            scope.curMode = scope.modes['Ionian (Major)'];
            scope.tonic = "C";
            scope.diatonicScale = CS.Utils.DiatonicScaleFromTonicAndMode(scope.tonic, scope.curMode);
            
            scope.changeMode = function(mode){
                scope.curMode = mode;
            };
            
            scope.modifyScale = modifyScale;
            
            function modifyScale() {
                scope.diatonicScale = CS.Utils.DiatonicScaleFromTonicAndMode(scope.tonic, scope.curMode);
            };
        }
        
        return {
            restrict: 'E'
            , link: linkFn
            , templateUrl: 'static/MusicMisc/directives/DiatonicScale.html'
        }
    })
    .directive('musicXml', function() {
        function linkFn(scope, element, attrs) {
            scope.Fingerings = true;
            scope.RehearsalLetters = true;
            scope.ScaleDegrees = true;
            scope.StaffSpacing = true;
            
            scope.fileUploaded = function(file) {
                scope.file = file;
            }
            scope.submit = function() {
                // code found here:
                //   http://stackoverflow.com/a/23797348/984407
                var fname = (scope.file instanceof File)
                    ? scope.file.name
                    : '';
                
                console.log('Fingerings: ' + scope.Fingerings
                    + '\nRehearsal Letters: ' + scope.RehearsalLetters
                    + '\nScale Degrees: ' + scope.ScaleDegrees
                    + '\nStaff Spacing: ' + scope.StaffSpacing
                    + '\nFile Name: ' + fname);
                console.log('submitted!');
                
                var myFormData = new FormData();
                myFormData.append("Fingerings", scope.Fingerings);
                myFormData.append("RehearsalLetters", scope.RehearsalLetters);
                myFormData.append("ScaleDegrees", scope.ScaleDegrees);
                myFormData.append("StaffSpacing", scope.StaffSpacing);
                myFormData.append("File", scope.file);
                
                $.ajax({
                    type: "POST"
                    , url: "ModifyMusicXML"
                    , data: myFormData
                    , cache: false
                    , contentType: false
                    , processData: false
                    , success: function(response, status, xhr) {
                        var filename = "";
                        var disposition = xhr.getResponseHeader('Content-Disposition');
                        if (disposition && disposition.indexOf('attachment') !== -1) {
                            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                            var matches = filenameRegex.exec(disposition);
                            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                        }
                        
                        var type = xhr.getResponseHeader('Content-Type');
                        var blob = new Blob([response], { type: type });
                        
                        if (typeof window.navigator.msSaveBlob !== 'undefined') {
                            // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                            window.navigator.msSaveBlob(blob, filename);
                        } else {
                            var URL = window.URL || window.webkitURL;
                            var downloadUrl = URL.createObjectURL(blob);

                            if (filename) {
                                // use HTML5 a[download] attribute to specify filename
                                var a = document.createElement("a");
                                // safari doesn't support this yet
                                if (typeof a.download === 'undefined') {
                                    window.location = downloadUrl;
                                } else {
                                    a.href = downloadUrl;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                }
                            } else {
                                window.location = downloadUrl;
                            }

                            setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                        }
                    }
                    , error: function(jqXHR, textStatus, errorThrown) {
                        alert("Some error happened.  I'm probably not going to fix it.  Sorrray.\n\n" + errorThrown.toString());
                    }
                });
            }
        }
        
        return {
            restrict: 'E'
            , link: linkFn
            , templateUrl: 'static/MusicMisc/directives/MusicXML.html'
        };
});
