
/**
 * Module dependencies.
 */

var express = require('express');
var s = require('./shortened_url');

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

// Routes

app.get(/^\/(index)?$/, function (req, res) {
    console.log('end');
    res.render('index', {
        title: 'Express'
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

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
