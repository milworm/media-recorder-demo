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
//     Recorder.instance().record();
// });

"use strict";

chrome.runtime.onMessageExternal.addListener(function (request, sender, callback) {
    Recorder.instance().record(callback);
    return true;
});