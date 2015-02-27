/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {
    var debug = true;

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window is passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'worklog',
        defaults = {
            // These are the defaults.
            width: "650px",
            height: "200px",
            background: "#FFF",
            format: "plain",
            titleColor: "#000",
            fixMinHeight: true,
            template: false,
            autoSuggest: false,
            autoFocus: false,
            suggestLength: 24
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;
        this.autoSuggestLines = [];
        this.$worklog = null;
        this.checkInterval = null;
        this.currLine = 1;
        this.lineHeight = 15;
        //
        this.init();
    }
    //
    $.extend(Plugin.prototype, {
        init: function() {
            if (debug) console.log("init");
            this.setAutoSuggestLines();
            this.createTextArea();
            this.loadLog();
            
            this.lineHeight = parseInt(this.$worklog.css("height"), 10)/(this.$worklog.data("linesArray").length || 1);
            if (debug) console.log(this)
        },
        setAutoSuggestLines: function () {
            if (debug) console.log("setAutoSuggestLines");
            //this.autoSuggestLines = new Array();
            if (this.options.autoSuggest) {
                var that = this;
                $.each(this.options.autoSuggest, function (index, value){
                    //console.log(that);
                    that.autoSuggestLines.push(value.line);
                });
            }
        },
        checkCursorPosition: function (that) {
            if (debug) console.log("checkCursorPosition");
            if (that.$worklog != null) {
                var t = that.$worklog[0];
                var tArray = t.value.split("\n");
                var position = t.value.substr(0, t.selectionStart).split("\n").length - 1;
                var autocompletePos;
                if (position !== that.currLine) {
                    if (debug) console.log(position);
                    that.currLine = position;
                    autocompletePos = parseInt(that.$worklog.css("padding-top"), 10) + ((that.currLine+1) *  that.lineHeight);
                    if (that.options.autoSuggest) {
                        that.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos } ).autocomplete("search", tArray[position]);
                    }
                } else if (tArray[position] !== that.$worklog.data("linesArray")[position]) {
                    if (debug) console.log(tArray[position]);
                    that.$worklog.data("linesArray", t.value.split("\n"));
                    autocompletePos = parseInt(that.$worklog.css("padding-top"), 10) + ((that.currLine+1) *  that.lineHeight);
                    console.log(autocompletePos);
                    if (that.options.autoSuggest) {
                        that.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos } ).autocomplete("search", tArray[position]);
                    }
                }
                return position;
            } else {
                return false;   
            }
        },
        createTextArea: function () {
            if (debug) console.log("createTextArea");
            var that = this;
            var templateHtml = '';
            if (this.options.template) {
                templateHtml += "<b>" + this.options.template.name + '</b><br>';
            }
            $(this.element).html(templateHtml + '<textarea class="worklog" autofocus="false"></textarea>');
            this.$worklog = $('textarea', $(this.element));
            this.$worklog.data("linesArray", []);
            this.$worklog.css({
                width: this.options.width,
                height: this.options.height,
                background: this.options.background,
                resize: 'none'
            }).attr({
                minWidth: this.options.width
            }).autogrow({
                vertical : true,
                horizontal : true,
                fixMinHeight: this.fixMinHeight
            }).focus(function () {
                that.checkInterval = setInterval(that.checkCursorPosition, 250, that);
            }).blur(function () {
                clearInterval(that.checkInterval);
            }).keydown(function(event) {
                var keyCode = $.ui.keyCode;
                if (event.keyCode == keyCode.UP || event.keyCode == keyCode.DOWN) {
                      event.stopImmediatePropagation();
                }
            }).focus();
            if (this.options.autoSuggest) {
                this.$worklog.autocomplete({
                    source: function (request, response) {
                        var term = request.term.trim();
                        console.log(term);
                        var result = [];
                        var firstWord = [];
                        var inLine = [];
                        $.each(that.autoSuggestLines, function (index, value) {
                            if (firstWord.length >= that.options.suggestLength) {
                                if (debug) console.log("Max suggestions reached");
                                //break out of $.each
                                return false;
                            }
                            var termIndex = value.toLowerCase().indexOf(term.toLowerCase());
                            if (termIndex === 0) {
                                if (value.trim() === term) {
                                    firstWord.unshift(value);
                                } else {
                                    firstWord.push(value);
                                }
                            } else if (termIndex > 0) {
                                inLine.push(value);
                            }
                        });
                        //suggestLength
                        result = result.concat(firstWord.slice(0, that.options.suggestLength)).concat(inLine.slice(0, that.options.suggestLength - result.length));
                        if (result.length === 1 && result[0].trim() === term) {
                            result = [];
                        }
                        response(result);//this will show in the selection box.
                        //response(term);
                    },
                    focus: function( event, ui ) {
                        return false;
                    },
                    select: function( event, ui ) {
                        console.log("Select");
                        //console.log(event);
                        console.log(ui.item.value);
                        that.setCurrentLine(ui.item.value, that);
                        return false;
                    },
                    position: { my : "right top", at: "right bottom" },
                    delay: 0,
                    autoFocus: this.options.autoFocus
                })
            }
        },
        loadLog: function () {
            if (debug) console.log("loadLog");
            var that = this;
            var worklogVal = "";
            var logObject = this.options.template;
            if (logObject) {
                $.each(logObject.sections, function (index, value){
                    //console.log(value);
                    if (logObject.firstLineTitle){
                        switch(that.options.format) {
                            case "html":
                                worklogVal += '<font color="' + that.options.titleColor + '"><b><u>' + value.shift() + '</u></b></font>\n';
                                break;
                            case "plain":
    //                            worklogVal += logObject[value].title + '\n';
                                break;
                        }
                    }
                    if (value.length){
                        worklogVal += value.join("\n") + '\n\n';
                    }
                });
                if (logObject.sig !=  null){
                    worklogVal += '<b>' + logObject.sig + '</b>';
                }
    //            if (debug) console.log(worklogVal);
                this.$worklog.val(worklogVal);
                this.$worklog.data("linesArray", worklogVal.split("\n"));
                this.$worklog.trigger("update.autogrow");
            }
        },
        setCurrentLine: function (value, that) {
            var logLines = that.$worklog.data("linesArray");
            logLines[that.currLine] = value;
            var cursorPos = that.$worklog[0].selectionStart;
            that.$worklog.val(logLines.join('\n'));
            var newPos = cursorPos + that.$worklog.val().substring(cursorPos).indexOf("\n");
            that.$worklog[0].setSelectionRange(newPos, newPos);
        }
    });
    
//    Plugin.prototype.init = function () {
//        // Place initialization logic here
//        // You already have access to the DOM element and the options via the instance,
//        // e.g., this.element and this.options
//    };

    // You don't need to change something below:
    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations and allowing any
    // public function (ie. a function whose name doesn't start
    // with an underscore) to be called via the jQuery plugin,
    // e.g. $(element).defaultPluginName('functionName', arg1, arg2)
    $.fn[pluginName] = function ( options ) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!$.data(this, 'plugin_' + pluginName)) {

                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call
            // to make it possible
            // to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);

                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                  $.data(this, 'plugin_' + pluginName, null);
                }
            });

            // If the earlier cached method
            // gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };

}(jQuery, window, document));