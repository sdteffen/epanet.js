// d3.js rendering

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

var width = 800,
        height = 500,
        colors = d3.scale.category10(),
        nodemap = {},
        lastNodeId = 0,
        links = [],
        nodes = [];

function rendersvg() {
    nodemap = {};
    lastNodeId = 0;
    links=[];
    nodes=[]
    d3.selectAll('svg').remove();
    var svg = d3.select('#col2')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', '10.16 51.79 0.05 0.05')
            .attr('style', 'border: 1px solid black;')
            .attr('id', 'svg');

    var 
            model = parseINP(document.getElementById('input').value),            
            nodesections = ['JUNCTIONS', 'RESERVOIRS', 'TANKS'],
            linksections = ['PIPES', 'VALVES', 'PUMPS'];

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
    }

    for (var c in model.COORDINATES)
    {
        var coordinate = model.COORDINATES[c],
                cx = coordinate.replace(/ *([^ ]+) .*$/, '$1'),
                cy = coordinate.replace(/^ *[^ ]+ +/, '');
        console.log(coordinate + ':' + cx + ',' + cy);
        svg.append('circle')
                .attr('cx', cx)
                .attr('cy', cy)
                .attr('r', '0.001');
    }

}
