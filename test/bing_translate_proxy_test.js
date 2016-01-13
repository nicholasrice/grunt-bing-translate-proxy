'use strict';

var grunt = require('grunt');
var http = require('http');
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
        // setup here if necessary
        done();
    },
    default_options: function(test) {
        test.expect(1);

        http.get('http://localhost:8080', function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                test.strictEqual(typeof chunk, 'string', 'Result should be a string');
                test.done();
            });
        }).on('error', function(e) {
            console.log('Got error: ' + e.message);
            test.done();
        });
    }
};
