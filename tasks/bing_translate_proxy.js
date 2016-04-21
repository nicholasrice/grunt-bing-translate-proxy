/*
 * grunt-bing-translate-proxy
 * https://github.com/nicholasrice/grunt-bing-translate-proxy
 *
 * Copyright (c) 2016 Nicholas Rice
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    xml2js = require('xml2js'),
    url = require('url');


module.exports = function(grunt) {
    grunt.registerMultiTask('bing_translate_proxy', 'Local proxy server to request translations from using Bing Translate API', function() {
        var done = null,
            tempStorage = ".grunt/grunt-bing-translate-proxy/",
            parser = new xml2js.Parser({
                charkey: "_"
            }),
            server = null,
            authTokenString = null,
            authTokens = null,
            options = null;

        //--------------------------------------------------------------------------
        // Define config requirements and defaults
        //--------------------------------------------------------------------------
        options = this.options();
        options.protocol = options.protocol || 'http:';
        options.hostname = options.domain || '0.0.0.0';
        options.port = options.port || 8080;
        options.auth = {
            client_id:      null,
            client_secret:  null
        };

        if (options.keepalive === true) {
            done = this.async();
        }

        // check if we're using auth_key.
        if (typeof options.auth_key !== 'undefined') {
            options.auth_location = options.auth_location || '.bing-translate-credentials';

            authTokenString = grunt.file.read(options.auth_location, {encoding: "utf-8"});
            authTokens = JSON.parse(authTokenString);

            // If we can find our client_id and client_secret, then pass them to
            // our auth object
            if (authTokens[options.auth_key]['client_id']) {
                options.auth.client_id = authTokens[options.auth_key]['client_id'];
            }

            if (authTokens[options.auth_key]['client_secret']) {
                options.auth.client_secret = authTokens[options.auth_key]['client_secret'];
            }
        }

        // If client_id or client_secret exist they should take precedence over
        // other other credentials
        if (typeof options.client_id !== 'undefined') {
            options.auth.client_id = options.client_id;
        }

        if (typeof options.client_secret !== 'undefined') {
            options.auth.client_secret = options.client_secret;
        }

        // Verify that we have valid auth tokens. If we don't we need to fail
        if (options.auth.client_id === null) {
            grunt.fail.fatal('No client_id found. Ensure you a passing a valid client_id to', this.name);
        }

        if (options.auth.client_secret === null) {
            grunt.fail.fatal('No client_secret found. Ensure you a passing a valid client_id to', this.name);
        }

        //--------------------------------------------------------------------------
        // Proxy entry function
        //--------------------------------------------------------------------------
        function handleRequest(request, response) {
            var url_parts = url.parse(request.url, true);

            function returnTranslation(translation) {
                response.writeHead(200, {
                    'Content-Length': Buffer.byteLength(translation),
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                });
                response.write(translation);
                response.end();
            }

            var options = {
                text: url_parts.query.text ? url_parts.query.text : "",
                to: url_parts.query.to ? url_parts.query.to : null,
                from: url_parts.query.from ? url_parts.query.from : null,
                method: url_parts.query.method ? url_parts.query.method : "Translate",
                callback: returnTranslation
            };


            if (options.to === null || options.from === null) {
                response.statusCode = 404;
                response.statusMessage = 'either the "to" or "from" paramater was not interpreted correctly.';
                response.write("Error: \n" + response.statusMessage);
                response.end();

                return null;
            }

            if (! validAccessToken()) {
                requestTranslateAccessToken(function() {
                    requestTranslation(options);
                });
            } else {
                requestTranslation(options);
            }
        }

        //--------------------------------------------------------------------------
        // Send requst for translation
        //--------------------------------------------------------------------------
        function requestTranslation(options) {
            var path = querystring.stringify({
                "from": encodeURIComponent(options.from),
                "text": options.text,
                "to": encodeURIComponent(options.to)
            });

            var authToken = "Bearer " + grunt.file.readJSON(tempStorage + "translate-access-token.json").access_token;

            var req_options = {
                protocol: 'http:',
                host: 'api.microsofttranslator.com',
                path: '/v2/Http.svc/' + options.method + '?' + path,
                method: 'GET',
                headers: {
                    "Authorization": authToken
                }
            };

            var request = http.request(req_options, function(res) {
                var response = '';

                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    response += chunk;
                });

                res.on('end', function() {
                    parser.parseString(response, function(err, data) {
                        if (err) {
                            return new Error(err);
                        }

                        if (data.string._ !== undefined) {
                            options.callback(data.string._);
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
                "client_id": options.auth.client_id,
                "client_secret": options.auth.client_secret,
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

        switch (options.protocol) {
            case "https:":
                server = https.createServer(handleRequest);
                break
            default:
                server = http.createServer(handleRequest);
        }


        //--------------------------------------------------------------------------
        // Start server
        //--------------------------------------------------------------------------
        server.listen({
            host: options.hostname,
            port: options.port
        }, function() {
            grunt.log.ok("Bing translate proxy started at: " + options.protocol + "//" + options.hostname + ':' + options.port);
        });

        if (! validAccessToken()) {
            requestTranslateAccessToken();
        }
    });
};
