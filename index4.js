var width = 960,
	height = 1000,
	duration = 0;

var nodes, links;
var i = 0;

var svg = d3
	.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);
var g = svg
	.append("g")
	.attr(
		"transform",
		"translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")"
	);

function connector(d) {
	return (
		"M" +
		project(d.x, d.y) +
		"C" +
		project(d.x, (d.y + d.parent.y) / 2) +
		" " +
		project(d.parent.x, (d.y + d.parent.y) / 2) +
		" " +
		project(d.parent.x, d.parent.y)
	);
	/*
  return "M" + d.y + "," + d.x +
    "C" + (d.y + d.parent.y) / 2 + "," + d.x +
    " " + (d.y + d.parent.y) / 2 + "," + d.parent.x +
    " " + d.parent.y + "," + d.parent.x;  */
}

var treeMap = d3.tree().size([360, 250]),
	root;
var nodeSvg, linkSvg, nodeEnter, linkEnter;

var stratify = d3
	.stratify()
	.id(function (d) {
		return d.name;
	})
	.parentId(function (d) {
		return d.parent;
	});

d3.json("data2.json", function (error, treeData) {
	if (error) throw error;

	root = stratify(treeData);

	root.each(function (d) {
		console.log(d);
		d.name = d.data.name; //transferring name to a name variable
		d.id = i; //Assigning numerical Ids
		i += i;
	});

	root.x0 = height / 2;
	root.y0 = 0;

	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}
	//root.children.forEach(collapse);
	update(root);
});

function update(source) {
	//root = treeMap(root);
	nodes = treeMap(root).descendants();
	//console.log(nodes);
	//links = root.descendants().slice(1);
	links = nodes.slice(1);
	//console.log(links);
	var nodeUpdate;
	var nodeExit;

	// Normalize for fixed-depth.
	nodes.forEach(function (d) {
		d.y = d.depth * 180;
	});

	nodeSvg = g.selectAll(".node").data(nodes, function (d) {
		return d.id || (d.id = ++i);
	});

	//nodeSvg.exit().remove();

	var nodeEnter = nodeSvg
		.enter()
		.append("g")
		//.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
		.attr("class", "node")
		.attr("transform", function (d) {
			return "translate(" + project(d.x, d.y) + ")";
		})
		//.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		.on("click", click)
		.on("mouseover", function (d) {
			return "minu";
		});

	nodeEnter.append("circle").attr("r", 5).style("fill", color);

	nodeEnter
		.append("text")
		.attr("dy", ".31em")
		//.attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
		.attr("x", function (d) {
			return d.children || d._children ? -10 : 10;
		})
		.style("text-anchor", function (d) {
			return d.x < 180 === !d.children ? "start" : "end";
		})
		//.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.attr("transform", function (d) {
			return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")";
		})
		.text(function (d) {
			return d.data.name;
		});

	// Transition nodes to their new position.
	var nodeUpdate = nodeSvg
		.merge(nodeEnter)
		.transition()
		.duration(duration)
		.attr("transform", function (d) {
			return "translate(" + project(d.x, d.y) + ")";
		});
	// .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	nodeSvg.select("circle").style("fill", color);

	nodeUpdate.select("text").style("fill-opacity", 1);

	// Transition exiting nodes to the parent's new position.
	var nodeExit = nodeSvg
		.exit()
		.transition()
		.duration(duration)
		.attr("transform", function (d) {
			return "translate(" + source.y + "," + source.x + ")";
		}) //for the animation to either go off there itself or come to centre
		.remove();

	nodeExit.select("circle").attr("r", 1e-6);

	nodeExit.select("text").style("fill-opacity", 1e-6);

	nodes.forEach(function (d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});

	linkSvg = g.selectAll(".link").data(links, function (link) {
		var id = link.id + "->" + link.parent.id;
		return id;
	});

	// Transition links to their new position.
	linkSvg.transition().duration(duration);
	// .attr('d', connector);

	// Enter any new links at the parent's previous position.
	linkEnter = linkSvg
		.enter()
		.insert("path", "g")
		.attr("class", "link")
		.attr("d", function (d) {
			return (
				"M" +
				project(d.x, d.y) +
				"C" +
				project(d.x, (d.y + d.parent.y) / 2) +
				" " +
				project(d.parent.x, (d.y + d.parent.y) / 2) +
				" " +
				project(d.parent.x, d.parent.y)
			);
		});
	/*
                            function (d) {
                        var o = {x: source.x0, y: source.y0, parent: {x: source.x0, y: source.y0}};
                        return connector(o);
                    });*/

	// Transition links to their new position.
	linkSvg.merge(linkEnter).transition().duration(duration).attr("d", connector);

	// Transition exiting nodes to the parent's new position.
	linkSvg
		.exit()
		.transition()
		.duration(duration)
		.attr(
			"d",
			/*function (d) {
                        var o = {x: source.x, y: source.y, parent: {x: source.x, y: source.y}};
                        return connector(o);
                    })*/ function (d) {
				return (
					"M" +
					project(d.x, d.y) +
					"C" +
					project(d.x, (d.y + d.parent.y) / 2) +
					" " +
					project(d.parent.x, (d.y + d.parent.y) / 2) +
					" " +
					project(d.parent.x, d.parent.y)
				);
			}
		)
		.remove();

	// Stash the old positions for transition.
}

function click(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	update(d);
}

function color(d) {
	return d._children
		? "#3182bd" // collapsed package
		: d.children
		? "#c6dbef" // expanded package
		: "#fd8d3c"; // leaf node
}

function flatten(root) {
	// hierarchical data to flat data for force layout
	var nodes = [];
	function recurse(node) {
		if (node.children) node.children.forEach(recurse);
		if (!node.id) node.id = ++i;
		else ++i;
		nodes.push(node);
	}
	recurse(root);
	return nodes;
}

function project(x, y) {
	var angle = ((x - 90) / 180) * Math.PI,
		radius = y;
	return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
