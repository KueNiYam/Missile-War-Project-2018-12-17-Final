// JavaScript source code for node
var portNum = 52273;

// 모듈
var os = require('os');
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var WebSocket = require("ws").Server;
var chatSocket = new WebSocket({ port: portNum + 1 });
var gameSocket = new WebSocket({ port: portNum + 2 });

// 정의 모듈
var loginJson = require('./server/loginJson.js');

// mysql 연결
var db = mysql.createConnection({
    user: 'root',
    password: '14109383',
    database: 'member'
});

// networkInterfaces 생성
var networkInterfaces = os.networkInterfaces();

// web server 생성
var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// 강제로 db와 연결유지
setInterval(function () {
    db.query('SELECT 1');
}, 5000);

/* 로그인&회원가입 */
// login request 응답
app.post('/login.json', function (request, response) {
    var userId = request.body.userId;
    var userPw = request.body.userPw;
    var idsPw = '';
    var failType = '';

    console.log('login request: ' + userId + ' / ' + userPw);

    db.query('select password from member ' +
        "where id = binary('" + userId + "')", function (error, rows) {
            if (error) {
                console.log(error);
            }
            else {
                if (rows.length == 0)
                    failType = 'id';
                else
                    idsPw = rows[0].password;

                if (failType == 'id') {
                    response.send(loginJson(false, failType));
                    console.log('login fail: ' + failType);
                }
                else if (userPw == idsPw) {
                    response.send(loginJson(true, userId));
                    console.log('login: ' + userId);
                    db.query("update member set score = score + 3 where id = binary('"
                        + userId + "')", function (error, rows) {
                            if (error) {
                                console.log(error);
                            }
                        });
                }
                else {
                    failType = 'password';
                    response.send(loginJson(false, failType));
                    console.log('login fail: ' + failType);
                }
            }
        });
});

// sing_up request 응답
app.post('/sign_up.json', function (request, response) {
    var userId = request.body.userId;
    var userPw = request.body.userPw;
    var failType = '';

    console.log('sign up request: ' + userId + ' / ' + userPw);

    db.query('select password from member ' +
        "where id = binary('" + userId + "')", function (error, rows) {
            if (error) {
                console.log(error);
            }
            else {
                if (rows.length != 0) {
                    failType = 'id';
                }
                else {
                    db.query('insert into member (id, password, authority) values (?,?,?)',
                        [userId, userPw, 'user'],
                        function (error) {
                            if (error)
                                console.log(error);
                        });
                }

                if (failType == 'id') {
                    response.send(loginJson(false, failType));
                    console.log('sign up fail: ' + failType);
                }
                else{
                    response.send(loginJson(true, userId));
                    console.log('sign_up: ' + userId);
                    db.query("update member set score = score + 3 where id = binary('"
                        + userId + "')", function (error, rows) {
                            if (error) {
                                console.log(error);
                            }
                        });
                }
            }
        });
});
/*---------------------------------------------*/
/* 프로필 카드 */
app.get('/profile/:id', function (request, response) {
    var id = request.params.id;
    db.query('select authority, score from member '
        + " where id = binary('" + id + "')"
        , function(error, rows, fields){
            if (error) {
                console.log(error);
                response.send({
                    result: 'failed',
                    failType: error
                });
            }
            else {
                if (rows.length == 0) {
                    response.send({
                        'rank': 'kakao',
                        'score': '---'
                    })
                }
                else {
                    response.send({
                        'rank': rows[0].authority,
                        'score': rows[0].score
                    })
                }
                console.log('send profile_card info');
            }
        })
});
/*---------------------------------------------*/
/* 게시판 */
// 게시판 응답
app.get('/board/:offset', function (request, response) {
    var offset = Number(request.params.offset);

    db.query('select * from board\n'+ 'order by post_date desc\n' + 'limit ?, 5'
        , [offset], function (error, rows, fields) {
            if (error) {
                console.log(error);
                response.send({
                    result: 'failed',
                    failType: error
                });
            }
            else {
                var items = rows.length;
                var titles = [];
                var post_dates = [];
                var writers = [];
                var contents = [];
                for (var i = 0; i < items; i++) {
                    titles.push(rows[i].title);
                    post_dates.push(rows[i].post_date);
                    writers.push(rows[i].writer);
                    contents.push(rows[i].content);
                }
                console.log('board data sent ');
                response.send({
                    'items': items,
                    'titles': titles,
                    'post_dates': post_dates,
                    'writers': writers,
                    'contents': contents
                });
            }
        });
});

// board post 응답
app.post('/post.json', function (request, response) {
    console.log('board post request');

    var post_title = request.body.title;
    var post_writer = request.body.writer;
    var post_content = request.body.content;
    
    db.query('INSERT INTO board (writer, title, content) values (?, ?, ?)'
        , [post_writer, post_title, post_content], function (error, results, fields) {
            if (error) {
                response.send({
                    result: 'failed',
                    failType: error
                });
            }
            else {
                console.log('board post successed');
                response.send({
                    result: 'successed',
                    failType: ''
                });
            }
        });

});
/*---------------------------------------------*/
/* 채팅 */
// 채팅 데이터 생성 함수
function encodeChattingData(type, who, message) {
    return encodeURIComponent(JSON.stringify({
        'type': type, //< type: join, message, peoples
        'who': who, //< who: user, system
        'message': message //< message: contents
    }));
}
// 채팅 데이터 파싱 함수
function decodeChattingData(raw) {
    return JSON.parse(decodeURIComponent(raw));
}

