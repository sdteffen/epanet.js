mergeInto(LibraryManager.library, {
    writecon: function(t) {
        document.getElementById('status').innerHTML = Module.Pointer_stringify(t);
    }
});