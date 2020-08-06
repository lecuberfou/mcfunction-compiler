// IMPORT JSzip
fetch('https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js')
    .then(function (data) { data.text()
        .then(function (text) { eval(text); });
    });

const MinecraftCompiler = class MinecraftCompiler {
	static compile (code) {
		if ([...arguments].length < 1) {
			throw new TypeError('Failed to compile : 1 argument required, but only 0 present.');
		}
		
		if (typeof code !== 'string') {
			throw new TypeError('Failed to compile : Expect argument 1 to be a String');
		}
		
		// do some computation
		
		return true;
	}
}
