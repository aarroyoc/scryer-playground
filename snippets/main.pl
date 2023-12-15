:- use_module(library(format)).
:- use_module(library(lists)).
:- use_module(library(time)).
:- use_module(library(crypto)).
:- use_module(library(http/http_server)).
:- use_module(library(dcgs)).
:- use_module(valveni).

:- initialization(main).

get_snippet(Id, Request, Response) :-
    (
	snippet(Id, Content, _DateTime, _UserAgent) ->
	snippet_found(Id, Content, Response)
    ;   snippet_not_found(Id, Response)
    ).

snippet_found(Id, Content, Response) :-
    portray_clause(snippet_found(Id)),
    http_status_code(Response, 200),
    http_headers(Response, ["content-type"-"text/x-prolog"]),
    http_body(Response, text(Content)).

snippet_not_found(Id, Response) :-
    portray_clause(snippet_not_found(Id)),
    http_status_code(Response, 404).

post_snippet(Db, Request, Response) :-
    http_headers(Request, RequestHeaders),
    member("user-agent"-UserAgent, RequestHeaders),
    current_time(T),
    phrase(format_time("%Y-%m-%d %H:%M:%S", T), DateTime),
    http_body(Request, text(Content)),
    crypto_data_hash(Content, HashId, [algorithm(sha512)]),
    v_assert(Db, snippet(HashId, Content, DateTime, UserAgent)),
    http_status_code(Response, 204),
    http_body(Response, text("")).

main :-
    portray_clause(scryer_playground_snippets(1.0, "Adrián Arroyo Calle")),
    v_open("data/snippets", [snippet/4], Db),
    http_listen(10006, [
        get(snippet/Id, get_snippet(Id)),
	post(snippet, post_snippet(Db))],[
	content_length_limit(8192)]),
    halt.

