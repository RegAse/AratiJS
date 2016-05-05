/*
	We always only want ONE instance of Arati.
*/
function Arati() {
	console.log("The entry point");

	this.root = document.querySelector("[ar-app]");
	this.router = {};
	this.views = [];
	this.controllers = {};
	this.globals = {};
}

Arati.prototype = {
	addVariable: function(name, value) {
		this.globals[name] = value;
	},
	getVariable: function(name) {
		return this.globals[name];
	},
	variableExists: function(name) {
		if (this.globals[name]) {
			return true;
		}
		return false;
	},
	/* Add a controller to the app*/
	addController: function(controllerName, func) {
		this.controllers[controllerName] = func;
	},
	/* Add a view to the app. */
	addView: function(view) {
		this.views.push(view);
	},
	/* Set the router */
	setRouter: function(router) {
		this.router = router;
		this.router.app = this;
	},
	update: function(name, value) {
		console.log("Update: name = " + name + ", value = " + value);
		router.currentRoute.controller[name] = value;
		for (var i = this.router.currentRoute.view.dict[name].length - 1; i >= 0; i--) {
			var output = Utility.replaceWithVariables(this.router.currentRoute.view.dict[name][i].template, router.currentRoute.controller);
			console.log(output);
			this.router.currentRoute.view.dict[name][i].element.innerHTML = output;
		}
	},
	start: function() {
		var rawViews = this.root.querySelectorAll("[ar-controller]");
		for (var i = 0; i < rawViews.length; i++) {
			console.log(rawViews[i]);

			// Then make the current router html page into a view.
			var view = new View(rawViews[i], rawViews[i].innerHTML, this.controllers[rawViews[i].getAttribute("ar-controller")]);
			this.addView(view);
			view.populate();
		}
		this.router.start();
	}
}
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
	    			console.log(xmlhttp.statusText);
	    		}
	    	}
	    }
	    xmlhttp.open("GET", url, true);
	    xmlhttp.send();
	},
	post: function(url, data, success, info) {
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
	    			console.log(xmlhttp.statusText);
	    		}
	    	}
	    }
	    xmlhttp.open("POST", url, true);
	    xmlhttp.setRequestHeader("Content-type", "application/json");
	    xmlhttp.send(data);
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

Utility.addMethodToObject = function(object, methodName, method) {
	object[methodName] = method;
}

