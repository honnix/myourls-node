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
    var page = req.query.page || 1;
    var perpage = req.query.perpage || 10;
    var offset = (page - 1) * perpage;
    var search = req.query.search || '';
    var searchIn = req.query['search-in'] || 'originUrl';
    var sortBy = req.query['sort-by'] || 'linkId';
    var sortOrder = req.query['sort-order'] || 'desc';
    var clickFilter = req.query['click-filter'] || 'gte';
    var clickLimit = req.query['click-limit'] || '';

    var options = {skip: offset, limit: perpage, sort: [[sortBy, sortOrder]]};
    var selector = {};
    var clickSelector = {};

    if (clickLimit !== '') {
        clickSelector['$' + clickFilter] = parseInt(clickLimit);
        selector.clickCount = clickSelector;
    }

    if (search !== '') {
        selector['$where'] = 'this.' + searchIn + '.indexOf("' + search + '") !== -1';
    }

    s.findAll(selector, options, function (urls, count) {
        var totalItems = _(urls).foldl(function (x, y) {
            return x + y.clickCount;
        }, 0);

        var from = 0;
        var to = 0;

        if (offset + 1 > totalItems) from = totalItems; else from = offset + 1;
        if (offset + perpage > totalItems) to = totalItems; else to = offset + perpage;

        res.render('index', {
            search: search,
            searchIn: searchIn,
            sortBy: sortBy,
            sortOrder: sortOrder,
            perpage: perpage,
            clickFilter: clickFilter,
            clickLimit: clickLimit,
            from: from,
            to: to,
            total: urls.length,
            links: count,
            clicks: totalItems,
            totalPages: Math.ceil(count / perpage),
            page: page,
            nav: '/?search=' + search + '&sort-by=' + sortBy + '&sort-order=' + sortOrder +
              '&search-in=' + searchIn + '&click-filter=' + clickFilter + '&click-limit=' + clickLimit +
              '&perpage=' + perpage + '&page=',
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
            to = 'home';
        }

        res.redirect(to);
    });
});

app.get('/api/add', function (req, res) {
    var url = {
        originUrl: req.query.url,
        ip: req.connection.remoteAddress
    };
    s.insert(url, function (url) {
        if (url != null) {
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
        } else {
            res.send({
                status: 'fail',
                message: 'URL already exists'
            });
        }
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
    var cluster = require('cluster');
    if (cluster.isMaster) {
        // Fork workers.
        var numCPUs = require('os').cpus().length;
        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('death', function(worker) {
            console.log('worker ' + worker.pid + ' died');
        });
    } else {
        // Worker processes have a http server.
        app.listen(3000);
    }
}
