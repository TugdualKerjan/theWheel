var duration = 3000;

var nodes_data, links_data;
var i = 0;

const svg = d3
	.select("svg")
	.style("width", "99vw")
	.style("height", "99vh")
	.style("font", "12px sans-serif");

const stratify = d3
	.stratify()
	.id(function (d) {
		return d.name;
	})
	.parentId(function (d) {
		return d.parent;
	});

let tree = d3
	.tree()
	.size([2 * Math.PI, 750])
	.separation((a, b) => (a.parent == b.parent ? 1 : 4));

let root;

const g = svg.append("g");

const linkgroup = g
	.append("g")
	.attr("fill", "none")
	.attr("stroke", "#555")
	.attr("stroke-opacity", 0.4)
	.attr("stroke-width", 1.5);

const nodegroup = g
	.append("g")
	.attr("stroke-linejoin", "round")
	.attr("stroke-width", 3);

d3.json("data2.json", function (error, data) {
	if (error) throw error;

	root = stratify(data);

	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}
	// root.children.forEach((d) => d.children.forEach(collapse));
	update(root);
});

function update(source) {
	var test = tree(root);
	nodes_data = test.descendants();
	links_data = test.links();

	var nodeUpdate;
	var nodes, nodeEnter, linksEnter;


	let t = d3
		.transition()
		.duration(400)
		.ease(d3.easeLinear)
		.on("end", function () {
			const box = g.node().getBBox();
			svg
				.transition()
				.duration(1000)
				.attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
		});

	let links = linkgroup
		.selectAll("path")
		.data(links_data, (d) => d.source.data.name + "_" + d.target.data.name);

	// Enter any new links at the parent's previous position.
	linksEnter = links
		.enter()
		.insert("path", "g")
		.attr("class", "link")
		.transition()
		.duration(duration)
		// .attr(
		// 	"d",
		// 	d3
		// 		.linkRadial()
		// 		.angle((d) => d.x)
		// 		.radius((d) => d.y)
		// 		.target((d) => d.source)
		// );

	// Transition links to their new position.
	links
		.merge(linksEnter)
		.transition()
		.duration(duration)
		.attr(
			"d",
			d3
				.linkRadial()
				.angle((d) => d.x)
				.radius((d) => d.y)
		);

	// Transition exiting nodes to the parent's new position.
	links
		.exit()
		.transition()
		.duration(duration)
		.attr(
			"d",
			d3
				.linkRadial()
				.angle((d) => d.x)
				.radius((d) => d.y)
				.target((d) => d.source)
		)
		// .remove();


	// Stash the old positions for transition.
	nodes = nodegroup.selectAll(".node").data(nodes_data, (d) => {
		return d.id || (d.id = ++i);
	});

	var nodeEnter = nodes
		.enter()
		.append("g")
		.attr("class", "node")
		.on("click", click)
		// .attr(
		// 	"transform",
		// 	(d) => {
		// 		console.log(d.parent); return `
		// 	rotate(${((d.parent) ? d.parent.x * 180 : d.x * 180) / Math.PI - 90})
		// 	translate(${(d.parent) ? d.parent.y : d.y, 0})
		// 	scale(0)`;
		// 	}
		// );

	//Add text and circle
	nodeEnter
		.append("text")
		.attr("dy", "0.31em")
		.text((d) => d.data.name);

	nodeEnter
		.append("circle")
		.attr("r", 5)
		.style("fill", color);

	// Transition nodes to their new position.
	nodes
		.merge(nodeEnter)
		.transition()
		.duration(duration)
		.attr(
			"transform",
			(d) => `
			rotate(${(d.x * 180) / Math.PI - 90})
			translate(${d.y},0)
			scale(1)`
		);

	// Transition exiting nodes to the parent's new position.
	nodes
		.exit()
		.transition()
		.duration(duration)
		.attr(
			"transform",
			(d) => `
			rotate(${(d.parent.x * 180) / Math.PI - 90})
			translate(${d.parent.y},0)
			scale(0)`
		) //for the animation to either go off there itself or come to centre
		// .remove();

	nodes.select("circle").style("fill", color);
	
	//Rotate text
	nodegroup
		.selectAll("g text")
		.attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
		.attr("text-anchor", (d) =>
			d.x < Math.PI === !d.children ? "start" : "end"
		)
		.attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null));
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
