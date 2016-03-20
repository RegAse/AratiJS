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