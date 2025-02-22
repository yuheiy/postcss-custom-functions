import { postcssTape } from '@csstools/postcss-tape';
import plugin from '../dist/index.mjs';

postcssTape(plugin)({
	basic: {
		message: 'supports basic usage',
		options: {
			functions: {
				'--shadow': (shadowColor) =>
					`2px 2px ${shadowColor ? shadowColor : 'var(--shadow-color, black)'}`,
				'--negative': (value) => `calc(-1 * ${value})`,
				'--repeat': (a, b) => `repeat(${a}, ${b})`,
				'--comma-separated-list-of-component-values': () => '10px, 20px',
			},
		},
	},
});
