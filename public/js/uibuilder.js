(function(Builder) {

	var REG_CLASS = /CLASS/g;

	// Internal "component" configuration keys:
	// config.name {String} a component readable name for human
	// config.path {String} a path for storing of data

	function Fork(app) {
		var t = this;
		t.id = app.id;
		t.query = app.query;
		t.app = app;
		t.cache = app.cache;
		t.class = app.class;
		t.components = app.components;
		t.instances = [];
		t.events = {};
		t.refs = {};
	}

	Fork.prototype.find = function(id) {
		var path = id.charAt(0) === '.' ? id.substring(1) : '';
		var id = path ? '' : id.charAt(0) === '@' ? id.substring(1) : id;
		for (var m of this.instances) {
			if (path) {
				if (m.config.path === path)
					return m;
			} else if (m.id === id)
				return m;
		}
	};

	Fork.prototype.urlify = function() {
		this.app.urlify.apply(this.app, arguments);
		return this;
	};

	Fork.prototype.clfind = function() {
		this.app.clfind.apply(this.app, arguments);
		return this;
	};

	Fork.prototype.clread = function() {
		this.app.clread.apply(this.app, arguments);
		return this;
	};

	Fork.prototype.view = function() {
		this.app.view.apply(this.app, arguments);
		return this;
	};

	Fork.prototype.clean = function() {
		return this;
	};

	Fork.prototype.on = function(name, fn) {
		var t = this;
		if (t.events[name])
			t.events[name].push(fn);
		else
			t.events[name] = [fn];
	};

	function parseorigin(url) {

		var origin = '';

		if (url.charAt(0) !== '/') {
			var index = url.indexOf('/', 9);
			origin = index === -1 ? url : url.substring(0, index);
		}

		return origin;
	}

	function rebindforce(t) {

		var binded = {};
		var binder = {};
		var isbinded = false;

		t.$rebindtimeout = null;

		// Check binded instances
		for (var item of t.instances) {
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
			for (var item of t.instances) {
				item.binded = binded[item.id] || null;
				item.binder = binder[item.id] ? t.instances.findItem('id', binder[item.id]) : null;
			}
		}
	}

	Fork.prototype.rebind = function() {
		var t = this;
		t.$rebindtimeout && clearTimeout(t.$rebindtimeout);
		t.$rebindtimeout = setTimeout(rebindforce, 50, t);
	};

	Fork.prototype.emit = function(name, a, b, c, d, e) {
		var t = this;
		var items = t.events[name];
		if (items) {
			for (var fn of items)
				fn.call(t, a, b, c, d, e);
		}
	};

	Fork.prototype.emitstate = function(e, key) {

		// @e InstanceEvent
		// 1. notifies all parents
		// 2. notifies all other components

		if (!key)
			key = 'state';

		var t = this;
		var parents = {};
		var instance = e.instance;
		var cachekey = key;
		var noemitkey = 'noemit' + key;

		// Clears cache
		e.instance.cache[cachekey] = null;

		// notifies all parents
		var parent = instance.parent;
		var count = 0;

		e.level = 0;
		e.type = key;

		while (parent) {

			e.level++;

			parents[parent.id] = true;

			if (parent.fork)
				break;

			if (parent.events[key]) {
				count++;
				parent.emit(key, e);
			}

			if (e.$propagation)
				break;

			parent = parent.parent;
		}

		e.level = null;

		key = '@' + key;

		for (var obj of t.instances) {
			if (!parents[instance.id] && obj !== e.instance) {
				if (obj.events[key]) {
					count++;
					obj.emit(key, e);
				}
			}
		}

		instance.state[noemitkey] = count === 0;
	};

	customElements.define('uibuilder-component', class extends HTMLElement {

		constructor() {
			super();
			setTimeout(() => this.compile(), 1);
		}

		compile() {

			var t = this;
			var parent = t.parentNode;
			var cls = Builder.selectors.component.substring(1);
			var com;

			t.classList.add('block');

			while (parent) {

				if (parent.tagName === 'BODY')
					return;

				if (parent.classList.contains(cls)) {
					com = parent.uibuilder;
					break;
				} else
					parent = parent.parentNode;
			}

			var is = true;

			if (!com.fork) {
				is = false;
				com.fork = new Fork(com.app);
				com.fork.element = com.element;
				com.fork.compile = app_compile;
				com.root = com;
			}

			var config = (t.getAttribute('config') || '').parseConfig();
			var obj = {};
			obj.id = t.getAttribute('uid') || 'ui' + GUID(10);
			obj.config = config || {};
			obj.component = t.getAttribute('name');

			var isused = false;

			for (var key in config) {
				var val = config[key];
				if (val === '#') {
					var node = t.children[0];
					if (node && node.tagName === 'SCRIPT') {
						switch (node.getAttribute('type')) {
							case 'application/json':
							case 'text/json':
								config[key] = PARSE(node.innerHTML.trim());
								break;
							case 'text/html':
							case 'text/plain':
								config[key] = node.innerHTML.trim();
								break;
						}
					} else
						config[key] = t.innerHTML;
					isused = true;
				}
			}

			if (isused)
				t.innerHTML = '';

			var path = t.getAttribute('path');
			if (path)
				config.path = path;

			var component = com.fork.components[obj.component];
			if (!component) {
				console.error('UI Builder: The component not found: ' + obj.component);
				t.parentNode.removeChild(t);
				return;
			}

			if (t.innerHTML) {
				config.name = t.innerHTML.trim();
				t.innerHTML = '';
			}

			if (!config.name)
				config.name = component.name;

			if (config.$bind || t.getAttribute('bind'))
				obj.bind = true;

			if (config.$notify || t.getAttribute('notify'))
				obj.notify = true;

			obj.readonly = true;

			com.fork.compile(t, obj, null, null, t);

			if (t.uibuilder)
				t.uibuilder.parent = com;

			com.fork.rebind();

			var clsl = t.classList;
			clsl.remove('invisible');
			clsl.remove('hidden');

			if (!is)
				setTimeout(com => com.emit('fork', com.fork), 1, com);
		}
	});

	function StateEvent() {}

	StateEvent.prototype.stopPropagation = function() {
		this.$propagation = true;
	};

	function Instance() {
		var t = this;
		t.state = { init: 0, value: null, disabled: false, modified: false, readonly: false, touched: false, invalid: false, delay: 10, notify: false, bind: false, validate: true };
		t.cache = {};
		t.events = {};
		t.$inputs = {};
		t.$outputs = {};
		t.iseditor = Builder.editor;
	}

	var IP = Instance.prototype;

	IP.$forcecheck = function(t) {

		t.$checktimeout = null;

		var is = false;

		if (t.state.disabled || t.state.readonly) {
			is = false;
		} else if (t.validate) {
			is = t.validate();
			if (is === true || is === 1 || is === '' || (is instanceof Array && !is.length))
				is = false;
			else if (is === false || is === 0)
				is = true;
		}

		t.set('invalid', is);
	};

	IP.$forcechange = function(t) {
		t.$changetimeout = null;
		t.app.emit('change', t);
	};

	IP.errors = function() {

		var output = [];
		var val = this.state.invalid;
		var type = typeof(val);

		if (!val || type === 'boolean' || type == 'number')
			return output;

		var err;

		if (type === 'string') {
			output.push({ error: val });
		} else if (val instanceof Array) {
			for (var m of val) {
				if (m) {
					if (typeof(m) === 'string') {
						output.push({ error: m });
					} else {
						err = m.error || m.err || m.msg || m.message;
						err && output.push({ error: err });
					}
				}
			}
		} else {
			err = val.error || val.err || val.msg || val.message;
			err && output.push({ error: err });
		}
		return output;
	};

	IP.change = function() {
		var t = this;
		if (t.app.events.change) {
			t.$changetimeout && clearTimeout(t.$changetimeout);
			t.$changetimeout = setTimeout(t.$forcechange, 50, t);
		}
	};

	IP.check = function(force) {
		var t = this;

		if (t.state.validate === false)
			return;

		t.$checktimeout && clearTimeout(t.$checktimeout);

		if (force)
			t.$forcecheck(t);
		else
			t.$checktimeout = setTimeout(t.$forcecheck, 50, t);

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
		console.error('UIBuilder:', t.component.name + ' - ' + config.name + (config.path ? ' ({0})'.format(config.path) : ''), e);
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
				tclass = true;
				value = value ? true : false;
				break;
			case 'invalid':
				tclass = true;
				break;
		}

		if (type === 'touched')
			t.check();

		if (!t.state.noemitsomething) {
			var e = t.cache.something;
			if (e) {
				t.cache.something.changes[type] = 1;
			} else {
				e = t.cache.something = new StateEvent();
				e.id = t.id;
				e.instance = t;
				e.state = t.state;
				e.element = t.element;
				e.changes = {};
				e.changes[type] = 1;
				e.kind = kind;
				setTimeout(t => t.app.emitstate(t.cache.something, 'something'), 222, t);
			}
		}

		if (kind !== 'force' && (value == null || typeof(value) !== 'object') && t.state[type] === value)
			return false;

		t.state[type] = value;
		t.events.set && t.emit('set', type, value, kind);
		t.change();

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

		// "invalid" can be object (e.g. array of errors)
		if (tclass)
			t.element.tclass('UI_' + type, value ? true : false);

		if (t.state.noemitstate)
			return true;

		var e = t.cache.state;

		if (e) {
			t.cache.state.changes[type] = 1;
			return true;
		} else {
			e = t.cache.state = new StateEvent();
			e.id = t.id;
			e.instance = t;
			e.state = t.state;
			e.element = t.element;
			e.changes = {};
			e.changes[type] = 1;
			e.kind = kind;
		}

		setTimeout(t => t.app.emitstate(t.cache.state), t.state.delay, t);
		return true;
	};

	IP.input = function(id, callback) {
		var t = this;
		t.$inputs[id] = callback;
		return t;
	};

	function sendoutput(t, output, err, data) {
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
	}

	IP.output = function(name, fn) {

		var t = this;
		var output = (t.component.outputs || EMPTYARRAY).findItem('id', name);
		if (!output) {
			console.error('UI Builder: Output "{0}" not found in the "{1}" component'.format(name, t.component.name));
			return;
		}

		if (fn !== undefined) {
			if (typeof(fn) === 'function')
				t.$outputs[name] = fn;
			else
				sendoutput(t, output, null, fn);
		} else {
			fn = t.$outputs[name];
			fn && fn((err, data) => sendoutput(t, output, err, data));
		}

		return t;
	};

	IP.family = function(container) {

		var t = this;
		var output = [];

		var next = function(instance) {
			if (instance.children) {
				for (var m of instance.children) {
					output.push(m);
					if (!m.component.scope)
						next(m);
				}
			}

		};

		if (container != null) {

			if (typeof(container) === 'object')
				container = ATTRD(container, 'index');

			var items = t.containers ? t.containers['container' + container] : null;
			if (items) {
				for (var m of items) {
					output.push(m);
					next(m);
				}
			}

		} else
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

	IP.view = function(id, query, callback) {

		var t = this;
		if (!id)
			return t;

		if (typeof(query) === 'function') {
			callback = query;
			query = null;
		}

		if (id.charAt(0) === '#')
			id = id.substring(1);

		t.app.view(id, query, callback);
		return t;
	};

	IP.datasource = function(id, callback) {

		var t = this;

		if (!id)
			return t;

		var fn = function(response) {
			if (response) {
				if (!(response instanceof Array) && response.items instanceof Array)
					response = response.items;
				if (response instanceof Array)
					callback(CLONE(response));
			}
		};

		var c = id.charAt(0);

		if (c === '#') {
			t.view(id, null, callback);
		} else if (c === '@') {
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
			var c = clid.charAt(0);
			if (c === '#') {
				t.view(clid, { search: search }, function(response) {
					if (response) {
						if (response.items instanceof Array)
							response = response.items;
						fn(response);
					} else
						fn([]);
				});
				return;
			} else if (c === '@') {
				var instance = t.find(clid);
				if (instance && instance.state.value instanceof Array) {
					var arr = [];
					if (search)
						search = search.toSearch();
					for (var m of instance.state.value) {
						if (m.name && (!search || m.name.toSearch().indexOf(search) !== -1))
							arr.push(m);
					}
					fn(arr);
				} else
					fn([]);
				return;
			}
			t.app.clfind(clid, search, fn);
			return t;
		} else
			return new Promise(resolve => t.app.clfind(clid, search, resolve));
	};

	IP.clread = function(clid, id, fn) {
		var t = this;
		if (fn) {
			var c = clid.charAt(0);
			if (c === '#') {
				t.view(clid, { id: id }, function(response) {
					if (response) {
						if (response.items instanceof Array)
							response = response.items;
						if (response instanceof Array) {
							fn(response.findItem('id', id));
							return;
						}
						fn(response);
					} else
						fn(null);
				});
				return;
			} else if (c === '@') {
				var instance = t.find(clid);
				if (instance && instance.state.value instanceof Array)
					fn(instance.state.value.findItem('id', id));
				else
					fn(null);
				return;
			}
			t.app.clread(clid, id, fn);
			return t;
		} else
			return new Promise(resolve => t.app.clread(clid, id, resolve));
	};

	IP.find = function(id) {
		return this.app.find(id);
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

		if (Builder.editor) {
			for (var item of t.app.instances)
				item.events.refresh && item.emit('refresh', { type: 'configure', item: t });
			t.app.refreshio();
		}

		return t;
	};

	IP.get = function(type) {
		return this.state[type || 'value'];
	};

	IP.on = function(name, fn) {
		var t = this;
		var arr = name.split(/\+|\s/).trim();
		for (var m of arr) {
			if (t.events[m])
				t.events[m].push(fn);
			else
				t.events[m] = [fn];
		}
	};

	IP.off = function(name, fn) {
		var t = this;
		var arr = name.split(/\+|\s/).trim();
		for (var m of arr) {
			var events = t.events[m];
			if (events) {
				if (fn) {
					var index = events.indexOf(fn);
					if (index !== -1) {
						events.splice(index, 1);
						if (!events.length)
							delete t.events[m];
					}
				} else
					delete t.events[m];
			}
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

	Builder.makeimage = IP.makeimage = function(width, height, bg) {
		var canvas = document.createElement('CANVAS');
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = bg || '#D91500';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/png');
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

	IP.include = function(el, meta, callback) {

		var t = this;
		var pending = [];

		(meta.import || EMPTYARRAY).wait(function(url, next) {
			if (Builder.cache[url]) {
				next();
			} else {
				Builder.cache[url] = 1;

				if (url.charAt(0) === '/')
					url = (Builder.origin || '') + url;

				IMPORT(url, next);
			}
		}, function() {

			var list = Object.keys(meta.components);
			list.wait(function(key, next) {

				if (t.app.components[key]) {
					next();
					return;
				}

				var fn = meta.components[key];
				if (typeof(fn) === 'string') {

					if (fn === '@' || fn === '#') {
						// local component
						if (Builder.components[key])
							t.app.pending.push({ name: key, fn: Builder.components[key], local: true });
						else
							console.error('UI Builder: The component "{0}" not found.'.format(key));
						next();
						return;
					}

					var ext = fn.split(' ');
					var url = (ext[1] || '').trim();

					ext = ext[0].trim();

					if (!url) {
						url = ext;
						ext = '';
					}

					if (ext) {
						if (ext.charAt(0) === '.')
							ext = ext.substring(1);
					}

					if (ext === 'base64') {
						// A component
						try {

							var parsed = Builder.parsehtml(decodeURIComponent(atob(url)));
							var obj = {};

							obj.id = key;
							obj.cls = t.app.class + '_' + HASH(obj.id).toString(36);

							if (parsed.css)
								obj.css = parsed.css;

							if (parsed.html)
								obj.html = parsed.html.replace(REG_CLASS, obj.cls);

							new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);

							if (obj.components) {
								for (var key2 in obj.components) {
									if (!meta.components[key2]) {
										meta.components[key2] = obj.components[key2];
										list.push(key2);
									}
								}
							}

							pending.push({ name: key, fn: obj });

						} finally {
							next();
						}
						return;
					}

					if (!ext || (ext === 'html' || ext === 'json')) {

						if (url.charAt(0) === '@')
							url = url.substring(1);

						if (Builder.editor) {
							if (url.charAt(0) === '/')
								url = (Builder.origin || '') + url;
						}

						var source = url.format(key);

						AJAX('GET ' + source + (Builder.cachecomponents ? ' <{0}>'.format(Builder.cachecomponents == true ? 'session' : Builder.cachecomponents) : ''), function(response, err) {

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

							// List of components
							if (typeof(response) === 'object') {

								var origintmp = parseorigin(tmp);

								for (var key2 in response) {

									var urltmp = response[key2];
									if (urltmp.charAt(0) === '/')
										urltmp = origintmp + urltmp;

									if (!meta.components[key2]) {
										meta.components[key2] = '@' + urltmp;
										list.push(key2);
									}
								}
								next();
								return;
							}

							var isexternal = response.charAt(0) === '@';
							if (isexternal)
								response = response.substring(1);

							var parsed = Builder.parsehtml(response);

							try {

								var obj = {};

								obj.id = key;
								obj.isexternal = isexternal;
								obj.cls = t.app.class + '_' + HASH(obj.id).toString(36);

								if (parsed.css)
									obj.css = parsed.css;

								if (parsed.readme)
									obj.readme = parsed.readme;

								if (parsed.html)
									obj.html = parsed.html.replace(REG_CLASS, obj.cls);

								if (parsed.settings)
									obj.settings = parsed.settings.replace(REG_CLASS, obj.cls);

								new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);

								if (obj.components) {
									for (var key2 in obj.components) {
										if (!meta.components[key2]) {
											meta.components[key2] = obj.components[key2];
											list.push(key2);
										}
									}
								}

								var index = url.indexOf('/', 10);
								if (index !== -1) {
									obj.origin = url.substring(0, index);
									if (Builder.origin !== obj.origin) {
										if (obj.render && obj.render.charAt(0) === '/')
											obj.render = obj.origin + obj.render;
										if (obj.settings && obj.settings.charAt(0) === '/')
											obj.settings = obj.origin + obj.settings;
									}
								}

								if (obj.render === 'auto')
									obj.render = source.replace('editor.html', 'render.html');

								if (obj.settings === 'auto')
									obj.settings = source.replace('editor.html', 'settings.html');

								pending.push({ name: key, fn: obj });

							} finally {
								next();
							}
							// console.error('UI Builder:', key, e);
						});
					}

				} else {
					pending.push({ name: key, fn: fn });
					next();
				}

			}, function() {

				var items = pending.splice(0);
				var css = [];

				items.wait(function(item, next) {

					var obj = null;

					if (typeof(item.fn) === 'function') {
						obj = {};
						obj.id = item.name;
						obj.cls = (item.local ? 'uibuilder' : t.app.class) + '_' + HASH(obj.id).toString(36);
						item.fn(obj);
					} else
						obj = item.fn;

					t.app.components[item.name] = obj;

					if (item.local) {
						next();
					} else {
						obj.css && css.push(obj.css.replace(REG_CLASS, obj.cls));

						if (obj.import instanceof Array) {
							obj.import.wait(function(url, next) {
								if (Builder.cache[url]) {
									next();
								} else {
									Builder.cache[url] = 1;

									if (url.charAt(0) === '/')
										url = (Builder.origin || '') + url;

									IMPORT(url, next);
								}
							}, next);
						} else
							next();
					}

				}, function() {

					meta.css && css.unshift(meta.css.replace(REG_CLASS, t.app.class));

					if (css.length) {
						var id = t.app.class + '_' + GUID(5);
						CSS(css.join('\n'), id);
						if (!t.removecss)
							t.removecss = [];
						t.removecss.push(id);
					}

					for (var i = 0; i < meta.children.length; i++) {
						var arr = meta.children[i];
						for (var o of arr)
							t.app.compile(el, o, i);
					}

					callback && callback();
				});

			}, 3);
		});

		return t;

	};

	IP.watch = function(id, type, callback) {

		if (typeof(type) === 'function') {
			callback = type;
			type = 'value';
		}

		var t = this;
		var instance = t.app.instances.findItem('id', id);
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
				return obj;
		}
		return obj;
	};

	IP.replace = IP.variables = function(val, data, encoder) {
		var self = this;
		return val.replace(/\{[a-z0-9_.-]+\}/gi, function(text) {
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
					return QUERIFY(self.query).substring(1);
				else
					val = self.query[key.substring(1)];
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

	IP.wait = function(fn, callback) {
		var t = this;
		var check = function() {
			if (fn())
				callback();
			else
				setTimeout(check, 300);
		};
		check();
		return t;
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

	Builder.version = 1.20;
	Builder.selectors = { component: '.UI_component', components: '.UI_components' };
	Builder.current = 'default';
	Builder.events = {};
	Builder.apps = {};
	Builder.cache = {};
	Builder.components = {};
	Builder.loader = 0;

	function rebuildcss() {
		rebuildercsstimeout = null;
		var css = [];
		for (var key in Builder.components) {
			var com = Builder.components[key];
			com.css && css.push(com.css);
		}
		CSS(css, 'uibuilder');
	}

	var rebuildercsstimeout;

	Builder.component = function(id, meta, callback) {

		// @meta {String/Object}
		// @meta.css {String}
		// @meta.html {String}

		rebuildercsstimeout && clearTimeout(rebuildercsstimeout);

		if (typeof(meta) === 'string') {
			var obj = {};
			obj.id = id;
			obj.cls = 'uibuilder_' + HASH(obj.id).toString(36);
			var parsed = Builder.parsehtml(meta.substring(0, 7) === 'base64 ' ? decodeURIComponent(atob(meta.substring(7))) : meta);
			new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);
			meta = obj;

			if (parsed.css)
				meta.css = parsed.css;

			if (parsed.html)
				meta.html = parsed.html;
		}

		meta.id = id;

		if (!meta.cls)
			meta.cls = 'uibuilder_' + HASH(meta.id).toString(36);

		if (meta.css)
			meta.css = meta.css.replace(REG_CLASS, meta.cls);

		if (meta.html)
			meta.html = meta.html.replace(REG_CLASS, meta.cls);

		if (meta.import instanceof Array) {
			Builder.loader++;
			meta.import.wait(function(url, next) {
				if (Builder.cache[url]) {
					next();
				} else {
					Builder.cache[url] = 1;

					if (url.charAt(0) === '/')
						url = (Builder.origin || '') + url;

					IMPORT(url, next);
				}
			}, function() {
				Builder.loader--;
				rebuildercsstimeout && clearTimeout(rebuildercsstimeout);
				rebuildercsstimeout = setTimeout(rebuildcss, 2);
				Builder.components[id] = meta;
				callback && callback(null, meta);
			});
		} else {
			rebuildercsstimeout && clearTimeout(rebuildercsstimeout);
			Builder.components[id] = meta;
			callback && callback(null, meta);
		}
	};

	Builder.resize = function() {
		for (var key in Builder.apps) {
			var app = Builder.apps[key];
			var el = app.element;
			var w = el.width();
			var h = el.height();
			var d = WIDTH(el);
			var meta = { width: w, height: h, display: d };
			for (var instance of app.instances)
				instance.events.resize && instance.emit('resize', meta);
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

	function app_compile(container, obj, index, position, inline, newbie) {

		var self = this;
		var com = self.components[obj.component];

		if (!com) {
			console.error('UI Builder: The component "{0}" not found'.format(obj.component));
			return;
		}

		var div = inline || document.createElement('DIV');
		var instance = new Instance();

		div.classList.add('ui_' + com.id);

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
		instance.newbie = newbie || obj.newbie;
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

		if (obj.newbie)
			delete obj.newbie;

		if (inline)
			instance.forked = true;

		if (obj.config) {
			for (var key in obj.config)
				instance.config[key] = obj.config[key];
		}

		if (!instance.config.name)
			instance.config.name = com.name;

		self.instances.push(instance);

		if (inline) {
			var uid = container.getAttribute('uid');
			if (uid)
				self.refs[uid] = instance;
		}

		div.uibuilder = instance;

		if (!inline) {
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
		}

		com.make && com.make(instance, instance.config, instance.element, instance.component.cls, Builder.editor);

		Builder.events.make && Builder.emit('make', instance);

		if (inline)
			return;

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

			var com = self.components[obj.component];
			if (com.children) {

				// reidentify
				var id = {};
				var children = CLONE(com.children);
				var reidentify = function(children) {
					for (var arr of children) {
						for (var m of arr) {
							id[m.id] = instance.id + 'X' + HASH(m.id).toString(36);
							if (m.children && m.children.length)
								reidentify(m.children);
						}
					}
				};

				reidentify(children);
				var keys = Object.keys(id);
				var regexp = new RegExp(keys.join('|'), 'g');
				children = PARSE(JSON.stringify(children).replace(regexp, text => id[text]));

				for (var i = 0; i < children.length; i++) {
					var container = containers.findItem('index', i);
					if (container) {
						var arr = children[i];
						for (var o of arr)
							self.compile(container.element, o, i);
					}
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
					if (instance.removecss) {
						for (var m of instance.removecss)
							CSS('', m);
					}
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

	function app_add(parentid, parentindex, com, position, config, extendmeta, newbie) {

		var self = this;

		if (typeof(com) === 'string') {

			var tmp = self.components[com];
			if (!tmp) {
				console.error('UI Builder: The component "{0}" not found'.format(com));
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
					self.compile(container.element, com, parentindex, position, null, newbie);
			}
		}

		self.refreshio();
		return com;
	}

	Builder.build = function(target, meta, callback) {

		if (Builder.loader) {
			setTimeout(Builder.build, 100, target, meta, callback);
			return;
		}

		var prev = Builder.apps[meta.id];
		if (prev) {
			Builder.remove(meta.id);
			setTimeout(Builder.build, 100, target, meta, callback);
			return;
		}

		if (!meta.components || !meta.children) {
			WARN('Invalid UI Builder metadata:', meta.id);
			return;
		}

		Builder.current = meta.id;

		var root = document.createElement('DIV');
		var container = $(root);

		container.attrd('id', meta.id);
		container.aclass('UI_app invisible');
		container.empty();

		// if (meta.css)
		// 	container[0].style = meta.css;

		$(target)[0].appendChild(root);

		var app = {};
		var css = [];

		app.id = Builder.current;
		app.components = {};
		app.args = meta.args || {};
		app.query = meta.query || CLONE(NAV.query);
		app.schema = meta;
		app.events = {};
		app.cache = {};
		app.refs = {};
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
		app.removecss = [];

		if (meta.urlify)
			app.urlify = meta.urlify;
		else
			app.urlify = url => url;

		container.aclass(app.class);

		// app.outputs = [];
		// app.inputs = [];

		app.view = function(id, query, fn) {

			// It must be declared in the app
			// @id {String}
			// @query {Object}
			// @fn {Function(response)}

			if (Builder.view)
				Builder.view.call(app, id, query, fn);
			else
				fn(EMPTYARRAY);
		};

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

		app.on = Fork.prototype.on;
		app.find = Fork.prototype.find;
		app.emit = Fork.prototype.emit;
		app.emitstate = Fork.prototype.emitstate;

		app.intervalcounter = 0;
		app.interval && clearInterval(app.interval);
		app.interval = setInterval(function(app) {

			if (!W.inDOM(app.dom)) {
				app.remove();
				return;
			}

			app.intervalcounter++;

			var servicefork = item => item.events.service && item.emit('service', app.intervalcounter);

			for (var item of app.instances) {
				item.events.service && item.emit('service', app.intervalcounter);
				if (item.fork)
					eachfork(item, servicefork);
			}

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
			Builder.build(el, submeta, callback);
		};

		var eachfork = function(instance, fn) {
			for (var item of instance.fork.instances) {
				fn(item);
				item.fork && eachfork(item, fn);
			}
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

					var com = instance.component;

					if (com.floating) {
						app.zindex = (instance.element.css('z-index') || '').parseInt();
						if (app.zindex <= 0)
							app.zindex = 1;
					}

					var arr = com.inputs;
					var name = instance.config.name || com.name;

					app.list && app.list.push({ id: instance.id, componentid: com.id, name: name, icon: com.icon, color: com.color });

					if (arr) {
						for (var m of arr)
							app.inputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + (arr.length > 1 ? (': ' + m.name) : ''), componentid: com.id, component: com.name, input: m.name, icon: com.icon, color: com.color, note: m.note, schema: m.schema });
					}

					arr = com.outputs;
					if (arr && arr.length) {
						for (var m of arr)
							app.outputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + (arr.length > 1 ? (': ' + m.name) : ''), componentid: com.id, component: com.name, output: m.name, icon: com.icon, color: com.color, note: m.note, schema: m.schema });
					}
				}
			}

			if (!app.ready) {

				app.ready = true;
				app.callback && app.callback(app);
				container.rclass('invisible');

				rebindforce(app);

				var readyfork = function(item) {
					item.state.init = 1;
					item.events.ready && item.emit('ready');
				};

				// Emit ready
				for (var item of app.instances) {

					if (item.fork)
						eachfork(item, readyfork);

					item.state.init = 1;
					item.events.ready && item.emit('ready');
				}

				Builder.emit('app', app);
				app.emit('ready');
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

		Builder.apps[Builder.current] = app;

		(meta.import || EMPTYARRAY).wait(function(url, next) {
			if (Builder.cache[url]) {
				next();
			} else {
				Builder.cache[url] = 1;

				if (url.charAt(0) === '/')
					url = (Builder.origin || '') + url;

				IMPORT(url, next);
			}
		}, function() {
			var list = Object.keys(meta.components);
			list.wait(function(key, next) {

				var fn = meta.components[key];

				if (typeof(fn) === 'string') {

					if (fn === '@' || fn === '#') {
						// local component
						if (Builder.components[key])
							app.pending.push({ name: key, fn: Builder.components[key], local: true });
						else
							console.error('UI Builder: The component "{0}" not found.'.format(key));
						next();
						return;
					}

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

							if (parsed.readme)
								obj.readme = parsed.readme;

							if (parsed.html)
								obj.html = parsed.html.replace(REG_CLASS, obj.cls);

							if (parsed.settings)
								obj.settings = parsed.settings.replace(REG_CLASS, obj.cls);

							new Function('exports', parsed.js.replace(REG_CLASS, obj.cls))(obj);

							if (obj.components) {
								for (var key2 in obj.components) {
									if (!meta.components[key2]) {
										meta.components[key2] = obj.components[key2];
										list.push(key2);
									}
								}
							}

							app.pending.push({ name: key, fn: obj });
						} finally {
							next();
						}
						return;
					}

					if (!ext || ext === 'html') {

						var isexternal = url.charAt(0) === '@';
						if (isexternal)
							url = url.substring(1);

						if (Builder.editor) {
							if (url.charAt(0) === '/')
								url = (Builder.origin || '') + url;
						}

						var tmp = url.format(key);

						AJAX('GET ' + tmp + (Builder.cachecomponents ? ' <{0}>'.format(Builder.cachecomponents == true ? 'session' : Builder.cachecomponents) : ''), function(response, err) {

							if (err) {
								console.error('UI Builder:', tmp, err);
								next();
								return;
							}

							if (ERROR(response)) {
								console.error('UI Builder:', tmp, response);
								next();
								return;
							}

							if (!response) {
								console.error('UI Builder:', tmp, 'empty file');
								next();
								return;
							}

							// List of components
							if (typeof(response) === 'object') {
								var origintmp = parseorigin(tmp);
								for (var key2 in response) {

									var urltmp = response[key2];
									if (urltmp.charAt(0) === '/')
										urltmp = origintmp + urltmp;

									if (!meta.components[key2]) {
										meta.components[key2] = '@' + urltmp;
										list.push(key2);
									}
								}
								next();
								return;
							}

							var parsed = Builder.parsehtml(response);

							try {
								var obj = {};

								obj.id = key;
								obj.isexternal = isexternal;
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

								if (obj.components) {
									for (var key2 in obj.components) {
										if (!meta.components[key2]) {
											meta.components[key2] = obj.components[key2];
											list.push(key2);
										}
									}
								}

								var index = url.indexOf('/', 10);
								if (index !== -1) {
									obj.origin = url.substring(0, index);
									if (Builder.origin !== obj.origin) {
										if (obj.render && obj.render.charAt(0) === '/')
											obj.render = obj.origin + obj.render;
										if (obj.settings && obj.settings.charAt(0) === '/')
											obj.settings = obj.origin + obj.settings;
									}
								}

								if (obj.render === 'auto')
									obj.render = tmp.replace('editor.html', 'render.html');

								if (obj.settings === 'auto')
									obj.settings = tmp.replace('editor.html', 'settings.html');

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
						obj.cls = (item.local ? 'uibuilder' : app.class) + '_' + HASH(obj.id).toString(36);
						item.fn(obj);
					} else
						obj = item.fn;

					app.components[item.name] = obj;

					if (item.local) {
						next();
					} else {
						obj.css && css.push(obj.css.replace(REG_CLASS, obj.cls));
						if (obj.import instanceof Array) {
							obj.import.wait(function(url, next) {
								if (Builder.cache[url]) {
									next();
								} else {
									Builder.cache[url] = 1;

									if (url.charAt(0) === '/')
										url = (Builder.origin || '') + url;

									IMPORT(url, next);
								}
							}, next);
						} else
							next();
					}

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

			}, 1);
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
			settings = response.substring(beg + 10, end).trim();
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

			for (var instance of item.instances) {
				if (instance.removecss) {
					for (var m of instance.removecss)
						CSS('', m);
				}
				instance.events.destroy && instance.emit('destroy');
			}

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

		var parent = el.closest('.UI_component')[0];

		if (!parent || parent.uibuilder.meta.readonly || parent.uibuilder.forked)
			return;

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

		if (opt.format && opt.icon == null)
			opt.icon = true;

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
		openeditor.instance = parent.uibuilder;
		openeditor.parent = opt.parent ? opt.parent[0] : openeditor.dom;

		if (!opt.callback) {
			opt.callback = function() {
				openeditor.instance && openeditor.instance.emit('html', el);
			};
		}

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

			var instance = openeditor.instance;
			openeditor && openeditor.close();

			var content = tmp.text();
			var href = '';

			tmp.aclass('UI_link');

			if (opt.cms)
				tmp.aclass('CMS_edit CMS_remove');

			if (content.indexOf('@') !== -1)
				href = 'mailto:' + content;
			else if ((/\d+/).test(content))
				href = 'tel:' + content;
			else if (content.indexOf(' ') === -1 && content.indexOf(',') === -1 && content.indexOf('.') !== -1)
				href = (/http(s):\/\//).test(content) ? content : ('https://' + content);

			var target = href.indexOf('.') !== -1 && href.indexOf(location.hostname) === -1 ? '_blank' : '';
			tmp.attr('href', href || '#');
			tmp.attr('target', target);
			Builder.emit('link', tmp);
		};

		var contextmenu = function() {
			openeditor.close();
		};

		var clickoutside = function(e) {
			if (!(e.target === openeditor.parent || openeditor.parent.contains(e.target)))
				openeditor.close();
		};

		var paste = function(e) {
			e.preventDefault();
			var text = (e.originalEvent || e).clipboardData.getData('text/plain');
			document.execCommand('insertHTML', false, text);
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
				e.preventDefault();
				e.stopPropagation();
				// link
				if (opt.format && opt.link !== false)
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
					var icon = '<i class="ti ti-totaljs UI_icon' + (opt.cms ? ' CMS_edit CMS_remove' : '') + '" contenteditable="false"></i>';
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
			el.off('contextmenu', contextmenu);
			el.off('paste', paste);
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
				arg.instance = openeditor.instance;
				opt.callback(arg);
			}
			openeditor.timeout && clearTimeout(openeditor.timeout);
			openeditor = null;
		};

		var placeholder = opt.placeholder;
		var placeholderprev = false;

		openeditor.checkplaceholder = function() {
			if (placeholder) {
				var is = el[0].innerHTML.length > 0;
				if (placeholderprev !== is) {
					placeholderprev = is;
					placeholder.classList.toggle('hidden', is);
				}
			}
		};

		$(W).on('click', clickoutside);
		el.on('keydown', keydown);
		el.on('contextmenu', contextmenu);
		opt.placeholder && placeholder && el.on('input', openeditor.checkplaceholder);
		el.on('paste', paste);
	}

	function app_stringify(element, isbuild) {

		var self = this;
		var fn = typeof(element) === 'function' ? element : null;

		if (fn)
			element = null;

		var arr = element || self.element.find('> ' + Builder.selectors.component);
		var children = [];
		var instances = [];
		var components = {};

		function browse(item, el) {

			var com = el.uibuilder;

			item.id = el.getAttribute('data-id');
			item.component = com.component.id;
			item.config = CLONE(com.config);

			if (!components[com.component.id]) {
				var comdeclaration = self.schema.components[com.component.id];
				if (comdeclaration)
					components[com.component.id] = comdeclaration;
			}

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

			// Component with components
			if (!com.component.children) {
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
			}

			com.events.stringify && com.emit('stringify', item, isbuild);
		}

		for (var el of arr) {
			var subitem = {};
			subitem.children = [];
			children.push(subitem);
			browse(subitem, el);
		}

		var children = element ? children[0] : [children];
		return { instances: instances, children: children, components: components };
	}

	Builder.edit = app_edit;

})(W.UIBuilder = {});