const basicAuth = require('basic-auth');

module.exports = function (username, password) {
    const middleware = function (req, res, next) {
        let user = basicAuth(req);
        if (!user || user.name !== username || user.pass !== password) {
            res.set('WWW-Authenticate', 'Basic realm="flash"');
            return res.status(401).send();
        }
        return next();
    };
    return middleware;
};