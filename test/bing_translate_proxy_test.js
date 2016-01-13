'use strict';

var grunt = require('grunt');
var http = require('http');
var querystring = require('querystring');

var text = 'Testing is fun!';
var from = 'en';
var to = 'de'
/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.bing_translate_proxy = {
    setUp: function(done) {

        done();
    },
    default_options: function(test) {
        test.expect(2);

        var path = querystring.stringify({
            to: to,
            from: from,
            text: text
        });

        http.get('http://localhost:8080?' + path, function(res) {
            res.setEncoding('utf8');

            test.strictEqual(res.statusCode, 200, 'Status code should be 200');

            res.on('data', function(chunk) {
                test.strictEqual(typeof chunk, 'string', 'Result should be a string');
                console.log(chunk);
                test.done();
            });
        }).on('error', function(e) {
            console.log('Got error: ' + e.message);
            test.done();
        });
    }
};
