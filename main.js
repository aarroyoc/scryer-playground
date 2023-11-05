import init, { eval_code } from "./scryer_prolog.js";

let ready = false;

const regex = /initialization\/1 failed for/g;


window.onload = () => {
    const source = document.getElementById("source");
    const history = document.getElementById("history");
    const query = document.getElementById("query");
    const execute = document.getElementById("execute");

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
	    const result = eval_code(code);
	    console.log(result);

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
	}
    };
};
await init("./scryer_prolog_bg.wasm");
ready = true;
