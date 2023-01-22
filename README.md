```html
	<ui-component name="uibuilder" config="url:https://uibuilder.totaljs.com/render.json"></ui-component>
```

__Metadata__:

```js
exports.follow = true;          // The user will see the object in the settings form Path for reading/writing (only for UI designer)
```

__Internal flags__:

```js
instance.state.bind = true;     // The object will be bind automatically in the e.g. form object (it's targeted for objects which can read/write data (for render)
instance.state.notify = true;   // The option will emit only the "notify" event in the object when the value is change (instead of setting value directly to the object (look at Counter object))
```