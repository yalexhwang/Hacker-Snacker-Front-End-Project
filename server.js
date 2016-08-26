// Angular routes are considered cross origin. Cross-origin is only supported for: http, https, ftp. Our protcol when we load a page is "file://".  this requres something with http, htps, ftp at the beginnin fot the the route to function.
// Node js is our answer. with the connect module and the serveStatic medule we can serve stuff up.
// This involves:
// 1.npm init -  this will create a package.json
// 1b. No prompts are required.  You can just hit enter
// 2.npm install connect -  this will add the connect module to a node_modules folder.  it will create it if it doesnt exit
// 3. npm install serveStatic -  this will add the serve-static module to node_modules
// 4. node server.js - this will tell node you want to run the js file server.js

// Node will then serve up anything it finds like usual via http at http://localhos:8000
// solving the problem

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8000, function(){
	console.log('listening on Port 8000...');
});