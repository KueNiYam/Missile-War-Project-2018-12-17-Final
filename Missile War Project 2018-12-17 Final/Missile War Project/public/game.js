$(document).ready(function () {
    var user = decodeURIComponent($.cookie('login_info'));
    var ws = new WebSocket("ws://127.0.0.1:52275");
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
    /* 소켓 통신 & 게임 */
    var mp = 0;
    var seed;
    var players = {};
    var missiles = {};
    var canvas;
    var context;
    var display = function () {
        if (!context)
            context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#b28c4e";
        context.fillRect(0, 0, width, redLine);
        context.fillRect(0, blueLine, width, height);

        for (var player in players) {
            if (players[player]['status'] == die) {
                // 회색 X자
                context.beginPath();
                context.moveTo(players[player]['x'] - radiusOfPlayer
                    , players[player]['y'] - radiusOfPlayer);
                context.lineTo(players[player]['x'] + radiusOfPlayer
                    , players[player]['y'] + radiusOfPlayer);
                context.moveTo(players[player]['x'] + radiusOfPlayer
                    , players[player]['y'] - radiusOfPlayer);
                context.lineTo(players[player]['x'] - radiusOfPlayer
                    , players[player]['y'] + radiusOfPlayer);
                context.lineWidth = 4;
                context.strokeStyle = "grey";
                context.stroke();
            }
            else {
                context.beginPath();
                context.arc(players[player]['x'], players[player]['y'], radiusOfPlayer,
                    0, Math.PI * 2, false);
                if (player == seed)
                    context.fillStyle = "#00cf37";
                else if (players[player]['team'] == red)
                    context.fillStyle = "red";
                else if (players[player]['team'] == blue)
                    context.fillStyle = "blue";
                context.fill();
                context.closePath();
            }
        }
        for (var missile in missiles) {
            if (missiles[missile]['status'] == die) {
                /* 의도적으로 비움 */
            }
            else {
                context.beginPath();
                context.arc(missiles[missile]['x'], missiles[missile]['y'], radiusOfMissile,
                    0, Math.PI * 2, false);
                context.fillStyle = "black";
                context.fill();
                context.closePath();
            }
        }
    }

    ws.onopen = function (event) {
        var string = '';
        string += '<canvas id = "gameCanvas" width = "' + width + '" height = "' + height
            + '"></canvas>';
        $('body').prepend(string);
        canvas = document.getElementById('gameCanvas');
    };

    ws.onmessage = function (raw) {
        var data = JSON.parse(raw.data);
        var type = data['type'];

        switch (type) {
            case 'seed':
                seed = data['value'];
                console.log(seed);
                break;
            case 'players':
                players = JSON.parse(data['value']);
                break;
            case 'missiles':
                missiles = JSON.parse(data['value']);
                break;
        }
        display();
    };

    ws.onerror = function (error) {
        alert("Server error message: " + error);
    };

    $(document).keypress(function (e) {
        var keycode = e.keycode ? e.keycode : e.which;
        switch (keycode) {
            case 'w'.charCodeAt(0): //< UP
                e.preventDefault();
                console.log(keycode);
                ws.send(JSON.stringify({
                    'type': 'control',
                    'seed': seed,
                    'value': north
                }));
                break;
            case 's'.charCodeAt(0): //< DOWN
                e.preventDefault();
                ws.send(JSON.stringify({
                    'type': 'control',
                    'seed': seed,
                    'value': south
                }));
                break;
            case 'a'.charCodeAt(0): //< LEFT
                e.preventDefault();
                ws.send(JSON.stringify({
                    'type': 'control',
                    'seed': seed,
                    'value': west
                }));
                break;
            case 'd'.charCodeAt(0): //< RIGHT
                e.preventDefault();
                ws.send(JSON.stringify({
                    'type': 'control',
                    'seed': seed,
                    'value': east
                }));
                break;
            case ' '.charCodeAt(0): //< SPACE BAR
                if (mp > 30) {
                    mp -= 30;
                    console.log('미사일 발사');
                    e.preventDefault();
                    ws.send(JSON.stringify({
                        'type': 'control',
                        'seed': seed,
                        'value': launch
                    }));
                }
                break;
        }
    });

    setInterval(function () {
        $('#mp').css('width', mp + 'px' );
        if (mp < 299.5)
            mp += 0.5;
    }, 10);
    /*------------------------------------------------------*/
});