// JavaScript source code
$(document).ready(function () {
    /* 로그인 관련 */
    var loginStatus = false;
    // 로그인&로그아웃 체크 함수
    var loginCheck = function () {
        var profile_name = $.cookie('login_info');
        if (!profile_name && loginStatus == true) {
            $('#profile_name').text('');
            $('.topWhenLogin').css({
                'visibility': 'hidden'
            });
            $('.categoryLink').css({
                'visibility': 'hidden'
            });
            $('.loginLink').css({
                'visibility': 'visible',
                'line-height': '50px'
            });
            alert('로그아웃되었습니다.');
            loginStatus = false;
        }
        else if(profile_name && loginStatus == false) {
            profile_name = decodeURIComponent(profile_name);
            $('#profile_name').text(profile_name);
            $('.topWhenLogin').css({
                'visibility': 'visible'
            });
            $('.categoryLink').css({
                'visibility': 'visible'
            });
            $('.loginLink').css({
                'visibility': 'hidden',
                'line-height': '0px'
            });
            loginStatus = true;
        }
    };

    //  로그인 버튼 클릭
    $('.loginLink').on('click', function () {
        var child = window.open('./login.html', 'loginWindow',
                        'height=290, width=480, location=no, menubar=no, resizable=no, status=no, toolbar=no', true);
        child.$('#userId').focus();
    });

    // 로그아웃 버튼 클릭
    $('#profile_logout').on('click', function(){
        $.cookie('login_info', '');
        loginCheck();
        window.location.reload();
    });

    // 로그인&로그아웃 체크
    loginCheck();
    setInterval(loginCheck, 1000);

    // 프로필 이름 클릭
    var cardStatus = false;
    $('#profile_name').on('click', function () {
        if (cardStatus == false) {
            $.ajax({
                url: './profile/' + decodeURIComponent($.cookie('login_info')),
                type: 'GET',
                success: function (data) {
                    my_rank = data['rank'];
                    my_score = data['score'];
                    var text = '';
                    text += '<p>Rank: ' + my_rank.toUpperCase() + '</p>';
                    text += '<p>Score: ' + my_score + '</p>';
                    $('#profile_rank').html(text);
                    $('#profile_card').css({ 'visibility': 'visible' });
                }
            });
            cardStatus = true;
        }
        else {
            $('#profile_card').css({ 'visibility': 'hidden' });
            cardStatus = false;
        }
    });
    /*-----------------------------------------------------*/
    /* 메인 관련 */
    $('#homeBtn').on('click', function () {
        location.href = './missile_war_project.html';
    });

    // 커뮤니티 버튼 클릭 시
    $('#communityBtn').on('click', function () {
        var offset = 0;

        // community 부분 생성
        var forCommunity = '<div class="communityStyle" id="board">'
                + '<div id = "board_box">'
                + '</div>'
                + '<div id="board_footer">'
                + '<p id="board_next">next</p>'
                + '<span class="txt_bar" id="board_footer_bar"></span>'
                + '<p id="board_previous">prev</p>'
                + '</div>'
                + '</div>'
                + '<input class="communityStyle" id="postTitle" type="text" placeholder="제목" />'
                + '<div class="communityStyle" id="postBtn"><a id="post" href="#"><p>게시하기</p></a></div>'
                + '<textarea class="communityStyle" id="postTextArea" placeholder="글 쓰기"></textarea>';
        $('#main').html(forCommunity);

        // 게시판 내용 생성
        $.ajax({
            url: './board/' + offset,
            type: 'GET',
            success: function (data) {
                var newHTML = '';
                for (var i = 0; i < data['items']; i++) {
                    newHTML += '<h3 class="board_title">' + data['titles'][i] +'</h3>'
                        + '<p class="board_date">'+ data['post_dates'][i]+'</p>'
                        + '<span class="txt_bar" id="board_bar"></span>'
                        + '<p class="board_writer">' + data['writers'][i] + '</p>'
                        + '<p class="board_content">' + data['contents'][i] + '</p>';
                }
                $('#board_box').html(newHTML);
            }
        });

        // prev 클릭
        $('#board_previous').on('click', function () {
            if (offset >= 5)
                offset -= 5;
            else
                offset = 0;
            $.ajax({
                url: './board/' + offset,
                type: 'GET',
                success: function (data) {
                    var newHTML = '';
                    for (var i = 0; i < data['items']; i++) {
                        newHTML += '<h3 class="board_title">' + data['titles'][i] + '</h3>'
                            + '<p class="board_date">' + data['post_dates'][i] + '</p>'
                            + '<span class="txt_bar" id="board_bar"></span>'
                            + '<p class="board_writer">' + data['writers'][i] + '</p>'
                            + '<p class="board_content">' + data['contents'][i] + '</p>';
                    }
                    $('#board_box').html(newHTML);
                }
            });
        });

        // next 클릭
        $('#board_next').on('click', function () {
            offset += 5;
            $.ajax({
                url: './board/' + offset,
                type: 'GET',
                success: function (data) {
                    if (data['items'] == 0){
                        offset -= 5;
                        alert('마지막 페이지입니다.');
                    }
                    else{
                        var newHTML = '';
                        for (var i = 0; i < data['items']; i++) {
                            newHTML += '<h3 class="board_title">' + data['titles'][i] + '</h3>'
                                + '<p class="board_date">' + data['post_dates'][i] + '</p>'
                                + '<span class="txt_bar" id="board_bar"></span>'
                                + '<p class="board_writer">' + data['writers'][i] + '</p>'
                                + '<p class="board_content">' + data['contents'][i] + '</p>';
                        }
                        $('#board_box').html(newHTML);
                    }
                }
            });
        });
        
        // 게시하기 버튼 클릭
        $('#postBtn').on('click', function () {
            var send_title = $('#postTitle').val();
            var send_writer = decodeURIComponent($.cookie('login_info'));
            var send_content = $('#postTextArea').val();

            if (send_title.length > 20) {
                alert('제목은 20글자 이하여야 합니다.');
                return;
            }
            else if (send_title.length <= 0) {
                alert('제목이 없습니다.');
                $('#postTitle').focus();
                return;
            }

            if (!send_writer) {
                alert('너는 누구냐!!');
                return;
            }

            if (send_content.length <= 0) {
                alert('내용이 없습니다.');
                $('#postTextArea').focus();
                return;
            }

            $.ajax({
                url: './post.json',
                type: 'POST',
                data: {
                    title: send_title,
                    writer: send_writer,
                    content: send_content
                },
                success: function (data) {
                    if (data['result'] == 'successed') {
                        $('#postTitle').val('');
                        $('#postTextArea').empty();
                        alert('글을 게시했습니다.');
                        offset = 0;
                        $.ajax({
                            url: './board/' + offset,
                            type: 'GET',
                            success: function (data) {
                                var newHTML = '';
                                for (var i = 0; i < data['items']; i++) {
                                    newHTML += '<h3 class="board_title">' + data['titles'][i] + '</h3>'
                                        + '<p class="board_date">' + data['post_dates'][i] + '</p>'
                                        + '<span class="txt_bar" id="board_bar"></span>'
                                        + '<p class="board_writer">' + data['writers'][i] + '</p>'
                                        + '<p class="board_content">' + data['contents'][i] + '</p>';
                                }
                                $('#board_box').html(newHTML);
                            }
                        });

                    }
                    else {
                        alert('실패: ' + data['failType']);
                    }
                }
            });
        });
    });
    /*-----------------------------------------------------*/
    //  채팅 버튼 클릭
    $('#chattingBtn').on('click', function () {
        var child = window.open('./chatting.html', 'chatting',
                        'height=440, width=360, location=no, menubar=no, resizable=no, status=no, toolbar=no', true);
    });
    /*-----------------------------------------------------*/
    // 게임 버튼 클릭
    $('#gameBtn').on('click', function () {
        var child = window.open('./game.html', 'game',
                        'height=720, width=1280,top=22.5,left=160,  location=no, menubar=no, resizable=no, status=no, toolbar=no', true);
    });
    /*-----------------------------------------------------*/


});