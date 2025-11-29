import { describe, it, expect } from 'vitest';
import { encodeSnippet, decodeSnippet } from './hash.js';

describe('encodeSnippet', () => {
	it('encodes simple code and query', () => {
		const result = encodeSnippet('foo(bar).', 'foo(X).');
		expect(result).toContain('code=');
		expect(result).toContain('query=');
		expect(result).toContain('&');
	});

	it('encodes empty strings', () => {
		const result = encodeSnippet('', '');
		expect(result).toContain('code=');
		expect(result).toContain('query=');
	});

	it('encodes special characters', () => {
		const code = 'foo("hello\\nworld").';
		const query = 'foo(X), X = "test".';
		const result = encodeSnippet(code, query);
		expect(result).toBeTruthy();
	});

	it('encodes unicode characters', () => {
		const code = '% λ-calculus\nλ(x).';
		const query = 'λ(X).';
		const result = encodeSnippet(code, query);
		expect(result).toBeTruthy();
	});

	it('encodes multi-line code', () => {
		const code = ':- use_module(library(lists)).\n\nfoo(bar).\nfoo(baz).';
		const query = 'foo(X).';
		const result = encodeSnippet(code, query);
		expect(result).toBeTruthy();
	});
});

describe('decodeSnippet', () => {
	it('decodes valid hash', () => {
		const hash = 'code=Zm9vKGJhciku&query=Zm9vKFgpLg%3D%3D';
		const result = decodeSnippet(hash);
		expect(result).toEqual({
			code: 'foo(bar).',
			query: 'foo(X).'
		});
	});

	it('returns null for empty hash', () => {
		expect(decodeSnippet('')).toBeNull();
	});

	it('returns null for hash with only code', () => {
		const hash = 'code=Zm9vKGJhciku';
		expect(decodeSnippet(hash)).toBeNull();
	});

	it('returns null for hash with only query', () => {
		const hash = 'query=Zm9vKFgpLg%3D%3D';
		expect(decodeSnippet(hash)).toBeNull();
	});

	it('returns null for invalid format', () => {
		expect(decodeSnippet('invalid')).toBeNull();
	});

	it('decodes unicode characters', () => {
		const original = { code: '% λ-calculus', query: 'λ(X).' };
		const encoded = encodeSnippet(original.code, original.query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual(original);
	});
});

describe('round-trip encoding', () => {
	it('preserves simple text', () => {
		const code = 'foo(bar).';
		const query = 'foo(X).';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves special characters', () => {
		const code = 'foo("hello\\nworld\\t!").';
		const query = 'foo(X), X = "test\\r\\n".';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves unicode', () => {
		const code = '% λ-calculus with ∀ and ∃\nλ(x) :- ∀(x).';
		const query = 'λ(X), ∃(Y).';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves multi-line code', () => {
		const code = `:- use_module(library(lists)).
:- use_module(library(clpz)).

foo(bar).
foo(baz).

test :- foo(X), write(X).`;
		const query = 'test.';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves empty strings', () => {
		const code = '';
		const query = '';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves Zurg puzzle code', () => {
		const code = `% Bridge and Torch Problem
:- use_module(library(dcgs)).
:- use_module(library(lists)).

toy_time(buzz, 5).
toy_time(woody, 10).`;
		const query = 'moves(Ms).';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves quotes and apostrophes', () => {
		const code = 'foo("hello\'world").';
		const query = 'foo(\'test"value\').';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});

	it('preserves URL-like strings', () => {
		const code = 'url("https://example.com?foo=bar&baz=qux").';
		const query = 'url(X).';
		const encoded = encodeSnippet(code, query);
		const decoded = decodeSnippet(encoded);
		expect(decoded).toEqual({ code, query });
	});
});

describe('URL parameter format', () => {
	it('produces valid URLSearchParams format', () => {
		const encoded = encodeSnippet('foo.', 'bar.');
		// Should be parseable as URLSearchParams
		const params = new URLSearchParams(encoded);
		expect(params.has('code')).toBe(true);
		expect(params.has('query')).toBe(true);
	});

	it('uses separate parameters for code and query', () => {
		const encoded = encodeSnippet('test code', 'test query');
		const params = new URLSearchParams(encoded);
		expect(params.get('code')).not.toEqual(params.get('query'));
	});
});
