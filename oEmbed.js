/*
 * oEmbed plugin
 * using http://developer.yahoo.com/yql/ and http://oembed.com/
 *
 * Automatically embed for you the YouTube or Vimeo iFrame
 * or simply return the JSON object with all the data
 * 
 * based on  https://github.com/starfishmod
 * refactor to match the 'Highly configurable' mutable plugin boilerplate https://github.com/jquery-boilerplate/jquery-patterns
 *
 * Author: @joemaffia
 */

;(function( window, document, undefined ){

  // Plugin constructor
  function OEmbed( element, url, options ){
    this.element = element;
    this.url = url;
    this.$element = $(element);
    this.options = options;

    // This next line takes advantage of HTML5 data attributes
    // to support customization of the plugin on a per-element
    // basis. For example,
    // <div class=item' data-plugin-options='{"message":"Hello World!"}'></div>
    this.metadata = this.$element.data( "plugin-options" );
  };

  // the plugin prototype
  OEmbed.prototype = {

    // default settings
    defaults: {
      injectCode: true,
      beforeEmbed: function() {},
      afterEmbed: function() {},
      onProviderNotFound: function() {},
      onError: function() {},
      ajaxOptions: {}
    },

    // array of providers and their config
    // make sure the apiendpoint contains the querystring start '?' or '&'
    providers:[
        {
            name: "youtube",
            type: "video",
            urlschemes: ["youtube\\.com/watch.+v=[\\w-]+&?", "youtu\\.be/[\\w-]+"],
            apiendpoint: window.location.protocol+"//www.youtube.com/oembed?scheme="+window.location.protocol.replace(':','')+"&"
        },
        {
            name: "vimeo",
            type: "video",
            urlschemes: ["www\.vimeo\.com\/groups\/.*\/videos\/.*", "www\.vimeo\.com\/.*", "vimeo\.com\/groups\/.*\/videos\/.*", "vimeo\.com\/.*"],
            apiendpoint: window.location.protocol+"//vimeo.com/api/oembed.json?"
        }
    ],

    // where everything start
    init: function() {
      // Introduce defaults that can be extended either
      // globally or using an object literal.
      this.config = $.extend({}, this.defaults, this.options, this.metadata);

      var container = this.$element,
      resourceURL =  (this.url && (!this.url.indexOf('http://') || !this.url.indexOf('https://'))) ? this.url : container.attr("data-url"),
      provider;

      if (resourceURL !== null && resourceURL !== undefined) {
        provider = this.getOEmbedProvider(resourceURL);
        if (provider !== null) {
          this.getOEmbedCode(container, resourceURL, provider);
        } else {
          this.config.onProviderNotFound.call(container, resourceURL);
        }
      }
      return this;
    },
    
    // loop through the providers urlscheme and check if there's a match
    getOEmbedProvider: function(resourceURL) {
      for (var i = 0; i < this.providers.length; i++) {
        for (var j = 0, l =this.providers[i].urlschemes.length; j < l; j++) {
          var regExp = new RegExp(this.providers[i].urlschemes[j], "i");
          if (resourceURL.match(regExp) !== null) {
            return this.providers[i];
          }
        }
      }
      return null;
    },

    // make the YQL ajax call to get the json
    getOEmbedCode: function(container, resourceURL, provider) {

      var _self = this;
      var url = provider.apiendpoint+'format=json&url='+resourceURL

      var query = 'SELECT * FROM '
          + 'json'
          + ' WHERE url="' + (url) + '"';
      
      var ajaxopts = $.extend({
          url: "//query.yahooapis.com/v1/public/yql",
          dataType: 'jsonp',
          data: {
              q: query,
              format: "json",
              env: 'store://datatables.org/alltableswithkeys',
              callback: "?"
          },
          success: function(data) {
            _self.config.beforeEmbed.call(container, data);
            _self.onSuccess(data.query.results.json, resourceURL, container, provider);
            _self.config.afterEmbed.call(container, data);
          },
          error: this.config.onError.call(container, resourceURL, provider)
      }, this.config.ajaxOptions || {});

      $.ajax(ajaxopts);
    },

    // called onSuccess of ajax
    // inject the code or just return the JSON object or anything else if need
    onSuccess: function(data, resourceURL, container, provider) {

      if ( data === null ) return;

      var html = $(data.html);
      var tag = html.prop("tagName").toLowerCase();

      if (this.config.injectCode === true) {
        if ( tag == "iframe" ) {
          // You must replace it yourself on domReady to avoid the iframe tax
          // ...in this way the iframe content load only when all the rest is there
          var src = html.attr('src');

          if ( provider.name == "youtube" ) {
            var uri = src.split('?');

            if ( uri[1] == null ) {
                uri[1] = '';
            }
            
            // since the youtube video always rectangle, make sure it is opaque to avoid rendering flaws
            uri[1] += '&wmode=opaque';

            src = uri.join('?');
          }

          html
            .attr('data-src', src)
            .removeAttr('src');
        }
      } 
      else if (typeof this.config.injectCode ==  "function") {
        // call custom inject function
        this.config.injectCode.call(container, data);
        return;
      }

      container.wrap('<div class="video-container"></div>');
      var oembedContainer = container.parent();
      oembedContainer.append(html);
    }
  }

  OEmbed.defaults = OEmbed.prototype.defaults;

  // Binding function
  // this function binds the plugin to the specified jquery object
  function bind( $ ) {
    $.fn.oEmbed = function(url, options) {
      return this.each(function() {
        new OEmbed(this, url, options).init();
      });
    };
  }

  OEmbed.bind = bind;

  // binding to global jquery and expose binding method as amd module
  if ( window.define && window.define.amd == true ){
    define(function(){
      return OEmbed;
    });
  }

  if ( window.jQuery ) {
    OEmbed.bind( window.jQuery );
  }

})(window, document);