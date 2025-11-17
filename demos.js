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
		query: "moves(Ms)"
	}
];
