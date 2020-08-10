var fs = require('fs');
const { promisify } = require('util');
const { match } = require('assert');

const directory = './documents/';

let file;

const readFiles = (dirname) => {
	const readDirPr = new Promise((resolve, reject) => {
		fs.readdir(dirname, (err, filenames) => (err ? reject(err) : resolve(filenames)));
	});

	return readDirPr.then((filenames) =>
		Promise.all(
			filenames.map((filename) => {
				return new Promise((resolve, reject) => {
					fs.readFile(
						dirname + filename,
						'utf-8',
						(err, content) => (err ? reject(err) : resolve({ content: content, filename: filename }))
					);
				});
			})
		).catch((error) => Promise.reject(error))
	);
};

const findOtherLocales = (grouplang, files, locale) => {
	let matchingFiles = [];

	files.forEach((item) => {

		const parsedContent = JSON.parse(item.content);
		const body = parsedContent.body || null;
		if (body && parsedContent.grouplang == grouplang && parsedContent.lang === locale) {
			matchingFiles.push(item.content);
		}
	});

	return matchingFiles;
};

readFiles(directory)
	.then((contents) => {
		// optional:
		const articlesWithRecommendations = [];
		contents.forEach((item, i) => {
			const parsedContent = JSON.parse(item.content);
			const body = parsedContent.body || null;

			if (body && parsedContent.lang === 'en-gb') {
				const productRecomendations = body.findIndex((element) => element.key.includes('product_'));

				if (productRecomendations > 0) {
					const otherFiles = findOtherLocales(parsedContent.grouplang, contents, 'is');
				
					if (otherFiles.length > 0) {
						articlesWithRecommendations.push({
							grouplang: parsedContent.grouplang,
							data: parsedContent,
							locales: otherFiles
						});
					}
				}
			}
		});

		console.log(articlesWithRecommendations[0]);

		// send data here
	})
	.catch((err) => {
		console.error(err);
	});

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
  
https://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
*/
