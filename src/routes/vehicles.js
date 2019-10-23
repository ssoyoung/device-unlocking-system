var express = require('express');
var router = express.Router();
var dbmanager = require('../lib/dbmanager');

/*
 * PUT /vehicles
 : create vehicle
 */
router.put('/', function(req, res) {
    if(typeof req === 'undefined' || req === null || req.body === null || req.body.length === 0) {
        res.status(400);
    }
    else {
        dbmanager.createVehicle(req.body)
            .then((createCb) => {
                res.status(createCb.code).send(createCb.message);
            }).catch((err) => {
                res.status(err.code).send(err.message);
            });
    }
});

module.exports = router;
