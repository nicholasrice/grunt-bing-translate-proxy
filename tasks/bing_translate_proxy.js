/*
 * grunt-bing-translate-proxy
 * https://github.com/nicholasrice/grunt-bing-translate-proxy
 *
 * Copyright (c) 2016 Nicholas Rice
 * Licensed under the MIT license.
 */

'use strict';

var chalk = require('chalk'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    xml2js = require('xml2js');


module.exports = function(grunt) {
    grunt.registerMultiTask('bing_translate_proxy', 'Local proxy server to request translations from using Bing Translate API', function() {
        var done = null;
        var tempStorage = ".grunt/grunt-bing-translate-proxy/";
        var parser = new xml2js.Parser();

        //--------------------------------------------------------------------------
        // Define config requirements and defaults
        //--------------------------------------------------------------------------
        var options = this.options();
        options.protocol = options.protocol || 'http:';
        options.domain = options.domain || 'localhost';
        options.port = options.port || 8080;

        if (options.keepalive === true) {
            done = this.async();
        }
        
        if (options.client_id === undefined) {
            return new Error(chalk.red("client_id is not defined"));
        }

        if (options.client_secret === undefined) {
            return new Error(chalk.red("client_secret is not defined"));
        }

        //--------------------------------------------------------------------------
        // Proxy entry function
        //--------------------------------------------------------------------------
        function handleRequest(request, response) {
            if (! validAccessToken()) {
                requestTranslateAccessToken();
            }

            var text = "Today I went to the store to buy groceries",
                from = "en",
                to = "de";

            requestTranslation(text, from, to, function(translation) {
                response.statusCode = 200; // TODO is this true?
                response.write(translation);
                response.end();
            });
        }

        function requestTranslation(text, from, to, callback) {
            // TODO make sure we have all of these arguments
            var path = querystring.stringify({
                "text": text,
                "from": encodeURIComponent(from),
                "to": encodeURIComponent(to)
            });

            var authToken = "Bearer " + grunt.file.readJSON(tempStorage + "translate-access-token.json").access_token;

            var req_options = {
                protocol: 'http:',
                host: 'api.microsofttranslator.com',
                path: "/v2/Http.svc/Translate?" + path,
                method: "GET",
                headers: {
                    "Authorization": authToken
                }
            };

            var request = http.request(req_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    parser.parseString(chunk, function(err, data) {
                        if (err) {
                            return new Error(err);
                        }

                        callback(data.string._);
                    });
                });
            });

            request.end();
        }
        //--------------------------------------------------------------------------
        // Determine if access token exists and is valid
        //--------------------------------------------------------------------------
        function validAccessToken() {
            if (grunt.file.exists(tempStorage + "translate-access-token.json")) {
                var token = grunt.file.readJSON(tempStorage + "translate-access-token.json"),
                    now = Date.now(),
                    requestDate = Date.parse(token.timestamp);

                    return now < requestDate + (token.expires_in * 1000);

            } else {
                return false;
            }
        }
        //--------------------------------------------------------------------------
        // Bing API token request function.
        //--------------------------------------------------------------------------
        function requestTranslateAccessToken(callback) {
            var post_data = querystring.stringify({
                "client_id": options.client_id,
                "client_secret": options.client_secret,
                "scope": "http://api.microsofttranslator.com",
                "grant_type": "client_credentials"
            });

            var post_options = {
                "protocol": "https:",
                "host": "datamarket.accesscontrol.windows.net",
                "path": "/v2/OAuth2-13",
                "method": "POST",
                "headers": {
                    'Content-Length': Buffer.byteLength(post_data)
                }
            };

            var timestamp = new Date();
            var post_req = https.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    var token = JSON.parse(chunk);
                    token.timestamp = timestamp;
                    grunt.file.write(
                        tempStorage + "translate-access-token.json",
                        JSON.stringify(token)
                    );

                    if (callback !== undefined) {
                        callback();
                    }
                });
            });

            post_req.write(post_data);
            post_req.end();
        }

        //--------------------------------------------------------------------------
        // Proxy Server Setup
        //--------------------------------------------------------------------------
        var PORT = options.port;
        var server = http.createServer(handleRequest);

        //--------------------------------------------------------------------------
        // Start server
        //--------------------------------------------------------------------------
        server.listen(PORT, function() {
          console.log("Server listening on: http://localhost:%s", PORT); // TODO lets make this more relevant
        });

        if (! validAccessToken()) {
            requestTranslateAccessToken();
        }
    });
};
