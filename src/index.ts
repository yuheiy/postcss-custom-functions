import {
	isFunctionNode,
	isTokenNode,
	isWhitespaceNode,
	parseCommaSeparatedListOfComponentValues,
	parseListOfComponentValues,
	replaceComponentValues,
} from '@csstools/css-parser-algorithms';
import { isTokenComma, stringify, tokenize } from '@csstools/css-tokenizer';
import type { PluginCreator } from 'postcss';

function separateBy<T>(array: T[], predicate: (element: T) => boolean) {
	if (array.length === 0) {
		return array as T[][];
	}

	return array.reduce<T[][]>(
		(acc, element) => {
			if (predicate(element)) {
				acc.push([]);
			} else {
				acc.at(-1)?.push(element);
			}
			return acc;
		},
		[[]],
	);
}

/** @yuheiy/postcss-custom-functions plugin options */
export type pluginOptions = {
	functions?: Record<string, (...values: string[]) => string>;
};

/** Allow users to define custom functions using JavaScript. */
const creator: PluginCreator<pluginOptions> = (
	options_: pluginOptions = {},
) => {
	const options = {
		functions: options_.functions ?? {},
	} satisfies pluginOptions;

	return {
		postcssPlugin: '@yuheiy/postcss-custom-functions',
		Declaration(decl, { result }) {
			const originalValue = decl.value;
			if (
				!Object.keys(options.functions).some((name) =>
					originalValue.includes(`${name}(`),
				)
			) {
				return;
			}

			const modifiedValue = replaceComponentValues(
				parseCommaSeparatedListOfComponentValues(
					tokenize({ css: originalValue }),
				),
				(componentValue) => {
					if (!isFunctionNode(componentValue)) {
						return componentValue;
					}

					for (const [name, customFunction] of Object.entries(
						options.functions,
					)) {
						if (componentValue.getName() === name) {
							const separatedByComma = separateBy(
								componentValue.value,
								(node) => isTokenNode(node) && isTokenComma(node.value),
							);

							const args: string[] = [];

							for (const nodes of separatedByComma) {
								while (isWhitespaceNode(nodes.at(0))) nodes.shift();
								while (isWhitespaceNode(nodes.at(-1))) nodes.pop();

								// contains commas without meaningful tokens, such as `--negative(,)`
								if (nodes.length === 0) {
									return componentValue;
								}

								args.push(nodes.join(''));
							}

							let customFunctionResult: string;

							try {
								customFunctionResult = customFunction(...args);
							} catch (error) {
								decl.warn(result, error.message);
								return componentValue;
							}

							return parseListOfComponentValues(
								tokenize({ css: customFunctionResult }),
							);
						}
					}

					return componentValue;
				},
			)
				.map((componentValues) =>
					componentValues.map((x) => stringify(...x.tokens())).join(''),
				)
				.join(',');

			if (modifiedValue === originalValue) {
				return;
			}

			decl.value = modifiedValue;
		},
	};
};

creator.postcss = true;

export default creator;
