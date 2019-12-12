var name = '', connectedUser;

var loginPage = document.querySelector('#login-page'),
	usernameInput = document.querySelector('#username'),
	loginButton = document.querySelector('#login'),
	callPage = document.querySelector('#call-page'),
	theirUsernameInput = document.querySelector('#their-username'),
	callButton = document.querySelector('#call'),
	hangUpButton = document.querySelector('#hang-up');
	callPage.style.display = 'none';

var yourVideo = document.querySelector('#yours'), 
	theirVideo = document.querySelector('#theirs'), 
	yourConnection, 
	stream;

loginButton.addEventListener('click', function(){
	name = usernameInput.value;
	if(name.length>0){
		send({
			type: "login",
			name: name
		});
	}
});

//var connection = new WebSocket('ws://'+document.domain+':8080');
var connection = new WebSocket('ws://服务器ip:8080');
/*
if (connection.readyState===1) {
	connection.send();
}else{
	//do something
	alert('1');
}
*/
connection.onopen = function(){
	console.log('Connected.');
};
connection.onmessage = function(message){
	console.log('Got message', message.data);
	var data = JSON.parse(message.data);
	switch(data.type){
		case 'login':
			onLogin(data.success);
			break;
		case 'offer':
			onOffer(data.offer, data.name);
			break;
		case 'answer':
			onAnswer(data.answer);
			break;
		case 'candidate':
			onCandidate(data.candidate);
			break;
		case 'leave':
			onLeave();
			break;
		default:
			break;
	}
};
connection.onerror = function(err){
	console.log("Got error", err);
};

function send(message){
	if(connectedUser){
		message.name = connectedUser;
	}
	connection.send(JSON.stringify(message));
}


function onLogin(success){
	if(success = false){
		alert('Login failed, Please try a different name,');
	}else{
		loginPage.style.display = 'none';
		callPage.style.display = 'block';
		startConnection();
	}
};

callButton.addEventListener('click', function(){
	var theirUsername = theirUsernameInput.value;
	if(theirUsername.length>0){
		startPeerConnection(theirUsername);
	}
});

hangUpButton.addEventListener('click', function(){
	send({
		type: "leave"
	});
	onLeave();
});




function onOffer(offer, name){
	connectedUser = name;
	yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
	console.log(yourConnection.remoteDescription.sdp);
	yourConnection.createAnswer(function(_answer){
		yourConnection.setLocalDescription(_answer);
		console.log(yourConnection.localDescription.sdp);
		send({
			type: 'answer',
			answer: _answer
		});
	}, function(err){
		console.log('An error occur on onOffer.');
	});
};

function onAnswer(answer){
	yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate){
	yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function onLeave(){
	connectedUser = null;
	yourConnection.close();
	yourConnection.onicecandidate = null;
	yourConnection.onaddstream = null;
	setupPeerConnection(stream);
};

function hasRTCPeerConnection(){
	window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
	window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
	window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
	return !!window.RTCPeerConnection;
}
	
function startConnection(){
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false
	})
	.then(function(myStream) {
		console.log(12);
		stream = myStream;
		yourVideo.srcObject = stream;
		if(hasRTCPeerConnection()){
			setupPeerConnection(stream);
		}
		else{
			alert('Sorry, your browser does not support WebRTC.');
		}
	})
	.catch(function(err) {
		/* 处理error */
		console.log(err);
  });
};


function setupPeerConnection(stream){
	var configuration = {
		"iceServers": [{
			 //"url": "stun:173.194.202.127:19302"
			 "url": "stun:stun1.l.google.com:19302"
		}]
	};
	yourConnection = new RTCPeerConnection(configuration);
	yourConnection.addStream(stream);
	yourConnection.onicecandidate = function(e){
		if(e.candidate){
			send({
				type: "candidate",
				candidate: e.candidate
			});
		}
	};
	console.log(yourConnection);
	yourConnection.onaddstream = function(e){
		theirVideo.srcObject = e.stream;
	};	
};

function startPeerConnection(user){
	connectedUser = user;
	yourConnection.createOffer(function(_offer){
		send({
			type: "offer",
			offer: _offer
		});
		yourConnection.setLocalDescription(_offer);
	}, function(error){
		alert('An error on startPeerConnection:', error);
	});
};