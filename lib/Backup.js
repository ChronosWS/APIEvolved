exports.asyncFunction = function(callback) {
    // Emulate a function that is not completed instantly
    setTimeout(function() {
        callback("Hello world");
    }, 3000);

};


console.log("I'll be run");

self.asyncFunction(function(callback_data) {
    console.log(callback_data); // Will print Hello World after callback function has been run.
});

console.log("I'll be visible before the callback data arrives");

