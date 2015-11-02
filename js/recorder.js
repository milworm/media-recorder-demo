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
        key: 'closeStream',
        value: function closeStream() {
            try {
                this.videoRecorder.stream.getTracks().forEach(function (tack) {
                    tack.stop();
                });
            } catch (e) {}

            // recorder could be inactive-state.
            try {
                this.videoRecorder.stop();
            } catch (e) {}
        }
    }, {
        key: 'onChoseDesktopMedia',
        value: function onChoseDesktopMedia(id) {
            if (!id) return; // user clicked cancel.

            chrome.tabs.query({ active: true, currentWindow: true }, (function (tabs) {
                this.tabId = tabs[0].id;
                this.initStreams(id);
            }).bind(this));
        }
    }, {
        key: 'initStreams',
        value: function initStreams(id) {
            Promise.all([
            // this.initAudioStream(),
            this.initVideoStream(id)]).then(this.onInitStreamsSuccess.bind(this), this.onInitStreamFailure.bind(this));
        }
    }, {
        key: 'initAudioStream',
        value: function initAudioStream() {
            return new Promise((function (resolve, error) {
                chrome.tabs.sendMessage(this.tabId, { action: "init" }, resolve);
            }).bind(this));
        }
    }, {
        key: 'initVideoStream',
        value: function initVideoStream(id) {
            var me = this;
            return new Promise(function (resolve, error) {
                navigator.webkitGetUserMedia({
                    audio: { mandatory: { chromeMediaSource: 'system' } },
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: id,
                            maxWidth: screen.width,
                            maxHeight: screen.height
                        }
                    }
                }, function (stream) {
                    debugger;
                    me.videoStream = stream;
                    resolve();
                }, function (errorObject) {
                    debugger;
                    error({
                        type: "video",
                        error: errorObject
                    });
                });
            });
        }
    }, {
        key: 'onInitStreamsSuccess',
        value: function onInitStreamsSuccess(values) {
            this.init();

            this.startVideoRecording();
            // this.startAudioRecording();
        }
    }, {
        key: 'onInitStreamFailure',
        value: function onInitStreamFailure() {
            console.log("initStreams failed");
        }
    }, {
        key: 'startVideoRecording',
        value: function startVideoRecording() {
            this.videoRecorder.start();
        }
    }, {
        key: 'startAudioRecording',
        value: function startAudioRecording() {
            chrome.tabs.sendMessage(this.tabId, {
                action: "start"
            });
        }
    }, {
        key: 'init',
        value: function init() {
            var recorder = new MediaRecorder(this.videoStream);

            this.videoBuffer = [];
            this.videoRecording = true;
            this.videoRecorder = recorder;

            recorder.ondataavailable = this.onVideoRecorderDataAvaible.bind(this);
        }
    }, {
        key: 'onVideoRecorderDataAvaible',
        value: function onVideoRecorderDataAvaible(e) {
            if (!e.data) return;

            this.videoBuffer.push(e.data);

            clearTimeout(this.onStopRecordingTimerId);
            this.onStopRecordingTimerId = setTimeout(this.onStopRecording.bind(this), 1000);
        }
    }, {
        key: 'onStopRecording',
        value: function onStopRecording() {
            this.closeStream();

            var buffer = this.videoBuffer;

            this.videoRecorder = null;
            this.recording = false;

            var blob = new Blob(buffer, {
                type: "video/webm"
            });

            var url = URL.createObjectURL(blob),
                a = document.createElement("a");

            document.body.appendChild(a);
            a.style = "display:none";
            a.href = url;
            a.download = "video.webm";
            a.click();
            URL.revokeObjectURL(url);

            chrome.tabs.sendMessage(this.tabId, { action: "stop" });

            // var reader = new FileReader(),
            //     callback = this.callback;

            // reader.onload = function() {
            //     callback(reader.result);
            // }

            // reader.readAsDataURL(blob);

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