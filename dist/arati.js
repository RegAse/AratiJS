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
/*
 * Performs http/https requests
*/
function Request() {

}

Request.prototype = {
	get: function(url, success, info) {
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
	    			success(xmlhttp.responseText, info);
	    		}
	    		else {
	    			console.log("An error occured during the Request.");
	    		}
	    	}
	    }
	    xmlhttp.open("GET", url, true);
	    xmlhttp.send();
	},
	getAll: function(urlsObject, success) {
		var res = {};
		var checkins = 0;
		var done = false;
		var urlsObjectLen = 0;
		for(var propertyName in urlsObject) {
			urlsObjectLen++;
			Request.get(urlsObject[propertyName], function(response, info) {
				checkins++;
				res[info] = response;
				if (done && checkins == urlsObjectLen) {
					success(res);
				}
			}, propertyName);
		}
		done = true;
	}
}

var Request = new Request();
/* Utility */

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

/**
 * Replaces all instances of {{variable}} with 
 * the corresponding variable from the model
 * @param {String} text 
 * @param {Object} model
 * @param {Object} otherModel
 * @param {String} priorityContextName
 * @return {String} processedText
 */
Utility.replaceWithVariables = function(text, model, otherModel, priorityContextName) {
	var i = 0, opening = 0, closing = 0, newText = "";

	// Run through the string
	while(i < text.length) {
		if (text[i] == "{" && text[i + 1] == "{") {
			opening = i;
			// jump over '{{'
			i += 2;
		}
		else if (text[i] == "}" && text[i + 1] == "}") {
			var oper = text.substring(opening + 2, i).trim();
			var fnIndex = oper.indexOf('.');
			var firstName = oper.substring(0, fnIndex);

			// Check if the variable is from the model or the controller
			if (firstName == priorityContextName) {
				// Need to remove the prefix of the variable name
				oper = oper.substring(fnIndex + 1, oper.length);

				// replace the string with a value from the model
				oper = Utility.resolve(otherModel, oper);
			}
			else {
				// replace the string with a value from the controller
				oper = Utility.resolve(model, oper);
				if (oper == undefined) {
					console.log("WARNING THIS SHOULD NOT HAPPEN");
					console.log(model);
					console.log(oper);
				};
			}

			// Add the text that came before the opening of the tag.
			newText += text.substring(closing, opening);

			// Then add the value of the variable/function..
			newText += oper;

			closing = i + 2;
			// jump over '}}'
			i += 2;
		}
		else {
			// Iterate normaly through the string.
			i += 1;
		}
	}
	// Then finally add the ending of the string which comes after the last '}}'
	newText += text.substring(closing, text.length);
	return newText;
}

/**
 * TODO: Make function more readable
 *
 * Resolves a variable or a call to
 * a function in a object
 * @param {Object} current
 * @param {String} next
 * @return {Object} current 
 */
Utility.resolve = function(current, next) {
	next = next.split('.');

	while (current && next[0]) {
		var nh = next.shift();
		if (current[nh] == undefined) {
			var spli = nh.split("(");
			var functionName = spli[0];
			var args = spli[1].replace(')', '').split(',');
			for (var i = args.length - 1; i >= 0; i--) {
				args[i] = args[i].trim();
			}

			var s = current[functionName].apply(current, args);
			return s;
		}
		else {
			current = current[nh];
		}
	}
	return current;
}
/*
	Stores info about the current view and
	can update the view in-part or fully.
*/
function View(view, route) {
	this.raw = view;
	this.route = route;
	this.dict = {};
	this.refs = {};
}

