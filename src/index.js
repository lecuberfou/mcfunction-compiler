// IMPORT JSzip
fetch('https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js')
    .then(function (data) { data.text()
        .then(function (text) { eval(text); });
    });

MinecraftCompiler = class MinecraftCompiler {

	constructor () {
		this.files = {};

		this.namespace = 'mccompiler';

		this.type_parsers = {
			'int':function (v) {},
			'void':function (v) {}
		}
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
		this.currentFile_content = this.files[file];
		this.currentFile_offset = 0;

		while (this.currentFile_offset < this.currentFile_content.length) {

			this.readSpace();

			// TYPE
			var type = this.readType();
			this.readSpace();

			// NOM
			var name = this.readVarName();
			if (['tick','load'].includes(name) && type !== 'void') { throw new SyntaxError(`Function ${name} has to be a void`); }

			// PARAMÈTRES
			this.readSpace();
			this.readChar('(');
			this.readSpace();
			var parameters = [];
			while (!this.readChar(')',false)) { // Tant que c'est pas un parenthèse fermante
				if (parameters.length > 0) { this.readChar(','); }

				var param = {type: this.readType()};
				parameters.push(param);
				this.readSpace();
				param.name = this.readName();
				this.readSpace();
				if (this.readChar('=',false)) {
					this.readSpace();
					param.default = this.readVal(param.type);
					this.readSpace();
				}
			}
			this.readSpace();

			// CONTENU
			this.readChar('{');
			this.readSpace();
			while (!this.readChar('}',false)) { // Tant que c'est pas un accolade fermante
				
				this.readChar(); // temporaire
			
			}
			
			this.readSpace();
		}
	}

	readChar (req_char=null, error=true) {
		if (req_char == null) { // Lit un caractère
			if (this.currentFile_offset < this.currentFile_content.length) {
				return this.currentFile_content[this.currentFile_offset++];
			} else {
				throw new SyntaxError(`Unexpected end of file at position ${this.currentFile_offset}`);
			}
		} else { // Attend un caractère spécifique
			if (this.currentFile_offset < this.currentFile_content.length) {
				if (this.currentFile_content[this.currentFile_offset++] === req_char) {
					return true;
				} else {
					this.currentFile_offset--;
					if (error) { throw new SyntaxError(`Unexpected character ${this.currentFile_content[this.currentFile_offset]} at position ${this.currentFile_offset}, expected ${req_char}`)
					} else { return false; }
				}
			} else {
				throw new SyntaxError(`Unexpected end of file at position ${this.currentFile_offset}`);
			}
		}
	}

	readSpace () {
		var ok = true;
		while (ok) {
			try {
				if (!/^[\s\r\n]*$/.test(this.readChar())) {
					ok = false;
					this.currentFile_offset--;
				}
			} catch (err) {
				ok = false;
			}
		}
	}

	readType () {
		var type = '';
		do {
			type += this.readChar();
		} while (/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(type));

		this.currentFile_offset--;
		type = type.slice(0,-1);

		if (!this.type_parsers[type]) { throw new SyntaxError(`Invalid type at position ${i}`); }

		return type;
	}

	readVarName () {
		var name = '';
		do {
			name += this.readChar();
		} while (/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name));

		this.currentFile_offset--;
		name = name.slice(0,-1);

		return name;
	}

	/*readInstructions (content, offset) {
		while (i < content.length) {
			if (/^\s*$/.test(content[i])) { i++; continue; }
			var type = content.slice(i).split(/^\s*$/);
		}
	}*/
}