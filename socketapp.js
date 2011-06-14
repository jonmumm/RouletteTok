var opentok = require('opentok');
var ot = new opentok.OpenTokSDK('413302', 'fc512f1f3c13e3ec3f590386c986842f92efa7e7');

var soloUsers = [];

exports.start = function(socket) {
	socket.on('connection', function(client) {	

		client.on('message', function(message) {
			// console.log(message);
			
			switch (message.event) {
				case 'initial':
					ot.createSession('localhost', {}, function(session) {
						
						var data = {
							sessionId: session.sessionId,
							token: ot.generateToken({ 
								sessionId: session.sessionId,
								role: opentok.Roles.MODERATOR
							})
						};
						
						client.send({
							event: 'initial',
							data: data
						});
					});
				break;
				
				case 'next':
					console.log(soloUsers);
				
					var me = {
						sessionId: message.data.sessionId,
						clientId: client.sessionId
					};
					
					var partner;
					var partnerClient;
					// Look for a user to partner with in the list of solo users
					for (var i = 0; i < soloUsers.length; i++) {
						var tmpUser = soloUsers[i];
						
						// Make sure our last partner is not our new partner
						if (client.partner != tmpUser) {							
							// Get the socket client for this user
							partnerClient = socket.clientsIndex[tmpUser.clientId];
							
							soloUsers.splice(i, 1);
							
							// If this user is still connected
							if (partnerClient) {
								partner = tmpUser;
								break;
							}
						}
					}
				
					// If we found a partner...
					if (partner) {
						
						// Tell myself to subscribe to my partner
						client.send({
							event: 'subscribe',
							data: {
								sessionId: partner.sessionId,
								token: ot.generateToken({ 
									sessionId: partner.sessionId,
									role: opentok.Roles.SUBSCRIBER
								})
							}
						});
						
						// Tell my partner to subscribe to me
						partnerClient.send({
							event: 'subscribe',
							data: {
								sessionId: me.sessionId,
								token: ot.generateToken({ 
									sessionId: me.sessionId,
									role: opentok.Roles.SUBSCRIBER
								})
							}
						});
						
						// Mark that my new partner and me are partners
						client.partner = partner;
						partnerClient.partner = me;
												
					} else {
						
						// Delete that I had a partner if I had one				
						if (client.partner) {							
							delete client.partner;
						}
						
						// Add myself to list of solo users if I'm not in the list
						if (!client.inList) {
							soloUsers.push(me);
						}
												
						// Tell myself that there is nobody to chat with right now
						client.send({
							event: 'empty'
						});
					}	
							
				break;
			}
		});
		
		client.on('disconnect', function() {
			
		});
	});
};