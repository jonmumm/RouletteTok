//(function() {
	
	var socket = new io.Socket("192.168.10.145", {port: 3000, rememberTransport: false}); 

	socket.on('connect', function() {
		console.log('send initial');
		socket.send({ event: 'initial' });
	});

	socket.on('message', function (message) {
		console.log(message);
		
		var sessionId;
		var token;
		
		switch(message.event) {
			case 'initial':
				sessionId = message.data.sessionId;
				token = message.data.token;
				
				RouletteApp.init(sessionId, token);				
			break;
			
			case 'subscribe':
				sessionId = message.data.sessionId;
				token = message.data.token;
				
				RouletteApp.subscribe(sessionId, token);		
			break;
			
			case 'empty':
				RouletteApp.wait();
			
			break;
		}
	});

	socket.connect();
	
	var SocketProxy = function() {
		
		var findPartner = function(mySessionId) {
			socket.send({ 
				event: 'next',
				data: {
					sessionId: mySessionId
				}
			});			
		};
		
		return {
			findPartner: findPartner
		};
	}();
	
	var RouletteApp = function() {
		
		var apiKey = 413302;
		
		var mySession;
		var partnerSession;
		
		var partnerConnection;
		
		// Get view elements
		var ele = {};
		
		TB.setLogLevel(TB.DEBUG);
		
		var init = function(sessionId, token) {			
			ele.publisherContainer = document.getElementById('publisherContainer');
			ele.subscriberContainer = document.getElementById('subscriberContainer');
			ele.notificationContainer = document.getElementById('notificationContainer');
			ele.nextButton = document.getElementById('nextButton');
			
			ele.notificationContainer.innerHTML = "Connecting...";

			ele.nextButton.onclick = function() {
				RouletteApp.next();
			};
			
			mySession = TB.initSession(sessionId);			
			mySession.addEventListener('sessionConnected', sessionConnectedHandler);	
			mySession.addEventListener('connectionCreated', connectionCreatedHandler);	
			mySession.addEventListener('connectionDestroyed', connectionDestroyedHandler);	
			mySession.connect(apiKey, 'moderator_token');
			
			function sessionConnectedHandler(event) {
				ele.notificationContainer.innerHTML = "Connected, press allow.";
				
				var div = document.createElement('div');
				div.setAttribute('id', 'publisher');
				ele.publisherContainer.appendChild(div);
				
				var publisher = mySession.publish(div.id);
				publisher.addEventListener('accessAllowed', accessAllowedHandler);
			};
			
			function accessAllowedHandler(event) {		
				SocketProxy.findPartner(mySession.sessionId);
			};
			
			function connectionCreatedHandler(event) {
				partnerConnection = event.connections[0];
			};
			
			function connectionDestroyedHandler(event) {
				partnerConnection = null;
			}
		};
		
		var next = function() {			
			if (partnerConnection) {
				mySession.forceDisconnect(partnerConnection);				
			}
			
			if (partnerSession) {
				partnerSession.disconnect();
			}			
		};
		
		var subscribe = function(sessionId, token) {
			ele.notificationContainer.innerHTML = "Have fun !!!!";
			
			partnerSession = TB.initSession(sessionId);
			
			partnerSession.addEventListener('sessionConnected', sessionConnectedHandler);
			partnerSession.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
			partnerSession.addEventListener('streamDestroyed', streamDestroyedHandler);
	
			partnerSession.connect(apiKey, token);
			
			function sessionConnectedHandler(event) {
				console.log(event);
				
				var div = document.createElement('div');
				div.setAttribute('id', 'subscriber');
				ele.subscriberContainer.appendChild(div);
				
				partnerSession.subscribe(event.streams[0], div.id);
				
				console.log('Subscribe to my new partner ' + event.streams[0].streamId);
			}
			
			function sessionDisconnectedHandler(event) {
				partnerSession.removeEventListener('sessionConnected', sessionConnectedHandler);
				partnerSession.removeEventListener('sessionDisconnected', sessionDisconnectedHandler);
				partnerSession.removeEventListener('streamDestroyed', streamDestroyedHandler);
				
				SocketProxy.findPartner(mySession.sessionId);
				partnerSession = null;
			}
			
			function streamDestroyedHandler(event) {
				partnerSession.disconnect();
			}
		};
		
		var wait = function() {
			ele.notificationContainer.innerHTML = "Nobody to talk to :(.  When someone comes, you'll be the first to know :).";
		};
		
		return {
			init: init,
			next: next,
			subscribe: subscribe,
			wait: wait
		};
		
	}();
			
//})();
