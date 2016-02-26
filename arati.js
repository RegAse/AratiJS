function Arati() {
	this.router = {};
}

Arati.prototype = {
	setController: function(controllerName, file) {
		console.log("Set controller here.");
	},
	setRouter: function(router) {
		this.router = router;
	},
	update: function(name, value) {
		console.log("Update: name = " + name + ", value = " + value);
		for (var i = this.router.currentRoute.view.dict[name].length - 1; i >= 0; i--) {
			var output = Utility.ReplaceWithVariables(this.router.currentRoute.view.dict[name][i].template, router.currentRoute.controller);
			this.router.currentRoute.view.dict[name][i].element.innerHTML = output;
		}
	}
}

// Initialize Arati
var Arati = new Arati();

function Request(url, success) {
	console.log("Requesting url: " + url);
	var xmlhttp;

	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}

    xmlhttp.onreadystatechange = function() {
    	if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
    		if (xmlhttp.status == 200) {
    			success(xmlhttp.responseText);
    		}
    		else {
    			console.log("An error occured during the Request.");
    		}
    	}
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function Utility() {
	
}

Utility.AddScriptToDOM = function(url, onload) {
	var script = document.createElement("script");
	
	script.onload = onload;
	script.setAttribute("araticontrollerremove", "");
	document.body.appendChild(script);
	script.src = url + (Arati.devMode ? "?ts=" + Date.now() : "");
	// TODO: FIX:ANNOYING CACHE PROBLEM
}

Utility.ReplaceWithVariables = function(html, model) {
	var regex = new RegExp('{{(.*)}}', 'gi');
	var match = html.match(regex);
	if (match != null) {
		for (var i = match.length - 1; i >= 0; i--) {
			var regex = new RegExp(match[i], 'gi');
			var variable = match[i].replace('{{', '');

			variable = variable.replace('}}', '');
			variable = variable.trim();

			if (typeof model[variable] == 'function') {
				html = html.replace(regex, model[variable]())
			}
			else {
				html = html.replace(regex, model[variable]);
			}
		}
	}
	return html;
}
Utility.resolve = function(cur, ns) {
    ns = ns.split('.');

    while (cur && ns[0])
        cur = cur[ns.shift()];

    return cur;

}
Utility.regexReplaceWithVariable = function(html, model, refrenceName) {
	if (html != null) {
		// Find all the variables in this element
		var regex = new RegExp('{{(.*)}}', 'gi');
		var match = html.match(regex);

		if (match != null) {
			for (var x = match.length - 1; x >= 0; x--) {
				var regex = new RegExp(match[x], 'gi');
				var variable = match[x].replace('{{', '');

				variable = variable.replace('}}', '');
				variable = variable.trim();

				//Remove the refrence name
				if (refrenceName != null && refrenceName != "") {
					variable = variable.replace(refrenceName + ".", "");
				}

				if (typeof model[variable] == 'function') {
					html = html.replace(regex, model[variable]())
				}
				else {
					html = html.replace(regex, Utility.resolve(model, variable));
				}
			}
		}
	}
	return html;
}

function View(view, route) {
	this.raw = view;
	this.route = route;
	this.dict = {};
}

