const svg = d3
	.select("svg")
	.style("width", "100%")
	.style("height", "auto")
	.style("padding", "10px")
	.style("box-sizing", "border-box")
	.style("font", "12px sans-serif");

const stratify = d3
	.stratify()
	.id(function (d) {
		return d.name;
	})
	.parentId(function (d) {
		print(d);
		return d.parent;
	});

let tree = (data) =>
	d3
		.tree()
		.size([2 * Math.PI, 500])
		.separation((a, b) => (a.parent == b.parent ? 1 : 3))(stratify(data));

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
	function newdata(animate = true) {
		let root = tree(data);
		let links_data = root.links();
		let links = linkgroup
			.selectAll("path")
			.data(links_data, (d) => d.source.data.name + "_" + d.target.data.name);

		links.exit().remove();

		let newlinks = links
			.enter()
			.append("path")
			.attr(
				"d",
				d3
					.linkRadial()
					.angle((d) => d.x)
					.radius(0.1)
			);

		let t = d3
			.transition()
			.duration(animate ? 400 : 0)
			.ease(d3.easeLinear)
			.on("end", function () {
				const box = g.node().getBBox();
				svg
					.transition()
					.duration(1000)
					.attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
			});

		let alllinks = linkgroup.selectAll("path");
		alllinks.transition(t).attr(
			"d",
			d3
				.linkRadial()
				.angle((d) => d.x)
				.radius((d) => d.y)
		);

		let nodes_data = root.descendants().reverse();
		let nodes = nodegroup.selectAll("g").data(nodes_data, function (d) {
			if (d.parent) {
				return d.parent.data.name + d.data.name;
			}
			return d.data.name;
		});

		nodes.exit().remove();

		let newnodes = nodes.enter().append("g");

		let allnodes = animate
			? nodegroup.selectAll("g").transition(t)
			: nodegroup.selectAll("g");
		allnodes.attr(
			"transform",
			(d) => `
        rotate(${(d.x * 180) / Math.PI - 90})
        translate(${d.y},0)
      `
		);

		newnodes
			.append("circle")
			.attr("r", 4.5)
			.on("click", function (d) {
				console.log(d.data);
				let altChildren = d.data.altChildren || [];
				let children = d.data.children;
				d.data.children = altChildren;
				d.data.altChildren = children;
				newdata();
			});

		nodegroup.selectAll("g circle").attr("fill", function (d) {
			let altChildren = d.data.altChildren || [];
			let children = d.data.children;
			return d.children ||
				(children && (children.length > 0 || altChildren.length > 0))
				? "#555"
				: "#999";
		});

		newnodes
			.append("text")
			.attr("dy", "0.31em")
			.text((d) => d.data.name)
			.clone(true)
			.lower()
			.attr("stroke", "white");

		nodegroup
			.selectAll("g text")
			.attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
			.attr("text-anchor", (d) =>
				d.x < Math.PI === !d.children ? "start" : "end"
			)
			.attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null));
	}
	newdata(false);
	// document.body.appendChild(svg.node());

	// const box = g.node().getBBox();

	// svg
	// 	.remove()
	// 	.attr("width", box.width)
	// 	.attr("height", box.height)
	// 	.attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
	// return svg.node();
});