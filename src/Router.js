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