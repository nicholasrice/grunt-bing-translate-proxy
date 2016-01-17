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
    xml2js = require('xml2js'),
    url = require('url');


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
            var url_parts = url.parse(request.url, true);
            var text = url_parts.query.text ? url_parts.query.text : "";
            var to = url_parts.query.to ? url_parts.query.to : null;
            var from = url_parts.query.from ? url_parts.query.from : null;

            function returnTranslation(translation) {
                response.writeHead(200, {
                    'Content-Length': Buffer.byteLength(translation),
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                });
                response.write(translation);
                response.end();
            }

            if (to === null || from === null) {
                console.log("to or from is null");
                response.statusCode = 404;
                response.statusMessage = 'either the "to" or "from" paramater was not interpreted correctly.';
                response.write("Error: \n" + response.statusMessage);
                response.end();

                return null;
            }

            if (text === "") {
                response.writeHead(200, {
                  'Content-Length': text.length,
                  'Content-Type': 'text/plain' });
                response.write(text);
                response.end();

                return text;
            }

            if (! validAccessToken()) {
                requestTranslateAccessToken(function() {
                    requestTranslation(text, from, to, returnTranslation);
                });
            } else {
                requestTranslation(text, from, to, returnTranslation);
            }

            return text;
        }

        function requestTranslation(text, from, to, callback) {
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

                        if (data.string._ !== undefined) {
                            callback(data.string._);
                        } else {
                            return new Error(data);
                        }
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
        var server = http.createServer(handleRequest);

        //--------------------------------------------------------------------------
        // Start server
        //--------------------------------------------------------------------------
        server.listen(options.port, function() {
          console.log(chalk.green("Bing translate proxy started at: " + options.protocol + "//" + options.domain + ':' + options.port)); // TODO lets make this more relevant
        });

        if (! validAccessToken()) {
            requestTranslateAccessToken();
        }
    });
};
