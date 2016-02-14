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

function Router() {
	var that = this;
	this.routes = [];
	this.currentRoute = {};

	this.registerRoute = function (url, view){
		that.routes.push({url: url, view: view});
	}
	this.start = function (){
		console.log("Current route url: " + window.location.hash.slice(1));
		var currentUrl = window.location.hash.slice(1);

		that.currentRoute = that.findRoute(currentUrl);
		console.log("Found the route");

		that.getCurrentRouteView(true);
	}
	this.findRoute = function (url) {
		for (var i = that.routes.length - 1; i >= 0; i--) {
			if (that.routes[i].url == url) {
				return that.routes[i];
			}
		}
	}
	this.renderCurrentRouteView = function () {
		var renderViews = document.querySelectorAll('[render-views]');
		if (renderViews.length == 1) {
			console.log("Found the render view.");
			renderViews[0].innerHTML = that.currentRoute.retrievedView;
		}
	}
	this.getCurrentRouteView = function (render) {
		Request(that.currentRoute.view, function (response) {
			// Do something on success
			console.log("Success");
			that.currentRoute.retrievedView = response;
			if (render) {
				that.renderCurrentRouteView();
			}
		});
	}
	this.hashChanged = function () {
		var currentUrl = window.location.hash.slice(1);
		that.currentRoute = that.findRoute(currentUrl);
		that.getCurrentRouteView(true);
	}
	window.onhashchange = this.hashChanged;
}

var router = new Router();

// Register routes
router.registerRoute("/", "views/home.html");
router.registerRoute("/dashboard", "views/dashboard.html");

router.start();