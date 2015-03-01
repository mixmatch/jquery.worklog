/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */

 ;(function ( $, window, document, undefined ) {
    var debug = true;
    $.widget( "mixmatch.worklog" , {
        //Options to be used as defaults
        options: {
            // These are the defaults.
            width: "650px",
            height: "200px",
            background: "#FFF",
            format: "plain",
            titleColor: "#000",
            fixMinHeight: false,
            template: false,
            autoSuggest: false,
            autoFocus: false,
            suggestLength: 24
        },
		_create: function() {
			if (debug) console.log("_create");
			this.edited = false;
			this.lastWorklogEdit = null;
			this.inactiveInterval = [];
			this.autoSuggestLines = [];
			this.lines = [];
			this.$worklog = null;
			this.checkInterval = null;
			this.currLine = 1;
			this.lineHeight = 15;
			this.element.addClass('mixmatch-worklog');
            this._setAutoSuggestLines();
            this._createTextArea();
            this._loadLog();
			this.lineHeight = parseInt(this.$worklog.css("height"), 10)/(this.lines.length || 1);
            if (debug) { console.log(this); }
			this._delay( this._blur, 1000 );
			//this.element.blur();
			//this.refresh();
		},
		_setOption: function( key, value ) {
			this._super( key, value );
		},
		_setOptions: function( options ) {
			this._super( options );
			this.refresh();
		},
		_blur: function() {
			this.$worklog.blur();
		},
		_constrain: function( value ) {

		},
		_destroy: function() {
			this.element
				.removeClass( "mixmatch-worklog" )
				.text( "" );
		},
		_setAutoSuggestLines: function () {
            if (debug) console.log("setAutoSuggestLines");
            //this.autoSuggestLines = new Array();
            if (this.options.autoSuggest) {
                var that = this;
                $.each(this.options.autoSuggest, function (index, value){
                    //if (debug) console.log(that);
                    that.autoSuggestLines.push(value.line);
                });
            }
        },
        _checkCursorPosition: function () {
            //if (debug) console.log("checkCursorPosition");
            if (this.$worklog != null && this.lines != null) {
                var t = this.$worklog[0];
                var tArray = t.value.split("\n");
                var position = t.value.substr(0, t.selectionStart).split("\n").length - 1;
                var autocompletePos;
                if (position !== this.currLine) {
                    if (debug) console.log(position);
                    this.currLine = position;
                    autocompletePos = parseInt(this.$worklog.css("padding-top"), 10) + ((this.currLine + 1) *  this.lineHeight);
                    if (this.options.autoSuggest) {
                        this.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos, collision: "none" } ).autocomplete("search", tArray[position]);
                    }
                } else if (tArray[position] !== this.lines[position]) {
                    if (debug) console.log(tArray[position]);
					this.edited = true;
					this.lastWorklogEdit = new Date();
                    this.lines = t.value.split("\n");
                    autocompletePos = parseInt(this.$worklog.css("padding-top"), 10) + ((this.currLine+1) *  this.lineHeight);
                    if (debug) console.log(autocompletePos);
                    if (this.options.autoSuggest) {
                        this.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos, collision: "none" } ).autocomplete("search", tArray[position]);
                    }
                }
                return position;
            } else {
                return false;   
            }
        },
        _createTextArea: function () {
            if (debug) console.log("createTextArea");
            //for callbacks that need this scope
            var that = this;
            var templateHtml = '';
            if (this.options.template) {
                templateHtml += "<b>" + this.options.template.name + '</b><br>';
            }
            $(this.element).html(templateHtml + '<textarea autofocus="false" class="mixmatch-worklog-input"></textarea>');
            this.$worklog = $('textarea', $(this.element));
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
                fixMinHeight: this.options.fixMinHeight
            }).focus(function () {
                that.checkInterval = setInterval(function () { that._checkCursorPosition.apply(that); }, 250);
            }).blur(function () {
                clearInterval(that.checkInterval);
            }).keydown(function(event) {
                var keyCode = $.ui.keyCode;
                if (event.keyCode == keyCode.UP || event.keyCode == keyCode.DOWN) {
                      event.stopImmediatePropagation();
                }
            });
            if (this.options.autoSuggest) {
                this.$worklog.autocomplete({
                    source: function (request, response) {
                        var term = request.term.trim();
                        if (debug) console.log(term);
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
                        if (debug) console.log("Select");
                        //console.log(event);
                        if (debug) console.log(ui.item.value);
                        that.setCurrentLine(ui.item.value);
                        return false;
                    },
                    position: { my : "right top", at: "right bottom" },
                    delay: 0,
                    autoFocus: this.options.autoFocus
                })
            }
        },
        _loadLog: function () {
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
                this.lines = worklogVal.split("\n");
                this.$worklog.trigger("update.autogrow");
				
            }
        },
		findLine: function (search) {
			//search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			var lineNum;
			$.each(this.lines, function (index, value){
				if (value.indexOf(search) !== -1) {
					lineNum = index;
					return false
				}
			});
			return lineNum;
		},
        setLine: function (line, value) {
            var cursorPos = this.$worklog[0].selectionStart;
			this.lines[line] = value;
            this.$worklog.val(this.lines.join('\n'));
            var newPos = cursorPos + this.$worklog.val().substring(cursorPos).indexOf("\n");
            this.$worklog[0].setSelectionRange(newPos, newPos);
        },
        setCurrentLine: function (value) {
			this.setLine(this.currLine, value);
        },
		replace: function (before, after) {
			before = before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			var re = new RegExp(before);
			var worklogVal = this.$worklog.val().replace(re, after);
			this.$worklog.val(worklogVal);
			this.lines = worklogVal.split("\n");
			this.$worklog.trigger("update.autogrow");
		},
		replaceLine: function (before, after) {
			before = before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			var re = new RegExp(before);
			var worklogVal = this.$worklog.val().replace(re, after);
			this.$worklog.val(worklogVal);
			this.lines = worklogVal.split("\n");
			this.$worklog.trigger("update.autogrow");
		}
	});

})( jQuery, window, document );