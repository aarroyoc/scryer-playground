% VALVENI
% A microdatabase in Prolog: https://github.com/aarroyoc/valveni-db
% BSD-3 License

:- module(valveni, [v_open/3, v_assert/2, v_retract/2]).

:- use_module(library(charsio)).
:- use_module(library(files)).
:- use_module(library(format)).
:- use_module(library(lists)).
:- use_module(library(pio)).

v_open(DbName, Preds, VState) :-
    append(DbName, ".db.pl", DbFile),
    append(DbName, ".oplog.pl", OplogFile),
    retract_preds(Preds),
    (file_exists(DbFile) ->
	 load_db_file(DbFile)
    ;    true
    ),
    (file_exists(OplogFile) ->
	 (
	     read_and_execute_oplog(OplogFile),
	     phrase_to_file(dump_db_(Preds), DbFile),
	     delete_file(OplogFile)
	 )
    ;    true
    ),
    VState = valveni(DbName, Preds).

retract_preds([]).
retract_preds([F/N|Xs]) :-
    functor(X, F, N),
    retractall(user:X),
    retract_preds(Xs).

load_db_file(DbFile) :-
    atom_chars(DbFileA, DbFile),
    consult(DbFileA).

read_and_execute_oplog(OplogFile) :-
    atom_chars(OplogFileA, OplogFile),
    consult(OplogFileA),
    findall(Op, (functor(Op, oplog, 1), clause(Op, true)), Ops),
    oplog_exec(Ops).

oplog_exec([]).
oplog_exec([oplog(assert(Term))|Ops]) :-
    retractall(user:Term),
    assertz(user:Term),
    oplog_exec(Ops).
oplog_exec([oplog(retract(Term))|Ops]) :-
    retractall(user:Term),
    oplog_exec(Ops).

dump_db_([]) --> [].
dump_db_([Pred|Preds]) -->
    {
	F/N = Pred,
	(findall(Clause, (functor(Clause, F, N), clause(Clause, true)), FindClauses) -> sort(FindClauses, Clauses) ; Clauses = [])
    },
    format_(":- dynamic(~a/~d).~n", [F, N]),
    format_(":- multifile(~a/~d).~n", [F, N]),
    dump_clauses_(Clauses),
    "\n",
    dump_db_(Preds).

dump_clauses_([]) --> [].
dump_clauses_([X|Xs]) -->
    portray_clause_(X),
    dump_clauses_(Xs).

v_assert(VState, Term) :-
    VState = valveni(DbName, Preds),
    functor(Term, F, N),
    member(F/N, Preds),
    append(DbName, ".oplog.pl", OplogFile),
    open(OplogFile, append, Stream),
    (file_exists(OplogFile) ->
        format(Stream, ":- dynamic(oplog/1).\n:- multifile(oplog/1).\n", [])
    ;   true
    ),
    portray_clause(Stream, oplog(assert(Term))),
    close(Stream),
    retractall(user:Term),
    assertz(user:Term).

v_retract(VState, Term) :-
    VState = valveni(DbName, Preds),
    functor(Term, F, N),
    member(F/N, Preds),
    append(DbName, ".oplog.pl", OplogFile),
    open(OplogFile, append, Stream),
    (file_exists(OplogFile) ->
        format(Stream, ":- dynamic(oplog/1).\n:- multifile(oplog/1).\n", [])
    ;   true
    ),
    portray_clause(Stream, oplog(retract(Term))),
    close(Stream),
    retractall(user:Term).
