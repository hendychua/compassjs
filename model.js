var Compass = function() {};

var Collection = Compass.Collection = function(model) {
    this.model = function(){};
    this.model.prototype = model.prototype;
    this.list = [];
    this.get = function(customUrl, additionalParams) {
        var useUrl = this.model.url;
        if (typeof customUrl != "undefined" && customUrl != "" && customUrl != null) {
            useUrl = customUrl;
        }
        $.ajax({
            async: false,
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
            }
        });
    };
}

var Model = Compass.Model = function(url) {
    this.url = url;
    this.obj = {};
    this.get = function(id) {
        $.ajax({
            async: false,
            url: this.url+"/"+id,
            type: 'get',
            context: this,
            error: function(jqxhr, textStatus, error) {
                console.log("error: "+error);
            },
            success: function(data, textStatus, jqxhr) {
                this.obj = data;
            }
        });                        
    };
    this.save = function(customUrl) {
        var useUrl = this.url;
        if (typeof customUrl != "undefined" && customUrl != "" && customUrl != null) {
            useUrl = customUrl;
        }
        // allow user to post with files with FormData
        // if formData attribute is set and is of the FormData type,
        // we will use it to post to the server
        // else we use normal key-value pairs to post
        if (this.obj.formData instanceof FormData) {
            $.ajax({
                type: 'post',
                async: false,
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
                }
            });
            
        }
    };
    this.sync = function(customUrl, endpointId) {
        var useUrl = this.url;
        if (typeof customUrl != "undefined" && customUrl != "" && customUrl != null) {
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
                async: false,
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
                }
            });
        } else {
            $.ajax({
                type: 'put',
                async: false,
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                }
            });
        }
    };
    this.destroy = function(customUrl, endpointId) {
        var useUrl = this.url;
        if (typeof customUrl != "undefined" && customUrl != "" && customUrl != null) {
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
                async: false,
                url: useUrl,
                context: this,
                data: this.obj,
                error: function(jqxhr, textStatus, error) {
                    console.log("error: "+error);
                },
                success: function(data, textStatus, jqxhr) {
                    this.obj = {};
                }
            });
        }
    };
};