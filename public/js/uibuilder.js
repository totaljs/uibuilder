(function(Builder) {

	customElements.define('ui-build-root', class extends HTMLDivElement {

		constructor() {
			super();
		}

	}, { extends: 'div' });

	customElements.define('ui-build-component', class extends HTMLDivElement {
		constructor() {
			super();
		}
	}, { extends: 'div' });

	customElements.define('ui-build-children', class extends HTMLDivElement {
		constructor() {
			super();
		}
	}, { extends: 'div' });

	var REG_CLASS = /CLASS/g;

	// Internal "component" configuration keys:
	// config.name {String} a component readable name for human
	// config.path {String} a path for storing of data

	function InstanceEvent() {
	}

	InstanceEvent.prototype.stopPropagation = function() {
		this.$propagation = true;
	};

	function Instance() {
		var t = this;
		t.state = { init: 0, value: null, disabled: false, modified: false, readonly: false, touched: false, invalid: false, delay: 10, notify: false, bind: false };
		t.cache = {};
		t.events = {};
		t.$inputs = {};
		t.$outputs = {};
	}

	var IP = Instance.prototype;

	IP.$forcecheck = function(t) {
		t.$checktimeout = null;
		t.set('invalid', t.state.disabled || t.state.readonly ? false : t.validate ? (!t.validate()) : false);
	};

	IP.check = function(force) {
		var t = this;
		t.$checktimeout && clearTimeout(t.$checktimeout);

		if (force)
			t.$forcecheck(t);
		else
			t.$checktimeout = setTimeout(t.$forcecheck, 150, t);

		return t;
	};

	var emptytemplate = function() {
		return '';
	};

	IP.maketemplate = function(value) {

		var t = this;

		if (!value)
			value = t.component.html;

		if (!value)
			return emptytemplate;

		var id = HASH(value).toString(36);
		if (t.app.cache[id])
			return t.app.cache[id];

		t.app.cache[id] = value.indexOf('{{') === -1 ? (() => value) : Tangular.compile(value);
		return t.app.cache[id];
	};

	IP.error = function(e) {
		var t = this;
		var config = t.config;
		console.error(t.component.name + ': ' + config.name + (config.path ? ' ({0})'.format(config.path) : ''), e);
	};

	IP.clone = function(val) {
		var tmp = val;
		switch (typeof(tmp)) {
			case 'object':
				if (tmp && !(tmp instanceof Date))
					tmp = CLONE(tmp);
				break;
		}
		return tmp;
	};

	IP.set = function(type, value, kind, binder) {

		// Supported types:
		// - value      (current value)
		// - disabled   (is disabled)
		// - modified   (value has been modified)
		// - readonly   (is readonly)
		// - touched    (user changed something)
		// - invalid    (is invalid?)

		var t = this;
		var tclass = false;

		switch (type) {
			case 'disabled':
			case 'modified':
			case 'readonly':
			case 'touched':
			case 'invalid':
				tclass = true;
				value = value ? true : false;
				break;
		}

		if (type === 'touched')
			t.check();

		if (t.state[type] === value)
			return false;

		t.state[type] = value;
		t.events.set && t.emit('set', type, value, kind);

		if (type === 'value') {

			t.events.value && t.emit('value', value, kind);

			if (t.binded) {
				for (var m of t.binded) {
					if (m !== binder) {
						var tmp = t.clone(value);
						if (m.state.notify)
							m.emit('notify', tmp, t);
						else
							m.set('value', tmp, binder ? 'noemitstate' : '', t);
					}
				}
			}

			if (t.binder && !t.state.notify && t.binder !== binder)
				t.binder.set('value', t.clone(value), binder ? 'noemitstate' : '', t);

			t.check();
		}

		if (kind === 'noemitstate')
			return;

		var e = t.cache.e;

		if (tclass)
			t.element.tclass('UI_' + type, value);

		if (e) {
			t.cache.e.changes[type] = 1;
			return true;
		} else {
			e = t.cache.e = new InstanceEvent();
			e.id = t.id;
			e.instance = t;
			e.state = t.state;
			e.element = t.element;
			e.changes = {};
			e.changes[type] = 1;
			e.kind = kind;
		}

		setTimeout(t => t.app.emitstate(t.cache.e), t.state.delay, t);
		return true;
	};

	IP.input = function(id, callback) {
		var t = this;
		t.$inputs[id] = callback;
		return t;
	};

	IP.output = function(name, fn) {

		var t = this;
		var output = (t.component.outputs || EMPTYARRAY).findItem('id', name);
		if (!output) {
			console.error('Output "{0}" not found in the "{1}" component'.format(name, t.component.name));
			return;
		}

		if (fn) {
			t.$outputs[name] = fn;
		} else {
			fn = t.$outputs[name];
			fn && fn(function(err, data) {
				var obj = {};
				obj.id = t.id + '_' + output.id;
				obj.instanceid = t.id;
				obj.componentid = t.component.id;
				obj.ref = output.id;
				obj.icon = output.icon;
				obj.color = output.color;
				obj.note = output.note;
				obj.name = output.name;
				obj.component = t.component;
				obj.app = t.app;
				obj.instance = t;
				obj.err = err;
				obj.data = data;
				t.app.emit('output', obj);
				Builder.emit('output', obj);
			});
		}

		return t;
	};

	IP.family = function() {

		var t = this;
		var output = [];

		var next = function(instance) {
			if (instance.children) {
				for (var item of instance.children) {
					output.push(item);
					next(item);
				}
			}
		};

		next(t);
		return output;
	};

	IP.remove = function() {
		var t = this;
		t.element.remove();
		t.app.clean();
	};

	IP.readvalue = function(id) {
		var t = this;

		if (!id)
			return t.state.value;

		var instance = t.find(id);
		return instance ? instance.state.value : null;
	};

	IP.datasource = function(id, callback) {

		var t = this;

		if (!id)
			return t;

		var fn = function(response) {
			if (response && response instanceof Array)
				callback(CLONE(response));
		};

		if (id.charAt(0) === '@') {
			var instance = t.find(id);
			if (instance) {
				instance.on('value', fn);
				fn(instance.state.value);
			}
		} else
			t.clfind(id, fn);

		return t;
	};

	IP.clfind = function(clid, search, fn) {
		var t = this;

		if (typeof(search) === 'function') {
			fn = search;
			search = '';
		}

		if (fn) {
			t.app.clfind(clid, search, fn);
			return t;
		} else
			return new Promise(resolve => t.app.clfind(clid, search, resolve));
	};

	IP.clread = function(clid, id, fn) {
		var t = this;
		if (fn) {
			t.app.clread(clid, id, fn);
			return t;
		} else
			return new Promise(resolve => t.app.clread(clid, id, resolve));
	};

	IP.find = function(id) {
		return this.app.instances.findItem('id', id.charAt(0) === '@' ? id.substring(1) : id);
	};

	IP.hidden = function() {
		return HIDDEN(this.dom);
	};

	IP.reset = function() {
		var t = this;
		// t.set('touched', false);
		// t.set('modified', false);
		t.events.reset && t.emit('reset');
		return t;
	};

	IP.reconfigure = function(config) {

		var t = this;
		var changes = {};

		if (config) {
			for (var key in config) {
				var prev = t.config[key];
				var curr = config[key];
				if (curr !== prev) {
					changes[key] = prev;
					t.config[key] = curr;
				}
			}
		}

		t.events.configure && t.emit('configure', changes);
		return t;
	};

	IP.get = function(type) {
		return this.state[type || 'value'];
	};

	IP.on = function(name, fn) {
		var t = this;
		if (t.events[name])
			t.events[name].push(fn);
		else
			t.events[name] = [fn];
	};

	IP.off = function(name, fn) {
		var t = this;
		var events = t.events[name];
		if (events) {
			if (fn) {
				var index = events.indexOf(fn);
				if (index !== -1) {
					events.splice(index, 1);
					if (!events.length)
						delete t.events[name];
				}
			} else
				delete t.events[name];
		}
		return t;
	};

	IP.emit = function(name, a, b, c, d, e) {
		var t = this;
		var items = t.events[name];
		if (items) {
			for (var fn of items)
				fn.call(t, a, b, c, d, e);
		}
	};

	IP.bindable = function(path) {
		var t = this;

		/*
		var can = !t.config.path || t.config.path.charAt(0) !== '@';
		if (path)
			return can ? t.config.path === path : false;
		else
			return can;
		*/

		var can = !t.config.path || t.config.path.charAt(0) !== '@';
		return can ? t.config.path === path : false;
	};

	IP.write = function(obj, path, value) {

		if (!path || path.charAt(0) === '@')
			return value;

		var arr = path.split('.');
		for (var i = 0; i < arr.length - 1; i++) {
			var tmp = obj[arr[i]];
			if (tmp == null)
				tmp = obj[arr[i]] = {};
			obj = tmp;
		}

		obj[arr[i]] = value;
		return obj;
	};

	IP.watch = function(id, type, callback) {

		if (typeof(type) === 'function') {
			callback = type;
			type = 'value';
		}

		var t = this;
		var instance = t.app.instance.findItem('id', id);
		instance && instance.on(type, callback);
		return t;
	};

	IP.read = function(obj, path) {

		if (!path || path.charAt(0) === '@')
			return obj;

		var arr = path.split('.');
		for (var i = 0; i < arr.length; i++) {
			obj = obj[arr[i]];
			if (!obj)
				return;
		}
		return obj;
	};

	IP.replace = IP.variables = function(val, data, encoder) {
		var self = this;
		return val.replace(/\{[a-z0-9_\.-]+\}/gi, function(text) {
			var key = text.substring(1, text.length - 1).trim();
			var val = '';
			var four = key.substring(0, 4);
			if (four === 'user') {
				if (W.user) {
					key = key.substring(5);
					val = key.indexOf('.') === -1 ? W.user[key] : self.read(W.user, key);
				}
			} else if (four === 'args') {
				key = key.substring(5);
				val = self.args[key];
			} else if (four === 'data') {
				if (data) {
					key = key.substring(4);
					val = key.indexOf('.') === -1 ? data : self.read(data, key.substring(1));
				}
			} else if (key.substring(0, 5) === 'query') {
				key = key.substring(5);
				if (key.indexOf('.') === -1)
					return QUERIFY(NAV.query).substring(1);
				else
					val = NAV.query[key.substring(1)];
			}

			if (val == null)
				return text;

			if (typeof(encoder) === 'function')
				return encoder(val);

			switch (encoder) {
				case 'url':
				case 'urlencode':
				case 'encode':
					return encodeURIComponent(val);
				case 'escape':
				case 'html':
					return Thelpers.encode(val);
				case 'json':
					return JSON.stringify(val);
			}

			return val;
		});
	};

	IP.querify = function(url, obj) {
		var self = this;
		return self.app.urlify(self.variables(obj ? QUERIFY(url, obj) : url));
	};

	IP.urlify = function(url) {
		var self = this;
		return self.app.urlify(self.variables(url));
	};

	IP.settings = function() {
		var t = this;
		t.app.emit('settings', t);
		Builder.emit('settings', t);
	};

	Builder.version = 1;
	Builder.selectors = { component: '.UI_component', components: '.UI_components' };
	Builder.current = 'default';
	Builder.events = {};
	Builder.apps = {};
	Builder.resize = function() {
		for (var key in Builder.apps) {
			var app = Builder.apps[key];
			for (var instance of app.instances)
				instance.events.resize && instance.emit('resize');
		}
	};

	ON('resize + resize2', Builder.resize);

	Builder.on = function(name, fn) {
		var t = this;
		if (t.events[name])
			t.events[name].push(fn);
		else
			t.events[name] = [fn];
	};

	Builder.emit = function(name, a, b, c, d, e) {
		var t = this;
		var items = t.events[name];
		if (items) {
			for (var fn of items)
				fn.call(t, a, b, c, d, e);
		}
	};

	Builder.register = function(name, fn) {
		var app = Builder.apps[Builder.current];
		app.pending.push({ name: name, fn: fn });
	};

	function app_compile(container, obj, index, position) {

		var self = this;
		var com = self.components[obj.component];

		if (!com) {
			console.error('UI Builder: The component "{0}" not found'.format(obj.component));
			return;
		}

		var div = document.createElement('DIV');
		var instance = new Instance();

		div.setAttribute('is', 'ui-build-component');

		obj.gap && div.classList.add('UI_gap');

		if (com.floating) {
			div.classList.add('UI_floating');
			div.style = 'left:{0}px;top:{1}px;z-index:{2};position:absolute'.format(obj.x || 0, obj.y || 0, obj.zindex || 1);
		}

		if (obj.bind)
			instance.state.bind = true;

		if (obj.notify)
			instance.state.notify = true;

		if (!com.config)
			com.config = {};

		instance.id = obj.id;
		instance.args = self.args;
		instance.element = $(div);
		instance.element.aclass(Builder.selectors.component.substring(1) + ' ' + com.cls).attrd('id', obj.id);
		instance.dom = div;
		instance.events = {};
		instance.config = CLONE(com.config);
		instance.app = self;
		instance.component = com;
		instance.protected = obj.protected;
		instance.meta = obj;
		instance.edit = app_edit;

		if (obj.config) {
			for (var key in obj.config)
				instance.config[key] = obj.config[key];
		}

		if (!instance.config.name)
			instance.config.name = com.name;

		self.instances.push(instance);

		var tmp = container.closest(Builder.selectors.component);
		if (tmp && tmp.length) {

			instance.parent = tmp[0].uibuilder;

			if (instance.parent) {

				var parent = instance.parent;

				if (!parent.children)
					parent.children = [];

				if (!parent.containers)
					parent.containers = {};

				var key = 'container' + index;

				parent.children.push(instance);

				if (parent.containers[key]) {
					if (position == null)
						parent.containers[key].push(instance);
					else
						parent.containers[key].splice(position, 0, instance);
				} else
					parent.containers[key] = [instance];
			}

		}

		div.uibuilder = instance;

		tmp = $(container);
		if (position == null) {
			tmp.append(div);
		} else {
			var is = false;
			for (var i = 0; i < tmp[0].children.length; i++) {
				if (i === position) {
					tmp[0].insertBefore(div, tmp[0].children[i]);
					is = true;
					break;
				}
			}
			if (!is)
				tmp.append(div);
		}

		com.make(instance, instance.config, instance.element, instance.component.cls);
		Builder.events.make && Builder.emit('make', instance);

		if (!(obj.children instanceof Array)) {
			self.refreshio();
			return;
		}

		setTimeout(function(self, obj) {
			var containers = findcontainers(self, obj.id);
			for (var i = 0; i < obj.children.length; i++) {
				var container = containers.findItem('index', i);
				if (container) {
					var arr = obj.children[i];
					for (var o of arr)
						self.compile(container.element, o, i);
				}
			}
			self.refreshio();
		}, 1, self, obj);
	}

	function inDOM(el) {
		if (!el)
			return;
		if (el.tagName === 'BODY')
			return true;
		var parent = el.parentNode;
		while (parent) {
			if (parent.tagName === 'BODY')
				return true;
			parent = parent.parentNode;
		}
	}

	function app_clean() {

		var self = this;
		var index = 0;
		var counter = 0;
		var ref = [];

		while (true) {
			var instance = self.instances[index];
			if (instance) {
				if (inDOM(instance.dom)) {
					index++;
				} else {
					counter++;
					instance.events.destroy && instance.emit('destroy');
					self.instances.splice(index, 1);
					ref.push(instance);
				}
			} else
				break;
		}

		self.refreshio();

		if (counter) {
			for (var item of self.instances)
				item.events.refresh && item.emit('refresh', { type: 'remove', items: ref });
		}

	}

	var findcontainers = function(self, id) {

		var el = self.element;
		var containers = [];
		var container = el.find(Builder.selectors.component + '[data-id="{0}"] {1}'.format(id, Builder.selectors.components));

		for (var el of container) {
			el = $(el);
			var parent = el.closest(Builder.selectors.component);
			if (parent.attrd('id') === id)
				containers.push({ index: +el.attrd('index'), element: el });
		}
		containers.quicksort('index');
		return containers;
	};

	function app_add(parentid, parentindex, com, position, config, extendmeta) {

		var self = this;

		if (typeof(com) === 'string') {
			var tmp = self.components[com];
			if (!tmp) {
				console.error('Component "{0}" not found'.format(com));
				return;
			}

			com = { id: 'cid' + Date.now().toString(36), component: com, children: [], config: com.config || {}, gap: com.gap != false };
		}

		extendmeta && COPY(extendmeta, com);

		if (config) {
			for (var key in config)
				com.config[key] = config[key];
		}

		var containers = findcontainers(self, parentid);
		if (containers.length) {
			for (var container of containers) {
				if (container.index == parentindex)
					self.compile(container.element, com, parentindex, position);
			}
		}

		self.refreshio();
		return com;
	}

	Builder.build = function(target, meta, args, callback) {

		if (typeof(args) === 'function') {
			callback = args;
			args = {};
		}

		var prev = Builder.apps[meta.id];
		if (prev) {
			Builder.remove(meta.id);
			setTimeout(Builder.build, 100, target, meta, callback);
			return;
		}

		Builder.current = meta.id;

		var root = document.createElement('DIV');
		var container = $(root);
		container.attrd('id', meta.id);
		container.aclass('UI_app invisible');
		container.empty();

		root.setAttribute('is', 'ui-build-root');

		// if (meta.css)
		// 	container[0].style = meta.css;

		$(target)[0].appendChild(root);

		var app = {};
		var css = [];

		app.id = Builder.current;
		app.components = {};
		app.args = args;
		app.schema = meta;
		app.events = {};
		app.cache = {};
		app.compile = app_compile;
		app.stringify = app_stringify;
		app.clean = app_clean;
		app.add = app_add;
		app.remove = () => Builder.remove(app.id);
		app.class = 'ui_' + HASH(Builder.current).toString(36);
		app.element = container;
		app.dom = container[0];
		app.pending = [];
		app.instances = [];

		if (meta.urlify)
			app.urlify = meta.urlify;
		else
			app.urlify = url => url;

		container.aclass(app.class);

		// app.outputs = [];
		// app.inputs = [];

		if (Builder.clfind) {
			app.clfind = Builder.clfind;
		} else {
			app.clfind = function(clid, search, fn) {
				// It must be declared in the app
				// @clid {String}
				// @search {String}
				// @fn {Function(response)}
				fn(EMPTYARRAY);
			};
		}

		if (Builder.clread) {
			app.clread = Builder.clread;
		} else {
			app.clread = function(clid, id, fn) {
				// It must be declared in the app
				// @clid {String}
				// @id {String}
				// @fn {Function(response)}
				fn(EMPTYOBJECT);
			};
		}

		app.on = function(name, fn) {
			var t = this;
			if (t.events[name])
				t.events[name].push(fn);
			else
				t.events[name] = [fn];
		};

		app.emit = function(name, a, b, c, d, e) {
			var t = this;
			var items = t.events[name];
			if (items) {
				for (var fn of items)
					fn.call(t, a, b, c, d, e);
			}
		};

		app.intervalcounter = 0;
		app.interval && clearInterval(app.interval);
		app.interval = setInterval(function(app) {

			if (!W.inDOM(app.dom)) {
				app.remove();
				return;
			}

			app.intervalcounter++;

			for (var item of app.instances)
				item.events.service && item.emit('service', app.intervalcounter);

		}, 60000, app);

		app.recompile = function() {
			app.clean();
			for (var i = 0; i < app.schema.children.length; i++) {
				var index = app.schema.children[i];
				for (var m of index) {
					m.protected = true;
					app.compile(app.element, m, i);
				}
			}
		};

		app.build = function(el, submeta, callback) {
			submeta.urlify = app.urlify;
			Builder.build(el, submeta, args, callback);
		};

		var refreshiotimeout = null;
		var refreshio = function() {

			refreshiotimeout = null;

			if (Builder.editor) {
				app.inputs = [];
				app.outputs = [];
				app.list = [];
				app.zindex = 1;

				for (var instance of app.instances) {

					if (!instance.dom.parentNode)
						continue;

					if (instance.component.floating) {
						app.zindex = (instance.element.css('z-index') || '').parseInt();
						if (app.zindex <= 0)
							app.zindex = 1;
					}

					var arr = instance.component.inputs;
					var name = instance.config.name || instance.component.name;

					app.list && app.list.push({ id: instance.id, name: name, icon: instance.component.icon, color: instance.component.color });

					if (arr) {
						for (var m of arr) {
							app.inputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + ': ' + m.name, component: name, input: m.name, icon: instance.component.icon, color: instance.component.color, note: m.note, schema: m.schema });
						}
					}

					arr = instance.component.outputs;
					if (arr && arr.length) {
						for (var m of arr) {
							app.outputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + ': ' + m.name, component: name, output: m.name, icon: instance.component.icon, color: instance.component.color, note: m.note, schema: m.schema });
						}
					}
				}
			} else
				app.outputs = app.inputs = app.schema = null;

			if (!app.ready) {

				app.ready = true;
				app.callback && app.callback(app);
				container.rclass('invisible');

				var binded = {};
				var binder = {};
				var isbinded = false;

				// Check binded instances
				for (var item of app.instances) {
					if (item.config.path && item.config.path.charAt(0) === '@') {
						var key = item.config.path.substring(1);
						if (key != item.id) {
							if (binded[key])
								binded[key].push(item);
							else
								binded[key] = [item];
							binder[item.id] = key;
							isbinded = true;
						}
					}
				}

				// Assign binded instances
				if (isbinded) {
					for (var item of app.instances) {
						item.binded = binded[item.id] || null;
						item.binder = binder[item.id] ? app.instances.findItem('id', binder[item.id]) : null;
					}
				}

				// Emit ready
				for (var item of app.instances) {
					item.state.init = 1;
					item.events.ready && item.emit('ready');
				}

				Builder.emit('app', app);
			}

			app.emit('io', app);
			Builder.emit('io', app);
		};

		app.refreshio = function(force) {
			if (force) {
				refreshio();
			} else {
				refreshiotimeout && clearTimeout(refreshiotimeout);
				refreshiotimeout = setTimeout(refreshio, 100);
			}
		};

		app.input = function(id, data, callback) {

			if (!callback)
				callback = NOOP;

			var index = id.indexOf('_');
			var instanceid = id.substring(0, index);
			var inputid = id.substring(index + 1);

			var instance = app.instances.findItem('id', instanceid);
			if (instance) {
				var fn = instance.$inputs[inputid];
				if (fn)
					fn(data, callback);
				else
					callback('Input "{0}" not found'.format(inputid));
			} else
				callback('Instance "{0}" not found'.format(instanceid));

		};

		app.output = function(id) {

			if (!callback)
				callback = NOOP;

			var index = id.indexOf('_');
			var instanceid = id.substring(0, index);
			var outputid = id.substring(index + 1);

			var instance = app.instances.findItem('id', instanceid);
			if (instance)
				instance.output(outputid);
			else
				callback('Instance "{0}" not found'.format(instanceid));

		};

		app.emitstate = function(e) {

			// @e InstanceEvent
			// 1. notifies all parents
			// 2. notifies all other components

			var parents = {};
			var key = 'state';
			var instance = e.instance;

			// Clears cache
			e.instance.cache.e = null;

			// notifies all parents
			var parent = instance.parent;

			e.level = 0;

			while (parent) {

				e.level++;
				parents[parent.id] = true;

				if (parent.events[key])
					parent.emit(key, e);

				if (e.$propagation)
					break;

				parent = parent.parent;
			}

			e.level = null;

			key = '@state';

			for (var obj of app.instances) {
				if (!parents[instance.id] && obj !== e.instance)
					obj.events[key] && obj.emit(key, e);
			}

		};

		Builder.apps[Builder.current] = app;

		Object.keys(meta.components).wait(function(key, next) {
			var fn = meta.components[key];
			if (typeof(fn) === 'string') {

				var ext = fn.split(' ');
				var url = (ext[1] || '').trim();

				ext = ext[0].trim();

				if (!url) {
					url = ext;
					ext = '';
				}

				if (ext) {
					if (ext.charAt(0) === '.html')
						ext = ext.substring(1);
				}

				if (ext === 'base64') {
					// A component
					try {
						var obj = {};
						obj.id = key;
						obj.cls = app.class + '_' + HASH(obj.id).toString(36);
						var parsed = Builder.parsehtml(decodeURIComponent(atob(url)));
						if (parsed.css)
							obj.css = parsed.css;
						if (parsed.html)
							obj.html = parsed.html.replace(REG_CLASS, obj.cls);
						new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);
						app.pending.push({ name: key, fn: obj });
					} finally {
						next();
					}
					return;
				}

				if (!ext || ext === 'html') {
					AJAX('GET ' + url, function(response, err) {

						if (err) {
							console.error('UI Builder:', url, err);
							next();
							return;
						}

						if (ERROR(response)) {
							console.error('UI Builder:', url, response);
							next();
							return;
						}

						var parsed = Builder.parsehtml(response);

						try {
							var obj = {};

							obj.id = key;
							obj.cls = app.class + '_' + HASH(obj.id).toString(36);

							if (parsed.css)
								obj.css = parsed.css;

							if (parsed.readme)
								obj.readme = parsed.readme;

							if (parsed.html)
								obj.html = parsed.html.replace(REG_CLASS, obj.cls);

							if (parsed.settings)
								obj.settings = parsed.settings.replace(REG_CLASS, obj.cls);

							new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);
							app.pending.push({ name: key, fn: obj });

						} finally {
							next();
						}
						// console.error('UI Builder:', key, e);
					});
				}

			} else {
				app.pending.push({ name: key, fn: fn });
				next();
			}

		}, function() {

			var items = app.pending.splice(0);
			items.wait(function(item, next) {

				var obj = null;

				if (typeof(item.fn) === 'function') {
					obj = {};
					obj.id = item.name;
					obj.cls = app.class + '_' + HASH(obj.id).toString(36);
					item.fn(obj);
				} else
					obj = item.fn;

				app.components[item.name] = obj;
				obj.css && css.push(obj.css.replace(REG_CLASS, obj.cls));

				if (obj.import instanceof Array)
					obj.import.wait(IMPORT, next);
				else
					next();

			}, function() {

				meta.css && css.unshift(meta.css.replace(REG_CLASS, app.class));
				CSS(css, app.class);

				for (var i = 0; i < meta.children.length; i++) {
					var index = meta.children[i];
					for (var m of index) {
						m.protected = true;
						app.compile(container, m, i);
					}
				}

				app.callback = callback;
			});
		});

		return app;
	};

	Builder.parsehtml = function(response) {

		var css = '';

		if (response.indexOf('<scr' + 'ipt>') === -1)
			return { js: response };

		var settings = '';
		var readme = '';
		var css = '';
		var js = '';
		var html = '';

		var beg = response.indexOf('<sett' + 'ings>');
		if (beg !== -1) {
			var end = response.indexOf('</sett' + 'ings>', beg + 10);
			settings = response.substring(beg + 8, end).trim();
			response = response.substring(0, beg) + response.substring(end + 11);
		}

		beg = response.indexOf('<st' +'yle>');
		if (beg !== -1)
			css = response.substring(beg + 7, response.indexOf('</st' + 'yle>', beg + 7));

		beg = response.indexOf('<body>');
		if (beg !== -1)
			html = response.substring(beg + 6, response.indexOf('</body>', beg + 6));

		beg = response.indexOf('<readme>');
		if (beg !== -1)
			readme = response.substring(beg + 8, response.indexOf('</readme>', beg + 8));

		beg = response.indexOf('<scr' + 'ipt>');
		if (beg !== -1) {
			var end = response.indexOf('</scr' + 'ipt>', beg + 8);
			js = response.substring(beg + 8, end).trim();
		}

		return { js: js, css: css, settings: settings, readme: readme, html: html };

	};

	Builder.remove = function(id) {
		var item = Builder.apps[id];
		if (item) {

			item.interval && clearInterval(item.interval);
			item.interval = null;

			for (var instance of item.instances)
				instance.events.destroy && instance.emit('destroy');

			setTimeout(function() {
				for (var key in item.components) {
					var obj = item.components[key];
					obj.uninstall && obj.uninstall();
				}
				item.tmp = null;
				CSS('', item.class);
				item.element.remove();
				delete Builder.apps[id];
			}, 2);

		}
	};

	var openeditor = null;
	var D = document;

	function getSelection2(node) {
		if (D.selection && D.selection.type === 'Text')
			return D.selection.createRange().htmlText;
		else if (!W.getSelection)
			return;
		var sel = W.getSelection();
		if (!sel.rangeCount)
			return '';
		var container = D.createElement('div');
		for (var i = 0, len = sel.rangeCount; i < len; ++i)
			container.appendChild(sel.getRangeAt(i).cloneContents());
		return node ? container : container.innerHTML;
	}

	function app_edit(el, opt, callback) {

		if (!(el instanceof jQuery))
			el = $(el);

		if (!opt)
			opt = {};

		// opt.format {Boolean}
		// opt.bold {Boolean}
		// opt.italic {Boolean}
		// opt.underline {Boolean}
		// opt.link {Boolean}
		// opt.icon {Boolean}
		// opt.multiline {Boolean}
		// opt.callback {Function}
		// opt.html {String}
		// opt.commands {Boolean}
		// opt.backslashremove {Boolean}
		// opt.param {Object} a custom parameter
		// opt.parent {Element}

		if (opt.format == null)
			opt.format = true;

		if (callback)
			opt.callback = callback;

		if (openeditor) {
			if (openeditor.element[0] != el[0]) {
				openeditor.close();
				setTimeout(app_edit, 100, el, opt, callback);
			}
			return;
		}

		opt.backup = el.html();
		opt.html && el.html(opt.html);
		el.attr('contenteditable', true);
		el.aclass('UI_editing');

		openeditor = {};
		openeditor.element = el;
		openeditor.dom = el[0];
		openeditor.parent = opt.parent ? opt.parent[0] : openeditor.dom;
		openeditor.createlink = function() {

			var sel = getSelection2().trim();
			if (!sel)
				return;

			var el = openeditor.element;
			var url = '#link' + Date.now().toString(36);
			var mtd = el[0];

			for (var i = 0; i < 5; i++) {
				if (mtd.tagName === 'A')
					return;
				mtd = mtd.parentNode;
				if (!mtd)
					break;
			}

			document.execCommand('CreateLink', false, url);

			var tmp = el.find('a[href="' + url + '"]');
			if (!tmp.length)
				return;

			openeditor && openeditor.close();

			var content = tmp.text();
			var href = '';

			tmp.aclass('UI_link');

			if (content.indexOf('@') !== -1)
				href = 'mailto:' + content;
			else if ((/\d+/).test(content))
				href = 'tel:' + content;
			else if (content.indexOf(' ') === -1 && content.indexOf(',') === -1 && content.indexOf('.') !== -1)
				href = (/http(s):\/\//).test(content) ? content : ('https://' + content);

			var target = href.indexOf('.') !== -1 && href.indexOf(location.hostname) === -1 ? '_blank' : '';
			tmp.attr('href', href || '#');
			tmp.attr('target', target);
			Builder.emit('link', tmp, NOOP);
		};

		var clickoutside = function(e) {
			if (!(e.target === openeditor.parent || openeditor.parent.contains(e.target)))
				openeditor.close();
		};

		var keydown = function(e) {

			opt.keydown && opt.keydown(e);

			// openeditor.timeout && clearTimeout(openeditor.timeout);
			// openeditor.timeout = setTimeout(loadformat, 150);

			if (e.keyCode === 27) {
				e.preventDefault();
				e.stopPropagation();
				openeditor.key = 27;
				openeditor.close();
				return;
			}

			if (opt.backslashremove && e.keyCode === 8 && !el.text().trim()) {
				openeditor.key = 8;
				openeditor.close();
				return;
			}

			if (e.keyCode === 13) {

				if (!opt.multiline || e.shiftKey) {
					e.preventDefault();
					e.stopPropagation();
					openeditor.key = 13;
					openeditor.close();
				}

				return;
			}

			if (e.keyCode === 9) {

				if (opt.tabs) {
					e.preventDefault();
					document.execCommand('insertHTML', false, '&#009');
					return;
				}

				if (opt.endwithtab) {
					e.preventDefault();
					openeditor.key = 9;
					openeditor.close();
					return;
				}

				e.preventDefault();
				e.stopPropagation();

				openeditor.close();
				return;
			}

			openeditor.change = true;

			if (!e.metaKey && !e.ctrlKey)
				return;

			if (e.keyCode === 66) {
				// bold
				if (!opt.format || opt.bold === false) {
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (e.keyCode === 76) {
				// link
				if (!opt.format || opt.link === false) {
					e.preventDefault();
					e.stopPropagation();
				} else
					openeditor.createlink();
				return;
			}

			if (e.keyCode === 73) {
				// italic
				if (!opt.format || opt.italic === false) {
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (e.keyCode === 80) {

				if (opt.format && opt.icon === true) {
					var tag = el[0].nodeName.toLowerCase();
					var icon = '<i class="ti ti-totaljs UI_icon" contenteditable="false"></i>';
					switch (tag) {
						case 'span':
							el.parent().prepend(icon);
							break;
						default:
							document.execCommand('insertHTML', false, icon);
							break;
					}
				}

				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 85) {
				// underline
				if (!opt.format || opt.underline === false) {
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (e.keyCode === 32) {
				document.execCommand('insertHTML', false, '&nbsp;');
				e.preventDefault();
				e.stopPropagation();
				return;
			}

		};

		el.focus();

		if (opt.cursor === 'end') {
			var range = document.createRange();
			range.selectNodeContents(el[0]);
			range.collapse(false);
			var sel = W.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}

		openeditor.close = function() {
			$(W).off('click', clickoutside);
			el.rattr('contenteditable');
			el.off('keydown', keydown);
			el.rclass('UI_editing');
			if (opt.callback) {
				var arg = {};
				arg.text = el.text().trim();
				arg.html = el.html();
				arg.change = openeditor.change;
				arg.element = openeditor.element;
				arg.dom = openeditor.dom;
				arg.backup = opt.backup;
				arg.key = openeditor.key;
				arg.param = opt.param;
				opt.callback(arg);
			}
			openeditor.timeout && clearTimeout(openeditor.timeout);
			openeditor = null;
		};

		$(W).on('click', clickoutside);
		el.on('keydown', keydown);
	}

	function app_stringify(element, isbuild) {

		var self = this;
		var fn = typeof(element) === 'function' ? element : null;

		if (fn)
			element = null;

		var arr = element || self.element.find('> ' + Builder.selectors.component);
		var children = [];
		var instances = [];

		function browse(item, el) {

			var com = el.uibuilder;
			item.id = el.getAttribute('data-id');
			item.component = com.component.id;
			item.config = CLONE(com.config);

			if (com.component.floating) {
				var tmp = $(el);
				var pos = tmp.position();
				item.x = pos.left;
				item.y = pos.top;
				item.zindex = tmp.css('z-index') || instances.length;
				item.zindex = +item.zindex;
				if (item.zindex <= 0)
					item.zindex = 1;
			}

			if (fn && !fn(item))
				return;

			instances.push(com);

			if (el.classList.contains('UI_gap'))
				item.gap = true;

			com.children = [];

			var containers = findcontainers(self, item.id);

			for (var container of containers) {

				var items = [];
				var arr = container.element.find('> ' + Builder.selectors.component);

				if (!item.children)
					item.children = [];

				item.children.push(items);

				for (var sub of arr) {
					var subitem = {};
					subitem.children = [];
					items.push(subitem);
					com.children.push(sub.uibuilder);
					browse(subitem, sub);
				}
			}

			com.events.stringify && com.emit('stringify', item, isbuild);
		}

		for (var el of arr) {
			var item = {};
			item.children = [];
			children.push(item);
			browse(item, el);
		}

		var children = element ? children[0] : [children];
		return { instances: instances, children: children };
	}

})(W.UIBuilder = {});