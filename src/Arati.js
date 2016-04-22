/*
	We always only want ONE instance of Arati.
*/
function Arati() {
	console.log("The entry point");

	this.root = document.querySelector("[ar-app]");
	this.router = {};
	this.views = [];
	this.controllers = {};
}

Arati.prototype = {
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