// Parser for EPANET INP files
d3.inp = function() {
    function inp() {
    }

    inp.parse = function(text) {
	var regex = {
	    section: /^\s*\[\s*([^\]]*)\s*\].*$/,
	    value: /\s*([^\s]+)([^;]*).*$/,
	    comment: /^\s*;.*$/
	},
	parser = {
	    COORDINATES: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/);
		if (m && m.length && 3 == m.length)
		    section[key] = {x: parseFloat(m[1]), y: parseFloat(m[2])};
	    },
	    LABELS: function(section, key, line) {
		var m = line.match(/\s+([[0-9\.]+)\s+"([^"]+)"/);
		if (m && m.length && 3 == m.length)
		    section[section.length] = {x: parseFloat(key), y: parseFloat(m[1]), label: m[2]};
	    },
	    PIPES: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
		if (m && m.length && 8 == m.length) {
		    section[key] = {NODE1: m[1], NODE2: m[2], LENGTH: parseFloat(m[3]),
			DIAMETER: parseFloat(m[4]), ROUGHNESS: parseFloat(m[5]),
			MINORLOSS: parseFloat(m[6]), STATUS: m[7]};
		}
	    },
	    PUMPS: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([^;]+).*/);
		if (m && m.length && 4 == m.length) {
		    section[key] = {NODE1: m[1], NODE2: m[2], PARAMETERS: m[3]};
		}
	    },
	    TIMES: function(section, key, line) {
		var m = line.match(/(CLOCKTIME|START|TIMESTEP)\s+([^\s].*[^\s])\s*/i);
		if (m && m.length && 3 == m.length) {
		    section[(key + ' ' + m[1]).toUpperCase()] = m[2];
		}
		else {
		    section[key.toUpperCase()] = line.replace(/^\s+/, '').replace(/\s+$/, '');
		}
	    },
	    VALVES: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+).*/);
		if (m && m.length && 7 == m.length) {
		    section[key] = {NODE1: m[1], NODE2: m[2], DIAMETER: parseFloat(m[3]),
			TYPE: m[4], SETTING: m[5],
			MINORLOSS: parseFloat(m[6])};
		}
	    },
	    VERTICES: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/),
		v = section[key] || [],
		c = {};
		if (m && m.length && 3 == m.length) {
		    c.x = parseFloat(m[1]);
		    c.y = parseFloat(m[2]);
		}
		v[v.length] = c;
		section[key] = v;
	    }
	},
	model = {COORDINATES: {}, LABELS: [], RESERVOIRS: {}, TANKS: {}},
	lines = text.split(/\r\n|\r|\n/),
		section = null;
	lines.forEach(function(line) {
	    if (regex.comment.test(line)) {
		return;
	    } else if (regex.section.test(line)) {
		var s = line.match(regex.section);
		if ('undefined' == typeof model[s[1]])
		    model[s[1]] = {};
		section = s[1];
	    } else if (regex.value.test(line)) {
		var v = line.match(regex.value);
		if (parser[section])
		    parser[section](model[section], v[1], v[2]);
		else
		    model[section][v[1]] = v[2];
	    }
	    ;
	});
	return model;
    };

    return inp;
};