// 채팅방 연결
chatSocket.on("connection", function (ws) {
    ws.on('pong', heartbeat);
    console.log("chatting socket conneted:" + Date());
    //ws.send(chatDataForm('join', ws));
    ws.on("message", function (raw) {
        var data = decodeChattingData(raw);
        var type = data['type'];
        var who = data['who'];
        var message = data['message'];

        chatSocket.clients.forEach(function each(client) {
            try {
                encodeChattingData('peoples', 'system', peoples); //< 인원 수 정보
                client.send(encodeChattingData(type, who, message));
            } catch (e) {
            }
        });
    });
});

// 연결 상태 체크
var peoples = 0;
function noop() { /* empty */ }
function heartbeat() {
    this.isAlive = true;
}
function ping() {
    peoples = 0;
    chatSocket.clients.forEach(function each(ws) {
        peoples++;
        ws.isAlive = false;
        ws.ping(noop);
    });
    chatSocket.clients.forEach(function each(client) {
        try {
            client.send(encodeChattingData('peoples', 'system', peoples));
        } catch (e) {
        }
    });
}
setInterval(ping, 1000);
ping();
/*---------------------------------------------*/
/* JavaScript Code for Game ------------------------------------------------------------------------------------------ */
/* enum */
const red = 1; // 위 팀
const blue = 2; // 아래 팀

const player = 1;
const missile = 2;

const width = 720;
const height = 640;

const redLine = height / 3;
const blueLine = height * 2 / 3;

const speedOfMissile = 2;
const speedOfPlayer = 10;

const radiusOfMissile = 20;
const radiusOfPlayer = 10;

const stop = 0;
const east = 1;
const west = 2;
const south = 3;
const north = 4;
const launch = 5;

const die = 0;
const live = 1;
/*----------------------------------------------*/
var createRedPlayer = function () {
    return {
        'team': red,
        'x': (width / 2),
        'y': (height / 5),
        'action': stop,
        'status': live
    };
}
var createBluePlayer = function () {
    return {
        'team': blue,
        'x': (width / 2),
        'y': (height * 4 / 5),
        'action': stop,
        'status': live
    };
}
var moveRedPlayer = function (redPlayer) {
    if (redPlayer['status'] == die)
        return;
    switch (redPlayer['action']) {
        case stop:
            break;
        case east:
            if (redPlayer['x'] + radiusOfPlayer + speedOfPlayer < width)
                redPlayer['x'] += speedOfPlayer;
            break;
        case west:
            if (redPlayer['x'] - radiusOfPlayer - speedOfPlayer > 0)
                redPlayer['x'] -= speedOfPlayer;
            break;
        case south:
            if (redPlayer['y'] + radiusOfPlayer + speedOfPlayer < redLine)
                redPlayer['y'] += speedOfPlayer;
            break;
        case north:
            if (redPlayer['y'] - radiusOfPlayer - speedOfPlayer > 0)
                redPlayer['y'] -= speedOfPlayer;
            break;
    }
    redPlayer['action'] = stop;
}
var moveBluePlayer = function (bluePlayer) {
    if (bluePlayer['status'] == die)
        return;
    switch (bluePlayer['action']) {
        case stop:
            break;
        case east:
            if (bluePlayer['x'] + radiusOfPlayer + speedOfPlayer < width)
                bluePlayer['x'] += speedOfPlayer;
            break;
        case west:
            if (bluePlayer['x'] - radiusOfPlayer - speedOfPlayer > 0)
                bluePlayer['x'] -= speedOfPlayer;
            break;
        case south:
            if (bluePlayer['y'] + radiusOfPlayer + speedOfPlayer < height)
                bluePlayer['y'] += speedOfPlayer;
            break;
        case north:
            if (bluePlayer['y'] - radiusOfPlayer - speedOfPlayer > blueLine)
                bluePlayer['y'] -= speedOfPlayer;
            break;
    }
    bluePlayer['action'] = stop;
}
var createRedMissile = function (redPlayer) {
    return {
        'team': red,
        'x': redPlayer['x'],
        'y': redPlayer['y'],
        'status': live
    }
}
var createBlueMissile = function (bluePlayer) {
    return {
        'team': blue,
        'x': bluePlayer['x'],
        'y': bluePlayer['y'],
        'status': live
    }
}
var moveRedMissile = function (redMissile) {
    if (redMissile['status'] != live)
        return;
    if (redMissile['y'] - radiusOfMissile + speedOfMissile < height)
        redMissile['y'] += speedOfMissile;
    else
        redMissile['status'] = die;
}
var moveBlueMissile = function (blueMissile) {
    if (blueMissile['status'] != live)
        return;
    if (blueMissile['y'] + radiusOfMissile - speedOfMissile > 0)
        blueMissile['y'] -= speedOfMissile;
    else
        blueMissile['status'] = die;
}
var collision = function (player, missile) {
    var distance = Math.sqrt((player['x'] - missile['x']) * (player['x'] - missile['x'])
        + (player['y'] - missile['y']) * (player['y'] - missile['y']));
    if (distance < radiusOfMissile + radiusOfPlayer) {
        player['status'] = die;
    }
}
var redPlayersCollision = function (redPlayers, blueMissiles) {
    for (var player in redPlayers) {
        if (redPlayers[player]['status'] != live)
            continue;
        for (var missile in blueMissiles) {
            if (blueMissiles[missile]['status'] != live)
                continue;
            if (blueMissiles[missile]['y'] > redLine + radiusOfMissile)
                continue;
            collision(redPlayers[player], blueMissiles[missile]);
        }
    }
}
var bluePlayersCollision = function (bluePlayers, redMissiles) {
    for (var player in bluePlayers) {
        if (bluePlayers[player]['status'] != live)
            continue;
        for (var missile in redMissiles) {
            if (redMissiles[missile]['status'] != live)
                continue;
            if (redMissiles[missile]['y'] < blueLine - radiusOfMissile)
                continue;
            collision(bluePlayers[player], redMissiles[missile]);
        }
    }
}
/*-------------------------------------------------------------------------------------------------------------------------*/
/* Game Thread ---------------------------------------------------------------------------------------------------------*/
var gameSeed = 1;
var players = {};
var missiles = [];
var decideTeam = function () {
    if (gameSeed % 2 == 0)
        return blue;
    else
        return red;
}

