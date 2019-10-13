var express = require('express');
var router = express.Router();
var dbmanager = require('../lib/dbmanager');

/*
 * PUT /users
 : create users
 */
router.put('/', function(req, res) {
    dbmanager.createUser(req.body, (createCb) => {
        res.status(createCb.code).send(createCb.message);
    });
});

module.exports = router;
