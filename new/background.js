FileSaver = new function() {
    var getFile,
        writeToFile,
        removeFile,
        fs;

    getFile = function(fileName) {
        var directlyEntry;
        return new Promise(function(resolve, error) {
            fs.root.getDirectory("/tmp", {create: true}, resolve);
        }).then(function(dir) {
            directlyEntry = dir;
            return removeFile(fileName);
        }).then(function() {
            return new Promise(function(resolve, error) {
                directlyEntry.getFile(fileName, {create: true}, resolve);
            });
        });
    }

    removeFile = function(fileName) {
        var directlyEntry;

        return new Promise(function(resolve, error) {
            fs.root.getDirectory("/tmp", {create: true}, resolve);
        }).then(function(dir) {
            directlyEntry = dir;
            return new Promise(function(resolve, error) {
                directlyEntry.getFile(fileName, {create: true}, resolve);
            });
        }).then(function(fileEntry) {
            return new Promise(function(resolve, error) {
                fileEntry.remove(resolve);
            });
        });
    }

    writeToFile = function(fsFile, blob) {
        return new Promise(function(resolve, error) {
            fsFile.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function() {
                    resolve();
                }

                fileWriter.write(blob);
            });
        });
    }

    this.save = function(files) {
        return new Promise(function(resolve, error) {
            window.webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024 * 100, function(fileSystem) {
                resolve(fs = fileSystem);
            });
        }).then(function() {
            return removeFile("output.webm");
        }).then(function() {
            console.log("fs opened");
            var items = [];

            for(var i=0,file; file=files[i]; i++)
                items.push(getFile(file.name));

            return Promise.all(items);
        }).then(function(fsFiles) {
            console.log("fs files initialized");
            var items = [];

            for(var i=0, file; file=files[i]; i++)
                items.push(writeToFile(fsFiles[i], file.data))

            Promise.all(items);
        }).then(function() {
            console.log("fs files saved");
        });
    }

    this.readFile = function(fileName) {
        var directlyEntry;
        return new Promise(function(resolve, error) {
            fs.root.getDirectory("/tmp", {create: true}, resolve);
        }).then(function(dir) {
            directlyEntry = dir;
            return new Promise(function(resolve, error) {
                directlyEntry.getFile(fileName, {}, resolve);
            });
        });
    };

    this.createDir = function(dirName) {
        return new Promise(function(resolve) {
            window.webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024 * 100, function(fileSystem) {
                resolve(fs = fileSystem);
            });
        }).then(function() {
            return new Promise(function(resolve, error) {
                fs.root.getDirectory(dirName, {create: true}, resolve);
            });
        });
    }
}

function startRecording(callback) {
    var screenId,
        tabId,
        audioRecorder,
        videoRecorder,
        videoBuffer = [],
        getVideoStream,
        getAudioStream,
        loadModule,
        videoEncoder,
        streams;

    getVideoStream = function() {
        return new Promise(function(resolve, error) {
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
    }

    getAudioStream = function() {
        return new Promise(function(resolve, error) {
            navigator.webkitGetUserMedia({
                audio: true
            }, resolve, error);
        });
    }

    stopRecorder = function() {
        var webm = new Blob(videoBuffer, {
            type: "video/webm"
        });
        
        audioRecorder.exportWAV(function(wav) {
            convertToVideo(webm, wav).then(loadModule);
        });
    }

    loadModule = function() {
        return new Promise(function(resolve, error) {
            videoEncoder = document.createElement("embed");

            videoEncoder.setAttribute("width", 0);
            videoEncoder.setAttribute("height", 0);
            videoEncoder.setAttribute("src", "/nacl/manifest.nmf");
            videoEncoder.setAttribute("ps_tty_prefix", "ps:");
            videoEncoder.setAttribute("ps_stdout", "/dev/tty");
            videoEncoder.setAttribute("ps_stderr", "/dev/tty");
            videoEncoder.setAttribute("type", "application/x-nacl");

            videoEncoder.addEventListener("load", function() {
                resolve();
            });

            videoEncoder.addEventListener("message", function() {
                console.log(arguments);
            });

            videoEncoder.addEventListener("crash", function() {
                console.log(arguments);
            });

            // Request the offsetTop property to force a relayout. As of Apr 10, 2014
            // this is needed if the module is being loaded on a Chrome App's
            // background page (see crbug.com/350445).
            document.body.appendChild(videoEncoder);
            videoEncoder.offsetTop;
        });
    }

    return new Promise(function(resolve, reject) {
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], resolve);
    })
    .then(function(id) {
        screenId = id;
        return new Promise(function(resolve, reject) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                resolve(tabId = tabs[0].id);
            });
        });
    })
    .then(function(tabId) {
        return Promise.all([
            getVideoStream(),
            getAudioStream()
        ]);
    })
    .then(function(config) {
        streams = config;
    })
    .then(loadModule)
    .then(function() {
        videoEncoder.postMessage({
            type: "start", 
            data: {
                filename: "/html5_persistent/output-file.webm",
                chromeVersion: 46,
                videoTrack: streams[0].getVideoTracks()[0],
                audioTrack: streams[1].getAudioTracks()[0]
            }
        });
    })
    .then(function() {
        return new Promise(function(resolve, error) {
            setTimeout(function() {
                console.log("stopped");
                videoEncoder.postMessage({
                    type: "stop", 
                    data: {}
                });
                resolve();
            }, 5000);
        });
    })
    .then(function() {
        streams.forEach(function(stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
        });
    })
    .then(callback);
}

chrome.runtime.onMessageExternal.addListener(function(request, sender, callback) {
    startRecording(callback);
    return true;
});