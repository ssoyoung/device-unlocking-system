config = {
    "_id" : "rs0",
    "members":[
        {"_id":0, "host":"mongo0:27017"},
        {"_id":1, "host":"mongo1:27017"},
        {"_id":2, "host":"mongo2:27017"}]
}

rs.initiate(config);