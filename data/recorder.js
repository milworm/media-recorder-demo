'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Recorder = (function () {
    function Recorder() {
        _classCallCheck(this, Recorder);
    }

    _createClass(Recorder, [{
        key: 'record',
        value: function record(callback) {
            this.callback = callback;
            this[this.recording ? 'stop' : 'start']();
        }
    }, {
        key: 'start',
        value: function start() {
            chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], this.onChoseDesktopMedia.bind(this));
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.closeStreams();
        }
    }, {
        key: 'closeStreams',
        value: function closeStreams() {
            try {
                this.recorder.stream.getTracks().forEach(function (tack) {
                    tack.stop();
                });
            } catch (e) {}

            // recorder could be inactive-state.
            try {
                this.recorder.stop();
            } catch (e) {}
        }
    }, {
        key: 'onChoseDesktopMedia',
        value: function onChoseDesktopMedia(id) {
            if (!id) return; // user clicked cancel.

            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: id,
                        maxWidth: screen.width,
                        maxHeight: screen.height
                    }
                }
            }, this.onGetVideoStream.bind(this), this.onGetVideoStreamFailure.bind(this));
        }
    }, {
        key: 'onGetVideoStream',
        value: function onGetVideoStream(stream) {
            var recorder = new MediaRecorder(stream, 'video/vp8');

            this.buffer = [];
            this.recording = true;
            this.recorder = recorder;

            recorder.ondataavailable = this.onMediaRecorderDataAvaible.bind(this);
            recorder.start();
        }
    }, {
        key: 'onGetVideoStreamFailure',
        value: function onGetVideoStreamFailure() {
            console.log('failied getting video stream.');
        }
    }, {
        key: 'onMediaRecorderDataAvaible',
        value: function onMediaRecorderDataAvaible(e) {
            if (!e.data) return;

            this.buffer.push(e.data);

            clearTimeout(this.onStopRecordingTimerId);
            this.onStopRecordingTimerId = setTimeout(this.onStopRecording.bind(this), 1000);
        }
    }, {
        key: 'onStopRecording',
        value: function onStopRecording() {
            this.closeStreams();

            this.recorder = null;
            this.recording = false;

            var blob = new Blob(this.buffer, {
                type: "video/webm"
            });

            var reader = new FileReader(),
                callback = this.callback;

            reader.onload = function () {
                callback(reader.result);
            };

            reader.readAsDataURL(blob);

            // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            //     chrome.tabs.sendMessage(tabs[0].id, {
            //         type: "ready",
            //         buffer: buffer
            //     });
            // });
        }
    }], [{
        key: 'instance',
        value: function instance() {
            return this.recorder = this.recorder || new this();
        }
    }]);

    return Recorder;
})();