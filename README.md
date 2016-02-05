# grunt-bing-translate-proxy

> Local proxy server to request translations from using Bing Translate API

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-bing-translate-proxy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-bing-translate-proxy');
```

## The "bing_translate_proxy" task

### Overview
In your project's Gruntfile, add a section named `bing_translate_proxy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  bing_translate_proxy: {
    options: {
        client_id: [your_client_id],
        client_secret: [your_client_secret]
      // Task-specific options go here.
    }
  },
});
```

Once the server is running, you can retrieve translations of strings with a `GET` request pointed at your server hostname and port. Eg:
`http://0.0.0.0:8080?text=Hello%20World&to=de&from=en&method=Translate`.

#### text __Required__
The Text to be translated.

#### to  __Required__
The language that the text is being translated to.

#### from  __Required__
The language that the text is being translated from.

#### method
The Bing Translate API method to use. Currently only `'Translate'` and `'TranslateArray'` methods. Please see [https://msdn.microsoft.com/en-us/library/ff512422.aspx](https://msdn.microsoft.com/en-us/library/ff512422.aspx) for more information on these methods.

### Options
#### options.client_id
Type: `string` __Required__  
Default Value: __N/A__  

This is the `client id` provided to you by the Bing API service. See [https://www.microsoft.com/en-us/translator/getstarted.aspx](https://www.microsoft.com/en-us/translator/getstarted.aspx) for details on how to get this.

#### options.client_secret
Type: `string` __Required__  
Default Value: __N/A__  

This is the `client secret` provided to you by the Bing API service. See [https://www.microsoft.com/en-us/translator/getstarted.aspx](https://www.microsoft.com/en-us/translator/getstarted.aspx) for details on how to get this.

#### options.port
Type: `integer`  
Default Value: `8080`  

The port that the server can be reached at. This task will fail if the port is already in use.

#### options.protocol
Type: `String`  
Default value: `'http'`  

Supports `'http'`, `'https'` protocols.

#### options.hostname
Type: `String`  
Default value: `'0.0.0.0'`  

The hostname that the server can be reached at.

#### options.keepalive
Type: `Boolean`  
Default value: `false`  

Keep the server alive until canceled.

### Usage Examples

#### Default Options
In this example, `grunt bing_translate_proxy` will start a static web server at `http://0.0.0.0:8080`.

```js
grunt.initConfig({
  bing_translate_proxy: {
    options: {
      client_id: 'your_client_id',
      client_secret: 'your_client_id'
    }
  },
  ...
});
```

#### Custom Options
In this example, `grunt bing_translate_proxy` will start a static web server at `http://localhost:9001`.

```js
grunt.initConfig({
  bing_translate_proxy: {
    options: {
      client_id: 'your_client_id',
      client_secret: 'your_client_id',
      protocol: 9001,
      hostname: 'localhost'
    }
  },
  ...
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
