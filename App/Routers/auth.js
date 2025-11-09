var express = require('express');
var router = express.Router();
var authController = require('../Controllers/auth');

router.post('/signin', authController.signin);

module.exports = router;