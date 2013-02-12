var Module = {
	arguments: ['/input.inp', '/report.txt'],
	preRun: function () {		
		FS.createDataFile('/', 'input.inp', document.getElementById('input').value, true, true);
	},
	postRun: function () {
		var o = document.getElementById('output'),
		    t = Module.intArrayToString(FS.findObject('/report.txt').contents)
		t = t.replace(/&/g, "&amp;");
                t = t.replace(/</g, "&lt;");
            	t = t.replace(/>/g, "&gt;");
		o.value = t;
	}
};

runButton = function () {
	FS.deleteFile('/input.inp');
	FS.deleteFile('/report.txt');
	FS.createDataFile('/', 'input.inp', document.getElementById('input').value, true, true);
	Module.run();
	var o = document.getElementById('output'),
	    t = Module.intArrayToString(FS.findObject('/report.txt').contents)
	t = t.replace(/&/g, "&amp;");
        t = t.replace(/</g, "&lt;");
    	t = t.replace(/>/g, "&gt;");
	o.value = t;
}

function _writecon(t) {
	document.getElementById('status').innerHTML = Module.Pointer_stringify(t);
}