// Read EPANET binary result files
d3.epanetresult = function() {
    function epanetresult() {

    }

    epanetresult.i4 = Module._malloc(4);
    epanetresult.string = Module._malloc(255);

    epanetresult.parse = function(filename) {
	var c = FS.findObject(filename).contents,
		r = {},
		er = epanetresult,
		count = {
	    'NODES': er.readInt(c, 8),
	    'TANKS': er.readInt(c, 12),
	    'LINKS': er.readInt(c, 16),
	    'PUMPS': er.readInt(c, 20)
	},
	numReportStart = er.readInt(c, 48),
		numTimeStep = er.readInt(c, 52),
		numDuration = er.readInt(c, 56),
		numPeriods = (numDuration / numTimeStep) + 1,
		offsetNodeIDs = 884,
		offsetLinkIDs = offsetNodeIDs + (32 * count['NODES']),
		offsetNodeResults = offsetNodeIDs + (36 * count['NODES']) + (52 * count['LINKS']) +
		(8 * count['TANKS']) + (28 * count['PUMPS']) + 4,
		offsetLinkResults = 16 * count['NODES'] + offsetNodeResults,
		i,
		j;	
	// Loop over periods
	for (i = 0; i < numPeriods; i++) {
	    r[i + 1] = {'NODES': {}, 'LINKS': {}};
	    
	    // Nodes
	    for (j = 0; j < count['NODES']; j++) {
		var id = Module.intArrayToString(Array.prototype.slice.call(c,
			offsetNodeIDs + (j * 32), offsetNodeIDs + 32 + (j * 32))).replace(/[^a-z0-9_\.]/gi, '');		
		r[i + 1]['NODES'][id] = {
		    'DEMAND': er.readFloat(c, offsetNodeResults + (j * 4)),
		    'HEAD': er.readFloat(c, offsetNodeResults + ((count['NODES'] + j) * 4)),
		    'PRESSURE': er.readFloat(c, offsetNodeResults + ((2 * count['NODES'] + j) * 4)),
		    'QUALITY': er.readFloat(c, offsetNodeResults + ((3 * count['NODES'] + j) * 4))
		};

	    }
	    
	    // Links
	    for( j = 0; j < count['LINKS']; j++) {
		var id = Module.intArrayToString(Array.prototype.slice.call(c,
		offsetLinkIDs + (j*32), offsetLinkIDs + 32 + (j * 32))).replace(/[^a-z0-9_\.]/gi, '');
		r[i + 1]['LINKS'][id] = {
		    'FLOW': er.readFloat(c, offsetLinkResults + (j * 4)),
		    'VELOCITY': er.readFloat(c, offsetLinkResults + ((count['LINKS'] + j) * 4)),
		    'HEADLOSS': er.readFloat(c, offsetLinkResults + ((2 * count['LINKS'] + j) * 4))
		};
	    }
	    
	    offsetNodeResults += (16 * count['NODES'] + 32 * count['LINKS']);
	    offsetLinkResults += (16 * count['NODES'] + 32 * count['LINKS']);
	}
	
	return r;
    }

    epanetresult.readInt = function(content, offset) {
	Module.HEAP8.set(new Int8Array(content.slice(offset, offset + 4)), epanetresult.i4);
	return Module.getValue(epanetresult.i4, 'i32');
    }

    epanetresult.readFloat = function(content, offset) {
	Module.HEAP8.set(new Int8Array(content.slice(offset, offset + 4)), epanetresult.i4);
	return Module.getValue(epanetresult.i4, 'float');
    }

    return epanetresult;
};

