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

	opt.url = app.schema.editor.upload;

	if (opt.query) {
		opt.url = QUERIFY(opt.url, opt.query);
		opt.query = undefined;
	}

	opt.callback = function(response) {
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
		PUSH('common.windows', { id: winid, cache: 'readme', html: '<ui-import config="url:@{#}/forms/readme.html"></ui-import>', title: title, actions: { move: true, autosave: true, close: true, maximize: false, minimize: false }, offset: { x: ((WW / 2) - 275) >> 0, y: ((WH / 2) - 250) >> 0, width: 550, height: 500, minwidth: 200, minheight: 300, maxwidth: 800, maxheight: 1200 }, make: el => el.closest('.ui-windows-item').css('z-index', 50) });

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
