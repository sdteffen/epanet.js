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
            VERTICES: function(section, key, line) {
                var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/)
                v = section[key] || [];
                c = {};
                if (m && m.length && 3 == m.length) {
                    c.x = parseFloat(m[1]);
                    c.y = parseFloat(m[2]);
                }
                v[v.length] = c;
                section[key] = v;
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
            VALVES: function(section, key, line) {
             var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+).*/);
                if (m && m.length && 7 == m.length) {
                    section[key] = {NODE1: m[1], NODE2: m[2], DIAMETER: parseFloat(m[3]),
                        TYPE: m[4], SETTING: m[5],
                        MINORLOSS: parseFloat(m[6])};
                }   
            }
        },
        model = {COORDINATES: {}, RESERVOIRS: {}, TANKS: {}},
        lines = text.split(/\r\n|\r|\n/),
                section = null;
        lines.forEach(function(line) {
            if (regex.comment.test(line)) {
                return;
            } else if (regex.section.test(line)) {
                var s = line.match(regex.section);
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

var width = window.innerWidth || document.documentElement.clientWidth || d.getElementsByTagName('body')[0].clientWidth,
        height = 500,
        colors = d3.scale.category10(),
        nodemap = {},
        lastNodeId = 0,
        links = [],
        nodes = [];

function svgRemoveAll(svg) {
    svg.selectAll('line').remove();
    svg.selectAll('circle').remove();
    svg.selectAll('rect').remove();
    svg.selectAll('polygon').remove();
}

function svgTooltip(element) {
    var svg = d3.select('#'+element.parentNode.id),
        a = element.attributes,
        r = parseFloat(a['r'].value);
    svg.select('.svgtooltip').remove();
    svg.append('text')
        .attr('x', parseFloat(a['cx'].value)+r)
        .attr('y', parseFloat(a['cy'].value)-r)
        .text(a['title'].value)
        .attr('class', 'svgtooltip')
        .attr('style', 'font-family: Verdana, Arial, sans; font-size:'+(r*4))
        .attr('fill', 'white');
}

function svgClearTooltips(element) {
    var svg = d3.select('#'+element.parentNode.id);
    svg.select('.svgtooltip').remove();
}

function rendersvg() {
    var svg = d3.select('#svgSimple'),
            model = d3.inp().parse(document.getElementById('inputTextarea').value),
            nodesections = ['JUNCTIONS', 'RESERVOIRS', 'TANKS'],
            linksections = ['PIPES', 'VALVES', 'PUMPS'];
    svgRemoveAll(svg);
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
            miny = d3.min(coords, y),
            maxy = d3.max(coords, y),
            height = (maxy - miny),
            width = (d3.max(coords, x) - minx),
            scale = width * 0.2,
            top = maxy + scale,
            nodeSize = height / 75,
            strokeWidth = height / 200;

    svg.attr('viewBox', (minx - scale) + ' ' + (-0.7 * scale) + ' ' + (width + 0.5 * scale) + ' ' + (height + 2 * scale));

    for (var coordinate in model.COORDINATES)
    {
        var c = model.COORDINATES[coordinate];
        if(model.RESERVOIRS[coordinate]) {
            svg.append('rect')
                .attr('width', nodeSize*2)
                .attr('height', nodeSize*2)
                .attr('x', c.x-nodeSize)
                .attr('y', top-c.y-nodeSize)
                .attr('style', 'fill:white;');
        }else if(model.TANKS[coordinate]) {
            svg.append('polygon')
                .attr('points', (c.x - nodeSize)+' '+(top-c.y-nodeSize)+ ' '+
                    (c.x + nodeSize)+' '+(top-c.y-nodeSize)+ ' '+
                    c.x+' '+(top-c.y+nodeSize))
                .attr('style', 'fill:white;');
        }else {
            svg.append('circle')
                .attr('cx', c.x)
                .attr('cy', top-c.y)
                .attr('r', nodeSize)
                .attr('title', coordinate)
                .attr('onmouseover', 'svgTooltip(evt.target)')
                .attr('onmouseout', 'svgClearTooltips(evt.target)')
                .attr('style', 'fill: white;');
        }
    }

    for (var section in linksections) {
        var s = linksections[section];       
        if (model[s]) {
            for (var link in model[s]) {
                var l = model[s][link],
                        node1 = l.NODE1 || false,
                        node2 = l.NODE2 || false,
                        c1 = model.COORDINATES[node1] || false,
                        c2 = model.COORDINATES[node2] || false;                
                if (c1 && c2) {
                    var centerx = (c1.x+c2.x)/2,
                        centery = (c1.y+c2.y)/2,
                        angle = 180/Math.PI*Math.atan2(c1.y-c2.y, c2.x-c1.x),
                            transform = 'rotate('+angle+' '+centerx+' '+(top-centery)+')'; ;
                    svg.append('line')
                            .attr('x1', c1.x)
                            .attr('y1', top-c1.y)
                            .attr('x2', c2.x)
                            .attr('y2', top-c2.y)
                            .attr('stroke', 'white')
                            .attr('stroke-width', strokeWidth);
                    
                    if('PUMPS' == s) {
                        svg.append('circle')
                            .attr('cx', centerx)
                            .attr('cy', top-centery)
                            .attr('r', nodeSize)
                            .attr('style', 'fill:white;');
                        svg.append('rect')
                            .attr('width', nodeSize*1.5)
                            .attr('height', nodeSize)
                            .attr('x', centerx)
                            .attr('y', top-centery-nodeSize)
                            .attr('transform', transform)
                            .attr('style', 'fill:white;');
                    } else if('VALVES' == s) {                       
                         svg.append('polygon')
                            .attr('points', (centerx + nodeSize)+' '+(top-centery-nodeSize)+ ' '+
                                centerx+' '+(top-centery)+ ' '+
                                (centerx+nodeSize)+' '+(top-centery+nodeSize))
                            .attr('transform', transform)
                            .attr('style', 'fill:white;');
                         svg.append('polygon')
                            .attr('points', (centerx - nodeSize)+' '+(top-centery-nodeSize)+ ' '+
                                centerx+' '+(top-centery)+ ' '+
                                (centerx-nodeSize)+' '+(top-centery+nodeSize))
                            .attr('transform', transform)
                            .attr('style', 'fill:white;');
                    }
                }
            }
        }
    }

}

function loadSample(f) {
    d3.text('samples/' + f, false, function(error, response) {
        if (error)
            return;
        d3.select('#inputTextarea').text(response);
        runButton();
    });
}

