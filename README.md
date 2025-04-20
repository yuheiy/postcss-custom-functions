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

You can also implement [Fluid Typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) as a custom function.

```js
function round(n) {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

function fluid(
  min,
  max,
  minBreakpoint = '640',
  maxBreakpoint = '1536',
  ...rest
) {
  if (!min || !max) {
    throw new Error(
      'The --fluid(…) function requires at least 2 arguments, but received insufficient arguments.',
    );
  }

  if (rest.length > 0) {
    throw new Error(
      `The --fluid(…) function only accepts 4 arguments, but received ${
        rest.length + 1
      }.`,
    );
  }

  min = Number(min);
  max = Number(max);
  minBreakpoint = Number(minBreakpoint);
  maxBreakpoint = Number(maxBreakpoint);

  const divider = 16;
  const slope =
    (max / divider - min / divider) /
    (maxBreakpoint / divider - minBreakpoint / divider);
  const intersection = -1 * (minBreakpoint / divider) * slope + min / divider;

  return `clamp(${[
    `${(min > max ? max : min) / divider}rem`,
    `${round(intersection)}rem + ${round(slope * 100)}svw`,
    `${(min > max ? min : max) / divider}rem`,
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
h1 {
  font-size: --fluid(32, 64);
}
```

will be processed to:

```css
h1 {
  font-size: clamp(2rem, 0.5714rem + 3.5714svw, 4rem);
}
```

Also, by utilizing the [`tan(atan2())` technique](https://dev.to/janeori/css-type-casting-to-numeric-tanatan2-scalars-582j), we can perform calculations in a CSS-native way without requiring JavaScript unit conversions. This means we can combine different units and work with custom properties directly in CSS.

> **Note:** Currently, this technique does not work in Firefox.

```js
function toPx(length) {
  return `tan(atan2(${length}, 1px))`;
}

function fluid(
  min,
  max,
  minBreakpoint = 'var(--breakpoint-sm)',
  maxBreakpoint = 'var(--breakpoint-2xl)',
  ...rest
) {
  if (!min || !max) {
    throw new Error(
      'The --fluid(…) function requires at least 2 arguments, but received insufficient arguments.',
    );
  }

  if (rest.length > 0) {
    throw new Error(
      `The --fluid(…) function only accepts 4 arguments, but received ${
        rest.length + 1
      }.`,
    );
  }

  const t = `(${toPx('100svw')} - ${toPx(minBreakpoint)}) / (${toPx(
    maxBreakpoint,
  )} - ${toPx(minBreakpoint)})`;

  return `clamp(${[
    `min(${min}, ${max})`,
    `${min} + (${max} - ${min}) * ${t}`,
    `max(${min}, ${max})`,
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
  font-size: clamp(
    min(2rem, 4rem),
    2rem + (4rem - 2rem) *
      (tan(atan2(100svw, 1px)) - tan(atan2(var(--breakpoint-sm), 1px)))
        / (tan(atan2(var(--breakpoint-2xl), 1px)) - tan(atan2(var(--breakpoint-sm), 1px))),
    max(2rem, 4rem)
  );
}
```
