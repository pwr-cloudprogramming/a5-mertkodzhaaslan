var express = require('express');
var bodyParser = require('body-parser');
var path = require('path'); 
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var groups = 1;

app.use(bodyParser.urlencoded({ extended: true }));

var cors = require('cors');
app.use(cors()); 



io.on('connection', function(socket){
	
	socket.on('startGame', function(data){
		socket.join(groups);
		socket.emit('new', {name: data.name, group: groups});
		groups++;
	});
	
	socket.on('joinGame', function(data){
		var group = io.nsps['/'].adapter.rooms[data.group];
		if (group && group.length == 1){
			socket.join(data.group);
			socket.broadcast.to(data.group).emit('player1', {});
			socket.emit('player2', {name: data.name, group: data.group })
		} else if (group && group.length > 1){
			socket.emit('err', {message: 'Room is full, please start a new game'});
		} else {
			socket.emit('err', {message: 'Invalid ID!'});
		}
	});
	
	socket.on('nextTurn', function(data){
		socket.broadcast.to(data.group).emit('toNext', {
			box: data.box,
			group: data.group
		});
	});

	socket.on('gameOver', function(data){
		
		if (data.winner) {
			
			socket.emit('endGame', { winner: data.winner, message: 'You win!' });
			socket.to(data.group).emit('endGame', { winner: data.winner, message: 'You lose!' });
		} else {
			
			io.in(data.group).emit('endGame', { message: data.message });
		}
	});
	
	socket.on('reset', function(data){
		
		io.in(data.group).emit('resetGame');
	});
})
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
