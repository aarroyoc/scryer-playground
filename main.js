let ready = false;

const regex = /initialization\/1 failed for/g;


window.onload = () => {
    let worker = new Worker("worker.js", {type: "module"});
    const source = document.getElementById("source");
    const history = document.getElementById("history");
    const query = document.getElementById("query");
    const execute = document.getElementById("execute");
    const postSnippet = document.getElementById("post-snippet");
    const snippetUrl = document.getElementById("snippet-url");
    const cancelRun = document.getElementById("cancel-run");
    
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

    execute.onclick = () => {
	if(!ready){
	    alert("Scryer Prolog WASM not loaded yet");
	} else {
	    const queryStr = query.value
	          .replaceAll("\\", "\\\\")
		  .replaceAll("\"", "\\\"");
	    const code = source.value + `
:- initialization(playground_main).
:- use_module(library(charsio)).
playground_main :- QueryStr = "${queryStr}", read_term_from_chars(QueryStr, Query, [variable_names(Vars)]), call(Query), write_term(Vars, [double_quotes(true)]).`
	    console.log(code);
	    document.querySelectorAll(".executing").forEach(e => e.style.display = "initial");
	    console.log(worker);
	    worker.postMessage({code: code});
	}
    };


    const workerHandler = (e) => {
	if(e.data.type === "ready") {
	    ready = true;
	}
	if(e.data.type === "result") {
	    const result = e.data.result;
	    console.log(result);
	    document.querySelectorAll(".executing").forEach(e => e.style.display = "none");
            const element = document.createElement("div");
	    const historyQuery = document.createElement("div");
	    historyQuery.textContent = `?- ${query.value}`;
	    element.appendChild(historyQuery);
	    const historyOutput = document.createElement("pre");
	    historyOutput.className = "output";
	    if(result.search(regex) == -1) {
		historyOutput.textContent = result;
	    } else {
		historyOutput.textContent = "false.";
	    }
	    element.appendChild(historyOutput);
	    history.appendChild(element);
	    element.scrollIntoView(false);
	}
    };

    worker.onmessage = workerHandler;

    cancelRun.onclick = () => {
	worker.terminate();
	document.querySelectorAll(".executing").forEach(e => e.style.display = "none");	
	ready = false;
	worker = new Worker("worker.js", {type: "module"});
	worker.onmessage = workerHandler;
    };
};
