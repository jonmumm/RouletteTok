// SET YOUR PRODUCTION SERVER HOST ADDRESS HERE
var HOST_ADDRESS = 'fierce-sword-182.herokuapp.com';

var express = require('express');

var app = module.exports = express.createServer();

var port = process.env.PORT || 3000;

// Configuration
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.set('port', port);
	app.set('address', 'localhost');
  app.use(express.errorHandler({ 
		dumpExceptions: true, 
		showStack: true 
	})); 
});

app.configure('production', function() {
	app.set('port', 80);
	app.set('address', HOST_ADDRESS);
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

if (!module.parent) {
  app.listen(port);
  console.log("Server listening on port %d", port);
}

// Start my Socket.io app and pass in the socket
var io = require('socket.io').listen(app);
require('./socketapp').start(io.sockets);
