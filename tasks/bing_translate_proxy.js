/*
 * grunt-bing-translate-proxy
 * https://github.com/nicholasrice/grunt-bing-translate-proxy
 *
 * Copyright (c) 2016 Nicholas Rice
 * Licensed under the MIT license.
 */

'use strict';

var chalk = require('chalk');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('bing_translate_proxy', 'Local proxy server to request translations from using Bing Translate API', function() {

    var options = this.options();
    options.protocol = options.protocol || 'http:';
    options.domain = options.domain || 'localhost';
    options.port = options.port || 8080;

    if (options.client_id === undefined) {
      return new Error(chalk.red("client_id is not defined"));
    }

    if (options.client_secret === undefined) {
      return new Error(chalk.red("client_secret is not defined"));
    }

    
  });
};
