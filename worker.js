// Fetch scryer-js from GitHub CDN with integrity verification
const SCRYER_CDN_URL = 'https://raw.githubusercontent.com/jjtolton/scryer-js/dist-cdn/dist/scryer.js';
const SCRYER_SRI_HASH = 'sha384-6BGoKKH2hc6CZw37l9X+9aYez77NLafXFNPZyIjpNqeuf4gh2lTF+wGw1SJXl0sq';

async function loadScryerModule() {
	// Fetch the distribution
	const response = await fetch(SCRYER_CDN_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch scryer-js: ${response.status}`);
	}

	// Verify integrity using SHA-384
	const text = await response.text();
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hashBuffer = await crypto.subtle.digest('SHA-384', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashBase64 = btoa(String.fromCharCode(...hashArray));
	const computedHash = `sha384-${hashBase64}`;

	if (computedHash !== SCRYER_SRI_HASH) {
		throw new Error(`Integrity check failed! Expected ${SCRYER_SRI_HASH}, got ${computedHash}`);
	}

	// Create blob URL and import as module
	const blob = new Blob([text], { type: 'text/javascript' });
	const blobUrl = URL.createObjectURL(blob);

	return import(blobUrl);
}

// Load the module from CDN
const scryerModule = await loadScryerModule();
const { init, Prolog } = scryerModule;

let pl = null;
let currentQuery = null;
let isPaused = false;
let isStreaming = false;
let bufferedAnswer = null; // Store peeked answer for next request

self.onmessage = async (e) => {
    const { type, code, query, stepSize } = e.data;

    if (type === "init") {
        await init();
        pl = new Prolog();
        self.postMessage({type: "ready"});
        return;
    }

    if (type === "execute") {
        try {
            // Reload source code each time
            pl = new Prolog();

            // Consult the source code if provided
            if (code && code.trim()) {
                pl.consultText(code);
            }

            // Execute the query
            currentQuery = pl.query(query);
            isPaused = false;
            bufferedAnswer = null; // Clear any buffered answer

            self.postMessage({type: "query_started"});

        } catch (error) {
            self.postMessage({
                type: "error",
                error: error.toString()
            });
            currentQuery = null;
        }
        return;
    }

    if (type === "next") {
        if (!currentQuery) {
            self.postMessage({type: "complete", hasMore: false});
            return;
        }

        try {
            const steps = stepSize || 1;
            let count = 0;

            // Handle "all" mode
            if (stepSize === "all") {
                isStreaming = true;
                for (const answer of currentQuery) {
                    if (isPaused) {
                        break;
                    }
                    self.postMessage({
                        type: "answer",
                        bindings: answer.bindings
                    });
                    count++;
                }
                isStreaming = false;

                if (currentQuery.done || isPaused) {
                    self.postMessage({
                        type: "complete",
                        hasMore: !currentQuery.done,
                        count: count
                    });
                    if (currentQuery.done) {
                        currentQuery = null;
                    }
                }
            } else {
                // Step mode (1 or 5)
                for (let i = 0; i < steps; i++) {
                    let result;

                    // Check if we have a buffered answer first
                    if (bufferedAnswer) {
                        result = bufferedAnswer;
                        bufferedAnswer = null;
                    } else {
                        result = currentQuery.next();
                    }

                    if (result.done) {
                        self.postMessage({
                            type: "complete",
                            hasMore: false,
                            count: count
                        });
                        currentQuery = null;
                        break;
                    }

                    self.postMessage({
                        type: "answer",
                        bindings: result.value.bindings
                    });
                    count++;
                }

                // Peek ahead to check if query is actually done (but don't send the answer)
                if (currentQuery && !bufferedAnswer) {
                    const peek = currentQuery.next();
                    if (peek.done) {
                        self.postMessage({
                            type: "complete",
                            hasMore: false,
                            count: count
                        });
                        currentQuery = null;
                    } else {
                        // Buffer the peeked answer for next request
                        bufferedAnswer = peek;
                        self.postMessage({
                            type: "waiting",
                            hasMore: true,
                            count: count
                        });
                    }
                }
            }

        } catch (error) {
            self.postMessage({
                type: "error",
                error: error.toString()
            });
            currentQuery = null;
        }
        return;
    }

    if (type === "pause") {
        isPaused = true;
        isStreaming = false;
        self.postMessage({type: "paused"});
        return;
    }

    if (type === "cancel") {
        if (currentQuery) {
            try {
                currentQuery.return(true);
            } catch (e) {
                // Ignore errors during cancellation
            }
            currentQuery = null;
        }
        isPaused = false;
        isStreaming = false;
        bufferedAnswer = null;
        self.postMessage({type: "cancelled"});
        return;
    }
};

// Initialize on load
await init();
pl = new Prolog();
self.postMessage({type: "ready"});
