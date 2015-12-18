'use strict';

function Recorder() {}
Recorder.prototype = {
    start: function start(callback) {
        this.recorder = null;
        this.buffer = [];

        this.getSource().then(this.initStreams.bind(this)).then(this.mergeStreams.bind(this)).then(this.record.bind(this)).then(this.cleanup.bind(this)).then(this.save.bind(this)).then(callback);
    },

    initStreams: function initStreams(sourceId) {
        return Promise.all([this.getVideoStream(sourceId), this.getAudioStream()]);
    },

    getVideoStream: function getVideoStream(sourceId) {
        return new Promise(function (resolve, error) {
            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        maxWidth: screen.width,
                        maxHeight: screen.height
                    }
                }
            }, resolve, error);
        });
    },

    getAudioStream: function getAudioStream() {
        return new Promise(function (resolve, error) {
            navigator.webkitGetUserMedia({
                audio: true,
                video: false
            }, resolve, error);
        });
    },

    mergeStreams: function mergeStreams(streams) {
        var video = streams[0],
            audio = streams[1];

        video.addTrack(audio.getTracks()[0]);
        return video;
    },

    getSource: function getSource() {
        return new Promise(function (resolve, reject) {
            chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], function (id) {
                resolve(id);
            });
        });
    },

    record: function record(stream) {
        var timerId,
            me = this;

        return new Promise(function (resolve, error) {
            var recorder = new MediaRecorder(stream);

            recorder.ondataavailable = function (e) {
                if (e.data) me.buffer.push(e.data);

                clearTimeout(timerId);
                timerId = setTimeout(resolve, 1000);
            };

            recorder.start();
            me.recorder = recorder;
        });
    },

    cleanup: function cleanup() {
        var stream = this.stream,
            recorder = this.recorder;

        return new Promise(function (resolve, reject) {
            recorder.stream.getTracks().forEach(function (track) {
                track.stop();
            });

            try {
                recorder.stop();
            } catch (e) {}

            resolve();
        });
    },

    save: function save() {
        var blob = new Blob(this.buffer, {
            type: "video/webm"
        });

        return new Promise(function (resolve, error) {
            var reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };

            reader.readAsDataURL(blob);
        });
    }
};

chrome.runtime.onMessageExternal.addListener(function (request, sender, callback) {
    new Recorder().start(callback);
    return true;
});