var Compass = function() {};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

function _routeToRegExp(route) {
     route = route.replace(escapeRegExp, '\\$&')
                  .replace(optionalParam, '(?:$1)?')
                  .replace(namedParam, function(match, optional){
                    return optional ? match : '([^\/]+)';
                  })
                  .replace(splatParam, '(.*?)');
     return new RegExp('^' + route + '$');
}

var Router = Compass.Router = function(routes) {
    this.originalRoutes = [];
    this.handlerName = [];
    this.handlers = routes.handlers;
    this.routesRegex = [];
    for (var key in routes.routes) {
        this.handlerName.push(routes.routes[key]);
        this.originalRoutes.push(key);
        var regex = _routeToRegExp(key);
        this.routesRegex.push(regex);
    }
    this.start = function() {
        var appRouterInstance = this;
        $(window).on("hashchange", function() {
            appRouterInstance._route();
        })
    },
    this._route = function () {
        var chosenHandlerName= null;
        var originalRoute = null;
        for (var i in this.routesRegex) {
            if (this.routesRegex[i].test(window.location.hash.substring(1)) == true) {
                chosenHandlerName = this.handlerName[i];
                originalRoute = this.originalRoutes[i];
                break;
            }
        }
        if (chosenHandlerName != null) {
            var handler = this.handlers[chosenHandlerName];
            var params = this._extractParameters(originalRoute, window.location.hash.substring(1));
            handler(params);
        }
    },
    this._extractParameters = function (originalRoute, currentRoute) {
        // a simplistic way to split url and extract params
        // whatever starts with ":" is treated as a param
        var originalTokens = originalRoute.split("/");
        var currentTokens = currentRoute.split("/");
        var params = {};
        for (var i in originalTokens) {
            if (originalTokens[i][0] == ":") {
                params[originalTokens[i].substring(1)] = currentTokens[i];
            }
        }
        return params;
    }
}

var View = Compass.View = function(template) {
    this.model = null;
    this.template = template;
    this.bindModel = function(model) {
        this.model = model;
    },
    this.render = function() {
        var template = _.template(this.template.html(), {model: this.model});
        return template;
    }
}

var Collection = Compass.Collection = function(model) {
    this.model = function(){};
    this.model.prototype = model.prototype;
    this.list = [];
    this.get = function(params) {
        var customUrl = params.customUrl;
        var additionalParams = params.additionalParams;
        var callback = params.success;
        var useUrl = this.model.url;
        if (typeof customUrl != "undefined") {
            useUrl = customUrl;
        }
        $.ajax({
            url: useUrl,
            type: 'get', 
            data: additionalParams,
            context: this,
            error: function(jqxhr, textStatus, error) {
                console.log("error: "+error);
            },
            success: function(data, textStatus, jqxhr) {
                for (var i in data) {
                    var datum = data[i];
                    var model = new this.model;
                    model.obj = datum;
                    this.list.push(model);
                }
                callback(this.list);
            }
        });
    };
}

var Model = Compass.Model = function(url) {
    this.url = url;
    this.obj = {};
    this.get = function(params) {
        var id = params.id;
        var callback = params.success;
        $.ajax({
            url: this.url+"/"+id,
            type: 'get',
            context: this,
            error: function(jqxhr, textStatus, error) {
                console.log("error: "+error);
            },
            success: function(data, textStatus, jqxhr) {
                this.obj = data;
                callback(data);
            }
        });                        
    };
    this.save = function(params) {
        var customUrl = params.customUrl;
        var callback = params.success;
        var useUrl = this.url;
        if (typeof customUrl != "undefined") {
            useUrl = customUrl;
        }
        // allow user to post with files with FormData
        // if formData attribute is set and is of the FormData type,
        // we will use it to post to the server
        // else we use normal key-value pairs to post
        if (this.obj.formData instanceof FormData) {
            $.ajax({
                type: 'post',
                url: useUrl,
                context: this,
                data: this.obj.formData,
                contentType: false,
                processData: false,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = data;
                    this.obj.formData = null;
                    callback(data);
                }
            });
        } else {
            $.ajax({
                type: 'post',
                async: false,
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = data;
                    callback(data);
                }
            });
            
        }
    };
    this.sync = function(params) {
        var customUrl = params.customUrl;
        var endpointId = params.id;        
        var callback = params.success;
        var useUrl = this.url;
        if (typeof customUrl != "undefined") {
            useUrl = customUrl;
        }
        if (typeof endpointId != 'undefined') {
            useUrl = useUrl+"/"+endpointId;
        } else {
            useUrl = useUrl+"/"+this.obj.id;
        }
        // allow user to post with files with FormData
        // if formData attribute is set and is of the FormData type,
        // we will use it to post to the server
        // else we use normal key-value pairs to post
        if (this.obj.formData instanceof FormData) {
            $.ajax({
                type: 'put',
                url: useUrl,
                context: this,
                data: this.obj.formData,
                contentType: false,
                processData: false,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj.formData = null;
                    callback(data);
                }
            });
        } else {
            $.ajax({
                type: 'put',
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    callback(data);
                }
            });
        }
    };
    this.destroy = function(params) {
        var customUrl = params.customUrl;
        var endpointId = params.id;        
        var callback = params.success;
        var useUrl = this.url;
        if (typeof customUrl != "undefined") {
            useUrl = customUrl;
        }
        if (typeof endpointId != 'undefined') {
            useUrl = useUrl+"/"+endpointId;
        } else {
            useUrl = useUrl+"/"+this.obj.id;
        }
        if (typeof this.obj.id == "undefined" ) {
            this.obj = {};
        } else {
            $.ajax({
                type: 'delete',
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = {};
                    callback(data);
                }
            });
        }
    };
};