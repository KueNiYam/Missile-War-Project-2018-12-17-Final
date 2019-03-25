// JavaScript source code for login
$(document).ready(function () {
    // 이미 로그인되어 있는지 확인
    setInterval(function () {
        if ($.cookie('login_info')) {
            $('html').html('');
            alert('이미 로그인되어있습니다.');
            window.close();
        }
    }, 1000);

    // 버튼 클릭 및 마우스 over
    $('#loginBtn').hover(function () {
        $('#loginBtn a').css('color', 'red');
    }, function () {
        $('#loginBtn a').css('color', 'white');
    });
    $('#signUpBtn').hover(function () {
        $('#signUpBtn a').css('color', 'red');
    }, function () {
        $('#signUpBtn a').css('color', 'white');
    });
    $('#signUpBtn').on('click', function () {
        window.location.href = './sign_up.html';
    });

    // 카카오톡 로그인 연동
    Kakao.init('42470b02a188ed6fc75a1fc93063c8f7');
    Kakao.Auth.createLoginButton({
        container: '#kakao-login-btn',
        success: function (authObj) {
            Kakao.API.request({
                url: '/v2/user/me',
                success: function (response) {
                    setLoginCookie(encodeURIComponent(response.properties['nickname']));
                    window.close();
                },
                fail: function (error) {
                    alert(JSON.stringify(error));
                }
            });
        },
        fail: function(error){
            alert(JSON.stringify(error));
        }
    });

    // 로그인 버튼 클릭
    $('#loginBtn').on('click', function () {
        var idValidity = isValidId($('#userId').val());
        var pwValidity = isValidPw($('#userPw').val())
        if (idValidity == false) {
            alert('아이디를 확인해주세요.\n아이디는 숫자와 영문만 가능합니다.');
            $('#userId').focus();
        }
        else if (pwValidity == false) {
            alert('비밀번호는 5글자 이상이어야 합니다.');
            $('#userPw').focus();
        }
        else { //< 유효성 검사 통과
            $.ajax({
                url: './login.json',
                type: 'POST',
                data: $('#loginform').serializeArray(),
                success: function (result) {
                    if (result['success'] == false) {
                        if (result['idcode'] == 'password')
                            alert('비밀번호를 다시 확인해주세요.');
                        else if (result['idcode'] == 'id')
                            alert('아이디를 다시 확인해주세요.');
                    }
                    else {
                        setLoginCookie(result['idcode']);
                        window.close();
                    }
                }
            });
        }
    });
});

//! @Return
//! valid -> true, invalid -> false
function isValidId(value) {
    var validRegx = /[^a-zA-Z0-9]/g;
    var isValid = true;
    if (validRegx.test(value)) //< 특수문자가 있으면
        isValid = false;
    if (value == '')
        isValid = false;
    return isValid;
}

function isValidPw(value) {
    if (value.length < 5)
        return false;
    else
        return true;
}

// 로그인 쿠키 함수
function setLoginCookie(value) {
    var name = 'login_info'
    $.cookie(name, value);
}


