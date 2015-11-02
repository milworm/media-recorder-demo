class AudioRecorder {
    static instance() {
        return this.recorder = this.recorder || new this();
    }

    init() {
        navigator.webkitGetUserMedia({
            audio: true
        }, this.onGetStreamSuccess.bind(this), this.onGetStreamFailure.bind(this));
    }

    stop() {
        this.recording = false;
        this.recorder.stop();
        this.recorder.exportWAV(function(wav) {
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

    start() {
        this.recording = true;
        this.recorder.record();
    }

    onGetStreamSuccess(mediaStream) {
        var context = new AudioContext(),
            source = context.createMediaStreamSource(mediaStream),
            recorder = new Recorder(source, {
                workerPath: chrome.extension.getURL("/bower_components/recorderjs/recorderWorker.js")
            });

        this.recording = true;
        this.recorder = recorder;
    }

    onGetStreamFailure() {

    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action) {
        case "init": {
            AudioRecorder.instance().init();
            break;
        }

        case "start": {
            AudioRecorder.instance().start();
            break;
        }

        case "stop": {
            AudioRecorder.instance().stop();
            break;
        }
    }

    sendResponse({});
});