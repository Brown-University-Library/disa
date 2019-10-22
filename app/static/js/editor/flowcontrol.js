class Control {

  constructor(){}

  setApp(obj) {
    this._app = obj;
  }

  getTemplates($elem) {
    let template_map = {};
    let $templates = $elem.find('template');
    $templates.each(function() {
      let $tmpl = $( $(this).prop('content') ).children().first();
      $tmpl.detach();
      template_map[$tmpl.attr('id')] = $tmpl;
      $tmpl.removeAttr('id');
      $(this).remove();
    });
    return template_map;
  }
}

class Config {

  constructor($elem) {
    this._$root = $elem;
    this._data = JSON.parse(
      this._$root.find('#config_data_json').attr('data-json'));
  }

  get(attr) {
    return this._data[attr];
  }
}

class Source {

  constructor($endpoints, $csrfToken) {
    this._app = {};
    this.endpoints = this.getEndpoints($endpoints);
    this._csrf = $csrfToken.attr('data-csrf');

    $.ajaxSetup({
      beforeSend: function(xhr, settings) {
        xhr.setRequestHeader("Access-Control-Allow-Origin", "http://0.0.0.0:5000");

        if (RegExp('^(POST|PUT|PATCH|DELETE)$').test(settings.type) && !this.crossDomain) {
          xhr.setRequestHeader("X-CSRFToken", this._csrf);
        }
      }
    });
  }

  setApp( app ) {
    this._app = app;
  }

  getEndpoints( $endpoints ) {
    let endpoint_map = {};

    $endpoints.find('.endpoint').each(function() {
      endpoint_map[$(this).attr('data-name')] = $(this).attr('data-url');
    });

    return endpoint_map;
  }

  request( endpoint, method, callback, payload ) {
    let settings = {
      type: method,
      dataType: "json",      
      url: endpoint,
      context: this,
      success: function( data ) {
        this._app[callback]( data );
      }
    };

    if (method === 'POST' || method === 'PUT') {
      settings.contentType = "application/json";
      settings.data = JSON.stringify(payload);
    }
    $.ajax(settings);
  }
}