var Arati = {
	setController: function(controllerName, file) {
		console.log("Setting the controller here.");
	},
	setRouter: function(router) {
		this.router = router;
	},
	update: function(name, value) {
		console.log("Update: name = " + name + ", value = " + value);
		for (var i = this.router.currentRoute.dict[name].length - 1; i >= 0; i--) {
			var output = Utility.ReplaceWithVariables(this.router.currentRoute.dict[name][i].template, window[this.router.currentRoute.controller]);
			this.router.currentRoute.dict[name][i].element.innerHTML = output;
		}
	}
}

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
    		else if (xmlhttp.status == 400) {
    			alert('There was an error 400')
    		}
    		else {
    			alert('something else other than 200 was returned')
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


function Router() {
	var that = this;
	this.routes = [];
	this.currentRoute = {};

	this.registerRoute = function(url, controller, view, controllerPath){
		that.routes.push({url: url, controller: controller, view: view, controllerPath: controllerPath});
	}
	this.start = function (){
		console.log("Current route url: " + window.location.hash.slice(1));
		var currentUrl = window.location.hash.slice(1);

		that.currentRoute = that.findRoute(currentUrl);
		console.log("Found the route");

		that.LoadCurrentRoute(true, true);
	}
	this.findRoute = function (url) {
		for (var i = that.routes.length - 1; i >= 0; i--) {
			if (that.routes[i].url == url) {
				return that.routes[i];
			}
		}
		return false;
	}
	this.populateCurrentRouteView = function () {
		var renderViews = document.querySelectorAll('[render-views]');
		if (renderViews.length == 1) {
			var html = that.currentRoute.retrievedView;
			
			var regex = new RegExp('{{(.*)}}', 'gi');
			var match = html.match(regex);
			if (match != null) {
				for (var i = match.length - 1; i >= 0; i--) {
					var regex = new RegExp(match[i], 'gi');
					var variable = match[i].replace('{{', '');

					variable = variable.replace('}}', '');
					variable = variable.trim();

					var controller = window[that.currentRoute.controller];
					if (typeof controller[variable] == 'function') {
						html = html.replace(regex, controller[variable]())
					}
					else {
						html = html.replace(regex, controller[variable]);
					}
				}
			}
			console.log(window[that.currentRoute.controller]);
			renderViews[0].innerHTML = html;
			console.log(renderViews[0]);
		}
	}
	this.renderCurrentRouteView = function() {
		// var renderViews = document.querySelectorAll('[render-views]');
		// if (renderViews.length == 1) {
		// 	var html = that.currentRoute.retrievedView;
		// 	renderViews[0].innerHTML = html;
		// }
	}
	this.getCurrentController = function() {
		var url = "js/controllers/" + that.currentRoute.controllerPath + ".js";
		var scripts = document.querySelectorAll('[araticontrollerremove]')
		for (var i = scripts.length - 1; i >= 0; i--) {
			document.body.removeChild(scripts[i]);
		}

		Utility.AddScriptToDOM(url, function(){
			// the script was loaded 
			try {
				window[that.currentRoute.controller];
			} catch(error){
				console.log("[Arati ERROR] The controller was not found.");
			}
			//that.populateCurrentRouteView();
		});
	}
	this.storeElements = function() {
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
		that.currentRoute.dict = dict;
	}
	this.LoadCurrentRoute = function(render, loadController) {
		Request(that.currentRoute.view, function(response) {
			// loads the current view
			console.log("Success");

			that.currentRoute.retrievedView = response;
			var renderViews = document.querySelectorAll('[render-views]');
			renderViews[0].innerHTML = response;

			that.storeElements();
			if (render) {
				that.renderCurrentRouteView();
			}
			if (loadController) {
				that.getCurrentController();
			}
		});
	}
	this.hashChanged = function() {
		//Set the previous controller to null
		window[that.currentRoute.controller] = undefined;

		var currentUrl = window.location.hash.slice(1);
		that.currentRoute = that.findRoute(currentUrl);
		that.LoadCurrentRoute(true, true);
	}
	window.onhashchange = this.hashChanged;
}

// Activate dev mode to disable caching on controller files
Arati.devMode = true;

// Run the router
var router = new Router();
Arati.setRouter(router);

// Register routes
//router.registerRoute("/example", "NameOfTheControllerAratiCalls", "PathToView", "exampleController OR js/cor/controller");
router.registerRoute("/", "HomeController", "views/home.html", "HomeController");
router.registerRoute("/dashboard", "DashboardController", "views/dashboard.html", "DashboardController");
router.registerRoute("/shows", "ShowController", "views/shows/shows.html", "ShowController");

// TODO
//router.registerRoute("/shows/{slug}-{id}", "ShowController", "views/shows/show.html", "ShowController");

router.start();