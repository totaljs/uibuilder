(function(Builder) {

	// Internal "object" configuration keys:
	// config.name {String} an object readble name for human
	// config.path {String} a path for storing of data

	function InstanceEvent() {
	}

	InstanceEvent.prototype.stopPropagation = function() {
		this.$propagation = true;
	};

	function Instance() {
		var t = this;
		t.state = { init: 0, invalid: false, value: null, disabled: false, modified: false, readonly: false, affected: false, delay: 10 };
		t.cache = {};
		t.events = {};
		t.$inputs = {};
		t.$outputs = {};
	}

	Instance.prototype.input = function(id, callback) {
		var t = this;
		t.$inputs[id] = callback;
		return t;
	};

	Instance.prototype.set = function(type, value, kind) {

		// Supported types:
		// - invalid    (is not valid)
		// - value      (current value)
		// - disabled   (is disabled)
		// - modified   (value has been modified)
		// - readonly   (is readonly)
		// - affected   (user changed something)

		var t = this;

		switch (type) {
			case 'disabled':
			case 'invalid':
			case 'modified':
			case 'readonly':
			case 'affected':
				value = value ? true : false;
				break;
		}

		if (t.state[type] === value)
			return;

		t.state[type] = value;
		t.events.set && t.emit('set', type, value, kind);

		var e = t.cache.e;

		if (e) {
			t.cache.e.changes[type] = 1;
			return;
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
		return t;
	};

	Instance.prototype.output = function(name, fn) {

		var t = this;
		var output = (t.object.outputs || EMPTYARRAY).findItem('id', name);

		if (!output) {
			console.error('Output "{0}" not found in the "{1}" object'.format(name, t.object.name));
			return;
		}

		if (fn) {
			t.$outputs[name] = fn;
		} else {
			fn = t.$outputs[name];
			if (fn) {
				fn(function(err, data) {
					var obj = {};
					obj.id = t.id + '_' + output.id;
					obj.ref = output.id;
					obj.icon = output.icon;
					obj.color = output.color;
					obj.note = output.note;
					obj.name = output.name;
					obj.object = output.instance.object;
					obj.app = t.app;
					obj.instance = t;
					obj.err = err;
					obj.data = data;
					t.app.emit('output', obj);
					Builder.emit('output', obj);
				});
			}
		}

		return t;
	};

	Instance.prototype.family = function() {

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

	Instance.prototype.remove = function() {
		var t = this;
		t.element.remove();
		t.app.clean();
	};

	Instance.prototype.cl = function(clid, id, fn) {
		var t = this;
		t.app.cl(clid, id, fn);
		return t;
	};

	Instance.prototype.hidden = function() {
		return HIDDEN(this.dom);
	};

	Instance.prototype.reset = function() {
		var t = this;
		// t.set('invalid', false);
		// t.set('affected', false);
		// t.set('modified', false);
		t.events.reset && t.emit('reset');
		return t;
	};

	Instance.prototype.get = function(type) {
		return this.state[type || 'value'];
	};

	Instance.prototype.on = function(name, fn) {
		var t = this;
		if (t.events[name])
			t.events[name].push(fn);
		else
			t.events[name] = [fn];
	};

	Instance.prototype.emit = function(name, a, b, c, d, e) {
		var t = this;
		var items = t.events[name];
		if (items) {
			for (var fn of items)
				fn.call(t, a, b, c, d, e);
		}
	};

	Instance.prototype.write = function(obj, path, value) {
		var arr = path.split('.');
		for (i = 0; i < arr.length - 1; i++)
 			obj = obj[arr[i]];
		obj[arr[i]] = value;
		return obj;
	};

	Instance.prototype.read = function(obj, path) {
		var arr = path.split('.');
		for (i = 0; i < arr.length; i++) {
 			obj = obj[arr[i]];
			if (!obj)
				return;
		}
		return obj;
	};

	Instance.prototype.args = function(val, data) {
		var self = this;
		return val.replace(/\{[a-z0-9]+\}/gi, function(text) {
			var key = text.substring(1, text.length - 1).trim();
			var val = self.app.args[key];
			if (val == null && data)
				val = data[key];
			return val == null ? text : val;
		});
	};

	Instance.prototype.settings = function() {
		var t = this;
		t.app.emit('settings', t);
		Builder.emit('settings', t);
	};

	Builder.version = 1;
	Builder.selectors = { object:'.UI_object', objects: '.UI_objects' };
	Builder.current = 'default';
	Builder.events = {};
	Builder.apps = {};
	Builder.repo = {};
	Builder.refs = {};
	Builder.tmp = {};

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
		var com = self.objects[obj.object];

		if (!com) {
			console.error('Object "{0}" not found in the object list'.format(obj.object));
			return;
		}


		var div = document.createElement('DIV');
		var instance = new Instance();

		obj.gap && div.classList.add('UI_gap');

		if (!com.config)
			com.config = {};

		instance.id = obj.id;
		instance.element = $(div);
		instance.element.aclass(Builder.selectors.object.substring(1) + ' ' + com.cls).attrd('id', obj.id);
		instance.dom = div;
		instance.events = {};
		instance.config = CLONE(com.config);
		instance.app = self;
		instance.object = com;
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

		var tmp = container.closest(Builder.selectors.object);
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

		com.make(instance, instance.config, instance.element);
		Builder.events.make && Builder.emit('make', instance);

		if (!(obj.children instanceof Array)) {
			self.refreshio();
			return;
		}

		setTimeout(function(self, children) {
			for (var i = 0; i < children.length; i++) {
				var container = instance.element.find(Builder.selectors.objects + '[data-index="{0}"]'.format(i));
				if (container.length) {
					var arr = children[i];
					for (var obj of arr)
						self.compile(container, obj, i);
				}
			}
			self.refreshio();
		}, 1, self, obj.children);
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

		while (true) {
			var instance = self.instances[index];
			if (instance) {
				if (inDOM(instance.dom)) {
					index++;
				} else {
					// @TODO: Notify all parents?
					instance.events.destroy && instance.emit('destroy');
					self.instances.splice(index, 1);
				}
			} else
				break;
		}

		self.refreshio();
	}

	var findcontainers = function(self, id) {
		var containers = [];
		var container = self.element.find(Builder.selectors.object + '[data-id="{0}"] {1}'.format(id, Builder.selectors.objects));
		for (var el of container) {
			el = $(el);
			var parent = el.closest(Builder.selectors.object);
			if (parent.attrd('id') === id)
				containers.push({ index: +el.attrd('index'), element: el });
		}
		containers.quicksort('index');
		return containers;
	};

	function app_add(parentid, parentindex, obj, position, config) {

		var self = this;

		if (typeof(obj) === 'string') {
			var com = self.objects[obj];

			if (!com) {
				console.error('Object "{0}" not found'.format(obj));
				return;
			}

			obj = { id: 'oid' + Date.now().toString(36), object: obj, children: [], config: com.config || {} };
		}

		if (config) {
			for (var key in config)
				obj.config[key] = config[key];
		}

		var containers = findcontainers(self, parentid);
		if (containers.length) {
			for (var container of containers) {
				if (container.index == parentindex)
					self.compile(container.element, obj, parentindex, position);
			}
		}

		self.refreshio();
		return obj;
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

		var container = $('<div>');
		container.attrd('id', meta.id);
		container.aclass('UI_app invisible');
		container.empty();

		if (meta.css)
			container[0].style = meta.css;

		$(target).append(container);

		var app = {};
		var css = [];

		app.id = Builder.current;
		app.objects = {};
		app.args = args;
		app.repo = Builder.repo;
		app.refs = Builder.refs;
		app.schema = meta;
		app.outputs = [];
		app.events = {};
		app.inputs = [];
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
		app.tmp = {};

		app.cl = function(clid, id, fn) {

			if (typeof(id) === 'function') {
				fn = id;
				id = null;
			}

			fn(id ? null : EMPTYARRAY);
		};

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

		var refreshiotimeout = null;
		var refreshio = function() {

			refreshiotimeout = null;

			app.inputs = [];
			app.outputs = [];

			for (var instance of app.instances) {

				if (!instance.dom.parentNode)
					continue;

				var arr = instance.object.inputs;
				var name = instance.config.name || instance.object.name;

				if (arr) {
					for (var m of arr) {
						app.inputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + ': ' + m.name, object: name, input: m.name, icon: m.icon, color: m.color, note: m.note, schema: m.schema });
					}
				}

				arr = instance.object.outputs;

				if (arr && arr.length) {
					for (var m of arr) {
						app.outputs.push({ id: instance.id + '_' + m.id, ref: m.id, name: name + ': ' + m.name, object: name, output: m.name, icon: m.icon, color: m.color, note: m.note, schema: m.schema });
					}
				}

			}

			if (!app.ready) {
				app.ready = true;
				app.callback && app.callback(app);
				container.rclass('invisible');
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
			// 2. notifies all other objects

			var parents = {};
			var key = '@state';
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
					return;

				parent = parent.parent;
			}

			e.level = null;

			for (var instance of app.instances) {
				if (e.$propagation || parents[instance.id])
					return;
				instance.events[key] && instance.emit(key, e);
			}
		};

		Builder.parsehtml = function(response) {

			var css = '';

			if (response.indexOf('<scr' + 'ipt>') === -1)
				return { js: response };

			var settings = '';
			var js = '';
			var css = '';

			var beg = response.indexOf('<sett' + 'ings>');
			if (beg !== -1) {
				var end = response.indexOf('</sett' + 'ings>', beg + 10);
				settings = response.substring(beg + 8, end).trim();
				response = response.substring(0, beg) + response.substring(end + 11);
			}

			beg = response.indexOf('<st' +'yle>');
			if (beg !== -1)
				css = response.substring(beg + 7, response.indexOf('</st' + 'yle>', beg + 7));

			beg = response.indexOf('<scr' + 'ipt>');
			if (beg !== -1) {
				var end = response.indexOf('</scr' + 'ipt>', beg + 8);
				js = response.substring(beg + 8, end).trim();
			}

			return { js: js, css: css, settings: settings };

		};

		Builder.apps[Builder.current] = app;

		Object.keys(meta.objects).wait(function(key, next) {
			var fn = meta.objects[key];
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
						new Function('exports', parsed.js)(obj);
						app.pending.push({ name: key, fn: obj });
					} catch (e) {
						console.error('UI Builder:', key, e);
					}
					next();
					return;
				}

				if (!ext || ext === 'html') {
					AJAX('GET ' + url, function(response) {

						var parsed = Builder.parsehtml(response);

						try {
							var obj = {};

							obj.id = key;
							obj.cls = app.class + '_' + HASH(obj.id).toString(36);

							if (parsed.css)
								obj.css = parsed.css;

							if (parsed.settings)
								obj.settings = parsed.settings;

							new Function('exports', parsed.js)(obj);
							app.pending.push({ name: key, fn: obj });
						} catch (e) {
							console.error('UI Builder:', key, e);
						}
						next();
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

				app.objects[item.name] = obj;
				obj.css && css.push(obj.css.replace(/CLASS/g, obj.cls));

				if (obj.import instanceof Array)
					obj.import.wait(IMPORT, next);
				else
					next();

			}, function() {

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

	};

	Builder.remove = function(id) {
		var item = Builder.apps[id];
		if (item) {

			item.interval && clearInterval(item.interval);
			item.interval = null;

			for (var instance of item.instances)
				instance.events.destroy && instance.emit('destroy');

			setTimeout(function() {
				for (var key in item.objects) {
					var obj = item.objects[key];
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
		// opt.multiline {Boolean}
		// opt.callback {Function}
		// opt.html {String}
		// opt.commands {Boolean}
		// opt.widget {Widget}
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
				// e.preventDefault();
				// e.stopPropagation();
				// var widget = openeditor.widget;
				// openeditor.key = 9;
				// openeditor.close();
				// var w = widget.element.parent().next().find('> .widget')[0];
				// if (w) {
				// 	w = w.$widget;
				// 	self.cmd.select(w);
				// 	setTimeout(w => w.emit('focus'), 100, w);
				// }
				return;
			}

			openeditor.change = true;

			if (!e.metaKey && !e.ctrlKey)
				return;

			if (e.keyCode === 66) {
				// bold
				if (opt.format && (opt.bold == null || opt.bold == true))
					self.format.bold();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 76) {
				// link
				if (opt.format && (opt.link == null || opt.link == true))
					self.format.link();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 73) {
				// italic
				if (opt.format && (opt.italic == null || opt.italic == true))
					self.format.italic();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 80) {
				self.format.icon();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 85) {
				// underline
				if (opt.format && (opt.underline == null || opt.underline == true))
					self.format.underline();
				e.preventDefault();
				e.stopPropagation();
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

	function app_stringify(element) {

		var self = this;
		var fn = typeof(element) ? element : null;

		if (fn)
			element = null;

		var arr = element || self.element.find('> ' + Builder.selectors.object);
		var children = [];
		var instances = [];

		function browse(item, el) {

			var obj = el.uibuilder;
			item.id = el.getAttribute('data-id');
			item.config = obj.config;
			item.object = obj.object.id;

			if (fn && !fn(item))
				return;

			instances.push(obj);

			if (el.classList.contains('UI_gap'))
				item.gap = true;

			obj.children = [];

			var containers = findcontainers(self, item.id);

			for (var container of containers) {

				var items = [];
				var arr = container.element.find('> ' + Builder.selectors.object);

				if (!item.children)
					item.children = [];

				item.children.push(items);

				for (var sub of arr) {
					var subitem = {};
					subitem.children = [];
					items.push(subitem);
					obj.children.push(sub.uibuilder);
					browse(subitem, sub);
				}
			}

			obj.events.stringify && obj.emit('stringify', item);
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