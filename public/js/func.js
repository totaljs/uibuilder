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

	builder.push('<div class="ui_placeholder_content ui_placeholder_{0}">'.format(options.name));

	switch (options.name) {
		case 'columnchart':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_bar" style="height:{0}px;width:{1}%"></div>'.format(Math.round((Math.random() * 100) + 1), 100 / count));
			break;
		case 'linechart':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_bar" style="height:{0}px;width:{1}%"><div class="ui_placeholder_dot"></div></div>'.format(Math.round((Math.random() * 100) + 1), 100 / count));
			break;
		case 'barchart':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_bar" style="width:{0}%;height:{1}%"></div>'.format(Math.round((Math.random() * 100) + 1), 100 / count));
			break;
		case 'checkboxlist':
			for (var i = 0; i < count; i++)
				builder.push('<div class="ui_placeholder_checkbox"><i></i><span class="editable">Checkbox</span></div>');
			break;
		case 'piechart':
			builder.push('<div class="ui_placeholder_pie"></div>');
			break;
	}

	builder.push('</div>');
	return builder.join('');
};