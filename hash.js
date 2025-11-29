// Helper functions for URL hash encoding/decoding

/**
 * Encodes code and query into URL hash format
 * @param {string} code - Prolog source code
 * @param {string} query - Prolog query
 * @returns {string} URLSearchParams string with base64-encoded code and query
 */
export function encodeSnippet(code, query) {
	const params = new URLSearchParams();
	params.set('code', btoa(encodeURIComponent(code)));
	params.set('query', btoa(encodeURIComponent(query)));
	return params.toString();
}

/**
 * Decodes URL hash into code and query
 * @param {string} hash - URL hash string (without leading #)
 * @returns {{code: string, query: string}|null} Decoded snippet or null if invalid
 */
export function decodeSnippet(hash) {
	const params = new URLSearchParams(hash);
	const code = params.get('code');
	const query = params.get('query');
	if (code !== null && query !== null) {
		return {
			code: decodeURIComponent(atob(code)),
			query: decodeURIComponent(atob(query))
		};
	}
	return null;
}

/**
 * Updates browser's location hash with encoded snippet
 * @param {string} code - Prolog source code
 * @param {string} query - Prolog query
 */
export function updateHash(code, query) {
	window.location.hash = encodeSnippet(code, query);
}