View.prototype = {
	populate: function() {
		//var renderViews = document.querySelectorAll('[render-view]');
		var div = document.createElement('div');
		div.innerHTML = this.raw;
		
		if (true) {
			var view = div;
			var queue = []
			for (var i = view.childNodes.length - 1; i >= 0; i--) {
				queue.push(view.childNodes[i]);
			}
			while (queue.length > 0)
			{
				for (var i = queue.length - 1; i >= 0; i--) {
					var element = queue.pop();
					if (element.nodeName != "#text" && element.nodeName != "#comment" && element.children.length == 0 && element.getAttribute("ar-foreach") == null) {
						// console.log(element);
						var html = element.innerHTML;

						if (html != null) {
							
							html = Utility.replaceWithVariables(html, this.route.controller);

							element.innerHTML = html;

							// NEED TO PROCESS ATTRIBUTES
							for (var i = element.attributes.length - 1; i >= 0; i--) {
								var attribute = element.attributes[i];
								attribute.value = Utility.replaceWithVariables(attribute.value, this.route.controller);
							}
						}
					}
					else if (element.nodeName != "#text" && element.nodeName != "#comment" && element.getAttribute("ar-foreach") == null) {
						for (var i2 = element.childNodes.length - 1; i2 >= 0; i2--) {
							queue.push(element.childNodes[i2]);
						}
					}
					else if (element.nodeName == "#text" && element.data != null && element.data.trim().length != 0) {
						var tex = element.data;
						var text = Utility.replaceWithVariables(tex, this.route.controller);
						element.data = text;
					}
				}
			}
		}
		document.querySelector('[render-view]').innerHTML = div.innerHTML;
	},
	populateElement: function(element, context, priorityContextName) {
		if (element.nodeName != "#text") {
			element.innerHTML = Utility.replaceWithVariables(element.innerHTML, this.route.controller, context, priorityContextName);

			this.populateElementAttributes(element, context, priorityContextName);
		}
		else {
			element.data = Utility.replaceWithVariables(element.data, this.route.controller, context, priorityContextName);
		}
	},
	populateElementAttributes: function(element, context, priorityContextName) {
		// NEED TO PROCESS ATTRIBUTES
		for (var i = element.attributes.length - 1; i >= 0; i--) {
			var attribute = element.attributes[i];
			attribute.value = Utility.replaceWithVariables(attribute.value, this.route.controller, context, priorityContextName);
		}
	},
	populateElements: function(elementsObj, context, priorityContextName) {
		console.log("Populate Elements: the PriorityContextName = " + priorityContextName);

		for (var i = elementsObj["nonParentElements"].length - 1; i >= 0; i--) {
			this.populateElement(elementsObj["nonParentElements"][i], context, priorityContextName);
		}

		for (var i2 = elementsObj["parentElements"].length - 1; i2 >= 0; i2--) {
			this.populateElementAttributes(elementsObj["parentElements"][i2], context, priorityContextName);
		}
	},
	populateForeach: function(eachElement, context, controller) {
		var temp = eachElement.getAttribute("ar-foreach").split(" as ");
		var propertyName = temp[0];
		var as = temp[1];

		console.log("Processing: " + propertyName + " as: " + as);

		var varia = Utility.resolve(context, propertyName);
		
		// do this x many times
		for (var x = varia.length - 1; x >= 0; x--) {
			// Clone a html element
			var clone = eachElement.cloneNode(true);

			eachElement.parentNode.insertBefore(clone, eachElement.nextSibling);

			var elementsObj = ElementProcessor.getAllChildren(clone);

			// Elements to populate inside foreach.
			this.populateElements(elementsObj, varia[x], as);

			// Then check if the element has another foreach then process those
			var eachElements = ElementProcessor.getAllChildrenWithAttribute(clone, "ar-foreach");
			for (var i = eachElements.length - 1; i >= 0; i--) {
				this.populateForeach(eachElements[i], varia[x], controller);
			}
		}

		eachElement.style.display = "none";
	},
	populateAllForeach: function() {
		var eachElement = document.querySelectorAll("[render-view]")[0];
		var eachElements = ElementProcessor.getAllChildrenWithAttribute(eachElement, "ar-foreach");
		for (var i = eachElements.length - 1; i >= 0; i--) {
			try{
				this.populateForeach(eachElements[i], this.route.controller, this.route.controller);
			} catch(err)
			{
				console.log("[Arati ERROR] a variable was undefined when trying to run the foreach loop." + err);
			}
		}
	},
	populateAllElements: function() {
		this.populate();	
		this.populateAllForeach();
	},
	/* Executes when the view has loaded*/
	load: function() {
		console.log("Loaded");
		var renderViews = document.querySelectorAll('[render-view]');
		//renderViews[0].innerHTML = this.raw;
		//this.storeElements();
		//console.log(this.route.controller);
		if (this.route.controller.init != null) {
			var bound = this.populateAllElements.bind(this);
			this.route.controller.init(bound);
		}
		else {
			this.populateAllElements();
		}
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
	this.routeParams = {};

	var that = this;
	window.addEventListener('hashchange', function() {
		that.hashChanged();
	});
}

Router.prototype = {
	registerRoute: function(url, controllerName, viewPath, controllerPath) {
		this.routes.push(
			{
				"url": url, 
				"viewPath": viewPath, 
				"controllerPath": controllerPath, 
				"controllerName": controllerName
			}
		);
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
			var routeUrl = this.routes[i].url;
			var routeParams = {};
			
			var urlSplit = url.split('/');
			var routeSplitUrl = routeUrl.split('/');
			if (routeSplitUrl.length == urlSplit.length) {
				var possible = true;

				// Check if this is the route if so return it
				for (var i2 = 1; i2 < routeSplitUrl.length; i2++) {
					if (routeSplitUrl[i2] != urlSplit[i2] && !~routeSplitUrl[i2].indexOf('{')) {
						possible = false;
						break;
					}
					if (~routeSplitUrl[i2].indexOf('{')) {
						var routeParams1 = routeSplitUrl[i2].split(/\{(.*?)}/);
						for (var par1 = routeParams1.length - 1; par1 >= 0; par1--) {
							if (routeParams1[par1] != "") {
								// Need to fix having two in a single slash.
								routeParams[routeParams1[par1]] = urlSplit[i2];
							}
						}
					}
				}
				if (possible) {
					this.routes[i]["routeParams"] = routeParams;
					return this.routes[i];
				}
			}
		}
		return false;
	},
	LoadCurrentRoute: function(render, loadController) {
		var that = this;
		Request.get(this.currentRoute.viewPath, function(response) {
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
				if (queue[i].nodeName != "#text" && queue[i].nodeName != "#comment" && queue[i].getAttribute(attribute) != null) {
					allDescendants.push(queue[i]);
				}
				else if (queue[i].nodeName != "#text" && queue[i].nodeName != "#comment" && queue[i].getAttribute(attribute) == null) {
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
	/* 
	  Gets all elements that don't have children and and return them in separate 
	  array from the ones that have children.
	*/
	getAllChildren: function(element) {
		var nonParentElements = [];
		var parentElements = [];

		var queue = []
		for (var i = element.childNodes.length - 1; i >= 0; i--) {
			queue.push(element.childNodes[i]);
		}
		while (queue.length > 0)
		{
			var child = queue.pop();
			if (child.nodeName != "#text" && child.children.length == 0 && child.getAttribute("ar-foreach") == null) {
				nonParentElements.push(child);
			}
			else if (child.nodeName != "#text" && child.getAttribute("ar-foreach") == null) {
				parentElements.push(child);
				for (var i2 = child.childNodes.length - 1; i2 >= 0; i2--) {
					queue.push(child.childNodes[i2]);
				}
			}
			if (child.nodeName == "#text") {
				nonParentElements.push(child);
			}
		}
		return {"nonParentElements": nonParentElements, "parentElements": parentElements};
	},
	getAllChildrenLessChildren: function() {
		// Get all nodes that don't have children.
		var element = document.querySelector("[render-view]");
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