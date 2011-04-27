var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

var ShortenedUrl = function (host) {
    this.host = host;
    this.db = new Db('myourls', new Server('localhost', 27017),
                     {native_parser: true});
};

ShortenedUrl.prototype.find = function (selector, callback) {
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.findAndModify(selector, [], {$inc: {clickCount: 1}}, {new: true}, function (err, doc) {
                try {
                    callback(doc);
                } finally {
                    db.close();
                }
            });
        });
    });
};

ShortenedUrl.prototype.findAll = function (selector, options, callback) {
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.count({}, function (err, count) {
                if (count !== 0) {
                    collection.find(selector, options, function (err, cursor) {
                        cursor.toArray(function (err, docs) {
                            try {
                                callback(docs, count);
                            } finally {
                                cursor.close();
                                db.close();
                            }
                        });
                    });
                } else {
                    try {
                        callback([], 0);
                    } finally {
                        db.close();
                    }
                }                
            });
        });
    });
};

ShortenedUrl.prototype.insert = function (url, callback) {
    var that = this;
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.find({originUrl: url.originUrl}, function (err, cursor) {
                cursor.nextObject(function (err, doc) {
                    if (doc == null) {
                        db.collection('nextids', function (err, collection) {
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

                                db.collection('shortenedurls', function (err, collection) {
                                    collection.insert(toBeInserted, {safe: true}, function (error, docs) {
                                        try {
                                            callback(docs[0]);
                                        } finally {
                                            db.close();
                                        }
                                    });
                                });
                            });
                        });
                    } else {
                        try {
                            callback(null);
                        } finally {
                            db.close();
                        }                        
                    }
                    cursor.close();
                });
            });
        });
    });
};

ShortenedUrl.prototype.update = function (url, callback) {
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.findAndModify({linkId: url.linkId}, [], {$set: {originUrl: url.originUrl, date: new Date()}}, {new: true}, function (err, doc) {
                try {
                    callback(doc);
                } finally {
                    db.close();
                }
            });
        });
    });
};

ShortenedUrl.prototype.remove = function (linkId, callback) {
    this.db.open(function (err, db) {
        db.collection('shortenedurls', function (err, collection) {
            collection.remove({linkId: linkId}, {safe: true}, function (err, doc) {
                try {
                    callback(linkId);
                } finally {
                    db.close();
                }
            });
        });
    });
};

module.exports.create = function (host) {
    return new ShortenedUrl(host);
};