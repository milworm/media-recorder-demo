navigator.webkitGetUserMedia({
    audio: {
        mandatory: {
            googEchoCancellation: "false",
            googAutoGainControl: "false",
            googNoiseSuppression: "false",
            googHighpassFilter: "false"
        },
        optional: []
    }
}, function() {
    console.log(arguments);
}, function() {
    console.log(arguments);
});