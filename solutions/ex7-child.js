"use strict";

var fetch = require("node-fetch");


// ************************************

const HTTP_PORT = 8039;


main().catch(() => 1);


// ************************************

async function main() {
	try {
		var result = await fetch(`http://localhost:${HTTP_PORT}/get-records`);
		if (result.status == 200) {
			let records = await result.json();
			if (Array.isArray(records) && records.length > 0) {
				process.exitCode = 0;
			}
			else {
				process.exitCode = 1;
			}
		}
	}
	catch (err) {
		process.exitCode = 1;
	}
}
