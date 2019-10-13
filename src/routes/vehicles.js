var express = require('express');
var router = express.Router();
var dbmanager = require('../lib/dbmanager');

/*
 * PUT /vehicles
 : create vehicle
 */
router.put('/', function(req, res) {
    if(req.body === null || req.body.length === 0) {
        res.status(400);
    }
    else {
        dbmanager.createVehicle(req.body, (createCb) => {
            res.status(createCb.code).send(createCb.message);
        });
    }
});

module.exports = router;
