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
            COORDINATES: function(line) {
                var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/)
                c = {};
                if (m && m.length && 3 == m.length)
                {
                    c.x = m[1];
                    c.y = m[2];
                }
                return c;
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
                    model[section][v[1]] = parser[section](v[2]);
                else
                    model[section][v[1]] = v[2];
            }
            ;
        });
        return model;
    };

    return inp;
};

function node2node(sectionnodes)
{
    for (var node in sectionnodes)
    {
        nodemap[node] = lastNodeId;
        nodes[lastNodeId++] = {id: node, reflexive: false}
    }
}

function link2link(sectionlinks)
{
    for (var pipe in sectionlinks)
    {
        var source = nodes[nodemap[sectionlinks[pipe].replace(/ *([^ ]+) .*/, '$1')]],
                target = nodes[nodemap[sectionlinks[pipe].replace(/ *[^ ]+ +([^ ]+) .*/, '$1')]];
        links[links.length] = {source: source, target: target, left: false, right: true};
    }
}

var width = window.innerWidth || document.documentElement.clientWidth || d.getElementsByTagName('body')[0].clientWidth,
        height = 500,
        colors = d3.scale.category10(),
        nodemap = {},
        lastNodeId = 0,
        links = [],
        nodes = [];

function rendersvg() {
    var nodemap = {},
            lastNodeId = 0,
            links = [],
            nodes = [],
            svg = d3.select('#svgSimple'),
            model = d3.inp().parse(document.getElementById('inputTextarea').value),
            nodesections = ['JUNCTIONS', 'RESERVOIRS', 'TANKS'],
            linksections = ['PIPES', 'VALVES', 'PUMPS'],
            coords = d3.values(model.COORDINATES),
            x = function (c) {return c.x},
            y = function (c) {return c.y},
            minx = d3.min(coords, x),
            miny = d3.min(coords, y),
            height = (d3.max(coords, y)-miny),
            width = (d3.max(coords, x)-minx)
            scale = width*0.1;

    svg.attr('viewBox', (minx-scale)+' '+(miny-scale)+' '+(width+2*scale)+' '+(height+2*scale));
    console.log('viewBox', minx+' '+miny+' '+(d3.max(coords, x)-minx)+' '+(d3.max(coords, y)-miny));
    
    for (var coordinate in model.COORDINATES)
    {
        var c = model.COORDINATES[coordinate];
        console.log(c.x+ ' '+c.y);
        svg.append('circle')
                .attr('cx', c.x)
                .attr('cy', c.y)
                .attr('r', height/75)
                .attr('style', 'fill: white;');
    }
    /*
    for (var s in nodesections)
    {
        var section = nodesections[s]
        if (model[section])
            node2node(model[section]);
    }

    for (var s in linksections)
    {
        var section = linksections[s];
        console.log(section);
        if (model[section])
            link2link(model[section]);
    }*/

   

}

function loadSample(f) {
    d3.text('samples/'+f, false, function (error, response) {
        if(error)
            return;
        d3.select('#inputTextarea').text(response);
        runButton();
    });
}

