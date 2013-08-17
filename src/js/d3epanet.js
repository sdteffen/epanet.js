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
                if (m && m.length && 3 == m.length)
                {
                    c.x = parseFloat(m[1]);
                    c.y = parseFloat(m[2]);
                }
                v[v.length] = c;
                section[key] = v;
            },
            PIPES: function(section, key, line) {                
                var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
                if(m && m.length && 8 == m.length)
                    {
                        section[key] = {NODE1: m[1], NODE2: m[2], LENGTH: parseFloat(m[3]), 
                                    DIAMETER: parseFloat(m[4]), ROUGHNESS: parseFloat(m[5]), 
                                    MINORLOSS: parseFloat(m[6]), STATUS: m[7]};
                    }
                    
            }
        },
        model = {COORDINATES: {}},
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

function rendersvg() {
    var svg = d3.select('#svgSimple'),
            model = d3.inp().parse(document.getElementById('inputTextarea').value),
            nodesections = ['JUNCTIONS', 'RESERVOIRS', 'TANKS'],
            linksections = ['PIPES', 'VALVES', 'PUMPS'];
    svg.selectAll('line').remove();
    svg.selectAll('circle').remove();
    if('object' != typeof model.COORDINATES)
        return;
    var coords = d3.values(model.COORDINATES),
            x = function (c) {return c.x},
            y = function (c) {return c.y},
            minx = d3.min(coords, x),
            miny = d3.min(coords, y),
            height = (d3.max(coords, y)-miny),
            width = (d3.max(coords, x)-minx)
            scale = width*0.2,
            nodeSize = height/75,
            strokeWidth = height/200;

    svg.attr('viewBox', (minx-scale)+' '+(miny-1.7*scale)+' '+(width+0.5*scale)+' '+(height+2*scale));
    console.log('viewBox', (minx-scale)+' '+(miny-scale)+' '+(width+0.5*scale)+' '+(height+2*scale));
    
    for (var coordinate in model.COORDINATES)
    {
        var c = model.COORDINATES[coordinate];
        console.log(c.x+ ' '+c.y);
        svg.append('circle')
                .attr('cx', c.x)
                .attr('cy', c.y)
                .attr('r', nodeSize)
                .attr('style', 'fill: white;');
    }
    
    for (var section in linksections) {
        var s = linksections[section];
        console.log(s);
        if(model[s]) {
            for (var link in model[s]) {
                var l = model[s][link],
                        node1 = l.NODE1 || false,
                        node2 = l.NODE2 || false,
                        c1 = model.COORDINATES[node1] || false,
                        c2 = model.COORDINATES[node2] || false;
                console.log(l+', '+node1+', '+node2+', '+c1+', '+c2);
                if(c1 && c2) {
                        svg.append('line')
                                .attr('x1', c1.x)
                                .attr('y1', c1.y)
                                .attr('x2', c2.x)
                                .attr('y2', c2.y)
                                .attr('stroke', 'white')
                                .attr('stroke-width', strokeWidth);
               }
            }
        }
    }

}

function loadSample(f) {
    d3.text('samples/'+f, false, function (error, response) {
        if(error)
            return;
        d3.select('#inputTextarea').text(response);
        runButton();
    });
}

