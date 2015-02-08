'use strict';

var CS = require('./ChromaticScale');

var musicMisc = angular.module('musicMisc', []);

musicMisc.directive('diatonicScale', function() {
        function linkFn(scope, element, attrs) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            window.ctx = new window.AudioContext();

            var tmpModes = [];
            tmpModes.push(CS.Modes['Ionian (Major)']);
            tmpModes.push(CS.Modes['Dorian']);
            tmpModes.push(CS.Modes['Phrygian']);
            tmpModes.push(CS.Modes['Lydian']);
            tmpModes.push(CS.Modes['Mixolydian']);
            tmpModes.push(CS.Modes['Aeolian (Minor)']);
            tmpModes.push(CS.Modes['Locrian']);
            scope.modes = tmpModes;
            scope.customModeName = "";
            scope.customModePattern = "";
            scope.customModeErrors = [];
            scope.customModeSuccess = "";

            scope.curMode = scope.modes[0];
            scope.tonic = "C";
            scope.diatonicScale = [];
            var tmpScale = CS.Utils.DiatonicScaleFromTonicAndMode(scope.tonic, scope.curMode);
            tmpScale.toArray().forEach(function(el) {
                scope.diatonicScale.push(el);
            });

            CS.Utils.AttachFrequenciesToDiatonicScale(scope.diatonicScale);

            $('#add-custom-mode').keydown(function(event) {
                if (event.keyCode == 13) {
                    $('#add-custom-mode .submit').click();
                }
                if (event.keyCode == 27) {
                    $.fancybox.close();
                }
            })

            $('diatonic-scale .fancyboxd, diatonic-scale .fancybox-trigger').fancybox({
                autoSize: false, autoHeight: true
            });
            element.find('.glyphicon-question-sign').click(function() {
                $('diatonic-scale .fancyboxd.info').click();
            });

            scope.changeMode = function(mode) {
                scope.curMode = mode;
            };

            scope.modifyScale = modifyScale;

            function modifyScale() {
                scope.diatonicScale = CS.Utils.DiatonicScaleFromTonicAndMode(scope.tonic, scope.curMode);
            };

            scope.addCustomMode = function() {
                if (verifyCustomMode()) {
                    scope.modes.push(new CS.Mode(scope.customModeName, scope.customModePattern));

                    scope.customModeSuccess = "'" + scope.customModeName + "' has been successfully added.";

                    // reset fields
                    scope.customModeName = "";
                    scope.customModePattern = "";
                    scope.customModeErrors = [];
                }
            }

            $('#custom-mode-pattern').keypress(function(evt) {
                var charCode = (evt.which) ? evt.which : event.keyCode;
                var enable1 = true;
                var enable2 = true;

                // if the text in the box is selected, then don't disable input
                if (window.getSelection().type !== "Range"
                    || (window.getSelection().type === "Range"
                        && window.getSelection().anchorNode.getElementsByTagName('input')[0] != $('#custom-mode-pattern').get(0))) {
                    enable1 = ($('#custom-mode-pattern').val().replace(/2/g, '').length < 2);
                    enable2 = ($('#custom-mode-pattern').val().replace(/1/g, '').length < 5);
                }

                return (
                    (charCode == 49 && enable1)
                    || (charCode == 50 && enable2)
                );
            });

            function verifyCustomMode() {
                scope.customModeErrors = [];
                var result = true;
                if (scope.customModePattern.length != 7) {
                    result = false;
                    scope.customModeErrors.push("Pattern must contain two half steps and 5 whole steps.");
                }

                if (scope.customModeName.length == 0 || /^\s+$/.test(scope.customModeName)) {
                    result = false;
                    scope.customModeErrors.push("Name must not be empty nor contain only white space characters");
                }

                if (!result) {
                    scope.customModeSuccess = "";
                }

                return result;
            }

            scope.playScale = function() {
                var playSecondsCounter = 0;
                var playLengthSeconds = 0.5;
                var transitionTime = 0.16;

                CS.Utils.AttachFrequenciesToDiatonicScale(scope.diatonicScale);
                CS.Utils.AttachPlayNoteToDiatonicScale(scope.diatonicScale, playLengthSeconds);

                scope.diatonicScale.forEach(function(note) {
                    setTimeout(function(note_) {
                        note_.playNote(note_, ctx);
                    }, (playSecondsCounter) * 1000, note);
                    playSecondsCounter += playLengthSeconds + transitionTime;
                });
            }
        }

        return {
            restrict: 'E'
            , link: linkFn
            , templateUrl: 'static/MusicMisc/directives/DiatonicScale.html'
        }
    })
    .directive('musicXml', function() {
        function linkFn(scope, element, attrs) {
            $('.fancybox').fancybox({
                autoSize: false
            });

            $('music-xml .fancyboxd, diatonic-scale .fancybox-trigger').fancybox({
                autoSize: false, autoHeight: true
            });
            element.find('.glyphicon-question-sign').click(function() {
                $('music-xml .fancyboxd.info').click();
            });

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
                            var blob = new Blob([response], {
                                type: type
                            });

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

                                setTimeout(function() {
                                    URL.revokeObjectURL(downloadUrl);
                                }, 100); // cleanup
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
