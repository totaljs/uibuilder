FUNC.makeimage = function(width, height, fill, color, text) {
	var canvas = document.createElement('CANVAS');

	canvas.width = width;
	canvas.height = height;

	var fs = ((canvas.width / 100) * 8) >> 0;
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = fill || '#E0E0E0';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if (text) {
		ctx.font = 'bold ' + fs + 'px Arial';
		ctx.fillStyle = color || '#FFF';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, (canvas.width / 2), (canvas.height / 2 >> 0) + 5);
	}

	return canvas.toDataURL('image/png');
};

FUNC.upload = function(opt, callback) {

	opt.url = app.schema.editor.upload || common.upload;

	if (opt.url === true) {
		opt.base64 = true;
		opt.callback = function(file) {
			var id = Date.now().toString(36) + GUID(5);
			common.callbacks[id] = function(response) {
				if (!opt.multiple && response instanceof Array)
					response = response[0];
				callback(response);
			};
			FUNC.send({ TYPE: 'upload', data: file, callbackid: id });
		};
		SETTER('filereader/open', opt);
		return;
	}

	if (opt.query) {
		opt.url = QUERIFY(opt.url, opt.query);
		opt.query = undefined;
	}

	opt.callback = function(response) {

		if (!opt.multiple && response instanceof Array)
			response = response[0];

		callback(response);
	};

	SETTER('fileuploader/upload', opt);
};

FUNC.readme = function(title, md) {

	var winid = 'readme' + HASH(md);
	common.readmewindow = md;

	if (common.windows.findItem('id', winid))
		SETTER('windows/focus', winid);
	else
		PUSH('common.windows', { id: winid, cache: 'readme', html: '<ui-import config="url:/forms/readme.html"></ui-import>', title: title, actions: { move: true, autosave: true, close: true, maximize: false, minimize: false }, offset: { x: ((WW / 2) - 275) >> 0, y: ((WH / 2) - 250) >> 0, width: 550, height: 500, minwidth: 200, minheight: 300, maxwidth: 800, maxheight: 1200 }, make: el => el.closest('.ui-windows-item').css('z-index', 50) });

};

FUNC.strim = function(value) {

	var c = value.charAt(0);
	if (c !== ' ' && c !== '\t')
		return value;

	for (var i = 0; i < value.length; i++) {
		c = value.charAt(i);
		if (c !== ' ' && c !== '\t')
			break;
	}

	var count = i;
	var lines = value.split('\n');

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.length > count) {
			if ((/^[\s\t]+$/g).test(line.substring(0, count)))
				lines[i] = line.substring(count);
		}
	}

	return lines.join('\n');
};

FUNC.send = function(data) {
	data.uibuilder = 1;
	W.parent.postMessage(STRINGIFY(data), '*');
};

