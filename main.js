import init, { eval_code } from "./scryer_prolog.js";

let ready = false;

const regex = /initialization\/1 failed for/g;


window.onload = () => {
    const source = document.getElementById("source");
    const history = document.getElementById("history");
    const query = document.getElementById("query");
    const execute = document.getElementById("execute");
    const postSnippet = document.getElementById("post-snippet");
    const snippetUrl = document.getElementById("snippet-url");
    
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
      :- use_module(library(charsio)).
      :- use_module(library(iso_ext)).
      :- use_module(library(format)).
      :- use_module(library(dcgs)).
      :- initialization(playground_main).

      playground_main :-
          QueryStr = "${queryStr}",
          read_term_from_chars(QueryStr, Query, [variable_names(Vars)]),
          bb_put(playground_first_answer, true),
          bb_put(playground_pending, true),
          (   setup_call_cleanup(true, Query, NotPending = true),
              % Query succeeded
              bb_get(playground_first_answer, FirstAnswer),
              (   FirstAnswer == true ->
                  format("   ", []),
                  bb_put(playground_first_answer, false)
              ;   true
              ),
              phrase(playground_answer(Vars), Answer),
              format("~s", [Answer]),
              (   NotPending == true ->
                  bb_put(playground_pending, false)
              ;   format("~n;  ", [])
              ),
              false
          ;   % Query maybe failed
              bb_get(playground_pending, Pending),
              (   Pending == true ->
                  % Query failed
                  bb_get(playground_first_answer, FirstAnswer),
                  (   FirstAnswer == true ->
                      format("   ", []),
                      bb_put(playground_first_answer, false)
                  ;   true
                  ),
                  format("false", [])
              ;   % Query just terminated
                  true
              )
          ),
          format(".", []).

      playground_answer([]) --> "true".
      playground_answer([Var|Vars]) -->
          playground_answer_([Var|Vars]).

      playground_answer_([]) --> "".
      playground_answer_([VarName=Var|Vars]) -->
          { write_term_to_chars(Var, [double_quotes(true), quoted(true)], VarChars) },
          format_("~a = ~s", [VarName, VarChars]),
          (   { Vars == [] } ->
              []
          ;   ", ",
              playground_answer_(Vars)
          ).
      `;
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
	    element.scrollIntoView(false);
	}
    };
};
await init("./scryer_prolog_bg.wasm");
ready = true;
