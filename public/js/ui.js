COMPONENT('uibuildereditor', 'container:UI_objects;selector:.UI_object', function(self, config, cls) {

	var drag = {};

	self.make = function() {
		self.aclass(cls);

		drag.start = function(e) {

			if (!HIDDEN(self.element)) {
				drag.element = $(e.target);
				self.aclass(cls + '-dragged');
				e.touches && drag.bind();
				var dt = e.originalEvent.dataTransfer;
				dt && dt.setData('text', '1');
			}

			drag.lastX = 0;
			drag.lastY = 0;
			drag.clickX = e.offsetX;
			drag.clickY = e.offsetY;
			drag.container = null;
			drag.prev = null;
		};

		drag.end = function() {
			drag.container && drag.container.classList.remove(cls + '-hover');
			self.rclass(cls + '-dragged');
		};

		drag.drop = function(e) {
			var meta = {};
			meta.pageX = e.pageX;
			meta.pageY = e.pageY;
			meta.offsetX = e.offsetX;
			meta.offsetY = e.offsetY;
			meta.clickX = drag.clickX;
			meta.clickY = drag.clickY;
			meta.element = $(drag.element);
			meta.container = $(drag.container);
			meta.target = $(e.target);
			meta.parent = self.element;
			config.ondrop && self.EXEC(config.ondrop, meta, self);
		};

		var findcontainer = function(el) {

			var c = config.container;
			var parent = el;

			while (parent != self.dom) {
				if (parent.classList.contains(c)) {
					return parent;
				}

				parent = parent.parentNode;

			}

			return null;
		};

		var doc = $(document);
		doc.on('dragstart touchstart', '[draggable]', drag.start);
		doc.on('dragend touchend', '[draggable]', drag.end);

		self.element.on('click', config.selector, function(e) {
			var el = e.target.closest(config.selector);

			if (drag.prev_el === el)
				return;

			if (drag.prev_el && drag.prev_el !== el)
				drag.prev_el.classList.remove('selected');

			if (el) {
				el.classList.add('selected');
				drag.prev_el = el;
			}

			el.classList.add('selected');
			config.click && self.SEEX(config.click, $(el));
		});

		self.element.on('dblclick', config.selector, function(e) {
			config.dblclick && self.SEEX(config.dblclick, $(this));
			e.preventDefault();
			e.stopPropagation();
		});

		self.element.on('dragenter dragover dragexit drop dragleave', function(e) {

			switch (e.type) {

				case 'dragenter':

					var ctrl = findcontainer(e.target);

					if (drag.prev === ctrl)
						return;

					if (drag.prev && drag.prev !== ctrl) {
						drag.prev.classList.remove(cls + '-hover');
						drag.prev.classList.remove(cls + '-disable');
					}

					if (ctrl) {
						ctrl.classList.add(cls + '-hover');
						ctrl.classList.contains('drop_disable') && ctrl.classList.add(cls + '-disable');
						drag.container = ctrl;
						drag.prev = ctrl;
					}

					break;

				case 'drop':
					drag.prev.classList.remove(cls + '-hover');
					e.target.classList.contains(cls + '-disable') && e.target.classList.remove(cls + '-disable');
					drag.container && drag.drop(e);
					break;
			}

			e.preventDefault();
		});

	};

});