FUNC.placeholder = function(options) {
	var count = options.count || 3;
	var builder = [];
	var position = ['top', 'bottom', 'inherit', 'right'];

	builder.push('<div class="ui_placeholder_content ui_placeholder_{0}">'.format(options.name));

	switch (options.name) {
		case 'columnchart':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_bar" style="height:{0}px;width:{1}%"></div>'.format(Math.round((Math.random() * 100) + 1), 100 / count));
			break;
		case 'linechart':
			builder.push('<div style="background-image: url(\'/img/linechart.png\');background-size:cover;background-repeat:no-repeat;height:140px;background-position:{0}"></div>'.format(position[Math.floor(Math.random() * 3)]));
			break;
		case 'barchart':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_bar" style="width:{0}%;height:{1}%"></div>'.format(Math.round((Math.random() * 100) + 1), 100 / count));
			break;
		case 'checkboxlist':
			for (var i = 0; i < count; i++)
				builder.push('<div><i></i><span class="editable">Checkbox</span></div>');
			break;
		case 'listview':
			for (var i = 0; i < count; i++)
				builder.push('<div class="{0}"><figure><section><div>Item</div></section></figure></div>'.format(options.background ? 'listing2' : 'listing'));
			break;
		case 'radiobutton':
			for (var i = 0; i < count; i++)
				builder.push('<div><i></i><span class="editable">Radiobutton</span></div>');
			break;
		case 'donutchart':
			builder.push('<div style="background-image: url(\'/img/donutchart.png\');background-size:contain;background-repeat:no-repeat;height:140px;background-position:center center"></div>');
			break;
		case 'piechart':
			builder.push('<div style="background-image: url(\'/img/piechart.png\');background-size:contain;background-repeat:no-repeat;height:140px;background-position:center center"></div>');
			break;
		case 'calendar':
			builder.push('<div class="ui_calendar_year"><span></span></div><div class="ui_calendar_header"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="ui_calendar_days"><div><span class="dt_hide"></span><span class="dt_hide"></span><span></span><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span class="dt_today"></span><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span><span class="dt_hide"></span><span class="dt_hide"></span><span class="dt_hide"></span></div></div><div class="ui_calendar_footer"><span></span></div>');
			break;
		case 'togglegroup':
			builder.push('<div>Toggle 1</div><div>Toggle 2</div><div>Toggle 3</div>');
			break;
		case 'richtext':
			builder.push('<div class="ui_richtext_header"><span></span><span></span><span class="divider"></span><span class="lg"></span><span class="lg"></span><span class="divider"></span><span></span><span></span><span></span><span class="divider"></span><span></span></div><div class="ui_richtext_area"><span>Rich text editor</span></div>');
			break;
	}

	builder.push('</div>');
	return builder.join('');
};

FUNC.htmlify = function(data) {

	var builder = [];
	var tapp = Tangular.compile('<uibuilder-app{{ if name }} name="{{ name }}"{{ fi }}{{ if css }} css="{{ css | raw }}"{{ fi }}{{ if uid }} uid="{{ id }}"{{ fi }}>');
	var tbrick = Tangular.compile('<uibuilder-brick name="{{ component }}"{{ if config.path }} path="{{ config.path }}"{{ fi }}{{ if source }} source="{{ source }}"{{ fi }}{{ if config2 }} config="{{ config2 | raw }}"{{ fi }}{{ if x }} x="{{ x }}"{{ fi }}{{ if y }} y="{{ y }}"{{ fi }}{{ if zindex }} zindex="{{ zindex }}"{{ fi }} uid="{{ id }}">');

	data.css = data.css.replace(/\n/g, '').replace(/\t/g, ' ');

	var tabs = function(count, text) {
		let str = '';
		for (let i = 0; i < count; i++)
			str += '  ';
		let lines = text.split('\n');
		for (let i = 0; i < lines.length; i++)
			lines[i] = str + lines[i];
		text = lines.join('\n');
		return str + text;
	};

	var serialize = function(builder, children, count) {
		for (let arr of children) {
			builder.push(tabs(count, '<uibuilder-container>'));
			let subcount = count + 1;
			for (let item of arr) {

				item.source = data.components[item.component];
				item.path = item.config ? item.config.path : null;

				var iscomplicated = false;

				item.config2 = [];

				for (let key in item.config) {
					let cfg = item.config[key];
					let type = typeof(cfg);
					if (type === 'object') {
						iscomplicated = true;
						break;
					} else if (type === 'string' && (cfg.includes('"') || cfg.includes(':'))) {
						iscomplicated = true;
						break;
					}

					if (cfg != '' && cfg != null)
						item.config2.push(key + ':' + cfg);

				}

				if (!iscomplicated)
					item.config2 = item.config2.join(';');

				builder.push(tabs(subcount, tbrick(item)));

				if (iscomplicated)
					builder.push(tabs(subcount + 1, ('<scr' + 'ipt type="application/json">{0}</scr' + 'ipt>').format(JSON.stringify(item.config))));

				serialize(builder, item.children, subcount + 1);
				builder.push(tabs(subcount, '</uibuilder-brick>'));
			}
			builder.push(tabs(count, '</uibuilder-container>'));
		}
	};

	builder.push(tabs(0, tapp(data)));
	serialize(builder, data.children, 1);
	builder.push(tabs(0, '</uibuilder-app>'));
	return builder.join('\n');
};