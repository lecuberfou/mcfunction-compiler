// IMPORT JSzip
fetch('https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js')
    .then(function (data) { data.text()
        .then(function (text) { eval(text); });
    });

MinecraftCompiler = class MinecraftCompiler {

	constructor () {
		this.files = {};

		this.namespace = 'mccompiler';

		this.varRegEx = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
		this.floatRegEx = /^[+-]?([0-9]*[.])?[0-9]+$/;
		this.spaceRegEx = /^[\s\r\n]*$/;
		this.operators = ['+','*','-','/','%'];
		this.assignements = ['+=','*=','-=','/=','%=','='];
		this.comparators = ['<','>','==','!='];

		this.types = {
			'byte':function (v) { if (/^[-+]?[0-9]*$/.test(v)) { return parseInt(v); } return false; }, // 8
			'short':function (v) { if (/^[-+]?[0-9]*$/.test(v)) { return parseInt(v); } return false; }, // 16
			'int':function (v) { if (/^[-+]?[0-9]*$/.test(v)) { return parseInt(v); } return false; }, // 32
			'long':function (v) { if (/^[-+]?[0-9]*$/.test(v)) { return parseInt(v); } return false; }, // 64
			'float':function (v) { if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(v)) { return parseFloat(v); } return false; }, // 32
			'double':function (v) { if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(v)) { return parseFloat(v); } return false; }, // 64

			'string':function (v) {},
			'void':function (v) {}
		}

		this.varPrefix = '$_compiler_variable%>';
		this.funcPrefix = '$_compiler_function%>';
	}

	setFile (name, content) {
		if ([...arguments].length < 2) { throw new TypeError(`Failed to set file : 2 arguments required, but only ${[...arguments].length} present.`); }
		
		if (typeof name !== 'string') { throw new TypeError('Failed to set file : Expect argument 1 (name) to be a String'); }
		if (typeof content !== 'string') { throw new TypeError('Failed to set file : Expect argument 2 (content) to be a String'); }

		this.files[name] = content;
	}

	resetCompilationSpace () {
		this.variables = {};
		
		this.mcfunctions = {};
		this.mcfunctions_map_i = 0;
		this.mcfunctions_map = {};
	}

	addVariable (variable) {
		if (this.variables[variable]) {
			throw new SyntaxError(`Variable ${variable.path.split('.').slice(-1)[0]} already defined !`);
		} else {
			this.variables[variable.path] = {
				path:variable.path,
				name:variable.path.split('.').slice(-1)[0],
				type:variable.type,
				isConstant:(variable.isConstant ? true : false),
				isFunction:(variable.isFunction ? true : false),
				map:'mcpp_§a'+Object.keys(this.variables).length.toString(36),
			};
		}
		return this.getVariable(variable.path);
	}
	getVariable (path) {
		if (!this.variables[path]) {
			throw new SyntaxError(`Variable ${path.split('.').slice(-1)[0]} is not defined !`);
		}
		return this.variables[path];
	}
	getMapFunction (mcfunction) {
		if (!this.mcfunctions_map[mcfunction]) {
			this.mcfunctions_map[mcfunction] = `${this.namespace}:${(this.mcfunctions_map_i++).toString(36)}`;
		}
		return this.mcfunctions_map[mcfunction];
	}

	compile () {
		return new Promise (function (resolve, reject) {

			try {

				// GENERATE FUNCTIONS
				this.resetCompilationSpace();
				for (var file of Object.keys(this.files)) {
					this.compileFile(file);
				}

				// tick, load lists
				var tick_funcs = [];
				var load_funcs = [];
				var i=0;
				for (var mcfunction of Object.keys(this.mcfunctions)) {
					if (mcfunction.endsWith('/tick')) { tick_funcs.push(this.getMapFunction(mcfunction)); }
					if (mcfunction.endsWith('/load')) { load_funcs.push(this.getMapFunction(mcfunction)); }
				}

				// CREATE ZIP
				var zip = new JSZip();
				zip.file('pack.mcmeta', `{"pack": {"pack_format": 5,"description": "compiled mc++ code"}}`);

				// PUT FILES IN ZIP
				for (var mcfunction of Object.keys(this.mcfunctions)) {
					zip.file(`data/${this.namespace}/functions/${this.getMapFunction(mcfunction).split(':')[1]}.mcfunction`, this.mcfunctions[mcfunction]);
				}
				// ticks & load
				if (load_funcs.length > 0) { zip.file(`data/minecraft/tags/functions/load.json`, JSON.stringify({'values':load_funcs})); }
				if (tick_funcs.length > 0) { zip.file(`data/minecraft/tags/functions/tick.json`, JSON.stringify({'values':tick_funcs})); }
		
				// GENERATE ZIP
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
			var name = this.readVal('varname').value;
			if (['tick','load'].includes(name) && type !== 'void') { throw new SyntaxError(`Function ${name} has to be a void`); }

			var currentPath = `${file}/${name}`;
			//var mcfunctionPath = this.getMapFunction(currentPath);
			var cur_function = this.addVariable({path:currentPath,type:type,isFunction:true,isConstant:true});

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
					param.default = this.readVal();
					this.readSpace();
				}
			}
			this.readSpace();

			// CONTENU
			this.readChar('{');
			this.readSpace();
			var commands = '';
			while (!this.readChar('}',false)) { // Tant que c'est pas un accolade fermante
				commands += this.readInstruction(currentPath)+'\n';
				this.readSpace();
			}
			this.mcfunctions[currentPath] = commands;
			
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
				throw new SyntaxError(`Unexpected end of file at position ${this.currentFile_offset}, expected character ${req_char}`);
			}
		}
	}

	readSpace () {
		var ok = true;
		while (ok) {
			try {
				if (!this.spaceRegEx.test(this.readChar())) {
					ok = false;
					this.currentFile_offset--;
				}
			} catch (err) {
				ok = false;
			}
		}
	}

	readType (type=null) {
		if (type === null) {
			var type = this.readVal('varname').value;

			if (!this.types[type]) { throw new SyntaxError(`Invalid type at position ${this.currentFile_offset}`); }

			return type;
		} else {

		}
	}

	readInstruction (currentPath) {
		var instruction = this.readVal('varname').value;
		var result = '';
		if (instruction == 'if') {
			this.readSpace();
			this.readChar('(');
			var condition = this.readVal();
		} else {
			if (this.types[instruction]) { // TYPE (déclaration de variable)
				var type = instruction;
				do {
					this.readSpace();
					var name = this.readVal('varname').value;
					var variable = `${currentPath}.${name}`;
					if (!this.variables[variable]) { this.variables[variable] = undefined; }
					this.readSpace();
					if (this.readChar('=', false)) {
						this.readSpace();
						var value = this.readVal();
					}
					var res_variable = this.addVariable({path:variable,type:type});
					if (type === 'int') {
						result += `scoreboard players set ${res_variable.map} ${this.namespace}._ints ${Math.max(-2147483648,Math.min(2147483647,parseInt((value.value||0))))}\n`;
					} else if (type === 'string') {
						//var result += `data modify storage ${this.namespace}:_strings ${this.varPrefix}${variable} set value "${value.replace(/"/g, '\\"')}"\n`;
						result += `data modify storage ${this.namespace}:_strings ${res_variable.map} set value ${JSON.stringify(value.value)}\n`;
					}
				} while (this.readChar(',', false));
				this.readSpace();
				this.readChar(';');
			} else { // VARIABLE (assignement)

			}
		}
		return (result.slice(-1) == '\n') ? result.slice(0,-1) : result;
	}

	readVal (type=null) {
		var ok = true;

		var result = {"value":"","precalc-lines":""};
		
		var first_chr = this.readChar();
		if ([`"`,`'`].includes(first_chr)) { // STRING
			result.type = 'string';
			var ok = true;
			var meta = false;
			do {
				var chr = this.readChar();

				if ((chr !== first_chr) || meta) {
					result.value += chr;
				} else { ok = false; }

				if (chr === '\\' && !meta) {
					meta = true;
				} else { meta = false; }
			} while (ok)
		} else if (first_chr === `[`) { // LIST
			result.type = 'list';
			var ok = true;
			/*var meta = false;
			do {
				var chr = this.readChar();

				if ((chr !== first_chr) || meta) {
					result.value += chr;
				} else { ok = false; }

				if (chr === '\\' && !meta) {
					meta = true;
				} else { meta = false; }
			} while (ok)*/
		} else if (this.floatRegEx.test(first_chr+"666")) { // FLOAT
			result.type = 'float';
			result.value = first_chr;
			do {
				result.value += this.readChar();
			} while (this.floatRegEx.test(result.value+"666"));

			this.currentFile_offset--;
			result.value = result.value.slice(0,-1);
		} else if (this.varRegEx.test(first_chr)) { // VAR NAME
			result.type = 'varname';
			result.value = first_chr;
			do {
				result.value += this.readChar();
			} while (this.varRegEx.test(result.value));

			this.currentFile_offset--;
			result.value = result.value.slice(0,-1);
		} else if (first_chr === `(`) { // PARENTHESIS OPERATION
			result.type = undefined;
			var ok = true;
			/*var meta = false;
			do {
				var chr = this.readChar();

				if ((chr !== first_chr) || meta) {
					result.value += chr;
				} else { ok = false; }

				if (chr === '\\' && !meta) {
					meta = true;
				} else { meta = false; }
			} while (ok)*/
		}

		if (type === null) {
			return result;
		} else if (result.type === type) {
			return result;
		} else {
			throw new SyntaxError(`Unexpected ${result.type} at position ${this.currentFile_offset}, expected ${type}`);
		}
	}
}