var epanetjs = function() {
    epanetjs = function() {
    };

    epanetjs.INPUT = 1;
    epanetjs.ANALYSIS = 2;
    epanetjs.ANALYSIS_WITH_LEGEND = 3;

    epanetjs.mode = epanetjs.INPUT;
    epanetjs.success = false;
    epanetjs.results = false;
    epanetjs.colors = {'NODES': false, 'LINKS': false};
    epanetjs.model = false;
    
    epanetjs.setMode = function(mode) {
	epanetjs.mode = mode;
	if (epanetjs.INPUT == mode) {
	    $('analysisContainer').fadeOut('slow');
	    $('#inputContainer').fadeOut('slow', function() {
		$(this).remove().insertBefore('#analysisContainer').fadeIn('slow');
		$('#analysisContainer').fadeIn('slow');
		$("[data-toggle=popover]").popover();
	    });	    
	}
	else {
	    $('inputContainer').fadeOut('slow');
	    $('#analysisContainer').fadeOut('slow', function() {
		$(this).remove().insertBefore('#inputContainer').fadeIn('slow');
		$('#inputContainer').fadeIn('slow');
		$("[data-toggle=popover]").popover();
	    });
	    
	}
	if(epanetjs.ANALYSIS_WITH_LEGEND == mode)
	    $('#legend').show()
	else
	    $('#legend').hide();
	epanetjs.render();
    };

    // Render the map
    epanetjs.svg = function() {
	var svg = function() {
	};
	
	// ====================================================================
	// This product includes color specifications and designs 
	// developed by Cynthia Brewer (http://colorbrewer.org/).
	// See ../../COPYING for licensing details.
	// RdYlGn
	svg.colors =  {'NODES': ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
	// RdBu
	    'LINKS': ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"]};
	// ====================================================================

	svg.width = window.innerWidth || document.documentElement.clientWidth || d.getElementsByTagName('body')[0].clientWidth;
	svg.height = 500;
	svg.nodemap = {};
	svg.lastNodeId = 0;
	svg.links = [];
	svg.nodes = [];
	svg.nodeSize = 1;

	svg.removeAll = function(el) {
	    el.selectAll('line').remove();
	    el.selectAll('circle').remove();
	    el.selectAll('rect').remove();
	    el.selectAll('polygon').remove();
	    el.selectAll('text').remove();
	};

	svg.tooltip = function(element) {
	    var el = d3.select('#' + element.parentNode.id),
		    a = element.attributes,
		    text = a['title'].value;
	    if(epanetjs.INPUT != epanetjs.mode && epanetjs.success) {
		var fmt = d3.format('0.3f'),
			nodeResult = $('#nodeResult').val().toUpperCase(),
			v = epanetjs.results[$('#time').val()]['NODES'][text][nodeResult];
		text = fmt(v);
	    }
	    el.select('.svgtooltip').remove();
	    el.append('text')
		    .attr('x', parseFloat(a['data-x'].value) + svg.nodeSize)
		    .attr('y', parseFloat(a['data-y'].value) - svg.nodeSize)
		    .text(text)
		    .attr('class', 'svgtooltip')
		    .attr('style', 'font-family: Verdana, Arial, sans; font-size:' + (svg.nodeSize * 2) + 'pt;')
		    .attr('fill', 'white');
	};

	svg.clearTooltips = function(element) {
	    var parent = d3.select('#' + element.parentNode.id);
	    parent.select('.svgtooltip').remove();
	};

	svg.render = function() {
	    var el = d3.select('#svgSimple'),
		    model = epanetjs.model,
		    nodesections = ['JUNCTIONS', 'RESERVOIRS', 'TANKS'],
		    linksections = ['PIPES', 'VALVES', 'PUMPS'],
		    step = $('#time').val(),
		    nodeResult = $('#nodeResult').val().toUpperCase(),
		    linkResult = $('#linkResult').val().toUpperCase();
	    svg.removeAll(el);	    
	    if ('object' != typeof model.COORDINATES)
		return;
	    var coords = d3.values(model.COORDINATES),
		    x = function(c) {
		return c.x
	    },
		    y = function(c) {
		return c.y
	    },
		    minx = d3.min(coords, x),
		    maxx = d3.max(coords, x),
		    miny = d3.min(coords, y),
		    maxy = d3.max(coords, y),
		    height = (maxy - miny),
		    width = (maxx - minx),
		    scale = width * 0.1,
		    top = maxy + scale,		    
		    strokeWidth = height / 200;

	    el.attr('viewBox', (minx - scale) + ' ' + 0 + ' ' + (width + 2 * scale) + ' ' + (height + 2 * scale));

	    svg.nodeSize = height / 75,
	    el.append('circle')
		    .attr('cx', minx + width / 2)
		    .attr('cy', top - height / 2)
		    .attr('r', svg.nodeSize)
		    .attr('style', 'fill: black');
	    var c = d3.select('circle');
	    if (c && c[0] && c[0][0] && c[0][0].getBoundingClientRect)
	    {
		var r = c[0][0].getBoundingClientRect();
		if (r && r.height && r.width) {
		    svg.nodeSize = svg.nodeSize / r.height * 10;
		}
	    }
	    svg.removeAll(el);
	    nodeSize = svg.nodeSize;

	    // Render links
	    for (var section in linksections) {
		var s = linksections[section];
		if (model[s]) {
		    for (var link in model[s]) {
			var l = model[s][link],
				node1 = l.NODE1 || false,
				node2 = l.NODE2 || false,
				c1 = model.COORDINATES[node1] || false,
				c2 = model.COORDINATES[node2] || false,
				v = epanetjs.results[step]['LINKS'][link][linkResult],
				r = epanetjs.colors['LINKS'],
				linkColors = epanetjs.svg.colors['LINKS'],
				color = (epanetjs.INPUT == epanetjs.mode ? 'white': linkColors[r(v)]);
			
			if (c1 && c2) {
			    var centerx = (c1.x + c2.x) / 2,
				    centery = (c1.y + c2.y) / 2,
				    angle = 180 / Math.PI * Math.atan2(c1.y - c2.y, c2.x - c1.x),
				    transform = 'rotate(' + angle + ' ' + centerx + ' ' + (top - centery) + ')';
			    if (model['VERTICES'][link]) {
				// Render polylines                        
				var v = model['VERTICES'][link],
					d = 'M ' + c1.x + ' ' + (top - c1.y);
				for (var point in v) {
				    var p = v[point];
				    d = d + ' L ' + p.x + ' ' + (top - p.y);
				}
				d = d + ' L ' + c2.x + ' ' + (top - c2.y);
				el.append('path')
					.attr('stroke', color)
					.attr('fill', 'none')
					.attr('d', d)
					.attr('stroke-width', strokeWidth);

			    }
			    else
			    {
				el.append('line')
					.attr('x1', c1.x)
					.attr('y1', top - c1.y)
					.attr('x2', c2.x)
					.attr('y2', top - c2.y)
					.attr('stroke', color)
					.attr('stroke-width', strokeWidth);
			    }

			    if ('PUMPS' == s) {
				el.append('circle')
					.attr('cx', centerx)
					.attr('cy', top - centery)
					.attr('r', nodeSize)
					.attr('style', 'fill:'+color+';');
				el.append('rect')
					.attr('width', nodeSize * 1.5)
					.attr('height', nodeSize)
					.attr('x', centerx)
					.attr('y', top - centery - nodeSize)
					.attr('transform', transform)
					.attr('style', 'fill:'+color+';');
			    } else if ('VALVES' == s) {
				el.append('polygon')
					.attr('points', (centerx + nodeSize) + ' ' + (top - centery - nodeSize) + ' ' +
					centerx + ' ' + (top - centery) + ' ' +
					(centerx + nodeSize) + ' ' + (top - centery + nodeSize))
					.attr('transform', transform)
					.attr('style', 'fill:'+color+';');
				el.append('polygon')
					.attr('points', (centerx - nodeSize) + ' ' + (top - centery - nodeSize) + ' ' +
					centerx + ' ' + (top - centery) + ' ' +
					(centerx - nodeSize) + ' ' + (top - centery + nodeSize))
					.attr('transform', transform)
					.attr('style', 'fill:'+color+';');
			    }
			}
		    }
		}
	    }
	    // Render nodes
	    for (var coordinate in model.COORDINATES)
	    {
		var c = model.COORDINATES[coordinate],			
			v = epanetjs.results[step]['NODES'][coordinate][nodeResult],
			r = epanetjs.colors['NODES'],
			nodeColors = epanetjs.svg.colors['NODES'],
			color = (epanetjs.INPUT == epanetjs.mode ? 'white': nodeColors[r(v)]);
		if (model.RESERVOIRS[coordinate]) {
		    el.append('rect')
			    .attr('width', nodeSize * 2)
			    .attr('height', nodeSize * 2)
			    .attr('x', c.x - nodeSize)
			    .attr('y', top - c.y - nodeSize)
			    .attr('data-x', c.x)
			    .attr('data-y', top - c.y)
			    .attr('title', coordinate)
			    .attr('onmouseover', 'svg.tooltip(evt.target)')
			    .attr('onmouseout', 'svg.clearTooltips(evt.target)')
			    .attr('fill', color);
		} else if (model.TANKS[coordinate]) {
		    el.append('polygon')
			    .attr('points', (c.x - nodeSize) + ' ' + (top - c.y - nodeSize) + ' ' +
			    (c.x + nodeSize) + ' ' + (top - c.y - nodeSize) + ' ' +
			    c.x + ' ' + (top - c.y + nodeSize))
			    .attr('title', coordinate)
			    .attr('data-x', c.x)
			    .attr('data-y', top - c.y)
			    .attr('onmouseover', 'svg.tooltip(evt.target)')
			    .attr('onmouseout', 'svg.clearTooltips(evt.target)')
			    .attr('fill', color);
		} else {
		    el.append('circle')
			    .attr('cx', c.x)
			    .attr('cy', top - c.y)
			    .attr('r', nodeSize)
			    .attr('data-x', c.x)
			    .attr('data-y', top - c.y)
			    .attr('title', coordinate)
			    .attr('onmouseover', 'svg.tooltip(evt.target)')
			    .attr('onmouseout', 'svg.clearTooltips(evt.target)')
			    .attr('fill', color);
		}
	    }

	    // Render labels
	    for (var label in model['LABELS']) {
		var l = model['LABELS'][label],
			t = l['label'];
		el.append('text')
			.attr('x', l['x'] - nodeSize * t.length / 3)
			.attr('y', top - l['y'] + nodeSize * 2)
			.text(t)
			.attr('style', 'font-family: Verdana, Arial, sans; font-size:' + (nodeSize * 2) + 'px;')
			.attr('fill', 'white');
	    }

	};

	return svg;
    };
    epanetjs.svg = epanetjs.svg();

    // Make toolkit functions accessible in JavaScript
    epanetjs.toolkit = function() {
	var toolkit = function() {
	};

	toolkit.hour = function(time, units) {
	    // Function has to be exported by emcc
	    var hour = Module.cwrap('hour', 'double', ['string', 'string']);
	    return hour(time, units);
	}
	return toolkit;
    };
    epanetjs.toolkit = epanetjs.toolkit();
    
    epanetjs.renderAnalysis = function(renderLegend) {
	var renderLegend = renderLegend || false;
	
	if (!epanetjs.success)
	    epanetjs.renderInput();
	else {
	    var time = $('#time').val(),
		nodes = epanetjs.results[time]['NODES'],
		links = epanetjs.results[time]['LINKS'],		
		nodeResult = $('#nodeResult').val().toUpperCase(),
		linkResult = $('#linkResult').val().toUpperCase();
	    if (epanetjs.INPUT == epanetjs.mode)
		epanetjs.mode = epanetjs.ANALYSIS;
	    epanetjs.colors['NODES'] = d3.scale.quantile().range(d3.range(5));
	    epanetjs.colors['NODES'].domain(d3.values(nodes).map(function(n) {
		return n[nodeResult];
	    }));
	    epanetjs.colors['LINKS'] = d3.scale.quantile().range(d3.range(5));
	    epanetjs.colors['LINKS'].domain(d3.values(links).map(function(n) {
		return n[linkResult];
	    }));
	    svg = epanetjs.svg;
	    svg.render();
	    d3.select('#legend ul').remove();
	    if(renderLegend) {
		var legend = d3.select('#legend'),
			ul = legend.append('ul').attr('class', 'list-group'),
			fmt = d3.format('0.3f'),
			elements = ['Nodes', 'Links'];
		for(var el in elements) {
		    var	el = elements[el],
			    singular = el.substr(0, el.length - 1)
			    range = epanetjs.colors[el.toUpperCase()],			    
			    quantiles = range.quantiles(),
			    v = [fmt(d3.min(range.domain()))];
		    ul.append('li').text(singular+' '+$('#'+singular.toLowerCase()+'Result').val()).attr('class', 'list-group-item active');
		    for(var q in quantiles)
		    {
		       v[v.length] = fmt(quantiles[q]);
		    }
		    v[v.length] = fmt(d3.max(range.domain()));
		    for(var i = 1; i < v.length; i++)
		    {
			var li = ul.append('li')			    
				.attr('class', 'list-group-item'),
			    value = (parseFloat(v[i-1]) + parseFloat(v[i]))/2;
			li.append('span')
				.attr('style', 'background:'+epanetjs.svg.colors[el.toUpperCase()][range(value)])
				.attr('class', 'legendcolor')
				.text(' ');
			li.append('span')
			    .text(' '+v[i-1]+' to '+v[i]);
		    }
		}
		
	    }		
	}
    };

    epanetjs.renderInput = function() {
	epanetjs.svg.render();
    };

    epanetjs.loadSample = function(f) {
	$('#working').modal('show');
	try {
	    d3.text('samples/' + f, false, function(error, response) {
		if (error) {
		    $('#working').modal('hide');
		    return;
		}
		d3.select('#inputTextarea').text(response);
		runButton();
	    });
	} catch (e) {
	    $('#working').modal('hide');
	}
    };

    epanetjs.readBin = function(success) {
	epanetjs.results = (success ? d3.epanetresult().parse('/report.bin') : false);
    };

    epanetjs.render = function() {
	if (epanetjs.INPUT == epanetjs.mode)
	    epanetjs.renderInput();
	else
	    epanetjs.renderAnalysis(epanetjs.ANALYSIS_WITH_LEGEND == epanetjs.mode);
    };

    epanetjs.setSuccess = function(success) {
	var time = d3.select('#time');
	epanetjs.success = success;
	epanetjs.readBin(success);
	time.selectAll('option').remove();
	epanetjs.model = d3.inp().parse(document.getElementById('inputTextarea').value)
	if (epanetjs.results) {
	    var reportTime = epanetjs.parseTime(epanetjs.model['TIMES']['REPORT START']),
		    reportTimestep = epanetjs.parseTime(epanetjs.model['TIMES']['REPORT TIMESTEP']);
	    for (var t in epanetjs.results) {
		time.append('option')
			.attr('value', t)
			.text(epanetjs.clocktime(reportTime));
		reportTime += reportTimestep;
	    }
	}
	epanetjs.render();
    };

    epanetjs.parseTime = function(text) {
	var t = parseFloat(text);
	if (!text.match(/^[0-9\.]+$/))
	{
	    t = epanetjs.toolkit.hour(text, '');
	    if (t < 0.0)
	    {
		var m = line.match(/\s*([^\s]+)\s+([^\s]+)\s*/);
		if (!m || !m.length || 3 != m.length ||
			(t = epanetjs.toolkit.hour(m[1], m[2])) < 0.0)
		    throw 'Input Error 213: illegal option value';
	    }
	}
	return 3600.0 * t;
    };

    epanetjs.clocktime = function(seconds) {
	var h = Math.floor(seconds / 3600),
		m = Math.floor((seconds % 3600) / 60),
		s = Math.floor(seconds - 3600 * h - 60 * m),
		fmt = d3.format('02d');
	return '' + h + ':' + fmt(m) + ':' + fmt(s);
    }

    return epanetjs;
};

epanetjs = epanetjs();