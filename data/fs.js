// request DOMFileSystem
!function() {
    function onError() {
        console.log(arguments);
    }

    navigator.webkitPersistentStorage.queryUsageAndQuota(function(used, remaining) {
        if(used + remaining < 1)
            navigator.webkitPersistentStorage.requestQuota(1024*1024*100000, function(bytes) {
                webkitRequestFileSystem(window.PERSISTENT, bytes, function(fs) {
                    FS = fs
                }, onError);
            });
        else
            webkitRequestFileSystem(window.PERSISTENT, 1024*1024*100000, function(fs) {
                FS = fs;
            }, onError);
    }, onError);
}();