/*
	We always only want ONE instance of Arati.
*/
function Arati() {
	console.log("The entry point");
	this.router = {};
	this.views = [];
}

Arati.prototype = {
	/* Add a view to the app. */
	addView: function(view) {
		this.views.push(view);
	},
	setRouter: function(router) {
		this.router = router;
	},
	update: function(name, value) {
		console.log("Update: name = " + name + ", value = " + value);
		router.currentRoute.controller[name] = value;
		for (var i = this.router.currentRoute.view.dict[name].length - 1; i >= 0; i--) {
			var output = Utility.replaceWithVariables(this.router.currentRoute.view.dict[name][i].template, router.currentRoute.controller);
			console.log(output);
			this.router.currentRoute.view.dict[name][i].element.innerHTML = output;
		}
	}
}

// Initialize Arati
var Arati = new Arati();