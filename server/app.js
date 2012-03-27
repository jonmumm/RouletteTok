var express = require('express');

var app = module.exports = express.createServer();

var port = 3000;
if (process.env.NODE_ENV === "production") {
  port = 80;
}

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
  app.use(express.errorHandler({ 
		dumpExceptions: true, 
		showStack: true 
	})); 
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res) {
  res.render('index', {
		title: 'RouletteTok'
  });
});

if (!module.parent) {
  app.listen(port);
  console.log("Server listening on port %d", port);
}

// Start my Socket.io app and pass in the socket
var io = require('socket.io').listen(app);
io.configure(function() {
  io.set('close timeout', 60*60*24);
});

require('./socketapp').start(io.sockets);
