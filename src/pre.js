var preRun = function() {
    FS.quit();
    FS.staticInit();
    FS.ignorePermissions = true;
    try
    {
        var inp = document.getElementById('inputTextarea').value;
        $('#inputModal').modal('hide');
        $('#inputPre').html(inp);
        FS.createDataFile('/', 'input.inp', inp, true, true);
    } catch (e) {
        console.log('/input.inp creation failed');
    }
    rendersvg();
},
        postRun = function() {
    var t = Module.intArrayToString(FS.findObject('/report.txt').contents),
        s = $('#status'),
        m = s.html(),
        l = (0 > m.indexOf('error') ? '<span class="label label-success">Success</span>' 
            : '<span class="label label-important">Error</span>');
    s.html(l + m.replace(/^[ \n]*\.\.\. */, ' '));
    t = t.replace(/&/g, "&amp;");
    t = t.replace(/</g, "&lt;");
    t = t.replace(/>/g, "&gt;");
    $('#output').html(t);    
},
        Module = {
    arguments: ['/input.inp', '/report.txt', '/report.bin'],
    preRun: preRun,
    postRun: postRun
};

runButton = function() {
    Module.run();
}

saveButton = function () {
    var inp = $('#inputTextarea').val(),
        blob = new Blob([inp], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "epanet.js.inp");
}
