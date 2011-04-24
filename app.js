
/**
 * Module dependencies.
 */

var express = require('express');
var s = require('./shortened_url');
var _ = require('underscore');

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'your secret here' }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function () {
    app.use(express.errorHandler()); 
});

app.set('view options', {
    layout: false
});

// Routes

app.get(/^\/(index)?$/, function (req, res) {
    s.findAll({}, {}, function (docs) {
        res.render('index', {
            from: 0,
            to: 10,
            total: 100,
            links: 100,
            clicks: 1000,
            totalPages: 10,
            urls: docs
        });
    });
});

app.get('/:id', function (req, res, next) {
    var id = req.params.id;
    s.find({linkId: id}, function (doc) {
        var to;

        if (doc != null) {
            to = doc.originUrl;
        } else {
            to = '/index';
        }

        res.redirect(to);
    });
});

app.get('/api/add', function (req, res) {
    var originUrl = req.param.url;
    res.send({status: 'success', html: 'ok'});
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
