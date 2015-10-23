// setTimeout(function() {
//     navigator.webkitGetUserMedia({
//         audio: true
//     }, function() {
//         console.log(arguments);
//     }, function() {
//         console.log(arguments);
//     });
// }, 2000);

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

        try {
            this.audioRecorder.stream.getTracks().forEach(function(tack) {
                tack.stop();
            });
        } catch(e) {}

        try {
            this.audioRecorder.stop();
        } catch(e) {}

        var blob = new Blob(this.audioBuffer, {
            type: "audio/ogg"
        });

        var url = URL.createObjectURL(blob),
            a = document.createElement("a");

        document.body.appendChild(a);
        a.style = "display:none";
        a.href = url;
        a.download = "audio.wav";
        a.click();
        URL.revokeObjectURL(url);

        delete this.audioRecorder;
    }

    start() {
        this.recording = true;
        this.audioRecorder.start();
    }

    onGetStreamSuccess(stream) {
        var recorder = new MediaRecorder(stream);

        this.audioBuffer = [];
        this.audioRecording = true;
        this.audioRecorder = recorder;

        recorder.ondataavailable = this.onAudioRecorderDataAvaible.bind(this);
    }

    onGetStreamFailure() {

    }

    onAudioRecorderDataAvaible(e) {
        debugger;
        if(! e.data)
            return ;

        this.audioBuffer.push(e.data);
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