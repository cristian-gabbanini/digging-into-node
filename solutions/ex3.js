#!/usr/bin/env node

"use strict";

var util = require("util");
var path = require("path");
var fs = require("fs");
var zlib = require("zlib");
var Transform = require("stream").Transform;

var CAF = require("caf");


// async initializations
var fsStatAsync = util.promisify(fs.stat);
var fsMkdirAsync = util.promisify(fs.mkdir);
var streamComplete = CAF(function *wait(signal,stream){
	return new Promise(function c(res){
		stream.on("end",res);
		signal.pr.catch(function onCancel(){
			stream.removeListener("end",res);
		});
	});
});
processFile = CAF(processFile);
// ************


var args = require("minimist")(process.argv.slice(2),{
	boolean: ["help","in","out","uncompress","compress",],
	string: ["file",],
});

const BASEPATH =
	path.resolve(process.env.BASEPATH || __dirname);

const BASEOUTPATH = process.env.BASEOUTPATH ?
	path.resolve(process.env.BASEOUTPATH) :
	path.join(__dirname,"outfiles");

var OUTPATH = path.join(BASEOUTPATH,"out.txt");

main().catch(console.error);




// ************************************

async function main() {
	try {
		await fsStatAsync(BASEOUTPATH);
	}
	catch (err) {
		await fsMkdirAsync(BASEOUTPATH);
	}

	if (args.help || process.argv.length <= 2) {
		error(null,/*showHelp=*/true);
	}
	else if (args._.includes("-") || args.in) {
		let timedCancel = new CAF.timeout(1000,"Took too long.");

		await processFile(timedCancel,process.stdin);

		// temporary debug output
		console.error("Complete.");
	}
	else if (args.file) {
		let timedCancel = new CAF.timeout(1000,"Took too long.");
		let filePath = path.join(BASEPATH,args.file);

		await processFile(timedCancel,fs.createReadStream(filePath));

		// temporary debug output
		console.error("Complete.");
	}
	else {
		error("Usage incorrect.",/*showHelp=*/true);
	}
}

function printHelp() {
	console.log("ex3 usage:");
	console.log("");
	console.log("--help                      print this help");
	console.log("-, --in                     read file from stdin");
	console.log("--file={FILENAME}           read file from {FILENAME}");
	console.log("--uncompress                uncompress input file with gzip");
	console.log("--compress                  compress output with gzip");
	console.log("--out                       print output");
	console.log("");
	console.log("");
}

function error(err,showHelp = false) {
	if (err) {
		console.log(err.toString());
		console.log("");
	}
	if (showHelp) {
		printHelp();
	}
}

function *processFile(signal,inputStream) {
	var stream = inputStream;
	var outStream;

	if (args.uncompress) {
		let gunzip = zlib.createGunzip();
		stream = stream.pipe(gunzip);
	}

	var upperCaseTr = new Transform({
		transform(chunk,encoding,callback) {
			this.push(chunk.toString().toUpperCase());
			callback();
		}
	});

	stream = stream.pipe(upperCaseTr);

	if (args.compress) {
		OUTPATH = `${OUTPATH}.gz`;
		let gzip = zlib.createGzip();
		stream = stream.pipe(gzip);
	}

	if (args.out) {
		outStream = process.stdout;
	}
	else {
		outStream = fs.createWriteStream(OUTPATH);
	}

	stream.pipe(outStream);

	// listen for cancelation to abort output
	signal.pr.catch(function onCancelation(){
		stream.unpipe(outStream);
		stream.destroy();
	});

	yield streamComplete(signal,stream);
}
