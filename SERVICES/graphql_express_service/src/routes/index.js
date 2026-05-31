const express = require('express');
const {Router} = express;
const {dorkController, getEmail, addEmail, emailLeaks} = require('../controller/index');
const router = Router();


router.get('/dorks', dorkController);

router.get('/leak-email', getEmail);
router.post('/leak-email', addEmail);


module.exports = router;