View.prototype = {
	populate: function() {
		var renderViews = document.querySelectorAll('[render-views]');
		if (renderViews.length == 1) {
			var view = renderViews[0];
			//var descendants = this.getAllRegularDescendants(view);
			//console.log(descendants);
			var descendants = ElementProcessor.getAllChildrenLessChildrenWithoutAttributes(view);

			// Loop through all child nodes.
			for (var i = 0; i < descendants.length; i++) {
				var html = descendants[i].innerHTML;

				if (html != null && descendants[i].getAttribute("ar-foreach") == null) {
					
					html = Utility.regexReplaceWithVariable(html, this.route.controller);

					descendants[i].innerHTML = html;
				}
				else if (descendants[i].nodeName = "#text") {
					var tex = descendants[i].data;
					var text = Utility.regexReplaceWithVariable(tex, this.route.controller["numbers"][0]);
					descendants[i].data = text;
				}
			}
		}
	},
	populateElement: function(element, context, as) {
		if (element.nodeName != "#text") {
			element.innerHTML = Utility.regexReplaceWithVariable(element.innerHTML, context, as);
		}
		else {
			element.data = Utility.regexReplaceWithVariable(element.data, context, as);
		}
	},
	populateElements: function(elements, context, as) {
		for (var i = elements.length - 1; i >= 0; i--) {
			this.populateElement(elements[i], context, as);
		}
	},
	populateForeach: function(eachElement, context) {
		var temp = eachElement.getAttribute("ar-foreach").split(" as ");
		var propertyName = temp[0];
		var as = temp[1];

		console.log("Processing: " + propertyName + " as: " + as);
		
		// do this x many times
		for (var x = context[propertyName].length - 1; x >= 0; x--) {
			var clone = eachElement.cloneNode(true);

			eachElement.parentNode.insertBefore(clone, eachElement.nextSibling);

			var elements = ElementProcessor.getAllChildrenLessChildrenWithoutAttributes(clone);

			// Elements to populate inside foreach.
			this.populateElements(elements, context[propertyName][x], as);

			// Then check if the element has another foreach then process those
			var eachElements = ElementProcessor.getAllChildrenWithAttribute(clone, "ar-foreach");
			for (var i = eachElements.length - 1; i >= 0; i--) {
				this.populateForeach(eachElements[i], context[propertyName][x]);
			}
		}

		eachElement.style.display = "none";
	},
	populateAllForeach: function() {
		// Populate a foreach
		/* Need to allow for foreach inside a foreach */
		var eachElement = document.querySelectorAll("[render-views]")[0];
		var eachElements = ElementProcessor.getAllChildrenWithAttribute(eachElement, "ar-foreach");
		for (var i = eachElements.length - 1; i >= 0; i--) {
			try{
				this.populateForeach(eachElements[i], this.route.controller);
			} catch(err)
			{
				console.log("[Arati ERROR] a variable was undefined when trying to run the foreach loop.");
			}
		}
	},
	load: function() {
		var renderViews = document.querySelectorAll('[render-views]');
		renderViews[0].innerHTML = this.raw;
		this.storeElements();
		this.populate();
		this.populateAllForeach();
	},
	storeElements: function() {
		var dict = {}
		var eles = document.querySelectorAll("[ar-update]");
		for (var i = eles.length - 1; i >= 0; i--) {
			var att = eles[i].getAttribute("ar-update");
			var di = dict[att];
			if (di != null) {
				dict[att].push({"element": eles[i], "template": eles[i].innerHTML});
			}
			else {
				dict[att] = [{"element": eles[i], "template": eles[i].innerHTML}];
			}
		}
		this.dict = dict;
	}
}

function Router() {
	this.routes = [];
	this.currentRoute = {};

	var that = this;
	window.addEventListener('hashchange', function() {
		that.hashChanged();
	});
}

Router.prototype = {
	registerRoute: function(url, controllerName, viewPath, controllerPath) {
		this.routes.push({url: url, viewPath: viewPath, controllerPath: controllerPath, controllerName});
	},
	start: function() {
		console.log("Current route url: " + window.location.hash.slice(1));
		var currentUrl = window.location.hash.slice(1);

		this.currentRoute = this.findRoute(currentUrl);
		console.log("Found the route");

		this.LoadCurrentRoute(true, true);
	},
	findRoute: function(url) {
		for (var i = this.routes.length - 1; i >= 0; i--) {
			if (this.routes[i].url == url) {
				return this.routes[i];
			}
		}
		return false;
	},
	LoadCurrentRoute: function(render, loadController) {
		var that = this;
		Request(this.currentRoute.viewPath, function(response) {
			// Succesfully loaded the view.

			// Create a new view.
			var view = new View(response, that.currentRoute);
			that.currentRoute.view = view;
			
			var url = "js/controllers/" + that.currentRoute.controllerPath + ".js";
			var scripts = document.querySelectorAll('[araticontrollerremove]')
			for (var i = scripts.length - 1; i >= 0; i--) {
				document.body.removeChild(scripts[i]);
			}
			Utility.AddScriptToDOM(url, function(){
				// the script was loaded 
				that.currentRoute.controller = window[that.currentRoute.controllerName];
					if (render) {
						that.currentRoute.view.load();
					}
				// try {
					
				// } catch(error){
				// 	console.log("[Arati ERROR] The controller was not found.");
				// }
				//that.populateCurrentRouteView();
				// NEED TO RECODE populate function
			});
		});
	},
	hashChanged: function() {
		//Set the previous controller to null
		//window[this.currentRoute.controller] = undefined;

		var currentUrl = window.location.hash.slice(1);
		this.currentRoute = this.findRoute(currentUrl);
		this.LoadCurrentRoute(true, true);
	}
}

