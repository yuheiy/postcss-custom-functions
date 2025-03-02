# @yuheiy/postcss-custom-functions

[PostCSS](https://github.com/postcss/postcss) plugin that allows users to define custom functions using JavaScript. This plugin is inspired by [custom functions](https://drafts.csswg.org/css-mixins-1/#custom-function) in CSS.

For example, define a custom function:

```js
module.exports = {
  plugins: {
    '@yuheiy/postcss-custom-functions': {
      functions: {
        '--negative': (value) => `calc(-1 * ${value})`,
      },
    },
  },
};
```

Use the custom function you have defined:

```css
html {
  --gap: 1em;
  padding: --negative(var(--gap));
  /* or by passing the value explicitly, like: */
  padding: --negative(1em);
}
```

will be processed to:

```css
html {
  --gap: 1em;
  padding: calc(-1 * var(--gap));
  /* or by passing the value explicitly, like: */
  padding: calc(-1 * 1em);
}
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss @yuheiy/postcss-custom-functions
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs](https://github.com/postcss/postcss#usage)
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: {
+   '@yuheiy/postcss-custom-functions': {},
    'autoprefixer': {},
  },
};
```

## Options

### `functions`

Type: `{ [key: string]: (...values: string[]) => string }`  
Default: `{}`

Define custom functions that can be used in your CSS.

## Recipes

### Optional arguments with fallback

You can define custom functions with optional arguments and fallback values.

```js
function shadow(shadowColor = 'var(--shadow-color, black)') {
  return `2px 2px ${shadowColor}`;
}

module.exports = {
  plugins: {
    '@yuheiy/postcss-custom-functions': {
      functions: {
        '--shadow': shadow,
      },
    },
  },
};
```

Use the custom function you have defined:

```css
.foo {
  --shadow-color: blue;
  box-shadow: --shadow(); /* produces a blue shadow */
  /* or just */
  box-shadow: --shadow(blue);
}
```

will be processed to:

```css
.foo {
  --shadow-color: blue;
  box-shadow: 2px 2px var(--shadow-color, black); /* produces a blue shadow */
  /* or just */
  box-shadow: 2px 2px blue;
}
```

### Arguments validation

You can validate functions arguments and output warnings if they are incorrect.

```js
function negative(value, ...rest) {
  if (!value) {
    throw new Error(
      `The --negative(…) function requires an argument, but received none.`,
    );
  }

  if (rest.length > 0) {
    throw new Error(
      `The --negative(…) function only accepts a single argument, but received ${
        rest.length + 1
      }.`,
    );
  }

  return `calc(-1 * ${value})`;
}

module.exports = {
  plugins: {
    '@yuheiy/postcss-custom-functions': {
      functions: {
        '--negative': negative,
      },
    },
  },
};
```

This implementation is inspired by [Tailwind CSS’s `css-functions.js`](https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/css-functions.ts).

### Fluid Typography

You can also implement [Fluid Typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) as a custom function, using the [`tan(atan2())` technique](https://dev.to/janeori/css-type-casting-to-numeric-tanatan2-scalars-582j) to remove px units and calculate them in CSS.

```js
function fluid(
  minSize,
  maxSize,
  minBreakpoint = 'var(--breakpoint-sm)',
  maxBreakpoint = 'var(--breakpoint-xl)',
  ...rest
) {
  if (!minSize || !maxSize) {
    throw new Error(
      'The --fluid(…) function requires 2–4 arguments, but received none.',
    );
  }

  if (rest.length > 0) {
    throw new Error(
      `The --fluid(…) function only accepts 4 arguments, but received ${
        rest.length + 1
      }.`,
    );
  }

  const slope = `calc(tan(atan2(${maxSize} - ${minSize}, 1px)) / tan(atan2(${maxBreakpoint} - ${minBreakpoint}, 1px)))`;
  const intercept = `calc(tan(atan2(${minSize}, 1px)) - ${slope} * tan(atan2(${minBreakpoint}, 1px)))`;

  return `clamp(${[
    `min(${minSize}, ${maxSize})`,
    `${slope} * 100svw + ${intercept} / 16 * 1rem`,
    `max(${minSize}, ${maxSize})`,
  ].join(', ')})`;
}

module.exports = {
  plugins: {
    '@yuheiy/postcss-custom-functions': {
      functions: {
        '--fluid': fluid,
      },
    },
  },
};
```

Use the custom function you have defined:

```css
:root {
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;
}

h1 {
  font-size: --fluid(2rem, 4rem);
}
```

will be processed to:

<!-- prettier-ignore -->
```css
:root {
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;
}

h1 {
  font-size: clamp(min(2rem, 4rem), calc(tan(atan2(4rem - 2rem, 1px)) / tan(atan2(var(--breakpoint-xl) - var(--breakpoint-sm), 1px))) * 100svw + calc(tan(atan2(2rem, 1px)) - calc(tan(atan2(4rem - 2rem, 1px)) / tan(atan2(var(--breakpoint-xl) - var(--breakpoint-sm), 1px))) * tan(atan2(var(--breakpoint-sm), 1px))) / 16 * 1rem, max(2rem, 4rem));
}
```
