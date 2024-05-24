(function() {
    var P1 = 'X', P2 = 'O';
    var socket = io.connect('/');
    var currentTurn;
    var playerType;
    var groupID;
    var board = [];
    var username; 

    $('#start').on('click', function(){
        username = $('#username').val().trim(); 
        if (!username) {
            alert('Please enter a username.');
            return;
        }
        socket.emit('startGame', {name: username}); 
        playerType = P1;
    });

    $('#join').on('click', function(){
        groupID = $('#group').val();
        username = $('#username').val().trim(); 
        if(!groupID || !username){
            alert('Please enter  ID and username.');
            return;
        }
        socket.emit('joinGame', {name: username, group: groupID}); 
        playerType = P2;
    });

    socket.on('new', function(data){
        groupID = data.group;
        $('.front-page').css('display', 'none');
        $('.board').css('display', 'block');
        $('#greeting').html('Group ' + groupID + ' - ' + data.name + 
            '.<span id="disappear"> <br><br/>  ID is ' + data.group + '. GIVE THE CODE TO ENEMY .</span>');
        currentTurn = null;
    });

    socket.on('player2', function(data){
        $('.front-page').css('display', 'none');
        $('.board').css('display', 'block');
        $('#greeting').text('Welcome ' + data.name);
        currentTurn = false;
        $('#turn').text('Waiting for your enemy...');
    }); 

    socket.on('player1', function(){
        $('.front-page').css('display', 'none');
        $('.board').css('display', 'block');
        $('#disappear').remove();
        currentTurn = true;
        $('#turn').text('It is your turn.');
    });

    socket.on('toNext', function(data){
        var opponentType = playerType == P1 ? P2 : P1;
        $('#'+data.box).text(opponentType);
        $('#'+data.box).prop('disabled', true);
        var row = data.box.split('_')[1][0];
        var col = data.box.split('_')[1][1];
        board[row][col] = opponentType;
        currentTurn = true;
        $('#turn').text('It is your turn.');
    });

    socket.on('err', function(data){
        alert(data.message);
    });

    socket.on('resetGame', function(){
        setTimeout(function() {
            window.location.reload(true);
        }, 100);
    });

    socket.on('endGame', function(data){
        if (data.message === 'Game Tied!') {
            $('#turn').text(data.message);
        } else if (data.winner === username) {
            $('#turn').text('You win!');
        } else {
            $('#turn').text('You lose!');
        }
        $('.box').prop('disabled', true).off('click');
    });

    $('#reset').on('click', function(){
        socket.emit('reset', {group: groupID});
    });
    
    window.onbeforeunload = function(){
        socket.emit('reset', {group: groupID});
    };

    for(var i = 0; i < 3; i++) {
        board.push(['','','']);
        for(var j = 0; j < 3; j++) {
            $('#button_' + i + '' + j).on('click', function(){
                if ($(this).prop('occupied')) {
                    alert('Select an empty square.');
                    return;
                }
                if(currentTurn == null) {
                    alert('Enemy has not entered.');
                    return;
                }
                if(!currentTurn) {
                    alert('It is not your turn.');
                    return;
                }
                var box = $(this).attr('id');
                var turnObj = {
                    box: box,
                    group: groupID
                };
                socket.emit('nextTurn', turnObj);
                var row = box.split('_')[1][0];
                var col = box.split('_')[1][1];
                board[row][col] = playerType;
                currentTurn = false;
                $('#turn').text('Waiting for your enemy...');
                $(this).text(playerType);
                $(this).prop('occupied', true);
                var tied = true;
                for(var i = 0; i < 3; i++){
                    if(board[i][0] == playerType && board[i][1] == playerType && board[i][2] == playerType ||
                        board[0][i] == playerType && board[1][i] == playerType && board[2][i] == playerType) {
                        tied = reportWin();
                    } 
                }
                if(board[0][0] == playerType && board[1][1] == playerType && board[2][2] == playerType ||
                    board[2][0] == playerType && board[1][1] == playerType && board[0][2] == playerType) {
                    tied = reportWin();
                } 
                for(var i = 0; i < 3; i++){
                    for(var j = 0; j < 3; j++){
                        if(board[i][j] == ''){
                            tied = false;
                        }
                    }   
                }
                checkTie(tied);
            });
        }
    }

    function checkTie() {
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                if (board[i][j] === '') {
                    return false; 
                }
            }
        }
        socket.emit('gameOver', { group: groupID, message: 'Game Tied!' });
        $('#turn').text('Game Tied!');
        endGame(); 
        return true;
    }

    function reportWin(){
        socket.emit('gameOver', { group: groupID, winner: username });
        $('#turn').text('You win!');
        endGame();
    }

    function endGame(){
        $('.box').prop('disabled', true).off('click');
    }

})();
