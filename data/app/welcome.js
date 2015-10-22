navigator.webkitGetUserMedia({
    audio: true
}, function () {
    console.log(arguments);
}, function () {
    console.log(arguments);
});