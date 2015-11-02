"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AudioRecorder = (function () {
    function AudioRecorder() {
        _classCallCheck(this, AudioRecorder);
    }

    _createClass(AudioRecorder, [{
        key: "init",
        value: function init() {
            navigator.webkitGetUserMedia({
                audio: true
            }, this.onGetStreamSuccess.bind(this), this.onGetStreamFailure.bind(this));
        }
    }, {
        key: "stop",
        value: function stop() {
            this.recording = false;
            this.recorder.stop();
            this.recorder.exportWAV(function (wav) {
                console.log("exported wav");
                var url = window.webkitURL.createObjectURL(wav),
                    a = document.createElement("a");

                document.body.appendChild(a);
                a.style = "display:none";
                a.href = url;
                a.download = "audio.wav";
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    }, {
        key: "start",
        value: function start() {
            this.recording = true;
            this.recorder.record();
        }
    }, {
        key: "onGetStreamSuccess",
        value: function onGetStreamSuccess(mediaStream) {
            var context = new AudioContext(),
                source = context.createMediaStreamSource(mediaStream),
                recorder = new Recorder(source, {
                workerPath: chrome.extension.getURL("/bower_components/recorderjs/recorderWorker.js")
            });

            this.recording = true;
            this.recorder = recorder;
        }
    }, {
        key: "onGetStreamFailure",
        value: function onGetStreamFailure() {}
    }], [{
        key: "instance",
        value: function instance() {
            return this.recorder = this.recorder || new this();
        }
    }]);

    return AudioRecorder;
})();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case "init":
            {
                AudioRecorder.instance().init();
                break;
            }

        case "start":
            {
                AudioRecorder.instance().start();
                break;
            }

        case "stop":
            {
                AudioRecorder.instance().stop();
                break;
            }
    }

    sendResponse({});
});