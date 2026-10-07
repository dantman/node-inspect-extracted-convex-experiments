# Experiments with node-inspect-extracted in the Convex runtime

This branch is a fork of `node-inspect-extracted` with log lines added to it to inspect the difference in results given in Node.js vs the Convex runtime. As you can see in [dantman/convex-node-inspect-extracted-test](https://github.com/dantman/convex-node-inspect-extracted-test) when an error is inspected by this library in Node.js it prints a different result than it does in the Convex runtime.

The main human written additions in this branch are [convex/test.js](./convex/test.js) where a Convex query was added and [test.js](./test.js) where a simple console log is used to inspect Node.js' behaviour. Also a [convex/package.json](convex/package.json) because Convex expects ESM exports not CommonJS exports. And this README.md was modified by me. [src/inspect.js](./src/inspect.js) has been modified by GitHub Copilot / GPT-5.3-Codex to insert console.log lines printing the state of `formatError` and `getStackString` as they execute. The remaining changes are additions made by `pnpm add convex`, `pnpm approve-builds`, `pnpm convex dev`, `pnpm convex ai-files disable` i.e. the boilerplate to setup Convex.

To test this out yourself `pnpm install` to get the new packages, `pnpm convex dev --once` to go through the setup process to deploy to Convex, and `pnpm convex dashboard` to open the dashboard (it will not open from the default Devcontiner so alt/ctrl+click the link in your terminal).

Run `node test.js` to see what inspecting an Error instance looks like from Node.js.

From the Convex dashboard click the "fn" tab in the lower right, select the "test:test" query in the "app" component (it will probably already be selected since it's the only user supplied Convex function), and look at the result in the panel to the right to see what is logged to Convex as well as the return result of the inspect function at the very bottom of the panel.

The **TL;DR** if you don't want to run this yourself is it appears that when `getStackString` reads `error.stack` in Node.js it is a string that starts with `"Error: This is a test"` and continues with 4 stack lines starting with `'    at Object.<anonymous> (/workspaces/node-inspect-extracted-convex-experiments/test.js:4:21)'` down to `'    at Module.load (node:internal/modules/cjs/loader:1651:32)'`; but when it reads `error.stack` in the Convex runtime it is a string that only contains the "    at handler (../convex/test.js:9:1)" stack.

----

# node-inspect-extracted

This library provides an as-faithful-as-possible implementation of Node.js's
[`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options) function.

It was built in such a way that it can be kept up-to-date with node's
[implementation](https://github.com/nodejs/node/blob/master/lib/internal/util/inspect.js),
by taking the code directly from node's repo, and changing nothing but the
`require()` statements.  All of the node built-in functions are emulated.
Many of the incompatibilities generated from that emulation are not
interesting for Web use cases.

## Installation

```bash
npm install node-inspect-extracted
```

## Use

This should work in node (for testing) and browsers, using either `require`, `import`, or as `window.Inspect` if you include this in your page as a script tag.

With `require`:

```js
const util = require('node-inspect-extracted');
console.log(util.inspect(1));
```

With `import`:

```mjs
import util from 'node-inspect-extracted';
console.log(util.inspect(2));
```

From the browser:

```html
<script src="https://unpkg.com/node-inspect-extracted/dist/inspect.js"></script>
<script>
  console.log(util.inspect(3));
</script>
```

## API

The following [`util`](https://nodejs.org/api/util.html) functions:

- [`inspect(object[,showHidden|options[,depth [, colors]]])`](https://nodejs.org/api/util.html#util_util_inspect_object_showhidden_depth_colors)
- [`format(format[, ...args])`](https://nodejs.org/api/util.html#util_util_format_format_args)
- [`formatWithOptions(inspectOptions, format[, ...args])`](https://nodejs.org/api/util.html#util_util_formatwithoptions_inspectoptions_format_args)

And these extras:

- `Proxy(target, handler)`: a wrapper for the normal [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) class that allows the `showProxy` option of inspect to work.
- `stylizeWithColor(str, styleType)`: colorize `str` with ANSI escapes according to the styleType
- `stylizeWithHTML(str, styleType)`: colorize `str` with HTML span tags

## Colors

If you specify `{colors: true}` in the inspect options, you will get ANSI
escape codes, just as you would in Node.  That's unlikely to be helpful to you
on the Web, so you might want `stylizeWithHTML`, which is also exported from the package:

```mjs
import { inspect, stylizeWithHTML } from 'node-inspect-extracted';
inspect({ a: 1 }, {
  compact: false,
  stylize: stylizeWithHTML,
});
```

which yields this ugly HTML:

```html
{
  a: <span style="color:yellow;">1</span>
}
```

If you want better HTML, the [lightly-documented](https://nodejs.org/api/util.html#util_custom_inspection_functions_on_objects) `stylize` option requires
a function that takes two parameters, a string, and a class name.  The mappings
from class names to colors is in `inspect.styles`, so start with this:

```mjs
import { inspect } from 'node-inspect-extracted';
function stylizeWithHTML(str, styleType) {
  const style = inspect.styles[styleType];
  if (style !== undefined) {
    return `<span style="color:${style};">${str}</span>`;
  }
  return str;
}
inspect({ a: 1 }, {
  compact: false,
  stylize: stylizeWithHTML,
});
```

## Known Limitations

- If you want your
   [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
   objects to have their internal object inspected, you may use the `Proxy`
   constructor exported by this project.  That was done mostly for test coverage
   purposes. It is not recommended for production code.
- [`arguments`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)
   objects are not treated specially.
   [[bug](https://github.com/hildjj/node-inspect-extracted/issues/1)]
- Several of the existing type checks (corresponding to Node's
   [`util.types`](https://nodejs.org/api/util.html#util_util_types)) are
   weaker than the ones in Node, which has the freedom to use internal
   capabilities of the runtime.  This means you can fake out the type
   detection to get output different than node.
   [[bug](https://github.com/hildjj/node-inspect-extracted/issues/2)]
- Objects that have been mangled with `Object.setPrototypeOf`
   do not retain their original type information.
   [[bug](https://github.com/hildjj/node-inspect-extracted/issues/3)]
- `Promise` state is not visible.  All Promises will show up as
   `Promise< pending >` no matter what state they are in.
- `Map` and `Set` iterators will not show their internal state because that
   cannot be done from unprivileged code without modifying the iterator.
   Entry iterators are not distinguished from value iterators.
   [[bug](https://github.com/hildjj/node-inspect-extracted/issues/4)]
- `WeakMap` and `WeakSet` will not show their contents, because those contents
   cannot be iterated over in unprivileged code.
- Colorful stack traces are not completely accurate with respect to what
   modules are Node-internal.  This doesn't matter on the Web.

## Developing

Check out NodeJS and this package next to one another:

    git clone https://github.com/hildjj/node-inspect-extracted.git
    git clone https://github.com/nodejs/node.git
    cd node-inspect-extracted
    npm install -g pnpm
    pnpm install

- `npm start` to build, run all tests and start an auto-refreshing web server
   to watch coverage change.
- `npm run check` to see if there have been any changes to node that need to be integrated.
- `npm run check -- -d` to see the diffs with node
- `npm run check -- -u` to indicate that we have merged the current changes

Tests run mostly against the pre-webpack source at the moment, but there are
some spot checks for the webpack output.

## Supported Node.js versions

This project only supports versions of Node that the Node team is [currently
supporting](https://github.com/nodejs/Release#release-schedule).  Ava's
[support statement](https://github.com/avajs/ava/blob/master/docs/support-statement.md)
is what we will be using as well.  Currently, that means Node `20`+ is
required.  Older versions of node may work, but issues will not be fixed for them.

## LICENSE

This code is an adaptation of the Node.js internal implementation, mostly from
the file lib/internal/util/inspect.js, which does not have the Joyent
copyright header.  The maintainers of this package will not assert copyright
over this code, but will assign ownership to the Node.js contributors, with
the same license as specified in the Node.js codebase; the portion adapted
here should all be plain MIT license.

[![Tests](https://github.com/hildjj/node-inspect-extracted/workflows/Tests/badge.svg)](https://github.com/hildjj/node-inspect-extracted/actions?query=workflow%3ATests)
[![codecov](https://codecov.io/gh/hildjj/node-inspect-extracted/graph/badge.svg?token=LIN5FW09AZ)](https://codecov.io/gh/hildjj/node-inspect-extracted)
