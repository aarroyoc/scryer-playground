import { formatValue, formatBindings } from './format.js';
import { demos } from './demos.js';

let ready = false;
let executing = false;
let executingTimer = null;
let currentResultDiv = null;
let currentOutputPre = null;
let answerCount = 0;
let lastAnswerWasFalse = false;

window.onload = () => {
	let worker = new Worker("worker.js", {type: "module"});
	const source = document.getElementById("source");
	const history = document.getElementById("history");
	const query = document.getElementById("query");
	const execute = document.getElementById("execute");
	const postSnippet = document.getElementById("post-snippet");
	const snippetUrl = document.getElementById("snippet-url");
	const cancelRun = document.getElementById("cancel-run");
	const next1 = document.getElementById("next1");
	const next5 = document.getElementById("next5");
	const nextAll = document.getElementById("next-all");
	const pauseBtn = document.getElementById("pause-btn");
	const demoButtons = document.getElementById("demo-buttons");

	// Create demo buttons
	demos.forEach(demo => {
		const button = document.createElement("button");
		button.textContent = demo.name;
		button.className = "demo-button";
		button.onclick = () => {
			source.value = demo.code;
			query.value = demo.query;
		};
		demoButtons.appendChild(button);
	});

	const urlParams = new URLSearchParams(window.location.search);
	const snippetId = urlParams.get("snippet");
	if(snippetId !== null) {
		fetch(`https://api.scryer.pl/snippet/${snippetId}`)
			.then(resp => resp.text())
			.then(code => {
				const snippetCode = code.split("\n").slice(0, -1).join("\n");
				const snippetQuery = code.split("\n").slice(-1)[0].slice(3);

				source.value = snippetCode;
				query.value = snippetQuery;
			});
	}

	postSnippet.onclick = () => {
		const snippet = `${source.value}\n?- ${query.value}`;
		fetch("https://api.scryer.pl/snippet", {
			method: "POST",
			body: snippet,
		})
			.then(resp => resp.text())
			.then(id => {
				const link = document.createElement("a");
				link.href = `https://play.scryer.pl/?snippet=${id}`;
				link.textContent = link.href;
				snippetUrl.innerHTML = "";
				snippetUrl.appendChild(link);
			});
	};

	query.onkeypress = (event) => {
		if(event.key === "Enter") {
			event.preventDefault();
			execute.click();
		}
	};

	const hideStepControls = () => {
		next1.style.display = "none";
		next5.style.display = "none";
		nextAll.style.display = "none";
		pauseBtn.style.display = "none";
	};

	const showStepControls = () => {
		next1.style.display = "initial";
		next5.style.display = "initial";
		nextAll.style.display = "initial";
	};

	const hidePauseButton = () => {
		pauseBtn.style.display = "none";
	};

	const showPauseButton = () => {
		pauseBtn.style.display = "initial";
	};

	execute.onclick = () => {
		if(!ready){
			alert("Scryer Prolog WASM not loaded yet");
		} else {
			// Cancel any existing query first
			if(executing) {
				worker.postMessage({type: "cancel"});
			}

			// Reset state
			answerCount = 0;
			lastAnswerWasFalse = false;
			hideStepControls();
			executing = false;
			clearInterval(executingTimer);
			document.querySelectorAll(".executing").forEach(e => e.style.display = "none");

			// Clear previous queries
			history.innerHTML = "";

			// Create new result container
			currentResultDiv = document.createElement("div");
			const historyQuery = document.createElement("div");
			historyQuery.textContent = `?- ${query.value}`;
			currentResultDiv.appendChild(historyQuery);

			currentOutputPre = document.createElement("pre");
			currentOutputPre.className = "output";
			currentResultDiv.appendChild(currentOutputPre);

			history.appendChild(currentResultDiv);
			currentResultDiv.scrollIntoView(false);

			executingTimer = setTimeout(() => {
				if(executing) {
				    document.querySelectorAll(".executing").forEach(e => e.style.display = "initial");
				}
			}, 500);

			// Send execute message to worker
			worker.postMessage({
				type: "execute",
				code: source.value,
				query: query.value
			});
			executing = true;
		}
	};

	const appendAnswer = (bindings) => {
		const formatted = formatBindings(bindings);
		lastAnswerWasFalse = (bindings === false);

		if (answerCount === 0) {
			currentOutputPre.textContent = "   " + formatted;
		} else {
			currentOutputPre.textContent += "\n;  " + formatted;
		}

		// If this answer is false, add period immediately
		if (lastAnswerWasFalse) {
			currentOutputPre.textContent += ".";
		}

		answerCount++;
		currentResultDiv.scrollIntoView(false);
	};

	next1.onclick = () => {
		hidePauseButton();
		worker.postMessage({type: "next", stepSize: 1});
	};

	next5.onclick = () => {
		hidePauseButton();
		worker.postMessage({type: "next", stepSize: 5});
	};

	nextAll.onclick = () => {
		hideStepControls();
		showPauseButton();
		worker.postMessage({type: "next", stepSize: "all"});
	};

	pauseBtn.onclick = () => {
		worker.postMessage({type: "pause"});
	};

	const workerHandler = (e) => {
		if(e.data.type === "ready") {
			ready = true;
		}

		if(e.data.type === "query_started") {
			executing = true;
			clearInterval(executingTimer);
			document.querySelectorAll(".executing").forEach(e => e.style.display = "none");
			showStepControls();
			// Automatically request first answer
			worker.postMessage({type: "next", stepSize: 1});
		}

		if(e.data.type === "answer") {
			appendAnswer(e.data.bindings);
		}

		if(e.data.type === "waiting") {
			// More answers available, controls already visible
		}

		if(e.data.type === "complete") {
			executing = false;
			clearInterval(executingTimer);
			document.querySelectorAll(".executing").forEach(e => e.style.display = "none");
			hideStepControls();
			hidePauseButton();

			if (answerCount === 0) {
				// No solutions found
				currentOutputPre.textContent = "   false.";
			} else if (!lastAnswerWasFalse) {
				// Query completed - add period (scryer-js yields false when needed)
				currentOutputPre.textContent += ".";
			}
			// If lastAnswerWasFalse, period already added in appendAnswer
		}

		if(e.data.type === "paused") {
			hidePauseButton();
			showStepControls();
		}

		if(e.data.type === "cancelled") {
			executing = false;
			clearInterval(executingTimer);
			document.querySelectorAll(".executing").forEach(e => e.style.display = "none");
			hideStepControls();
			hidePauseButton();
			if (currentOutputPre) {
				currentOutputPre.textContent += "\n% Execution cancelled";
			}
		}

		if(e.data.type === "error") {
			executing = false;
			clearInterval(executingTimer);
			document.querySelectorAll(".executing").forEach(e => e.style.display = "none");
			hideStepControls();
			hidePauseButton();
			if (currentOutputPre) {
				currentOutputPre.textContent = `Error: ${e.data.error}`;
			}
		}
	};

	worker.onmessage = workerHandler;

	cancelRun.onclick = () => {
		worker.postMessage({type: "cancel"});
	};

	// Initialize controls as hidden
	hideStepControls();
};
