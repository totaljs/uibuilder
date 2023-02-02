customElements.define('is-button', class extends HTMLButtonElement {
	constructor() {
		super();
		setTimeout(NEWUIBIND, 2, this);
	}
}, { extends: 'button' });

COMPONENT('uibuildereditor', 'container:UI_components;selector:.UI_component', function(self, config, cls) {

	var drag = {};
	var events = {};

	self.make = function() {

		self.aclass(cls);
		self.cache = {};

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
				if (parent.classList.contains(c))
					return parent;
				parent = parent.parentNode;
			}

			return null;
		};

		var doc = $(document);
		doc.on('dragstart touchstart', '[draggable]', drag.start);
		doc.on('dragend touchend', '[draggable]', drag.end);

		/*
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
		});*/

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
					drag.prev && drag.prev.classList.remove(cls + '-hover');
					e.target.classList.contains(cls + '-disable') && e.target.classList.remove(cls + '-disable');
					drag.container && drag.drop(e);
					break;
			}

			e.preventDefault();
		});

		drag.css = {};

		events.move = function(e) {

			var x = (e.pageX - drag.x);
			var y = (e.pageY - drag.y);

			drag.css.left = drag.posX + x;
			drag.css.top = drag.posY + y;

			if (!drag.is)
				drag.is = true;

			drag.target.css(drag.css);
		};

		events.movetouch = function(e) {
			events.move(e.touches[0]);
		};

		events.up = function() {
			events.unbind();
		};

		events.bind = function() {
			self.element.on('mouseup', events.up);
			self.element.on('mousemove', events.move);
			self.element.on('touchend', events.up);
			self.element.on('touchmove', events.movetouch);
		};

		events.unbind = function() {
			self.element.off('mouseup', events.up);
			self.element.off('mousemove', events.move);
			self.element.off('touchend', events.up);
			self.element.off('touchmove', events.movetouch);
		};

		self.event('mousedown touchstart', '.UI_floating', function(e) {

			if (!e.touches && e.button)
				return;

			e.preventDefault();

			var target = $(e.target);
			if (target[0].tagName === 'BUTTON' || target[0].tagName === 'A') {
				return;
			} else {
				var p = target[0].parentNode;
				if (p.tagName === 'BUTTON' || p.tagName === 'A')
					return;
			}

			var evt = e.touches ? e.touches[0] : e;

			target = target.closest('.UI_component');
			drag.id = target.attrd('id');

			drag.target = target;
			drag.x = evt.pageX;
			drag.y = evt.pageY;

			drag.is = false;

			var pos = target.position();
			drag.posX = pos.left;
			drag.posY = pos.top;

			events.bind();
		});

	};

});