Utility.addMethodToObjectsInArray = function(array, methodName, method) {
	for (var i = array.length - 1; i >= 0; i--) {
		array[i][methodName] = method;
	}
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
function View(rootElement, rawView, controller) {
	this.raw = rawView;
	this.rootElement = rootElement;
	this.controller = new controller(this);
	this.dict = {};
	this.refs = {};
	this.foreachTemplates = {};

	this.viewElement = document.createElement('div');
	this.viewElement.innerHTML = this.raw;
	this.rootElement.innerHTML = "";
	console.log("Created View.");
	console.log(rootElement);
}

View.prototype = {
	/*
		Populates the basic values inside a template
	*/
	populate: function() {
		console.log("Populating View.");
		var view = this.viewElement;
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
						
						html = Utility.replaceWithVariables(html, this.controller);

						element.innerHTML = html;

						// NEED TO PROCESS ATTRIBUTES
						for (var i = element.attributes.length - 1; i >= 0; i--) {
							var attribute = element.attributes[i];
							attribute.value = Utility.replaceWithVariables(attribute.value, this.controller);
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
					var text = Utility.replaceWithVariables(tex, this.controller);
					element.data = text;
				}
			}
		}
		// var el = document.querySelector('[render-view]');
		// el.innerHTML = "";
		//el.appendChild(this.viewElement);

		this.rootElement.appendChild(this.viewElement);
		//this.rootElement.innerHTML = this.viewElement.innerHTML;
	},
	/**
	 * Populates all instances of {{variable}} inside
	 * a HTML element the corresponding variable 
	 * from the context and you can specify a 
	 * priorityContextName, so it will process it
	 * from that name as context[priorityContextName][..][variable[i]]
	 * @param {Element} element
	 * @param {Object} context
	 * @param {String} priorityContextName
	 * @return 
	 */
	populateElement: function(element, context, priorityContextName) {
		if (element.nodeName != "#text") {
			element.innerHTML = Utility.replaceWithVariables(element.innerHTML, this.controller, context, priorityContextName);

			this.populateElementAttributes(element, context, priorityContextName);
		}
		else {
			element.data = Utility.replaceWithVariables(element.data, this.controller, context, priorityContextName);
		}
	},
	/**
	 * Populates all instances of {{variable}} inside 
	 * attributes with the corresponding variable from 
	 * the context and you can specify a 
	 * priorityContextName, so it will process it
	 * from that name as context[priorityContextName][..][variable[i]]
	 * @param {Element} element 
	 * @param {Object} context
	 * @param {String} priorityContextName
	 * @return 
	 */
	populateElementAttributes: function(element, context, priorityContextName) {
		// NEED TO PROCESS ATTRIBUTES
		for (var i = element.attributes.length - 1; i >= 0; i--) {
			var attribute = element.attributes[i];
			attribute.value = Utility.replaceWithVariables(attribute.value, this.controller, context, priorityContextName);
		}
	},
	/* A parent function for the populateElement */
	populateElements: function(elementsObj, context, priorityContextName) {
		console.log("Populate Elements: the PriorityContextName = " + priorityContextName);

		for (var i = elementsObj["nonParentElements"].length - 1; i >= 0; i--) {
			this.populateElement(elementsObj["nonParentElements"][i], context, priorityContextName);
		}

		for (var i2 = elementsObj["parentElements"].length - 1; i2 >= 0; i2--) {
			this.populateElementAttributes(elementsObj["parentElements"][i2], context, priorityContextName);
		}
	},
	/* Removes old elements/text generated by a foreach loop */
	removeOldForeachElements: function(propertyName) {
		for (var i = this.refs[propertyName].length - 1; i >= 0; i--) {
			this.refs[propertyName][i].remove();
		}
	},
	/* Populates a ar-foreach element with data from the controller/model */
	populateForeach: function(eachElement, context, controller) {
		var temp = eachElement.getAttribute("ar-foreach").split(" as ");
		var propertyName = temp[0];
		var as = temp[1];

		console.log("Processing: " + propertyName + " as: " + as);
		if (this.refs[propertyName] != null) {
			this.removeOldForeachElements(propertyName);
		}

		var varia = Utility.resolve(context, propertyName);

		// do this x many times
		for (var x = varia.length - 1; x >= 0; x--) {
			// Clone a html element
			var clone = eachElement.cloneNode(true);

			// Remove the attribute of the clone
			clone.removeAttribute("ar-foreach");
			
			// If the foreach elements need to be changed later or completely replaced it will need to know, then the framework stores the information.
			if (clone.getAttribute("ar-model")) {
				console.log("Update this later.");
				// NEED TO WORK ON THIS SO I CAN ADD/REMOVE FROM LIST OF OBJECTS AND UPDATE THE VIEW WITH THAT INFO.
				// this.refs["shows"][0] = [element]
				//this.refs[propertyName][x] = []
				if (this.refs[propertyName] == null) {
					this.refs[propertyName] = [clone];
				}
				else {
					this.refs[propertyName].push(clone);
				}
			}

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
	/* Parent function for populateForeach */
	populateAllForeach: function() {
		var eachElement = document.querySelectorAll("[render-view]")[0];
		var eachElements = ElementProcessor.getAllChildrenWithAttribute(eachElement, "ar-foreach");
		for (var i = eachElements.length - 1; i >= 0; i--) {
			try{
				this.populateForeach(eachElements[i], this.controller, this.controller);
			} catch(err)
			{
				console.log("[Arati ERROR] a variable was undefined when trying to run the foreach loop." + err);
			}
		}
	},
	/*
		Populates all elements inside a view and caches 
		the elements that can later be updated easily by code 
	*/
	populateAllElements: function() {
		this.storeElements();
		this.populate();
		this.populateAllForeach();
		this.registerEvents();

		// Code for ontype to work
		// var el = document.querySelector("[ar-model]");
		// var that = this;
		// el.addEventListener("keyup", function(e){
		// 	Arati.update(el.getAttribute("ar-model"), e.target.value);
		// 	that.route.controller[el.getAttribute("ar-change")]();
		// });
	},
	/* Executes when the view has loaded*/
	load: function() {
		console.log("Loaded");
		//var renderViews = document.querySelectorAll('[render-view]');
		//renderViews[0].innerHTML = this.raw;

		//console.log(this.controller);
		if (this.controller.init != null) {
			var bound = this.populateAllElements.bind(this);
			this.controller.init(bound);
		}
		else {
			this.populateAllElements();
		}
	},
	/* Stores the elements that can be easily updated later by controller/code. */
	storeElements: function() {
		var dict = {}
		var eles = this.viewElement.querySelectorAll("[ar-update]");
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
	},
	/* Registers all arati specific events */
	registerEvents: function() {
		var that = this;

		var onclickElements = this.rootElement.querySelectorAll("[ar-onclick]");
		for (var i = 0; i < onclickElements.length; i++) {
			onclickElements[i].addEventListener("click", this.controller[onclickElements[i].getAttribute("ar-onclick")]);
		}

		var boundElements = this.rootElement.querySelectorAll("[ar-model]");
		for (var i = 0; i < boundElements.length; i++) {
			console.log("Register click event.");
			boundElements[i].addEventListener("change", function(el) {
				that.onModelChanged(el);
			});
		}

		var changedElements = this.rootElement.querySelectorAll("[ar-change]");
		for (var i = 0; i < changedElements.length; i++) {
			console.log("Register click event.");
			changedElements[i].addEventListener("change", function(el) {
				that.onElementChanged(el);
			});
		}
	},
	onElementChanged: function(el) {
		this.controller[el.target.getAttribute("ar-change")]();
	},
	onModelChanged: function(el) {
		this.update(el.target.getAttribute("ar-model"), el.target.value);
	},
	update: function(name, value) {
		if (value != undefined) {
			//console.log("Update: name = " + name + ", value = " + value);
			this.controller[name] = value;
		}
		for (var i = this.dict[name].length - 1; i >= 0; i--) {
			// If it's updating a list then update it differently.
			if (this.dict[name][i].element.getAttribute("ar-foreach")) {
				/* Do some foreach updating */
				var ele = this.dict[name][i].element;
				// Need to find a way to store the original display style so i can actually reverse back correctly.
				ele.style.display = "block"; // THIS IS A QUICKFIX !!

				this.populateForeach(ele, this.controller, this.controller);
			}
			else {
				var output = Utility.replaceWithVariables(this.dict[name][i].template, this.controller);
				this.dict[name][i].element.innerHTML = output;
			}
		}
	}
}
function Router() {
	this.routes = [];
	this.currentRoute = {};
	this.routeParams = {};
	this.app = {};

	var that = this;
	window.addEventListener('hashchange', function() {
		that.hashChanged();
	});
}

Router.prototype = {
	registerRoute: function(url, controllerName, viewPath, controllerPath) {
		this.routes.push({ "url": url, "viewPath": viewPath, "controllerPath": controllerPath, "controllerName": controllerName });
	},
	start: function() {
		console.log("Current route url: " + window.location.hash.slice(1));
		var currentUrl = window.location.hash.slice(1);

		this.currentRoute = this.findRoute(currentUrl);
		console.log("Found the route");

		// Need to load the current route
		// TODO MAKE BETTER
		this.LoadCurrentRoute(true, false);
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
			var rootElement = that.app.root.querySelector("[render-view]");
			var view = new View(rootElement, response, that.app.controllers[that.currentRoute.controllerName]);
			that.app.addView(view);
			that.currentRoute.view = view;
			
			var url = "js/controllers/" + that.currentRoute.controllerPath + ".js";
			var scripts = document.querySelectorAll('[araticontrollerremove]')
			for (var i = scripts.length - 1; i >= 0; i--) {
				document.body.removeChild(scripts[i]);
			}
			if (loadController) {
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
			}
			else {
				console.log("Do something.");
				that.currentRoute.view.load();
			}
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