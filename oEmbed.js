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

;(function( $, window, document, undefined ){

  // our plugin constructor
  var oEmbed = function( element, url, options ){
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
  oEmbed.prototype = {

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
    providers:[
      {
        name: "youtube",
        type: "video",
        urlschemes: ["youtube\\.com/watch.+v=[\\w-]+&?", "youtu\\.be/[\\w-]+"],
        apiendpoint: window.location.protocol+"//www.youtube.com/oembed"
      },
      {
        name: "vimeo",
        type: "video",
        urlschemes: ["www\.vimeo\.com\/groups\/.*\/videos\/.*", "www\.vimeo\.com\/.*", "vimeo\.com\/groups\/.*\/videos\/.*", "vimeo\.com\/.*"],
        apiendpoint: window.location.protocol+"//vimeo.com/api/oembed.json"
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
      var url = provider.apiendpoint+'?format=json&url='+resourceURL

      var query = 'SELECT * FROM '
          + 'json'
          + ' WHERE url="' + (url) + '"';
      
      var ajaxopts = $.extend({
          url: "http://query.yahooapis.com/v1/public/yql",
          dataType: 'jsonp',
          data: {
              q: query,
              format: "json",
              env: 'store://datatables.org/alltableswithkeys',
              callback: "?"
          },
          success: function(data) {
            _self.config.beforeEmbed.call(container, data);
            _self.onSuccess(data.query.results.json, resourceURL, container);
            _self.config.afterEmbed.call(container, data);
          },
          error: this.config.onError.call(container, resourceURL, provider)
      }, this.config.ajaxOptions || {});

      $.ajax(ajaxopts);
    },

    // called onSuccess of ajax
    // inject the code or just return the JSON object or anything else if need
    onSuccess: function(data, resourceURL, container) {

      if (data === null) return;

      if (this.config.injectCode === true) {
        // You must replace it yourself on domReady to avoid the iframe tax
        // ...in this way the iframe content load onlly when all the rest is there
        var iframe = (data.html).replace('src', 'data-src');
        container.wrap('<div class="video-container"></div>');
        var oembedContainer = container.parent();
        oembedContainer.append(iframe);
      } else {
        // console.log(this);
        this.config.injectCode.call(container, data);
      }

    }
  }

  oEmbed.defaults = oEmbed.prototype.defaults;

  $.fn.oEmbed = function(url, options) {
    return this.each(function() {
      console.log("\nSTART "+this)
      new oEmbed(this, url, options).init();
    });
  };

  // AMD, CommonJS or Global
  // optional: window.oEmbed = oEmbed;
  
})( jQuery, window , document );


