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
}

function startRecording(callback) {
    var screenId,
        tabId,
        audioRecorder,
        videoRecorder,
        videoBuffer = [],
        getVideoStream,
        getAudioStream,
        loadModule;

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
                audio: {
                    echoCancellation: true,
                    sourceId: "default"
                }
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
        // attrs = "ffmpeg -i input.webm -i input.wav -shortest output.mp4".split(" ");
        // attrs = "ffmpeg -v warning -stats -nostdin -i input.webm -c:v libx264 -c:a mp3 -crf 22 out.mp4".split(" ");
        var attrs = ("ffmpeg -i input.webm -i input.wav -preset ultrafast -s 1366x768 -map 0:0 -map 1:0 output.webm").split(" ");
        // attrs = ("ffmpeg -nostdin -i input.webm -i input.wav -c:v mpeg4 -c:a vorbis -b:v 6400k -b:a 4800k output.mp4").split(" ");

        // @example
        // <embed id="pnacl" width="0" height="0" src="ffmpeg.nmf" type="application/x-pnacl" ps_stdout="dev/tty" ps_stderr="dev/tty" 
        // ps_tty_prefix="" arg0="ffmpeg" arg1="-y" arg2="-v" arg3="warning" arg4="-stats" arg5="-nostdin" arg6="-i" arg7="infile" arg8="-c:v" arg9="libx264" 
        // arg10="-c:a" arg11="mp3" arg12="-crf" arg13="22" arg14="out.mp4">

        var domModuleEl = document.querySelector("embed");

        if(domModuleEl)
            domModuleEl.parentNode.removeChild(domModuleEl);

        var moduleEl = document.createElement('embed');

        moduleEl.setAttribute('name', 'ffmpeg');
        moduleEl.setAttribute('id', 'ffmpeg');
        moduleEl.setAttribute('width', 0);
        moduleEl.setAttribute('height', 0);
        moduleEl.setAttribute('path', '/nacl');
        moduleEl.setAttribute('src', '/nacl/manifest.nmf');
        // moduleEl.setAttribute('type', 'application/x-nacl');
        moduleEl.setAttribute('type', 'application/x-pnacl');
        moduleEl.setAttribute('ps_stdout', 'dev/tty');
        moduleEl.setAttribute('ps_stderr', 'dev/tty');
        moduleEl.setAttribute('ps_tty_prefix', '');

        for(var i=0, attr; attr=attrs[i]; i++)
            moduleEl.setAttribute("arg" + i, attr);

        // The <EMBED> element is wrapped inside a <DIV>, which has both a 'load'
        // and a 'message' event listener attached.  This wrapping method is used
        // instead of attaching the event listeners directly to the <EMBED> element
        // to ensure that the listeners are active before the NaCl module 'load'
        // event fires.
        var listenerEl = document.body;
        listenerEl.appendChild(moduleEl);

        // Request the offsetTop property to force a relayout. As of Apr 10, 2014
        // this is needed if the module is being loaded on a Chrome App's
        // background page (see crbug.com/350445).
        moduleEl.offsetTop;

        return new Promise(function(resolve, error) {
            var mark1 = performance.now();

            listenerEl.addEventListener('error', error, true);
            listenerEl.addEventListener('crash', function() {
                console.log(performance.now() - mark1);
                resolve("output.webm");
            }, true);
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
    .then(function(streams) {
        return {
            video: streams[0],
            audio: streams[1]
        }
    })
    .then(function(streams) {
        // init audio recorder
        var context = new AudioContext(),
            source = context.createMediaStreamSource(streams.audio);

        audioRecorder = new Recorder(source, {
            workerPath: chrome.extension.getURL("/bower_components/recorderjs/recorderWorker.js")
        });

        audioRecorder.record();
        return streams;
    })
    .then(function(streams) {
        // init video recorder
        return new Promise(function(resolve, reject) {
            var stream = streams.video;
            videoRecorder = new MediaRecorder(stream, "video/vp9");

            videoRecorder.ondataavailable = function(e) {
                videoBuffer.push(e.data);
            };

            stream.onended = function() {
                resolve();
            }

            videoRecorder.start();
        });
    })
    .then(function() {
        return new Promise(function(resolve, error) {
            var webm = new Blob(videoBuffer, {
                type: "video/webm"
            });
            
            audioRecorder.exportWAV(function(wav) {
                resolve({
                    webm: webm,
                    wav: wav
                });
            });
        });
    })
    .then(function(data) {
        return FileSaver.save([{
            name: "input.webm", 
            data: data.webm
        }, {
            name: "input.wav", 
            data: data.wav
        }]);
    })
    .then(loadModule)
    .then(FileSaver.readFile)
    .then(function(fileEntry) {
        return new Promise(function(resolve, error) {
            fileEntry.file(resolve, error);
        });
    })
    .then(function(file) {
        return new Promise(function(resolve, error) {
            var reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result);
            };
            reader.readAsDataURL(file);
        });
    })
    .then(callback);
}

chrome.runtime.onMessageExternal.addListener(function(request, sender, callback) {
    startRecording(callback);
    return true;
});