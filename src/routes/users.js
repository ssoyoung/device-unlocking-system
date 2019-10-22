var express = require('express');
var router = express.Router();
var dbmanager = require('../lib/dbmanager');

/*
 * PUT /users
 : create users
 */
router.put('/', function(req, res) {
    dbmanager.createUser(req.body)
        .then((createCb) => {
            res.status(createCb.code).send(createCb.message);
        })
        .catch((err) => {
            res.status(err.code).send(err.message);
        });
});

/*
 * POST /users/reset
  : reset specific user's retry field value to 0
 */
router.post('/reset', function(req, res) {
    dbmanager.resetProcess(req.body, (resetCb) => {
        res.status(resetCb.code).send(resetCb.message);
    });
});


module.exports = router;
