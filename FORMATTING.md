# Scryer-JS Output Format Documentation

This document describes the expected output format from scryer-js and how we format it for display.

## Purpose

The playground uses custom formatting logic to convert scryer-js output (JavaScript objects) into human-readable Prolog syntax. This document serves as a reference for maintaining compatibility as scryer-js evolves.

## Expected Formats

### Atoms

**Input from scryer-js:**
```javascript
{value: "hello"}
// OR
{indicator: "atom", value: "hello"}
```

**Output:**
```
hello
```

### Variables

**Input from scryer-js:**
```javascript
{var: "_A"}
```

**Output:**
```
_A
```

### Compound Terms

**Input from scryer-js:**
```javascript
{
  indicator: "compound",
  name: "foo",
  args: [{value: "a"}, {value: "b"}]
}
```

**Output:**
```
foo(a, b)
```

### Strings (Lists of Single-Character Atoms)

In Scryer Prolog, lists of single-character atoms are displayed as strings.

**Input from scryer-js:**
```javascript
[{value: "a"}, {value: "a"}, {value: "a"}]
```

**Output:**
```
"aaa"
```

### Lists (Non-String)

Lists with multi-character atoms or mixed content stay as lists.

**Input from scryer-js:**
```javascript
[{value: "foo"}, {value: "bar"}]
```

**Output:**
```
[foo, bar]
```

### Empty List

**Input from scryer-js:**
```javascript
[]
```

**Output:**
```
[]
```

### Numbers

**Input from scryer-js:**
```javascript
42
```

**Output:**
```
42
```

### Strings

**Input from scryer-js:**
```javascript
"hello"
```

**Output:**
```
"hello"
```

## Testing

Run the unit tests:

```bash
npm test
```

Or run in watch mode during development:

```bash
npm run test:watch
```

### Regression Testing

When upgrading scryer-js:

1. Run all unit tests in `test-formatting.html`
2. Manually verify the integration tests listed on that page
3. Check that common queries still display correctly:
   - `as(As)` - Should show `[a, a, a]` not `[{"value":"a"}, ...]`
   - `length(Ls, N)` - Should show properly formatted lists
   - `X = foo(a, b)` - Should show compound terms correctly

## Implementation

The formatting logic is implemented in `main.js`:

- `formatValue(value)` - Converts a single value to Prolog syntax
- `formatBindings(bindings)` - Converts variable bindings object to display format

## Breaking Changes

If scryer-js changes its output format:

1. Tests in `test-formatting.html` will fail
2. Update `formatValue()` in `main.js` to handle new format
3. Update this documentation
4. Update tests to cover new format
5. Consider maintaining backward compatibility if possible
