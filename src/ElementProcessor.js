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