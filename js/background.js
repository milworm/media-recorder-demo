'use strict';

var FsHelper = new function () {
    var fs;

    this.readFileAsDataUrl = function (fileName) {
        return new Promise(function (resolve, error) {
            if (fs) return;

            window.webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024 * 100, function (fileSystem) {
                resolve(fs = fileSystem);
            });
        }).then(function () {
            return new Promise(function (resolve, error) {
                fs.root.getFile(fileName, {}, resolve);
            });
        }).then(function (fileEntry) {
            return new Promise(function (resolve, error) {
                fileEntry.file(resolve, error);
            });
        }).then(function (file) {
            return new Promise(function (resolve, error) {
                var reader = new FileReader();
                reader.onloadend = function () {
                    resolve(reader.result);
                };
                reader.readAsDataURL(file);
            });
        });
    };
}();

function startRecording(callback) {
    var screenId, getVideoStream, getAudioStream, videoEncoder, streams;

    getVideoStream = function () {
        return new Promise(function (resolve, error) {
            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: screenId,
                        maxWidth: screen.width,
                        maxHeight: screen.height
                    }
                }
            }, resolve, error);
        });
    };

    getAudioStream = function () {
        return new Promise(function (resolve, error) {
            navigator.webkitGetUserMedia({
                audio: true
            }, resolve, error);
        });
    };

    return new Promise(function (resolve, reject) {
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], resolve);
    }).then(function (id) {
        screenId = id;

        return Promise.all([getVideoStream(), getAudioStream()]);
    }).then(function (config) {
        streams = {
            video: config[0],
            audio: config[1]
        };
    }).then(function () {
        return new Promise(function (resolve, error) {
            videoEncoder = document.createElement("embed");

            videoEncoder.setAttribute("width", 0);
            videoEncoder.setAttribute("height", 0);
            videoEncoder.setAttribute("src", "/nacl/manifest.nmf");
            videoEncoder.setAttribute("ps_tty_prefix", "ps:");
            videoEncoder.setAttribute("ps_stdout", "/dev/tty");
            videoEncoder.setAttribute("ps_stderr", "/dev/tty");
            videoEncoder.setAttribute("type", "application/x-nacl");

            videoEncoder.addEventListener("load", resolve);

            videoEncoder.addEventListener("message", function () {
                console.log(arguments);
            });

            videoEncoder.addEventListener("crash", function () {
                console.log(arguments);
            });

            // Request the offsetTop property to force a relayout. As of Apr 10, 2014
            // this is needed if the module is being loaded on a Chrome App's
            // background page (see crbug.com/350445).
            document.body.appendChild(videoEncoder);
            videoEncoder.offsetTop;
        });
    }).then(function () {
        videoEncoder.postMessage({
            type: "start",
            data: {
                filename: "/html5_persistent/output.webm",
                chromeVersion: 46,
                videoTrack: streams.video.getVideoTracks()[0],
                audioTrack: streams.audio.getAudioTracks()[0]
            }
        });

        return new Promise(function (resolve, error) {
            streams.video.onended = resolve;
        });
    }).then(function () {
        videoEncoder.postMessage({
            type: "stop",
            data: {}
        });
    }).then(function () {
        [streams.video, streams.audio].forEach(function (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        });
    }).then(function () {
        return FsHelper.readFileAsDataUrl("output.webm");
    }).then(callback);
}

chrome.runtime.onMessageExternal.addListener(function (request, sender, callback) {
    startRecording(callback);
    return true;
});