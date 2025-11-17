import { describe, it, expect } from 'vitest';
import { formatValue, formatBindings } from './format.js';

describe('formatValue', () => {
	describe('atoms', () => {
		it('formats atoms with indicator', () => {
			expect(formatValue({indicator: "atom", value: "hello"})).toBe("hello");
		});

		it('formats atoms without indicator', () => {
			expect(formatValue({value: "a"})).toBe("a");
		});
	});

	describe('variables', () => {
		it('formats variables', () => {
			expect(formatValue({var: "_A"})).toBe("_A");
		});
	});

	describe('compound terms', () => {
		it('formats simple compounds', () => {
			const input = {
				indicator: "compound",
				name: "foo",
				args: [{value: "a"}, {value: "b"}]
			};
			expect(formatValue(input)).toBe("foo(a, b)");
		});

		it('formats nested compounds', () => {
			const input = {
				indicator: "compound",
				name: "foo",
				args: [{
					indicator: "compound",
					name: "bar",
					args: [{value: "x"}]
				}]
			};
			expect(formatValue(input)).toBe("foo(bar(x))");
		});
	});

	describe('strings (character lists)', () => {
		it('formats single-char atom lists as strings', () => {
			expect(formatValue([{value: "a"}, {value: "a"}, {value: "a"}])).toBe('"aaa"');
		});

		it('formats single-char atom lists with indicator as strings', () => {
			expect(formatValue([
				{indicator: "atom", value: "h"},
				{indicator: "atom", value: "i"}
			])).toBe('"hi"');
		});

		it('handles empty string', () => {
			expect(formatValue([])).toBe('[]');
		});
	});

	describe('lists', () => {
		it('formats empty list', () => {
			expect(formatValue([])).toBe("[]");
		});

		it('formats list of multi-char atoms as list', () => {
			expect(formatValue([{value: "foo"}, {value: "bar"}])).toBe("[foo, bar]");
		});

		it('formats list with variables', () => {
			expect(formatValue([{var: "_A"}, {var: "_B"}])).toBe("[_A, _B]");
		});

		it('formats mixed list as list', () => {
			expect(formatValue([{value: "a"}, {value: "foo"}])).toBe("[a, foo]");
		});
	});

	describe('primitives', () => {
		it('formats numbers', () => {
			expect(formatValue(42)).toBe("42");
		});

		it('formats strings', () => {
			expect(formatValue("hello")).toBe('"hello"');
		});

		it('formats null', () => {
			expect(formatValue(null)).toBe("null");
		});

		it('formats undefined', () => {
			expect(formatValue(undefined)).toBe("null");
		});
	});

	describe('edge cases', () => {
		it('falls back to JSON for unknown objects', () => {
			expect(formatValue({foo: "bar"})).toBe('{"foo":"bar"}');
		});
	});

	describe('functor-based compounds (scryer-js format)', () => {
		it('formats simple functor with single arg', () => {
			expect(formatValue({
				functor: "right_to_left",
				args: [{value: "buzz"}]
			})).toBe("right_to_left(buzz)");
		});

		it('formats functor with multiple args', () => {
			expect(formatValue({
				functor: "left_to_right",
				args: [{value: "buzz"}, {value: "woody"}]
			})).toBe("left_to_right(buzz, woody)");
		});

		it('formats list of functors', () => {
			const input = [
				{functor: "left_to_right", args: [{value: "buzz"}, {value: "woody"}]},
				{functor: "right_to_left", args: [{value: "buzz"}]}
			];
			expect(formatValue(input)).toBe("[left_to_right(buzz, woody), right_to_left(buzz)]");
		});
	});
});

describe('formatBindings', () => {
	it('formats empty bindings as "true"', () => {
		expect(formatBindings({})).toBe("true");
	});

	it('handles undefined bindings', () => {
		expect(formatBindings(undefined)).toBe("true");
	});

	it('handles null bindings', () => {
		expect(formatBindings(null)).toBe("true");
	});

	it('formats single binding', () => {
		expect(formatBindings({X: 42})).toBe("X = 42");
	});

	it('formats multiple bindings', () => {
		expect(formatBindings({
			X: {value: "a"},
			Y: {value: "b"}
		})).toBe("X = a, Y = b");
	});

	it('formats complex bindings', () => {
		expect(formatBindings({
			Ls: [{value: "a"}, {value: "a"}],
			N: 2
		})).toBe('Ls = "aa", N = 2');
	});

	it('formats Zurg puzzle solution correctly', () => {
		expect(formatBindings({
			Ms: [
				{functor: "left_to_right", args: [{value: "buzz"}, {value: "woody"}]},
				{functor: "right_to_left", args: [{value: "buzz"}]},
				{functor: "left_to_right", args: [{value: "hamm"}, {value: "rex"}]},
				{functor: "right_to_left", args: [{value: "woody"}]},
				{functor: "left_to_right", args: [{value: "buzz"}, {value: "woody"}]}
			]
		})).toBe('Ms = [left_to_right(buzz, woody), right_to_left(buzz), left_to_right(hamm, rex), right_to_left(woody), left_to_right(buzz, woody)]');
	});
});
