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

function _extractParameters(originalRoute, currentRoute) {
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

function _routeWithInstance(routerInstance) {
    var chosenHandlerName= null;
    var originalRoute = null;
    for (var i in routerInstance.routesRegex) {
        if (routerInstance.routesRegex[i].test(routerInstance.currentHash) == true) {
            chosenHandlerName = routerInstance.handlerName[i];
            originalRoute = routerInstance.originalRoutes[i];
            break;
        }
    }
    if (chosenHandlerName != null) {
        var handler = routerInstance.handlers[chosenHandlerName];
        var params = _extractParameters(originalRoute, routerInstance.currentHash);
        handler(params);
    }
}

var Router = Compass.Router = function(routes) {
    this.currentHash = window.location.hash.substring(1);
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
        var rb = new RouterBack();
        rb.checkUrl(this);
    }
}

var RouterBack = function() {
    this.checkUrl = function(appRouterInstance) {
        window.setInterval(function() {
            if (appRouterInstance.currentHash != window.location.hash.substring(1)) {
                appRouterInstance.currentHash = window.location.hash.substring(1);
                _routeWithInstance(appRouterInstance);
            }
        }, 100);
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