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
	/* Basicaly sets up a basic waiting system and when the last one calls in, the success method is called. */
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