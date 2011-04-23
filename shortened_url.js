var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

var ShortenedUrl = function () {
    this.db = new Db('myourls', new Server('localhost', 27017),
                     {native_parser: true});
};

ShortenedUrl.prototype.find = function (conditions, callback) {
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.find(conditions, function (err, cursor) {
                cursor.nextObject(function (err, doc) {
                    try {
                        callback(doc);
                    } finally {
                        db.close();
                    }
                });
            });
        });
    });
};

module.exports = new ShortenedUrl();