const firebase = require('firebase-admin');

module.exports.requireSignin = function (req, res, next) {

    let authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return next(new Error('Authorization header is missing'));
    }

    let token = authHeader.substr(7);

    firebase.auth().verifyIdToken(token, true)
        .then(decodedToken => {
            console.log(decodedToken);
            req.auth = decodedToken;

            next();
        })
        .catch((error) => {
            console.log(error);
            next(error);
        });
}

module.exports.logtoken = async function (req, res, next) {
    console.log(req.headers);
    next();
}