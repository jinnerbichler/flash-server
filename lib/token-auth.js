const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const nameGenerator = require('project-name-generator');
const ApiToken = require("./model/api-token");
const config = require("./config");

const jwtOptions = {
    jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET
};

function createToken(name) {
    return ApiToken.exists({name: name})
        .then((tokenExists) => {
            if (tokenExists === false) {
                // create new token
                const token = jwt.sign({name: name}, jwtOptions.secretOrKey);
                return ApiToken.Model.create({
                    name: name,
                    token: token
                })
            }
        })
}

function init() {

    // create default token
    if (config.DEFAULT_TOKEN_NAME != null)
        createToken(config.DEFAULT_TOKEN_NAME);

    // create strategy for validating tokens
    const strategy = new passportJWT.Strategy(jwtOptions, function (jwt_payload, next) {
        console.log('payload received', jwt_payload);
        ApiToken.exists({name: jwt_payload.name})
            .then((tokenExists) => {
                if (tokenExists)
                    next(null, jwt_payload);
                else
                    next(null, false);

            })
            .catch((err) => {
                console.log(err);
                next(null, false);
            })
    });

    passport.use(strategy);

    return passport;
}

function tokenRequestHandler(req, res, next) {
    const tokenName = req.body.name || nameGenerator().dashed;
    createToken(tokenName)
        .then((tokenObj) => {
            if (tokenObj == null)
                res.status(409).send(`Token with name ${tokenName} already exists`);
            else
                res.json({
                    name: tokenName,
                    token: tokenObj.token
                });
        })
        .catch((error) => {
            next(error)
        });
}

middleware = passport.authenticate('jwt', {session: false});

module.exports = {
    init: init,
    middleware: middleware,
    createToken: createToken,
    tokenRequestHandler: tokenRequestHandler
};
