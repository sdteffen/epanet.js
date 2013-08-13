var preRun = function() {
    FS.quit();
    FS.staticInit();
    FS.ignorePermissions = true;
    try
    {
        FS.createDataFile('/', 'input.inp', document.getElementById('input').value, true, true);
    } catch (e) {
        console.log('/input.inp creation failed');
    }
    rendersvg();
},
        postRun = function() {
    var o = document.getElementById('output'),
            t = Module.intArrayToString(FS.findObject('/report.txt').contents)
    t = t.replace(/&/g, "&amp;");
    t = t.replace(/</g, "&lt;");
    t = t.replace(/>/g, "&gt;");
    o.value = t;
},
        Module = {
    arguments: ['/input.inp', '/report.txt', '/report.bin'],
    preRun: preRun,
    postRun: postRun
};

runButton = function() {
    Module.run();
    var o = document.getElementById('output'),
            t = Module.intArrayToString(FS.findObject('/report.txt').contents)
    t = t.replace(/&/g, "&amp;");
    t = t.replace(/</g, "&lt;");
    t = t.replace(/>/g, "&gt;");
    o.value = t;
}

function parseINP(inp) {
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\].*$/,
        value: /\s*([^\s]+)([^;]*).*$/,
        comment: /^\s*;.*$/
    };
    var model = {};
    var lines = inp.split(/\r\n|\r|\n/);
    var section = null;
    lines.forEach(function(line) {
        if (regex.comment.test(line)) {
            return;
        } else if (regex.section.test(line)) {
            var s = line.match(regex.section);
            model[s[1]] = {};
            section = s[1];
        } else if (regex.value.test(line)) {
            var v = line.match(regex.value);
            model[section][v[1]] = v[2];
        }
        ;
    });
    return model;
}
