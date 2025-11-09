let UserModel = require('../Models/user');
require('dotenv').config()
let jwt = require('jsonwebtoken');
let { expressjwt } = require('express-jwt');

module.exports.signin = async function(req, res, next) {
    try {
        console.log(req.body);
        let user = await UserModel.findOne({"email": req.body.email});
        if(!user)
            throw new Error('User not found.');
        if(!user.authenticate(req.body.password))
            throw new Error("Password don't match.");

        let payload = {
            id: user._id,
            username: user.username
        }

        let token = jwt.sign(payload, process.env.SecretKey, {
            algorithm: 'HS512',
            expiresIn: "20min"//Expiration time of the token
        })

        res.json(
            {
                success: true,
                message: "Authentication successful",
                token: token
            }
        );

    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.logtoken = async function (req, res, next) {
    console.log(req.headers);
    next();
}

module.exports.requireSignin = expressjwt(
    {
        secret: process.env.SECRETKEY,
        algorithms: ['HS512'],
        userProperty: 'auth' 
    }
);