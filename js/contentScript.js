// setTimeout(function() {
//     navigator.webkitGetUserMedia({
//         audio: true
//     }, function() {
//         console.log(arguments);
//     }, function() {
//         console.log(arguments);
//     });
// }, 2000);

"use strict";

function initAudioStream(callback) {
    navigator.webkitGetUserMedia({
        audio: true
    }, function (stream) {
        callback({
            stream: stream
        });
    }, function (error) {
        callback({
            error: error
        });
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "initaudiostream") initAudioStream(sendResponse);

    return true;
});