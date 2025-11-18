// Demo files for the Scryer Prolog Playground

export const demos = [
	{
		name: "Zurg Puzzle",
		code: `% Bridge and Torch Problem - "Escape from Zurg"
% Source: https://www.metalevel.at/zurg/zurg.pl
% Explanation: https://www.metalevel.at/zurg/
% Author: Markus Triska, 2007

:- use_module(library(dcgs)).
:- use_module(library(lists)).
:- use_module(library(clpz)).

toy_time(buzz,   5).
toy_time(woody, 10).
toy_time(rex,   20).
toy_time(hamm,  25).

moves(Ms) :- phrase(moves(state(0,[buzz,woody,rex,hamm],[])), Ms).

moves(state(T0,Ls0,Rs0)) -->
        { select(Toy1, Ls0, Ls1), select(Toy2, Ls1, Ls2),
          Toy1 @< Toy2,
          toy_time(Toy1, Time1), toy_time(Toy2, Time2),
          T1 #= T0 + max(Time1,Time2), T1 #=< 60 },
        [left_to_right(Toy1,Toy2)],
        moves_(state(T1,Ls2,[Toy1,Toy2|Rs0])).

moves_(state(_,[],_))     --> [].
moves_(state(T0,Ls0,Rs0)) -->
        { select(Toy, Rs0, Rs1),
          toy_time(Toy, Time),
          T1 #= T0 + Time, T1 #=< 60 },
        [right_to_left(Toy)],
        moves(state(T1,[Toy|Ls0],Rs1)).`,
		query: "moves(Ms)."
	},
	{
		name: "Sudoku Solver",
		code: `% Solving Sudoku with Prolog
% Source: https://www.metalevel.at/sudoku/sudoku.pl
% Explanation: https://www.metalevel.at/sudoku/
% Author: Markus Triska, 2008

:- use_module(library(clpz)).
:- use_module(library(lists)).
:- use_module(library(format)).

sudoku(Rows) :-
        length(Rows, 9), maplist(same_length(Rows), Rows),
        append(Rows, Vs), Vs ins 1..9,
        maplist(all_distinct, Rows),
        transpose(Rows, Columns), maplist(all_distinct, Columns),
        Rows = [As,Bs,Cs,Ds,Es,Fs,Gs,Hs,Is],
        blocks(As, Bs, Cs), blocks(Ds, Es, Fs), blocks(Gs, Hs, Is).

blocks([], [], []).
blocks([N1,N2,N3|Ns1], [N4,N5,N6|Ns2], [N7,N8,N9|Ns3]) :-
        all_distinct([N1,N2,N3,N4,N5,N6,N7,N8,N9]),
        blocks(Ns1, Ns2, Ns3).

problem(1, P) :-
        P = [[1,_,_,8,_,4,_,_,_],
             [_,2,_,_,_,_,4,5,6],
             [_,_,3,2,_,5,_,_,_],
             [_,_,_,4,_,_,8,_,5],
             [7,8,9,_,5,_,_,_,_],
             [_,_,_,_,_,6,2,_,3],
             [8,_,1,_,_,_,7,_,_],
             [_,_,_,1,2,3,_,8,_],
             [2,_,5,_,_,_,_,_,9]].

problem(2, P) :-
        P = [[_,_,2,_,3,_,1,_,_],
             [_,4,_,_,_,_,_,3,_],
             [1,_,5,_,_,_,_,8,2],
             [_,_,_,2,_,_,6,5,_],
             [9,_,_,_,8,7,_,_,3],
             [_,_,_,_,4,_,_,_,_],
             [8,_,_,_,7,_,_,_,4],
             [_,9,3,1,_,_,_,6,_],
             [_,_,7,_,6,_,5,_,_]].`,
		query: "problem(1, Rows), sudoku(Rows)."
	}
];
