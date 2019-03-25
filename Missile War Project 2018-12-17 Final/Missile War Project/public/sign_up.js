// JavaScript source code
$(document).ready(function () {
    // 이미 로그인되어 있는지 확인
    setInterval(function () {
        if ($.cookie('login_info')) {
            $('html').html('');
            alert('이미 로그인되어있습니다.');
            window.close();
        }
    }, 1000);

    // 버튼에 마우스 올려도 색 변하게
    $('#signUpBtn').hover(function () {
        $('#signUpBtn a').css('color', 'red');
    }, function () {
        $('#signUpBtn a').css('color', 'white');
    });

    // 로그인 버튼 클릭
    $('#signUpBtn').on('click', function () {
        var userId = $('#userId').val();
        var userPw = $('#userPw').val()
        var idValidity = isValidId(userId);
        var pwValidity = isValidPw(userPw)
        if (idValidity == false) {
            alert('아이디를 확인해주세요.\n아이디는 숫자와 영문만 가능합니다.');
            $('#userId').focus();
        }
        else if (pwValidity == false) {
            alert('비밀번호는 5글자 이상이어야 합니다.');
            $('#userPw').focus();
        }
        else if (userPw != $('#userPw_chk').val()) {
            alert('비밀번호를 다시 확인해주세요.');
            $('#userPw_chk').focus();
        }
        else { //< 유효성 검사 통과
            $.ajax({
                url: './sign_up.json',
                type: 'POST',
                data: {
                    'userId': userId,
                    'userPw': userPw
                },
                success: function (result) {
                    if (result['success'] == false) {
                        alert('이미 있는 아이디입니다.');
                    }
                    else {
                        alert('회원가입이 완료되었습니다.');
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


