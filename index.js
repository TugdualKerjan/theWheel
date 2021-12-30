var svg = d3.select("svg");
var g = svg.append("g");

var width = svg.attr("width");
var height = svg.attr("height");

d3.json("data.json", function (data) {
	var links = [];

	for (var i = 0; i < data.nodes.length; i++) {
		// if (data.nodes[i].bottom == 1) {
			links.push({
				source: data.nodes[i].parent,
				target: data.nodes[i].name,
				value: data.nodes[i].value,
			});
		// }	
	}

	// Initialize the links
	var link = g
		.append("g")
		.selectAll("line")
		.data(links)
		.enter()
		.append("line")
		.style("stroke", "#aaa");

	var textsAndNodes = g
		.append("g")
		.selectAll("g")
		.data(data.nodes)
		.enter()
		.append("g");

	// Initialize the nodes
	var circles = textsAndNodes
		.append("circle")
		.attr("r", (d) => (5 - d.value) ** 2)
		.style("fill", "#69b3a2");

	var texts = textsAndNodes
		.append("text")
		.text((d) => d.name)
		.attr("style", (d) => "font-size: " + (5 - d.value) ** 2 + "px;");

	// Let's list the force we wanna apply on the network
	var simulation = d3
		.forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
		.force(
			"link",
			d3
				.forceLink()
				.strength(function (d) {
					// Seperates heavy and lightweight nodes
					return d3
						.scaleLinear()
						.range([3, 3.1])
						.domain(
							d3.extent(links, function (d) {
								return d.value;
							})
						)(d.value);
				}) // This force provides links between nodes
				.id(function (d) {
					console.log(d);
					return d.name;
				}) // This provide the id of a node
				.links(links) // and this the list of links
		)
		.force("charge", d3.forceManyBody().strength(-15)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
		.force(
			"center",
			d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2)
		) // This force attracts nodes to the center of the svg area
		.on("tick", ticked);

	// This function is run at each iteration of the force algorithm, updating the nodes position.
	function ticked() {
		link
			.attr("x1", function (d) {
				return d.source.x;
			})
			.attr("y1", function (d) {
				return d.source.y;
			})
			.attr("x2", function (d) {
				return d.target.x;
			})
			.attr("y2", function (d) {
				return d.target.y;
			});

		textsAndNodes.attr(
			"transform",
			(d) => "translate(" + d.x + ", " + d.y + ")"
		);
	}

	//add zoom capabilities
	var zoom_handler = d3.zoom().on("zoom", zoom_actions);

	zoom_handler(svg);

	//Zoom functions
	function zoom_actions() {
		g.attr("transform", d3.event.transform);
	}

	//add drag capabilities
	var drag_handler = d3
		.drag()
		.on("start", drag_start)
		.on("drag", drag_drag)
		.on("end", drag_end);

	drag_handler(textsAndNodes);

	//Drag functions
	//d is the node
	function drag_start(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	//make sure you can't drag the circle outside the box
	function drag_drag(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function drag_end(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
});
