const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

const loginLimiter = require('../middleware/rate-limit');

router.post('/signup', userCtrl.signup);
router.post('/login', loginLimiter, userCtrl.login);

module.exports = router;