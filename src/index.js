// IMPORT JSzip
fetch('https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js')
    .then(function (data) { data.text()
        .then(function (text) { eval(text); });
    });

MinecraftCompiler = class MinecraftCompiler {

	constructor () {
		this.files = {};

		this.namespace = 'mccompiler';
	}

	setFile (name, content) {
		if ([...arguments].length < 2) { throw new TypeError(`Failed to compile : 2 arguments required, but only ${[...arguments].length} present.`); }
		
		if (typeof name !== 'string') { throw new TypeError('Failed to compile : Expect argument 1 (name) to be a String'); }
		if (typeof content !== 'string') { throw new TypeError('Failed to compile : Expect argument 2 (content) to be a String'); }

		this.files[name] = content;
	}

	compile () {
		return new Promise (function (resolve, reject) {

			var zip = new JSZip();

			zip.file('pack.mcmeta', `{"pack": {"pack_format": 5,"description": "The default data for Minecraft"}}`);

			/*zip.file(`data/${this.namespace}/tags/functions/`);
			zip.file(`data/${this.namespace}/tags/functions/`);*/
			zip.file(`data/${this.namespace}/functions/test.mcfunction`, "say Hello world!");

			var functions = {};
			
			// do some computation
			
			zip.generateAsync({type:'blob'}).then(resolve);

		}.bind(this));
	}
}