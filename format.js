/**
 * Format a single value from scryer-js output to Prolog syntax
 * @param {*} value - Value from scryer-js bindings
 * @returns {string} Formatted Prolog representation
 */
export function formatValue(value) {
	if (value === null || value === undefined) {
		return "null";
	}
	if (typeof value === "string") {
		return `"${value}"`;
	}
	if (typeof value === "object") {
		// Handle variables
		if (value.var !== undefined) {
			return value.var;
		}
		// Handle atoms (both with and without indicator)
		if (value.indicator === "atom" || (value.value !== undefined && !Array.isArray(value) && typeof value.value === "string" && !value.args)) {
			return value.value;
		}
		// Handle compound terms (both indicator-based and functor-based)
		if ((value.indicator === "compound" || value.functor) && value.args) {
			const functorName = value.name || value.functor;
			const args = value.args.map(formatValue).join(", ");
			return `${functorName}(${args})`;
		}
		if (Array.isArray(value)) {
			// Check if this is a string (list of single-character atoms)
			const isString = value.length > 0 && value.every(item =>
				(item.value !== undefined && typeof item.value === "string" && item.value.length === 1) ||
				(item.indicator === "atom" && typeof item.value === "string" && item.value.length === 1)
			);
			if (isString) {
				const str = value.map(item => item.value).join('');
				return `"${str}"`;
			}
			return `[${value.map(formatValue).join(", ")}]`;
		}
		// Default object formatting
		return JSON.stringify(value);
	}
	return String(value);
}

/**
 * Format variable bindings from scryer-js output
 * @param {Object} bindings - Variable bindings object
 * @returns {string} Formatted bindings string
 */
export function formatBindings(bindings) {
	// Handle explicit false (query failure)
	if (bindings === false) {
		return "false";
	}
	// Handle null, undefined, or empty bindings (success with no vars)
	if (!bindings) {
		return "true";
	}
	if (typeof bindings === 'object' && Object.keys(bindings).length === 0) {
		return "true";
	}
	return Object.entries(bindings)
		.map(([name, value]) => `${name} = ${formatValue(value)}`)
		.join(", ");
}
