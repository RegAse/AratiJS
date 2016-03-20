/* Utility */

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

/**
 * Replaces all instances of {{variable}} with 
 * the corresponding variable from the model
 * @param {String} text 
 * @param {Object} model
 * @return {String} processedText
 */
Utility.ReplaceWithVariables = function(text, model) {
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

			// I replace the string with a value from the model
			oper = model[oper];

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
 * TODO: Make function more readable
 *
 * Resolves a variable or a call to
 * a function in a object
 * @param {Object} current
 * @param {String} next
 * @return {Object} current 
 */
Utility.resolve = function(current, next) {
	next = next.split('.');

	while (current && next[0]) {
		var nh = next.shift();
		if (current[nh] == undefined) {
			var spli = nh.split("(");
			var functionName = spli[0];
			var args = spli[1].replace(')', '').split(',');
			for (var i = args.length - 1; i >= 0; i--) {
				args[i] = args[i].trim();
			}

			var s = current[functionName].apply(current, args);
			return s;
		}
		else {
			current = current[nh];
		}
	}
	return current;
}

Utility.regexReplaceWithVariable = function(html, model, refrenceName) {
	if (html != null) {
		// Find all the variables in this element
		var regex = new RegExp('{{(.*)}}', 'gi');
		var match = html.match(regex);

		if (match != null) {
			for (var x = match.length - 1; x >= 0; x--) {
				var variable = match[x].replace('{{', '');

				variable = variable.replace('}}', '');
				variable = variable.trim();

				//Remove the refrence name
				if (refrenceName != null && refrenceName != "") {
					variable = variable.replace(refrenceName + ".", "");
				}

				if (typeof model[variable] == 'function') {
					html = html.replace(regex, model[variable]())
				}
				else {
					html = html.replace(regex, Utility.resolve(model, variable));
				}
			}
		}
	}
	return html;
}