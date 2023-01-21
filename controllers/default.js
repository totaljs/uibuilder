exports.install = function() {
	ROUTE('GET /');
	ROUTE('POST /render/');
	ROUTE('POST /save/', save, 1024);
	ROUTE('POST /publish/', publish, 1024);
};

function save() {
	var self = this;
	F.Fs.writeFile(PATH.public('editor.json'), JSON.stringify(JSON.parse(self.body.data), null, '\t'), self.done());
}

function publish() {
	var self = this;
	F.Fs.writeFile(PATH.public('render.json'), JSON.stringify(JSON.parse(self.body.data), null, '\t'), self.done());
}