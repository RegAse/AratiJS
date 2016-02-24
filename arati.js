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
		console.log(this.router.currentRoute.view.dict);
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
Utility.regexReplaceWithVariable = function(html, model) {
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

				if (typeof model[variable] == 'function') {
					html = html.replace(regex, model[variable]())
				}
				else {
					html = html.replace(regex, model[variable]);
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

			// Loop through all child nodes.
			for (var i = 0; i < renderViews[0].childNodes.length; i++) {
				var html = renderViews[0].childNodes[i].innerHTML;
				if (html != null) {
					
					html = Utility.regexReplaceWithVariable(html, this.route.controller);

					renderViews[0].childNodes[i].innerHTML = html;
				}
				else if (renderViews[0].childNodes[i].nodeName = "#text") {
					var tex = renderViews[0].childNodes[i].data;
					var text = Utility.regexReplaceWithVariable(tex, this.route.controller);
					renderViews[0].childNodes[i].data = text;
				}
			}
		}
	},
	load: function() {
		var renderViews = document.querySelectorAll('[render-views]');
		renderViews[0].innerHTML = this.raw;
		this.storeElements();
		this.populate();
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