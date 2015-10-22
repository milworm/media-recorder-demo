"use strict";

// var onTabChange = function(tab) {
//     var host = tab.url.split('://')[1],
//         tabId = tab.id;

//     if (/^(localhost|challengeu)/.test(host))
//         chrome.pageAction.show(tabId);
//     else
//         chrome.pageAction.hide(tabId);
// }

// chrome.tabs.onActivated.addListener(function(activeInfo) {
//     chrome.tabs.get(activeInfo.tabId, onTabChange);
// });

// chrome.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
//     onTabChange(tab);
// });

// chrome.pageAction.onClicked.addListener(function(tab) {
//     Recorder.instance().record(function() {
//         console.log("works");
//     });
// });

// chrome.runtime.onMessageExternal.addListener(function(request, sender, callback) {
//     Recorder.instance().record(callback);
//     return true;
// });

// chrome.runtime.onInstalled.addListener(function(e) {
//     chrome.tabs.create({
//         url: chrome.extension.getURL("data/welcome.html"),
//         active: true
//     })
// });