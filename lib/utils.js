const basicAuth = require('basic-auth');

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

const authMiddleware = function (username, password) {
    return function (req, res, next) {
        let user = basicAuth(req);
        // noinspection JSUnresolvedVariable
        if (!user || user.name !== username || user.pass !== password) {
            res.set('WWW-Authenticate', 'Basic realm="flash"');
            return res.status(401).send();
        }
        return next();
    };
};

module.exports = {
    asyncMiddleware: asyncMiddleware,
    authMiddleware: authMiddleware
};