gameSocket.on("connection", function (ws) {
    console.log("game socket conneted:" + Date());

    // assign team
    var team = decideTeam();
    if (team == blue)
        players[String(gameSeed)] = createBluePlayer();
    else
        players[String(gameSeed)] = createRedPlayer();
    try {
        ws.send(JSON.stringify(
            {
                'type': 'seed',
                'value': (gameSeed++)
            }
            ));
    }
    catch (e) {
    }

    ws.on("message", function (raw) {
        var data = JSON.parse(raw);
        var seed = data['seed'];
        var type = data['type'];
        var value = data['value'];

        switch (type) {
            case 'control':
                if (value == north)
                    players[seed]['action'] = north;
                else if (value == south) 
                    players[seed]['action'] = south;
                else if (value == east) 
                    players[seed]['action'] = east;
                else if (value == west) 
                    players[seed]['action'] = west;
                else if (value == launch) 
                    players[seed]['action'] = launch;
                break;
        }
    });
});

setInterval(function () {
    if (!players)
        return;

    // Initialize
    var redPlayers = [];
    var bluePlayers = [];
    var redMissiles = [];
    var blueMissiles = [];

    for (var player in players) {
        if (players[player]['status'] == die)
            ;
        else if (players[player]['team'] == red)
            redPlayers.push(players[player]);
        else if (players[player]['team'] == blue)
            bluePlayers.push(players[player]);
    }
    for (var missile in missiles) {
        if (missiles[missile]['status'] == die)
            ;
        else if (missiles[missile]['team'] == red)
            redMissiles.push(missiles[missile]);
        else if (missiles[missile]['team'] == blue)
            blueMissiles.push(missiles[missile]);
    }

    // Action
    redPlayersCollision(redPlayers, blueMissiles);
    bluePlayersCollision(bluePlayers, redMissiles);
    for (var redPlayer in redPlayers) {
        if (redPlayers[redPlayer]['action'] == launch)
            missiles.push(createRedMissile(redPlayers[redPlayer]));
        moveRedPlayer(redPlayers[redPlayer]);
    }
    for (var bluePlayer in bluePlayers) {
        if (bluePlayers[bluePlayer]['action'] == launch)
            missiles.push(createBlueMissile(bluePlayers[bluePlayer]));
        moveBluePlayer(bluePlayers[bluePlayer]);
    }
    for (var redMissile in redMissiles) {
        moveRedMissile(redMissiles[redMissile]);
    }
    for (var blueMissile in blueMissiles) {
        moveBlueMissile(blueMissiles[blueMissile]);
    }
    
    gameSocket.clients.forEach(function each(client) {
        stringOfPlayers = JSON.stringify(players);
        stringOfMissiles = JSON.stringify(missiles);
        try {
            client.send(JSON.stringify({
                'type': 'players',
                'value': stringOfPlayers
            }));
            client.send(JSON.stringify({
                'type': 'missiles',
                'value': stringOfMissiles
            }));
        } catch (e){
        }
    });
}, 10);

/*------------------------------------------------------------------------------------------------------------------------*/
// web server 실행
app.listen(portNum, function () {
    console.log('Server Running:');
    console.log(networkInterfaces);
    console.log('at port number ' + portNum);
});

