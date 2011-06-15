
/**
 * Module dependencies.
 */

var express = require('express');
var io = require('socket.io');

var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.set('address', 'localhost');
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
	app.set('address', 'some-heroku-address');
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res) {
  res.render('index', {
		title: 'RouletteTok',
    address: app.settings.address,
		port: app.settings.port
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(app.settings.port);
  console.log("Express server listening on port %d", app.address().port);
}

require('./socketapp').start(io.listen(app));