d3.json("data2.json", (data) => {
	networkChart = renderBeautifulRadius()
		.svgHeight(window.innerHeight)
		.svgWidth(window.innerWidth)
		.container("#myGraph")
		.data(data)
		.debug(false)
		.run();
});

function renderBeautifulRadius(params) {
	// exposed variables
	var attrs = {
		id: "id" + Math.floor(Math.random() * 1000000),
		svgWidth: 960,
		svgHeight: 600,
		marginTop: 0,
		marginBottom: 0,
		marginRight: 0,
		marginLeft: 0,
		nodeRadius: 18,
		container: "body",
		distance: 100,
		hiddenChildLevel: 5,
		//hiddenChildLevel: 5,
		nodeStroke: "#41302D",
		nodeTextColor: "#E5E5E5",
		linkColor: "#303030",
		activeLinkColor: "blue",
		hoverOpacity: 0.5,
		maxTextDisplayZoomLevel: 1,
		textDisplayed: true,
		lineStrokeWidth: "1.5px",
		data: null,
		duration: 500
	};

	/*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

	var attrKeys = Object.keys(attrs);
	attrKeys.forEach(function (key) {
		if (params && params[key]) {
			attrs[key] = params[key];
		}
	});

	//innerFunctions which will update visuals
	var updateData;
	var filter;
	var flatten;
	var tree;

	var main = function (selection) {
		selection.each(function scope() {
			//calculated properties
			var calc = {};
			calc.chartLeftMargin = attrs.marginLeft;
			calc.chartTopMargin = attrs.marginTop;
			calc.chartWidth =
				attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
			calc.chartHeight =
				attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

			//########################## HIERARCHY STUFF  #########################
			var hierarchy = {};
			hierarchy.root = d3
				.stratify()
				.id(function (d) {
					return d.name;
				})
				.parentId(function (d) {
					return d.parent;
				})(attrs.data);

			//###########################   BEHAVIORS #########################
			var behaviors = {};
			behaviors.zoom = d3
				.zoom()
				.wheelDelta(() => {
					return -d3.event.deltaY * (d3.event.deltaMode ? 10 : 1) / 4500;
				})
				.on("zoom", zoomed);
			behaviors.drag = d3
				.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended);

			//###########################   LAYOUTS #########################
			var layouts = {};

			// custom radial kayout
			layouts.tree = d3
				.tree()
				.size([2 * Math.PI, 1000])
				.separation((a, b) => (a.parent == b.parent ? 5 - a.depth : 2) / Math.pow(a.depth, 1));

			//####################################  DRAWINGS #######################

			//drawing containers
			var container = d3.select(this);

			//add svg
			var svg = container
				.patternify({ tag: "svg", selector: "svg-chart-container" })
				.attr("width", attrs.svgWidth)
				.attr("height", attrs.svgHeight)
				.call(behaviors.zoom);

			//add container g element
			var chart = svg
				.patternify({ tag: "g", selector: "chart" });

			//################################   Chart Content Drawing ##################################

			//link wrapper
			var linksWrapper = chart.patternify({
				tag: "g",
				selector: "links-wrapper",
			}).attr(
				"transform",
				"translate(" +
				calc.chartWidth / 2 +
				"," +
				calc.chartHeight * 0.55555 +
				")scale(0.4)"
			);

			//node wrapper
			var nodesWrapper = chart.patternify({
				tag: "g",
				selector: "nodes-wrapper",
			}).attr(
				"transform",
				"translate(" +
				calc.chartWidth / 2 +
				"," +
				(calc.chartHeight * 0.55555) + 
				")scale(0.4)"
			);
			var nodes, links, enteredNodes;

			// reusable function which updates visual based on data change
			update();

			function update() {

				var test = layouts.tree(hierarchy.root);
				var nodesArr = test.descendants();
				var linksArr = test.links();
				var nodes, enteredNodes, enteredLinks;

				let links = linksWrapper
					.selectAll("path")
					.data(linksArr, (d) => d.source.data.name + "_" + d.target.data.name);

				// Enter any new links at the parent's previous position.
				enteredLinks = links
					.enter()
					.insert("path", "g")
					.attr("class", "link")
					.transition()
					.duration(attrs.duration)

				// Transition links to their new position.
				links
					.merge(enteredLinks)
					.transition()
					.duration(attrs.duration)
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
					.duration(attrs.duration)
					.attr(
						"d",
						d3
							.linkRadial()
							.angle((d) => d.x)
							.radius((d) => d.y)
							.target((d) => d.source)
					)

				// Stash the old positions for transition.
				nodes = nodesWrapper.selectAll(".node").data(nodesArr, (d) => {
					return d.id || (d.id = ++i);
				});

				var enteredNodes = nodes
					.enter()
					.append("g")
					.attr("class", "node")

				//bind event handlers
				enteredNodes
					.on("click", click)
					.on("mouseenter", nodeMouseEnter)
					.on("mouseleave", nodeMouseLeave)
					.call(behaviors.drag);

				//Add text and circle
				enteredNodes
					.append("text")
					.attr("class", "node-texts")
					.attr("dy", "0.31em")
					.text((d) => d.data.name)
					.style("display", attrs.textDisplayed ? "initial" : "none");


				enteredNodes
					.append("circle")
					.attr("r", 5)
					.style("fill", color);

				// Transition nodes to their new position.
				nodes
					.merge(enteredNodes)
					.transition()
					.duration(attrs.duration)
					.attr("transform", (d) => `
						rotate(${(d.x * 180) / Math.PI - 90})
						translate(${d.y},0)
						scale(1)`
					);

				// Transition exiting nodes to the parent's new position.
				nodes
					.exit()
					.transition()
					.duration(attrs.duration)
					.attr(
						"transform",
						(d) => `
				rotate(${(d.parent.x * 180) / Math.PI - 90})
				translate(${d.parent.y},0)
				scale(0)`
					) //for the animation to either go off there itself or come to centre

				nodes.select("circle").style("fill", color);

				//Rotate text
				nodesWrapper
					.selectAll("g text")
					.attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
					.attr("text-anchor", (d) =>
						d.x < Math.PI === !d.children ? "start" : "end"
					)
					.attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null));
			}


			//####################################### EVENT HANDLERS  ########################

			// zoom handler
			function zoomed() {
				//get transform event
				var transform = d3.event.transform;
				attrs.lastTransform = transform;

				// apply transform event props to the wrapper
				chart.attr("transform", transform);

				svg
					.selectAll(".link")
					.attr(
						"stroke-width",
						attrs.lineStrokeWidth /
						(attrs.lastTransform ? attrs.lastTransform.k : 1)
					);
				// hide texts if zooming is less than certain level
				if (transform.k < attrs.maxTextDisplayZoomLevel) {
					svg.selectAll(".node-texts").style("display", "none");
					attrs.textDisplayed = false;
				} else {
					svg.selectAll(".node-texts").style("display", "initial");
					attrs.textDisplayed = true;
				}
			}

			//handler drag start event
			function dragstarted(d) {
				//disable node fixing
				nodes.each((d) => {
					d.fx = null;
					d.fy = null;
				});
			}

			// handle dragging event
			function dragged(d) {
				// make dragged node fixed
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			}

			//-------------------- handle drag end event ---------------
			function dragended(d) {
				// we are doing nothing, here , aren't we?
			}

			//-------------------------- node mouse hover handler ---------------
			function nodeMouseEnter(d) {
				//get hovered node
				var node = d3.select(this);

				//get links
				var links = hierarchy.root.links();

				//get hovered node connected links
				var connectedLinks = links.filter(
					(l) => l.source.id == d.id || l.target.id == d.id
				);

				//get hovered node linked nodes
				var linkedNodes = connectedLinks
					.map((s) => s.source.id)
					.concat(connectedLinks.map((d) => d.target.id));

				//reduce all other nodes opacity
				nodesWrapper
					.selectAll(".node")
					.filter((n) => linkedNodes.indexOf(n.id) == -1)
					.attr("opacity", attrs.hoverOpacity);

				//reduce all other links opacity
				linksWrapper.selectAll(".link").attr("opacity", attrs.hoverOpacity);

				//highlight hovered nodes connections
				linksWrapper
					.selectAll(".link")
					.filter((l) => l.source.id == d.id || l.target.id == d.id)
					.attr("opacity", 1)
					.attr("stroke", attrs.activeLinkColor);
			}

			// --------------- handle mouseleave event ---------------
			function nodeMouseLeave(d) {
				// return things back to normal
				nodesWrapper.selectAll(".node").attr("opacity", 1);
				linksWrapper
					.selectAll(".link")
					.attr("opacity", 1)
					.attr("stroke", attrs.linkColor);
			}

			// --------------- handle node click event ---------------
			// function nodeClick(d) {
			// 	//free fixed nodes
			// 	nodes.each((d) => {
			// 		d.fx = null;
			// 		d.fy = null;
			// 	});

			// 	// collapse or expand node
			// 	if (d.children) {
			// 		d._children = d.children;
			// 		d.children = null;
			// 		update();
			// 		force.simulation.restart();
			// 		force.simulation.alphaTarget(0.15);
			// 	} else if (d._children) {
			// 		d.children = d._children;
			// 		d._children = null;
			// 		update(d);
			// 		force.simulation.restart();
			// 		force.simulation.alphaTarget(0.15);
			// 	} else {
			// 		//nothing is to collapse or expand
			// 	}
			// 	freeNodes();
			// }

			function click(d) {
				if (d.children) {
					d._children = d.children;
					d.children = null;
				} else {
					d.children = d._children;
					d._children = null;
				}
				update();
			}

			function color(d) {
				return d._children
					? "#3182bd" // collapsed package
					: d.children
						? "#c6dbef" // expanded package
						: "#fd8d3c"; // leaf node
			}

			//#########################################  UTIL FUNCS ##################################
			updateData = function () {
				main.run();
			};

			function debug() {
				if (attrs.isDebug) {
					//stringify func
					var stringified = scope + "";

					// parse variable names
					var groupVariables = stringified
						//match var x-xx= {};
						.match(/var\s+([\w])+\s*=\s*{\s*}/gi)
						//match xxx
						.map((d) => d.match(/\s+\w*/gi).filter((s) => s.trim()))
						//get xxx
						.map((v) => v[0].trim());

					//assign local variables to the scope
					groupVariables.forEach((v) => {
						main["P_" + v] = eval(v);
					});
				}
			}
			debug();
		});
	};

	//----------- PROTOTYEPE FUNCTIONS  ----------------------
	d3.selection.prototype.patternify = function (params) {
		var container = this;
		var selector = params.selector;
		var elementTag = params.tag;
		var data = params.data || [selector];

		// pattern in action
		var selection = container.selectAll("." + selector).data(data);
		selection.exit().remove();
		selection = selection.enter().append(elementTag).merge(selection);
		selection.attr("class", selector);
		return selection;
	};


	//https://github.com/bumbeishvili/d3js-boilerplates#orderby
	Array.prototype.orderBy = function (func) {
		this.sort((a, b) => {
			var a = func(a);
			var b = func(b);
			if (typeof a === "string" || a instanceof String) {
				return a.localeCompare(b);
			}
			return a - b;
		});
		return this;
	};

	//##########################  BOILEPLATE STUFF ################

	//dinamic keys functions
	Object.keys(attrs).forEach((key) => {
		// Attach variables to main function
		return (main[key] = function (_) {
			var string = `attrs['${key}'] = _`;
			if (!arguments.length) {
				return eval(` attrs['${key}'];`);
			}
			eval(string);
			return main;
		});
	});

	//set attrs as property
	main.attrs = attrs;

	//debugging visuals
	main.debug = function (isDebug) {
		attrs.isDebug = isDebug;
		if (isDebug) {
			if (!window.charts) window.charts = [];
			window.charts.push(main);
		}
		return main;
	};

	//exposed update functions
	main.data = function (value) {
		if (!arguments.length) return attrs.data;
		attrs.data = value;
		if (typeof updateData === "function") {
			updateData();
		}
		return main;
	};

	// run  visual
	main.run = function () {
		d3.selectAll(attrs.container).call(main);
		return main;
	};

	main.filter = function (filterParams) {
		if (!arguments.length) return attrs.filterParams;
		attrs.filterParams = filterParams;
		if (typeof filter === "function") {
			filter();
		}
		return main;
	};

	return main;
}