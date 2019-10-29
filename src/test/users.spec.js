const request = require('supertest');
const app = require('../app');
const addressPrefix = '/users';


describe('PUT /users positive test', function(){

    const userInfo = {
        phoneNumber: '+491780000000'
    };

    it('PUT /users returns 201', function (done) {
        request(app)
            .put(addressPrefix)
            .set('Accept', 'application/json')
            .send(userInfo)
            .expect(201, done);
    });
});

describe('DELETE /users positive test', function(){

    const userInfo = {
        phoneNumber: '+491780000000'
    };

    it('DELETE /users returns 204', function (done) {
        request(app)
            .delete(addressPrefix)
            .set('Accept', 'application/json')
            .send(userInfo)
            .expect(204, done);
    });
});
