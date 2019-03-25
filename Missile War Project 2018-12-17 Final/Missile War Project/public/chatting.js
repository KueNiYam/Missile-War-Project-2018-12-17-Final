// JavaScript source code

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

$(document).ready(function () {
    var user = decodeURIComponent($.cookie('login_info'));
    // 웹소켓 생성
    var ws = new WebSocket("ws://127.0.0.1:52274");
    // 웹소켓이 생성되면
    ws.onopen = function (event) {
        ws.send(encodeChattingData('join', user, ''));
        var doSend = function (e) {
            if ($('#input').val())
                ws.send(encodeChattingData('message', user, $('#input').val()));
            $('#input').val('');
        }

        $('#input_btn').on('click', doSend);
        $(document).keypress(function (e) {
            keycode = e.keycode ? e.keycode : e.which;
            if (keycode == 13) {
                e.preventDefault();
                doSend();
            }
        });
    };
    // 응답
    ws.onmessage = function (raw) {
        var data = decodeChattingData(raw.data);
        var type = data['type'];
        var who = data['who'];
        var message = data['message'];
        var text = '';

        if (type == 'join') {
            text += '<p class="system">"';
            text += who;
            text += '"님이 채팅방에 참가하였습니다.</p>';
            $('#chatting_section').append(text);
            $('#chatting_section').scrollTop($('#chatting_section')[0].scrollHeight);
        }
        else if (type == 'message') {
            if (who == user) {
                text += '<p class="my_name">' + who + ':</p>';
                text += '<p class="my_chat">' + message + '</p>';
            }
            else {
                text += '<p class="your_name">' + who + ':</p>';
                text += '<p class="your_chat">' + message + '</p>';
            }
            $('#chatting_section').append(text);
            $('#chatting_section').scrollTop($('#chatting_section')[0].scrollHeight);
        }
        else if (type == 'peoples') {
            text += '현재 ' + message + '명';
            $('#peoples').text(text);
        }
    };
    // 연결상태 체크
    function heartbeat() {
        /* empty */
    }
    ws.on('open', heartbeat);
    ws.on('ping', heartbeat);
    ws.on('close', function() {
        alert('서버와 연결이 끊어졌습니다.');
    });
    // 예외 처리
    ws.onerror = function (error) {
        alert("Server error message: " + error);
    };

});