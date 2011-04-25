/**
 * Configuration
 */

var host = 'http://localhost:3000/';

/**
 * Module dependencies.
 */

var express = require('express');
var s = require('./shortened_url').create(host);
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
    s.findAll({}, {}, function (urls) {
        res.render('index', {
            from: 0,
            to: 10,
            total: 100,
            links: 100,
            clicks: 1000,
            totalPages: 10,
            urls: urls
        });
    });
});

app.get('/:id', function (req, res, next) {
    var id = req.params.id;
    s.find({linkId: id}, function (url) {
        var to;

        if (url != null) {
            to = url.originUrl;
        } else {
            to = '/index';
        }

        res.redirect(to);
    });
});

app.get('/api/add', function (req, res) {
    var url = {
        originUrl: req.query.url,
        ip: req.header('Host')
    };
    s.insert(url, function (url) {
        res.send({
            status: 'success', 
            message: 'URL added successfully',
            url: {
                linkId: url.linkId,
                originUrl: url.originUrl,
                shortUrl: url.shortUrl,
                date: url.date.toString(),
                ip: url.ip,
                clickCount: url.clickCount
            }
        });
    });
});

app.get('/api/update', function (req, res) {
    var url = {
        linkId: req.query.linkId,
        originUrl: req.query.newUrl
    };
    s.update(url, function (url) {
        res.send({
            status: 'success',
            message: 'URL updated successfully',
            url: {
                linkId: url.linkId,
                originUrl: url.originUrl,
                shortUrl: url.shortUrl,
                date: url.date.toString(),
                ip: url.ip,
                clickCount: url.clickCount
            }
        });
    });
});

app.get('/api/remove', function (req, res) {
    s.remove(req.query.linkId, function (linkId) {
        res.send({
            status: 'success',
            message: 'URL deleted successfully',
            url: {
                linkId: linkId
            }
        });
    });
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
