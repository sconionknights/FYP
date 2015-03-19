var express = require('express');
var app = express();
var http = require('http');
var https = require('https');

app.use(express.static(__dirname + '/public'));
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/branchs', function(request, response) {
	var query = request.originalUrl;
	
	var options = {
	  host: 'tgl.standardchartered.com',
	  path: '/bridgeheadi18n/channels' + query,
	  method: 'GET'
	};
	var body = '';
	var request = https.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  //res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    
	    body += chunk;
	  });

	  res.on('end', function() {
	  	console.log('BODY: ' + body);
	  	response.setHeader('content-type', 'application/json');
	  	body = body.replace('jsoncallback(', '');
	  	body = body.slice(0, -1);
  		
	  	response.write(body);
	  	response.end();
	  });  
	});

	request.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	//console.log(str);
	request.write('data\n');
	request.end();

	console.log(request._headers);
});

app.get('/translate', function(request, response) {
	var query = request.originalUrl;
	
	var options = {
	  host: 'openapi.baidu.com',
	  path: '/public/2.0/bmt' + query,
	  method: 'GET'
	};
	var body = '';
	var request = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  //res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    
	    body += chunk;
	  });

	  res.on('end', function() {
	  	console.log('BODY: ' + body);
	  	response.setHeader('content-type', 'application/json');
	  	
	  	response.write(body);
	  	response.end();
	  });  
	});

	request.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	//console.log(str);
	request.write('data\n');
	request.end();

	console.log(request._headers);
});

app.get('/v1', function(request, response) {
	var query = request.originalUrl;
	
	var options = {
	  host: 'api.map.baidu.com',
	  path: '/direction' + query,
	  method: 'GET'
	};
	var body = '';
	var request = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  //res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    
	    body += chunk;
	  });

	  res.on('end', function() {
	  	console.log('BODY: ' + body);
	  	response.setHeader('content-type', 'application/json');
	  	
	  	response.write(body);
	  	response.end();
	  });  
	});

	request.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	//console.log(str);
	request.write('data\n');
	request.end();

	console.log(request._headers);
});

app.get('/hello', function (req, res) {
  res.send('Hello World!');
});

app.listen(process.env.PORT || 3000);

/*
var path = require('path');

app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
*/