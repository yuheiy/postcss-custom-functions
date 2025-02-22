import postcss from 'postcss';
import assert from 'node:assert/strict';
import test from 'node:test';
import plugin from '../dist/index.mjs';

test('output errors in custom functions as PostCSS warnings', async () => {
	const result = postcss([
		plugin({
			functions: {
				'--error': () => {
					throw new Error('custom function error');
				},
			},
		}),
	]).process('.foo { margin: --error() --error() }', {
		from: undefined,
	});

	assert.equal(result.warnings().length, 2);
});
