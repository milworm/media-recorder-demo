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

    closeStream() {
        try {
            this.videoRecorder.stream.getTracks().forEach(function(tack) {
                tack.stop();
            });
        } catch(e) {}

        // recorder could be inactive-state.
        try {
            this.videoRecorder.stop();
        } catch(e) {}
    }

    onChoseDesktopMedia(id) {
        if (! id) 
            return; // user clicked cancel.

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            this.tabId = tabs[0].id;
            this.initStreams(id);
        }.bind(this));
    }

    initStreams(id) {
        Promise.all([
            this.initAudioStream(),
            this.initVideoStream(id)
        ]).then(
            this.onInitStreamsSuccess.bind(this), 
            this.onInitStreamFailure.bind(this)
        );
    }

    initAudioStream() {
        return new Promise(function(resolve, error) {
            chrome.tabs.sendMessage(this.tabId, {action: "init"}, resolve);
        }.bind(this));
    }

    initVideoStream(id) {
        var me = this;
        return new Promise(function(resolve, error) {
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
            }, function(stream) {
                debugger;
                me.videoStream = stream;
                resolve();
            }, function(errorObject) {
                error({
                    type: "video",
                    error: errorObject
                });
            });
        });
    }

    onInitStreamsSuccess(values) {
        this.init();

        this.videoRecorder.start();
        chrome.tabs.sendMessage(this.tabId, {action: "start"});
    }

    onInitStreamFailure() {
        console.log("initStreams failed");
    }

    init() {
        var recorder = new MediaRecorder(this.videoStream);

        this.videoBuffer = [];
        this.videoRecording = true;
        this.videoRecorder = recorder;

        recorder.ondataavailable = this.onVideoRecorderDataAvaible.bind(this);
    }

    onVideoRecorderDataAvaible(e) {
        if(! e.data)
            return ;

        this.videoBuffer.push(e.data);

        clearTimeout(this.onStopRecordingTimerId);
        this.onStopRecordingTimerId = setTimeout(this.onStopRecording.bind(this), 1000);
    }

    onStopRecording() {
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

        chrome.tabs.sendMessage(this.tabId, {action: "stop"});

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
}