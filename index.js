var fs = require('fs');

function readFiles(dirname, onFileContent, onError) {
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		filenames.forEach(function(filename) {
			fs.readFile(dirname + filename, 'utf-8', function(err, content) {
				if (err) {
					onError(err);
					return;
				}
				onFileContent(filename, content);
			});
		});
	});
}

let index = 0;
readFiles(
	'./documents/',
	function(file, content) {
		const parsedContent = JSON.parse(content);
		const body = parsedContent.body || null;

		if (body && parsedContent.lang==="en-gb") {
			const productRecomendations = body.findIndex((element) => element.key.includes('product_'));
			console.log(parsedContent.lang, productRecomendations);
		}

		index++;
	},
	function(error) {
		console.log(error);
	}
);

/*

  Go through all files
  Store an object if the conditions are met:
    1 -  lang = en-gb
    2 - in body has a slice that matches product_recommendation_
  Object
  {
    filename,
    grouplang
  }

  Go through the new list
  - Filter out just to icelandic
  - Filter out if it has product recomendations already ? {this could also delete exising product recomendations}
  - Is there a group lang

*/
