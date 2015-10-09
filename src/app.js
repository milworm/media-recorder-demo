'use strict';

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
    }
}

var Recorder = (function () {
    function Recorder() {
        _classCallCheck(this, Recorder);

        chrome.runtime.onMessage.addListener(this.onExtensionEvent.bind(this));
    }

    _createClass(Recorder, [{
        key: 'onExtensionEvent',
        value: function onExtensionEvent(request) {
            if (request.action === 'pageActionClick') this.onPageActionClick();
        }
    }, {
        key: 'onPageActionClick',
        value: function onPageActionClick() {
            this[this.recording ? 'stop' : 'start']();
        }
    }, {
        key: 'start',
        value: function start() {
            chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], this.onChoseDesktopMedia.bind(this));
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.recorder.stop();

            var blob = new Blob(this.buffer, 'video/webm'),
                url = URL.createObjectURL(blob),
                a = document.createElement("a");

            document.body.appendChild(a);

            a.style.display = "none";
            a.href = url;
            a.download = "media-recorder-demo";
            a.click();

            window.location.href = url;
            URL.revokeObjectURL(url);
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
            }, onGetUserMedia, onGetUserMediaFailure);
        }
    }, {
        key: 'onGetUserMedia',
        value: function onGetUserMedia(stream) {
            this.buffer = [];
            this.recording = true;
            this.recorder = new MediaRecorder(stream, 'video/vp8');
            this.recorder.ondataavailable = this.onMediaRecorderDataAvaible.bind(this);
            this.recorder.onstop = this.onMediaRecorderStop.bind(this);
            this.recorder.start();

            console.log('recorder started');
        }
    }, {
        key: 'onGetUserMediaFailure',
        value: function onGetUserMediaFailure() {
            console.log('failure');
        }
    }, {
        key: 'onMediaRecorderStop',
        value: function onMediaRecorderStop() {
            this.recording = false;
            console.log('recorder stopped');
        }
    }, {
        key: 'onMediaRecorderDataAvaible',
        value: function onMediaRecorderDataAvaible(e) {
            this.buffer.push(e.data);
        }
    }]);

    return Recorder;
})();

new Recorder();