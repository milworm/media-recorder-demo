class Recorder {
    static instance() {
        return this.recorder = this.recorder || new this();
    }

    record(callback) {
        this.callback = callback;
        this[this.recording ? 'stop' : 'start']();
    }

    start() {
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], this.onChoseDesktopMedia.bind(this));
    }

    stop() {
        this.closeStreams();
    }

    closeStreams() {
        try {
            this.recorder.stream.getTracks().forEach(function(tack) {
                tack.stop();
            });
        } catch(e) {}

        // recorder could be inactive-state.
        try {
            this.recorder.stop();
        } catch(e) {}
    }

    onChoseDesktopMedia(id) {
        if (! id) 
            return; // user clicked cancel.

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

    onGetVideoStream(stream) {
        var recorder = new MediaRecorder(stream, 'video/vp8');

        this.buffer = [];
        this.recording = true;
        this.recorder = recorder;

        recorder.ondataavailable = this.onMediaRecorderDataAvaible.bind(this);
        recorder.start();
    }

    onGetVideoStreamFailure() {
        console.log('failied getting video stream.');
    }

    onMediaRecorderDataAvaible(e) {
        if(! e.data)
            return ;

        this.buffer.push(e.data);

        clearTimeout(this.onStopRecordingTimerId);
        this.onStopRecordingTimerId = setTimeout(this.onStopRecording.bind(this), 1000);
    }

    onStopRecording() {
        this.closeStreams();

        this.recorder = null;
        this.recording = false;

        var blob = new Blob(this.buffer, {
            type: "video/webm"
        });

        var reader = new FileReader(),
            callback = this.callback;

        reader.onload = function() {
            callback(reader.result);
        }

        reader.readAsDataURL(blob);

        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        //     chrome.tabs.sendMessage(tabs[0].id, {
        //         type: "ready", 
        //         buffer: buffer
        //     });
        // });
    }
}