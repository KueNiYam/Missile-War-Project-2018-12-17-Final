// JavaScript source code for login response
// loginResponse object
function loginJson(_success, _idcode) {
    if (typeof (_success) == undefined || typeof (_idcode) == undefined)
        throw new loginResponseException('Lack of parameter');
    if (arguments.length >= 3)
        throw new loginResponseException('Many of parameter');
    if (typeof (_success) != 'boolean')
        throw new loginResponseException('Invalid type of arguments[0]');

    return {
        success: _success,
        idcode: _idcode
    };
}

module.exports = function (success, idcode) {
    return loginJson(success, idcode);
};

// loginResponseException object
function loginResponseException(message) {
    this.message = message;
    this.name = 'loginResponseException';
}

loginResponseException.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
}