/* A small library/'class' that deals with common templating challenges */
var ElementProcessor = {
	/* Gets all the children of a element that have a attribute NOT attribute inside attribute */
	getAllChildrenWithAttribute: function(element, attribute){
		var allDescendants = [];
		var queue = [];
		for (var i = element.childNodes.length - 1; i >= 0; i--) {
			queue.push(element.childNodes[i]);
		}
		while (queue.length > 0)
		{
			for (var i = queue.length - 1; i >= 0; i--) {
				if (queue[i].nodeName != "#text" && queue[i].getAttribute(attribute) != null) {
					allDescendants.push(queue[i]);
				}
				else if (queue[i].nodeName != "#text" && queue[i].getAttribute(attribute) == null) {
					for (var i2 = queue[i].children.length - 1; i2 >= 0; i2--) {
						queue.push(queue[i].children[i2]);
					}
				}

				if (i > -1) {
					queue.splice(i, 1);
				}
			}
		}
		return allDescendants;
	},
	getAllRegularDescendants: function(element) {
		var allDescendants = [];
		var queue = [element]
		while (queue.length > 0)
		{
			for (var i = queue.length - 1; i >= 0; i--) {
				if (queue[i].innerHTML != null && queue[i].getAttribute("ar-foreach") == null) {
					allDescendants.push(queue[i]);
					for (var i2 = queue[i].childNodes.length - 1; i2 >= 0; i2--) {
						queue.push(queue[i].childNodes[i2]);
					}
				}
				if (i > -1) {
					queue.splice(i, 1);
				}
			}
		}
		return allDescendants;
	},
	getAllChildrenLessChildrenWithoutAttributes: function(element, ignoreWithAttributes) {
		// Get all nodes that don't have children.
		var allDescendants = [];
		var queue = []
		for (var i = element.childNodes.length - 1; i >= 0; i--) {
			queue.push(element.childNodes[i]);
		}
		while (queue.length > 0)
		{
			for (var i = queue.length - 1; i >= 0; i--) {
				if (queue[i].nodeName != "#text" && queue[i].children.length == 0 && queue[i].getAttribute("ar-foreach") == null) {
					// console.log(queue[i]);
					allDescendants.push(queue[i]);
				}
				else if (queue[i].nodeName != "#text" && queue[i].getAttribute("ar-foreach") == null) {
					for (var i2 = queue[i].childNodes.length - 1; i2 >= 0; i2--) {
						queue.push(queue[i].childNodes[i2]);
					}
				}

				if (queue[i].nodeName == "#text" && queue[i].data != null) {
					// console.log("This is a text node: " + queue[i].data);
					allDescendants.push(queue[i]);
				}

				if (i > -1) {
					queue.splice(i, 1);
				}
			}
		}
		return allDescendants;
	},
	getAllChildrenLessChildren: function() {
		// Get all nodes that don't have children.
		var element = document.querySelector("[render-views]");
		var allDescendants = [];
		var queue = [element]
		while (queue.length > 0)
		{
			for (var i = queue.length - 1; i >= 0; i--) {
				if (queue[i].nodeName != "#text" && queue[i].children.length == 0) {
					// console.log(queue[i]);
					allDescendants.push(queue[i]);
				}
				else if (queue[i].nodeName != "#text") {
					for (var i2 = queue[i].childNodes.length - 1; i2 >= 0; i2--) {
						queue.push(queue[i].childNodes[i2]);
					}
				}

				if (queue[i].nodeName == "#text" && queue[i].data != null) {
					// console.log("This is a text node: " + queue[i].data);
					allDescendants.push(queue[i]);
				}

				if (i > -1) {
					queue.splice(i, 1);
				}
			}
		}
		return allDescendants;
	}
}