(function() {

    var Compass = this.Compass = {};

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    function _routeToRegExp(route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^\/]+)';
            })
            .replace(splatParam, '(.*?)');
        return new RegExp('^' + route + '$');
    }

    var Router = Compass.Router = function(routes) {
        // this.originalRoutes = [];
        // this.handlerName = [];
        // this.handlers = routes.handlers;
        // this.routesRegex = [];
        this.routes = routes;
        
        // this.start = function() {
            // var appRouterInstance = this;
            // $(window).on("hashchange", function() {
            //     appRouterInstance._route();
            // })
        // },
        this._route = function() {
            // var chosenHandlerName = null;
            // var originalRoute = null;
            // for (var i in this.routesRegex) {
            //     if (this.routesRegex[i].test(window.location.hash.substring(1)) == true) {
            //         chosenHandlerName = this.handlerName[i];
            //         originalRoute = this.originalRoutes[i];
            //         break;
            //     }
            // }
            // if (chosenHandlerName != null) {
            //     var handler = this.handlers[chosenHandlerName];
            //     var params = this._extractParameters(originalRoute, window.location.hash.substring(1));
            //     handler(params);
            // }

            var router = this;
            var key;

            for (key in routes.routes) {
                Compass.History.route(key, _routeToRegExp(key), function(originalRoute){
                    var params = router._extractParameters(originalRoute, Compass.History.getHash());
                    var handlerName = router.routes.routes[originalRoute];
                    router.routes.handlers[handlerName](params);
                });
                // this.handlerName.push(routes.routes[key]);
                // this.originalRoutes.push(key);
                // var regex = _routeToRegExp(key);
                // this.routesRegex.push(regex);
            }
        },
        this._extractParameters = function(originalRoute, currentRoute) {
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

    var Histoy = Compass.History = {
        routeHandlers: [],
        started: false,

        start: function(){
            if(this.started) console.log("History has been started!");
            else $(window).on("hashchange", this.loadUrl);
        },

        route: function(originalRoute, routeRegex, handler){
            this.routeHandlers.unshift({originalRoute: originalRoute, routeRegex: routeRegex, handler:handler});
        },

        getHash: function(){
            var urlRegex = window.location.href.match(/#(.*)$/);
            if(urlRegex) return urlRegex[1];
            else return "";
        },

        checkUrl: function(url, urlRegex){
            return urlRegex.test(url);
        },

        loadUrl: function(){
            var i;
            var self = Compass.History;
            var currentUrl = self.getHash();

            for(i = 0; i < self.routeHandlers.length; i++){
                if(self.checkUrl(currentUrl,self.routeHandlers[i]["routeRegex"])){
                    Compass.History.routeHandlers[i]["handler"]
                        (Compass.History.routeHandlers[i]["originalRoute"]);
                }

                // console.log(currentUrl);
                // console.log(Compass.History.routeHandlers[i]["routeRegex"]);
            }
        },

        stop: function(){
            $(window).off("hashchange", this.loadUrl);
            this.started = false;
        },
    }

    var Events = Compass.Events = {
        bind: function(params, callback) {
            var eventName = params.eventName;
            var event = {
                callback: callback
            };
            if (typeof this._events == "undefined") {
                this._events = {};
            }
            if (typeof this._events[eventName] == "undefined") {
                this._events[eventName] = [];
            }
            var events = this._events[eventName];
            events.push(event);
            return this; // returning this to facilitate chaining
        },

        //name of event to trigger
        trigger: function(params) {
            if (!this._events) return this;
            var events = this._events[params.eventName];
            //trigger events
            var i;
            for (i = 0; i < events.length; i++) {
                events[i].callback();
            }
            return this;
        }
    }

    var View = Compass.View = function(params) {
        this.model = null;
		this.element = null;
        this.template = params.template;
		
        this.prototype = this.Events;

        this.bindModel = function(model) {
            this.model = model;
        };
		
		this.bindElement = function(element) {
            this.element = element;
        };
		
        this.render = function() {
            var template = _.template(this.template.html(), {
                model: this.model
            });
			$(this.element).append(template);
            return template;
        };

        this.delegateEvents = function() {
            var delegateEventSplitter = /^(\S+)\s*(.*)$/;
            if (params.events) {
                var events = params.events;
                console.log(events);
                for (var key in events) {
                    var method = events[key];
                    if (!_.isFunction(method)) method = this[events[key]];
                    if (!method) continue;
                    var match = key.match(delegateEventSplitter);
                    var eventName = match[1],
                        selector = match[2];
                    $(selector).on(eventName, method);
                }
            }
        }
    };

    var Collection = Compass.Collection = function(model) {
        this.model = function() {};
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
                    console.log("error: " + error);
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
			var doIfSuccess;
			var doIfError;
			if (params.success==null) {
				doIfSuccess = function(message){
					console.log("MODEL GET SUCCESS");
					console.log(message);
				}
			} else {
				doIfSuccess = params.success;
			}
			if (params.error==null) {
				doIfError = function(message){
					console.log("MODEL GET ERROR");
					console.log(message);
				}
			} else {
				doIfError = params.error;
			}
            $.ajax({
                url: this.url + "/" + id,
                type: 'get',
                context: this,
                error: function(jqxhr, textStatus, error) {
                    doIfError(error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = data;
                    doIfSuccess(data);
                }
            });
        };
        this.save = function(params) {
			var customUrl = params.customUrl;
            var useUrl = this.url;
            if (typeof customUrl != "undefined") {
                useUrl = customUrl;
            }
			var doIfSuccess;
			var doIfError;
			var formData = new FormData();
			var key;
			for (key in this.obj) {
				formData.append(key,this.obj[key]);
			}
			if (params.success==null) {
				doIfSuccess = function(message){
					console.log("MODEL SAVE SUCCESS");
					console.log(message);
				}
			} else {
				doIfSuccess = params.success;
			}
			if (params.error==null) {
				doIfError = function(message){
					console.log("MODEL SAVE ERROR");
					console.log(message);
				}
			} else {
				doIfError = params.error;
			}
            $.ajax({
                type: 'post',
                async: false,
                url: useUrl,
                context: this,
				data: formData,
				contentType: false,
                processData: false,
                error: function(jqxhr, textStatus, error) {
                    doIfError(error);
                },
                success: function(data, textStatus, jqxhr) {
                    doIfSuccess(data);
                }
            });
        };
        this.sync = function(params) {
            var customUrl = params.customUrl;
            var endpointId = params.id;
            var useUrl = this.url;
            if (typeof customUrl != "undefined") {
                useUrl = customUrl;
            }
            if (typeof endpointId != 'undefined') {
                useUrl = useUrl + "/" + endpointId;
            } else {
                useUrl = useUrl + "/" + this.obj.id;
            }
			var doIfSuccess;
			var doIfError;
			var formData = new FormData();
			var key;
			for (key in this.obj) {
				formData.append(key,this.obj[key]);
			}
			if (params.success==null) {
				doIfSuccess = function(message){
					console.log("MODEL SYNC SUCCESS");
					console.log(message);
				}
			} else {
				doIfSuccess = params.success;
			}
			if (params.error==null) {
				doIfError = function(message){
					console.log("MODEL SYNC ERROR");
					console.log(message);
				}
			} else {
				doIfError = params.error;
			}
            $.ajax({
                type: 'put',
                url: useUrl,
                context: this,
                data: this.formData,
				contentType: false,
                processData: false,
                error: function(jqxhr, textStatus, error) {
                    doIfError(error);
                },
                success: function(data, textStatus, jqxhr) {
                    doIfSuccess(data);
                }
            });
        };
        this.destroy = function(params) {
		    var customUrl = params.customUrl;
            var endpointId = params.id;
            var useUrl = this.url;
            if (typeof customUrl != "undefined") {
                useUrl = customUrl;
            }
            if (typeof endpointId != 'undefined') {
                useUrl = useUrl + "/" + endpointId;
            } else {
                useUrl = useUrl + "/" + this.obj.id;
            }
            var endpointId = params.id;
            var doIfSuccess;
			var doIfError;
			if (params.success==null) {
				doIfSuccess = function(message){
					console.log("MODEL DESTROY SUCCESS");
					console.log(message);
				}
			} else {
				doIfSuccess = params.success;
			}
			if (params.error==null) {
				doIfError = function(message){
					console.log("MODEL DESTROY ERROR");
					console.log(message);
				}
			} else {
				doIfError = params.error;
			}
            
            $.ajax({
                type: 'delete',
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: " + error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = {};
                    callback(data);
                }
            });
        };
		
		this.set = function(params) {
			var inputtedContent = params;
			var key;
			for (key in inputtedContent) {
				this.obj[key] = inputtedContent[key];
			}
		}
	};

}).call(this);