// chrome.runtime.onInstalled.addListener(function(e) {
//     chrome.tabs.create({
//         url: chrome.extension.getURL("data/welcome.html"),
//         active: !0
//     })
// });

"use strict";

window.addEventListener("load", initAudio);

function initAudio() {
    navigator.webkitGetUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'system'
            },
            optional: []
        }
    }, function () {
        console.log(arguments);
    }, function () {
        console.log(arguments);
    });
};