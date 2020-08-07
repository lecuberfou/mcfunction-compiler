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

	resetCompilationSpace () {
		
	}

	compile () {
		return new Promise (function (resolve, reject) {

			try {
				var zip = new JSZip();

				zip.file('pack.mcmeta', `{"pack": {"pack_format": 5,"description": "compiled mc++ code"}}`);

				/*zip.file(`data/minecraft/tags/functions/tick.json`);
				zip.file(`data/minecraft/tags/functions/load.json`);*/
				zip.file(`data/${this.namespace}/functions/test.mcfunction`, "say Hello world!");

				//var functions = {};

				this.resetCompilationSpace();
				for (var file of Object.keys(this.files)) {
					this.compileFile(file);
				}
		
				zip.generateAsync({type:'blob'}).then(resolve).catch(reject);
			} catch (err) {
				reject(err);
			}

		}.bind(this));
	}

	compileFile (file) {
		var i=0;
		var content = this.files[file];

		this.readFuncs(content);
	}

	readFunctions (content) {
		while (i < content.length) {
			if (/^\s*$/.test(content[i])) { i++; continue; }

			// TYPE (int, void, etc)
			var type = '';
			while (!/^\s*$/.test(content[i])) { type += content[i]; i++; }

			// ESPACE (obligatoire)
			while (/^\s*$/.test(content[i])) { i++; }

			// NOM (tick, load)
			var end = i;
			while (/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(content.slice(i,end+1))) { end++; }
			var name = content.slice(i,end);

			// ESPACE (optionnel)
			while (/^\s*$/.test(content[i])) { i++; }

			// { /* code */ }
		}
	}

	readInstructions (content) {
		while (i < content.length) {
			if (/^\s*$/.test(content[i])) { i++; continue; }
			var type = content.slice(i).split(/^\s*$/);
		}
	}
}