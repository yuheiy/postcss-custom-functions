import { postcssTape } from '@csstools/postcss-tape';
import plugin from '../dist/index.mjs';

postcssTape(plugin)({
	basic: {
		message: 'supports basic usage',
		options: {
			functions: {
				'--shadow': (shadowColor = 'var(--shadow-color, black)') =>
					`2px 2px ${shadowColor}`,
				'--negative': (value) => `calc(-1 * ${value})`,
				'--repeat': (a, b) => `repeat(${a}, ${b})`,
				'--comma-separated-list-of-component-values': () => '10px, 20px',
			},
		},
	},
	'syntax-errors': {
		message: 'warn syntax errors',
		options: {
			functions: {
				'--negative': (value) => `calc(-1 * ${value})`,
			},
		},
		warnings: 3,
	},
	'function-errors': {
		message: 'warn function errors',
		options: {
			functions: {
				'--error': () => {
					throw new Error('function error');
				},
			},
		},
		warnings: 3,
	},
});
