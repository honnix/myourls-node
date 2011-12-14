var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

var ShortenedUrl = function (host) {
    this.host = host;
    this.db = new Db('myourls', new Server('localhost', 27017, {auto_reconnect: true, poolSize: 10}),
                     {native_parser: true});
    this.db.open(function (err, db) {});
};

ShortenedUrl.prototype.find = function (selector, callback) {
    this.db.collection('shortenedurls', function (err, collection) {
        collection.findAndModify(selector, [], {$inc: {clickCount: 1}}, {new: true}, function (err, doc) {
            callback(doc);
        });
    });
};

ShortenedUrl.prototype.findAll = function (selector, options, callback) {
    this.db.collection('shortenedurls', function (err, collection) {
        collection.count({}, function (err, count) {
            if (count !== 0) {
                collection.find(selector, options, function (err, cursor) {
                    cursor.toArray(function (err, docs) {
                        try {
                            callback(docs, count);
                        } finally {
                            cursor.close();
                        }
                    });
                });
            } else {
                callback([], 0);
            }                
        });
    });
};

ShortenedUrl.prototype.insert = function (url, callback) {
    var that = this;
    this.db.collection('shortenedurls', function (err, collection) {
        collection.find({originUrl: url.originUrl}, function (err, cursor) {
            cursor.nextObject(function (err, doc) {
                if (doc == null) {
                    this.db.collection('nextids', function (err, collection) {
                        collection.findAndModify({_id: 'seq'}, [], {$inc: {next: 1}}, {upsert: true, new: true}, function (err, doc) {
                            var linkId = doc.next.toString(16);
                            var toBeInserted = {
                                linkId: linkId,
                                originUrl: url.originUrl,
                                shortUrl: that.host + linkId,
                                date: new Date,
                                ip: url.ip,
                                clickCount: 0
                            };

                            this.db.collection('shortenedurls', function (err, collection) {
                                collection.insert(toBeInserted, {safe: true}, function (error, docs) {
                                    callback(docs[0]);
                                });
                            });
                        });
                    });
                } else {
                    callback(null);
                }
                cursor.close();
            });
        });
    });
};

ShortenedUrl.prototype.update = function (url, callback) {
    this.db.collection('shortenedurls', function (err, collection) {
        collection.findAndModify({linkId: url.linkId}, [], {$set: {originUrl: url.originUrl, date: new Date()}}, {new: true}, function (err, doc) {
            callback(doc);
        });
    });
};

ShortenedUrl.prototype.remove = function (linkId, callback) {
    this.db.collection('shortenedurls', function (err, collection) {
        collection.remove({linkId: linkId}, {safe: true}, function (err, doc) {
            callback(linkId);
        });
    });
};

module.exports.create = function (host) {
    return new ShortenedUrl(host);
};
