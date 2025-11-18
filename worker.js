import { init, Prolog } from "./scryer-patched.js";

let pl = null;
let currentQuery = null;
let isPaused = false;
let isStreaming = false;

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
                    const result = currentQuery.next();

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

                // Peek ahead to check if query is actually done
                if (currentQuery) {
                    const peek = currentQuery.next();
                    if (peek.done) {
                        self.postMessage({
                            type: "complete",
                            hasMore: false,
                            count: count
                        });
                        currentQuery = null;
                    } else {
                        // Got another answer, send it and wait for more
                        self.postMessage({
                            type: "answer",
                            bindings: peek.value.bindings
                        });
                        count++;

                        if (!currentQuery.done) {
                            self.postMessage({
                                type: "waiting",
                                hasMore: true,
                                count: count
                            });
                        }
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
        self.postMessage({type: "cancelled"});
        return;
    }
};

// Initialize on load
await init();
pl = new Prolog();
self.postMessage({type: "ready"});
