# UI Builder

Total.js UI Builder is a cloud-based editor for creating UI schemas.

- Cloud version: <https://uibuilder.totaljs.com>
- [Documentation](https://docs.totaljs.com/uibuilder/)

---

- [Join Total.js Telegram](https://t.me/totaljs)
- [Support](https://www.totaljs.com/support/)

__Instructions__:

- Download source code
- Install NPM dependencies with `$ npm install`
- Run the app `$ node index.js`

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: license.txt

## Good to know

__Custom rendering__:

```html
	<ui-component name="uibuilder" config="url:https://uibuilder.totaljs.com/render.json"></ui-component>
```

### Components

__Metadata__:

```js
exports.follow = true;          // The user will see the component in the settings form Path for reading/writing (only for UI designer)
exports.hidden = true;          // The component will be hidden in the component list
```

__Internal flags__:

```js
instance.state.bind = true;     // The component will be bind automatically in the e.g. form component (it's targeted for components which can read/write data (for render)
instance.state.notify = true;   // The option will emit only the "notify" event in the component when the value is change (instead of setting value directly to the component (look at Counter component))
```

__Methods__:

```js
instance.datasource(CLID_OR_@INSTANCEID, function(value) {
	// value {Array} [id, name]
});
```

__Events__:

```js
instance.on('refresh', function(meta) {
	// meta.type {String} can be "remove" or "configure"
	// meta.items {Object Array} [instance] (remove type)
	// meta.item {Object} instance (configure type)
	// some objects have been changed
});
```

__Editor properties__:

- `DEF.cl.datasource` contains all CodeList + Components.follow = true
- `DEF.cl.paths` contains Paths + Components.follow = true
- `DEF.cl.list` contains a list of all instances
- `DEF.cl.inputs` contains all inputs
- `DEF.cl.outputs` contains all outputs

__Good to know__:

- if the `config.path` starts with the `@` at, it means that he component is following another component