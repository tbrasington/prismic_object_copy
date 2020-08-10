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
		if (item && item.content) {
			const parsedContent = JSON.parse(item.content);
			const body = parsedContent.body || null;
			if (body && parsedContent.grouplang == grouplang && parsedContent.lang === locale) {
				matchingFiles.push({ content: item.content, filename: item.filename });
			}
		}
	});

	return matchingFiles;
};

const insert = (arr, index, newItem) => [
	// part of the array before the specified index
	...arr.slice(0, index),
	// inserted item
	newItem,
	// part of the array after the specified index
	...arr.slice(index)
];

readFiles(directory)
	.then((contents) => {
		// optional:

		const jsonFiles = contents.filter((item) => item.filename.includes('.json'));

		const articlesWithRecommendations = [];
		jsonFiles.forEach((item, i) => {
			if (item && item.content) {
				const parsedContent = JSON.parse(item.content);
				const body = parsedContent.body || null;

				if (body && parsedContent.lang === 'en-gb') {
					const productRecomendations = body.findIndex((element) => element.key.includes('product_'));

					if (productRecomendations > 0) {
						const otherFiles = findOtherLocales(parsedContent.grouplang, jsonFiles, 'is');

						if (otherFiles.length > 0) {
							articlesWithRecommendations.push({
								grouplang: parsedContent.grouplang,
								data: parsedContent,
								locales: otherFiles
							});
						}
					}
				}
			}
		});

		// send data here
		const fileToMerge = articlesWithRecommendations[0];
		const fileContent = fileToMerge.data.body;
		const targetFileContent = fileToMerge.locales[0];
		let previousElement = null;
		let productRecommendationData = [];

		// get the json data and what the previous sibling element is
		fileContent.map((item, index) => {
			if (item.key.includes('product_rec')) {
				productRecommendationData.push({
					inject: item,
					previous: previousElement
				});
			}
			previousElement = item;
		});

		// now lets open up the icelandic file
		let LocaleBody = JSON.parse(targetFileContent.content);
		// remove any existing product recommendations
		let LocaleBodyWithNoProducts = LocaleBody.body.filter((item) => !item.key.includes('product_rec'));

		//lets loops over what products want to inject
	
		// loop over the LocaleBodyWithNoProducts
		// if one of its key's matches, clone the array and inject the product rec,
		// pass that array back to the loop, and go over the next one
		let rebuiltBody = [];
		let noMatch = []
		LocaleBodyWithNoProducts.forEach((originalItem) => {
			rebuiltBody.push(originalItem);
			productRecommendationData.forEach((productRec) => {
				if (productRec.previous.key === originalItem.key) {
					rebuiltBody.push(productRec.inject);
				} 
			});
		});

		// we do a second pass to then add in the products by id under the section id
		let rebuiltBody2 = [];
		const f = productRecommendationData.filter(
			(p) => !p.inject.key.includes('product_recommendation_section_by_ids')
		);
		rebuiltBody.forEach((originalItem) => {
			rebuiltBody2.push(originalItem);
			f.forEach((productRec) => {
				if (productRec.previous.key === originalItem.key) {
					rebuiltBody2.push(productRec.inject);
				}
			});
		});

		// our rebuilt body
		LocaleBody.body = rebuiltBody2;
		console.log(targetFileContent.filename)

		fs.writeFileSync('processed/' + targetFileContent.filename, JSON.stringify(LocaleBody));

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
