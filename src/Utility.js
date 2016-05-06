/* Utility */
function Utility() {}

/**
 * Adds a user defined method/variable to all objects inside array. 
 * @param {String} url - The url to retrieve the script file.
 * @param {Object} onload - Function to call when the script has loaded.
 * @return {}
 */
Utility.AddScriptToDOM = function(url, onload) {
	var script = document.createElement("script");
	
	script.onload = onload;
	script.setAttribute("araticontrollerremove", "");
	document.body.appendChild(script);
	script.src = url + (Arati.devMode ? "?ts=" + Date.now() : "");
}

/**
 * Adds a user defined method/variable to the object. 
 * @param {Object} object 
 * @param {String} methodName
 * @param {Object} method
 * @return {Array} the array
 */
Utility.addMethodToObject = function(object, methodName, method) {
	object[methodName] = method;
}

/**
 * Adds a user defined method/variable to all objects inside array. 
 * @param {Array} array the array to add the method to. 
 * @param {String} methodName
 * @param {Object} method
 * @return {Array} the array
 */
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
 * Resolves a variable or a call to
 * a function in a object
 * @param {Object} current
 * @param {String} next
 * @return {Object} current 
 */
Utility.resolve = function(current, next) {
	// Split on '.'
	next = next.split('.');

	// Runs through all splits and accesses the corresponding variable.
	while (current && next[0]) {
		var nh = next.shift();
		// Checks if the object exists
		if (current[nh] == undefined) {
			// The variable does not exist on the object, so it will try to check if it is a function call.
			var spli = nh.split("(");
			var functionName = spli[0];
			var args = spli[1].replace(')', '').split(',');
			for (var i = args.length - 1; i >= 0; i--) {
				args[i] = args[i].trim();
			}

			// Calls the function with the correct context.
			var s = current[functionName].apply(current, args);
			return s;
		}
		else {
			current = current[nh];
		}
	}
	return current;
}