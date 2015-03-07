/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */

 ;(function ( $, window, document, undefined ) {
    var debug = true;
    var base;
    $.widget( "mixmatch.worklog" , {
        //Options to be used as defaults
        options: {
            // These are the defaults.
            width: "650px",
            height: "200px",
            background: "#FFF",
            format: "plain",
            title: {
                color: "#000",
                bold: true,
                underline: true,
                italics: false
            },
            fixMinHeight: false,
            template: false,
            autoSuggest: false,
            autoFocus: false,
            suggestLength: 24
        },
		_create: function() {
			if (debug) console.log("_create");
			if (debug) console.log(this.eventNamespace);
			if (debug) console.log(this.namespace);
			if (debug) console.log(this.widgetEventPrefix);
			if (debug) console.log(this.widgetFullName);
			if (debug) console.log(this.widgetName);
            base = this;
            this.nameSpace = this.eventNamespace.replace(/[.]/g, '');
			this.edited = false;
			this.lastWorklogEdit = null;
			this.inactiveInterval = [];
			this.autoSuggestLines = [];
			this.lines = [];
			this.log = $.extend(true, {}, this.options.template);
			this.checkInterval = null;
			this.currentLine = null;
            this.currentElem = null;
            this.showSuggest = false;
			this.lineHeight = 15;
            this.$element = $(this.element);
			this.element.addClass(this.nameSpace);
            this._setAutoSuggestLines();
            this._createTextArea();
//            this._loadLog();
//			this.lineHeight = parseInt(this.$worklog.css("height"), 10)/(this.lines.length || 1);
//            if (debug) { console.log(this); }
//			this._delay( this._blur, 1000 );
			//this.element.blur();
			//this.refresh();
		},
		_setOption: function (key, value) {
			this._super( key, value );
		},
		_setOptions: function (options) {
			this._super( options );
			this.refresh();
		},
		_blur: function () {
			this.$worklog.blur();
		},
		_constrain: function( value ) {

		},
		_destroy: function () {
			this.element
				.removeClass(this.nameSpace)
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
        _prevEditable: function (elem) {
//            if (debug) console.log(elem);
            var prevElem = $(elem).prev('.editable');
            if (prevElem.length){
                return prevElem;
            } else if ($(elem).prev().length) {
                return base._prevEditable($(elem).prev());
            } else if ($(elem).parent().length) {
                return base._prevEditable($(elem).parent());
            } else {
                return false;   
            }
        },
        _nextEditable: function (elem) {
//            if (debug) console.log(elem);
            var nextElem = $(elem).next('.editable');
            if (nextElem.length){
                return nextElem;
            } else if ($(elem).next().length) {
                return base._nextEditable($(elem).next());
            } else if ($(elem).parent().length) {
                return base._nextEditable($(elem).parent());
            } else {
                return false;   
            }
        },
        _checkCursorPosition: function () {
            var elem = base.focusedElem;
            if (this.options.autoSuggest && elem != null) {
                var tArray = elem.innerText.split("\n");
                var position = tArray.indexOf(window.getSelection().getRangeAt(0).endContainer.textContent);
                var lineHeight = parseInt($(elem).css("height"), 10)/(tArray.length || 1);
                var autocompletePos;
                if (position !== this.currentLine || this.showSuggest) {
                    if (debug) console.log(lineHeight);
                    if (debug) console.log(position);
                    if (debug) console.log(window.getSelection().getRangeAt(0));
                    if (debug) console.log(window.getSelection().getRangeAt(0).endContainer.textContent);
                    autocompletePos = parseInt($(elem).css("padding-top"), 10) + ((position + 1) *  lineHeight);
                    $(elem).autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos, collision: "none" } ).autocomplete("search", tArray[position]);
                    this.currentLine = position;
                    this.showSuggest = false;
                }
            }
        },
        _createTextArea: function () {
            if (debug) console.log("createTextArea");
            //for callbacks that need this scope
            var that = this;
            var templateHtml = '';
            var logObject = $.extend(true, {}, this.options.template);
            if (logObject) {
                this.$element.css({
                    width: this.options.width,
                    height: this.options.height,
                    background: this.options.background,
                    padding: '2px',
                    resize: 'none'
                }).append($('<div>', {
                    'id':this.nameSpace + 'header',
                    'css': {'margin-bottom': '10px'}
                }).append($('<b>', {
                    'text':'[' + logObject.name + ' ] '
                })).append($('<input>', {
                    'id':this.nameSpace + 'boldCheck',
                    'checked':that.options.title.bold,
                    'type':'checkbox',
                    'change': function () {
                        if (debug) console.log($(this).is(':checked'));
                        that.options.title.bold = $(this).is(':checked');
                        that._setTitleFormat();
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'boldCheck',
                    'html':'<b>B</b>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'italicsCheck',
                    'checked':that.options.title.italics,
                    'type':'checkbox',
                    'change': function () {
                        if (debug) console.log($(this).is(':checked'));
                        that.options.title.italics = $(this).is(':checked');
                        that._setTitleFormat();
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'italicsCheck',
                    'html':'<i>I</i>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'underlineCheck',
                    'checked':that.options.title.underline,
                    'type':'checkbox',
                    'change': function () {
                        if (debug) console.log($(this).is(':checked'));
                        that.options.title.underline = $(this).is(':checked');
                        that._setTitleFormat();
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'underlineCheck',
                    'html':'<u>U</u>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'titleColor',
                    'type':'color',
                    'css':{'width':'16px', 'height':'16px', 'margin-left':'10px', 'padding': '0px 1px'},
                    'change': function () {
                        if (debug) console.log($(this).val());
                        that.options.title.color = $(this).val();
                        that._setTitleFormat();
                        //that.options.title.underline = $(this).is(':checked');
                    }
                })).buttonset()
                ).append($('<div>', {
                    'id':this.nameSpace + 'body'
                }));
                $('.ui-button').css({"height": "14px", "width": "24px"});
                $('.ui-button-text').css({"padding": "0px 2px", "margin": "0px auto", 'font-size': '0.9em'});
                
                base.$worklogBody = $('#' + this.nameSpace + 'body');
                $.each(logObject.sections, function (index, value){
                    //console.log(value);
                    if (logObject.firstLineTitle){
                        switch(that.options.format) {
                            case "html":
                                var titleString = value.shift();
                                if (that.options.title.italics) {
                                    titleString = '<i>' + titleString + '</i>';
                                }
                                if (that.options.title.underline) {
                                    titleString = '<u>' + titleString + '</u>';
                                }
                                if (that.options.title.bold) {
                                    titleString = '<b>' + titleString + '</b>';
                                }
                                base.$worklogBody.append($('<div>', {
                                    'id':that.nameSpace+ 'title' + index,
                                    'class':'editable'
                                }).append($('<font color="' + that.options.title.color + '">').html(titleString)
                                ).data({type: 'title', index: index}));
                                break;
                            case "plain":
                                break;
                        }
                    }
                    if (value.length){
                        base.$worklogBody.append($('<div>', {
                            'id':that.nameSpace + 'section' + index,
                            'class':'editable autosuggest'
                        }).data({type: 'section', index: index}).html(value.join("<br>"))).append('<br>');
                    }
                });
                if (logObject.sig !=  null){
                    base.$worklogBody.append($('<div>', {
                        'id':that.nameSpace + 'sig',
                        'class':'editable'
                    }).data({type: 'sig'}).html('<b>' + logObject.sig + '</b>'));
                }
            }
            $('.editable').attr('contentEditable', 'true').css('white-space', 'pre').keydown(function(event) {
                var keyCode = $.ui.keyCode;
                var action = null;
                if (event.keyCode == keyCode.UP) {
                    //if (debug) console.log("Up");
                    event.stopImmediatePropagation();
                    if (base.currentLine === 0 || base.currentLine == null) {
                        var currentSelection = window.getSelection();
                        var range = document.createRange();
                        var elem = currentSelection.getRangeAt(0).startContainer.parentElement;
                        var caretStart = currentSelection.getRangeAt(0).startOffset;
                        var prevElem = base._prevEditable(elem);
                        if (prevElem) {
                            prevElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
                            var currentNode = window.getSelection().getRangeAt(0).startContainer
                            range.setStart(currentNode, Math.min(caretStart, currentNode.length));
                            range.collapse(true);
                            setTimeout ( function () {
                                var sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }, 1);
                        }
                    }
                }
                if (event.keyCode == keyCode.DOWN) {
                    //if (debug) console.log("Down");
                    event.stopImmediatePropagation();
                    var lastLine = base.focusedElem.innerText.split('\n').length - 1;
                    if (debug) console.log(base.currentLine);
                    if (debug) console.log(lastLine);
                    if (debug) console.log(base.focusedElem.innerText.split('\n'));
                    if (base.currentLine === lastLine || base.currentLine == null) {
                        var currentSelection = window.getSelection();
                        var range = document.createRange();
                        var elem = currentSelection.getRangeAt(0).startContainer.parentElement;
                        var caretStart = currentSelection.getRangeAt(0).startOffset;
                        var nextElem = base._nextEditable(elem);
                        if (nextElem) {
                            nextElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
                            var currentNode = window.getSelection().getRangeAt(0).startContainer
                            range.setStart(currentNode, Math.min(caretStart, currentNode.length));
                            range.collapse(true);
                            setTimeout ( function () {
                                var sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }, 1);
                        }
                    }
                }
            }).on( "input", function() {
                if (debug) { console.log(this.innerText); }
                if (debug) { console.log($(this).data()); }
                var elemObj = $(this).data();
                switch (elemObj.type){
                    case 'title':
                        base.log.sections[elemObj.index][0] = this.innerText;
                        break;
                    case 'section':
                        if(base.log.firstLineTitle) {
                            var sectionText = this.innerText.split('\n');
                            base.log.sections[elemObj.index] = [base.log.sections[elemObj.index][0]].concat(sectionText);
                        } else {
                           base.log.sections[elemObj.index] =  this.innerText.split('\n')
                        }
                        break;
                    case 'sig':
                        base.log.sig = this.innerText
                        break;
                };
                base.showSuggest = true;
            }).hover(function(e) { 
                if (e.type === "mouseenter") {
                    $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
                } else if ($(base.focusedElem).attr('id') != $(this).attr('id')){
                    $(this).css('background-color', 'transparent');
                }
            }).focus(function () {
                base.showSuggest = false;
                $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
                base.focusedElem = this;
            }).blur(function () {
                $(this).css('background-color', 'transparent');
                base.currentLine = null;
                base.focusedElem = null;
            });
            if (this.options.autoSuggest) {
                $('.autosuggest').autocomplete({
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
                                    //firstWord.unshift(value);
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
                        that.setCurrentLine(ui.item.value, this);
                        return false;
                    },
                    position: { my : "right top", at: "right bottom" },
                    delay: 0,
                    autoFocus: this.options.autoFocus
                }).focus(function () {
                    that.checkInterval = setInterval(function () { base._checkCursorPosition(); }, 250);
                }).blur(function () {
                    clearInterval(that.checkInterval);
                });
            }
            //$(':focus').css('background-color', 'rgba( 255, 255, 255, 0.7)');
        },
        _setTitleFormat: function () {
            $.each(base.log.sections, function (index, value) {
                if (base.log.firstLineTitle){
                    switch(base.options.format) {
                        case "html":
                            var titleString = value[0];
                            if (base.options.title.italics) {
                                titleString = '<i>' + titleString + '</i>';
                            }
                            if (base.options.title.underline) {
                                titleString = '<u>' + titleString + '</u>';
                            }
                            if (base.options.title.bold) {
                                titleString = '<b>' + titleString + '</b>';
                            }
                            $('#' + base.nameSpace+ 'title' + index).html('<font color="' + base.options.title.color + '">' + titleString + '</font>');
                            break;
                        case "plain":
                            break;
                    }
                }
                
            });
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
		findLine: function (search, startIndex, endIndex) {
			//search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			if (search === '') {
				search = '^$';
			}
			var re = new RegExp(search);
			startIndex = startIndex != null ? startIndex : 0;
			endIndex = endIndex != null ? endIndex : this.lines.length;
			var lineNum = false;
			if (typeof startIndex === 'string') {
				startIndex = this.findLine(startIndex);
				if (startIndex === false) {
					return false;
				}
				startIndex++;
			}
			if (typeof endIndex === 'string') {
				endIndex = this.findLine(endIndex);
				if (endIndex === false) {
					return false;
				}
			}
			$.each(this.lines, function (index, value){
				if ((re.test(value)) && (index >= startIndex) && (index < endIndex)) {
				//if ((value === search || value.indexOf(search) !== -1) && (index >= startIndex) && (index < endIndex)) {
					lineNum = index;
					return false;
				}
			});
			return lineNum;
		},
		addLine: function (value, lineNum) {
			lineNum = lineNum != null ? lineNum : this.lines.length;
            var cursorPos = this.$worklog[0].selectionStart;
			if (Array.isArray(value)) {
				this.lines = this.lines.slice(0, lineNum).concat(value).concat(this.lines.slice(lineNum));
				
			} else {
				this.lines.splice(lineNum, 0, value);
			}
            this.$worklog.val(this.lines.join('\n'));
			var newPos = cursorPos + this.$worklog.val().substring(cursorPos).indexOf("\n");
			this.$worklog[0].setSelectionRange(newPos, newPos);
			this.$worklog.trigger("update.autogrow");
		},
        setLine: function (lineNum, value, elem) {
            if (debug) { console.log('Setting Line'); }
            var elemObj = $(elem).data();
            if (debug) { console.log(elemObj); }
            var newHTML;
            switch (elemObj.type){
                case 'title':
                    base.log.sections[elemObj.index][0] = value;
                    $(elem).text(value);
                    break;
                case 'section':
                    var sectionText = elem.innerText.split('\n');
                    sectionText[lineNum] = value;
                    if(base.log.firstLineTitle) {
                        base.log.sections[elemObj.index] = [base.log.sections[elemObj.index][0]].concat(sectionText);
                    } else {
                       base.log.sections[elemObj.index] =  sectionText;
                    }
                    $(elem).html(sectionText.join("<br>"));
                    break;
                case 'sig':
                    base.log.sig = value;
                    $(elem).text(value);
                    break;
            };
        },
        setCurrentLine: function (value, elem) {
			this.setLine(this.currentLine, value, elem);
        },
		replace: function (findVal, replaceVal) {
			//before = before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			var re = new RegExp(findVal);
			var worklogVal = this.$worklog.val().replace(re, replaceVal);
			this.$worklog.val(worklogVal);
			this.lines = worklogVal.split("\n");
			this.$worklog.trigger("update.autogrow");
		},
		replaceLine: function (findVal, replaceVal, startIndex, endIndex) {
			//findVal = findVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			//var re = new RegExp(findVal);
			var lineNum = this.findLine(findVal, startIndex, endIndex);
			if (lineNum !== false) {
				this.setLine(lineNum, replaceVal);
				return lineNum;
			} else {
				return false;
			}
		},
		toArray: function () {
			return this.lines;
		},
		value: function () {
			return this.$worklog.val();
		}
	});
})( jQuery, window, document );