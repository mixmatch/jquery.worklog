/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */
/*jslint browser: true, devel: true, nomen: true, eqeq: true, plusplus: true, sloppy: true, white: true, maxerr: 999 */
/*global jQuery, $*/

 ; (function ($, window, document, undefined) {
    var debug = true;
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
			if (debug) { console.log("_create"); }
			if (debug) { console.log(this.eventNamespace); }
			if (debug) { console.log(this.namespace); }
			if (debug) { console.log(this.widgetEventPrefix); }
			if (debug) { console.log(this.widgetFullName); }
			if (debug) { console.log(this.widgetName); }
            this.nameSpace = this.eventNamespace.replace(/[.]/g, '');
			this.edited = false;
			this.lastWorklogEdit = null;
			this.inactiveInterval = [];
			this.autoSuggestLines = [];
			this.log = $.extend(true, {}, this.options.template);
			this.checkInterval = null;
			this.currentLine = null;
            this.currentElem = null;
            this.showSuggest = false;
			this.lineHeight = 15;
            this.$element = $(this.element);
			this.element.addClass(this.nameSpace);
			this.element.addClass(this.widgetName);
            this._setAutoSuggestLines();
            this._createTextArea();
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
            if (debug) { console.log("setAutoSuggestLines"); }
            //this.autoSuggestLines = new Array();
            if (this.options.autoSuggest) {
                var base = this;
                $.each(this.options.autoSuggest, function (index, value){
                    //if (debug) console.log(that);
                    base.autoSuggestLines.push(value.line);
                });
            }
        },
        _prevEditable: function (elem) {
//            if (debug) console.log(elem);
            var prevElem = $(elem).prev('.editable');
            if (prevElem.length){
                return prevElem;
            } else if ($(elem).prev().length) {
                return this._prevEditable.apply(this, $(elem).prev());
            } else if ($(elem).parent().length) {
                return this._prevEditable.apply(this, $(elem).parent());
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
                return this._nextEditable.apply(this, $(elem).next());
            } else if ($(elem).parent().length) {
                return this._nextEditable.apply(this, $(elem).parent());
            } else {
                return false;   
            }
        },
        _getCaretOffsetHTML: function (element) {
            var caretOffset = 0;
            var doc = element.ownerDocument || element.document;
            var win = doc.defaultView || doc.parentWindow;
            var sel;
            var selHTML = null;
            if (typeof win.getSelection != "undefined") {
                sel = win.getSelection();
                if (sel.rangeCount > 0) {
                    var range = win.getSelection().getRangeAt(0);
                    var preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(element);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    selHTML = $('<div>').append(preCaretRange.cloneContents()).html();
                    caretOffset = selHTML.length;
                    //if (debug) console.log(selHTML);
                }
            } else if ( (sel = doc.selection) && sel.type != "Control") {
                var textRange = sel.createRange();
                var preCaretTextRange = doc.body.createTextRange();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                caretOffset = preCaretTextRange.text.length;
                //if (debug) console.log(preCaretTextRange);
            }
            //if (debug) console.log(caretOffset);
            return caretOffset;
        },
        _checkCursorPosition: function () {
            var elem = this.focusedElem;
            var $elem = $(elem);
            if (this.options.autoSuggest && elem != null) {
                var charOffset = this._getCaretOffsetHTML(elem);
                var tArray = $elem.html().replace(/(.*)<br>$/i, "$1").split("<br>");
                var position = $elem.html().substr(0, charOffset).split("<br>").length - 1;
                var lineHeight = parseInt($(elem).css("height"), 10)/(tArray.length || 1);
                var autocompletePos;
                if (position !== this.currentLine || this.showSuggest) {
//                    if (debug) console.log(lineHeight);
//                    if (debug) console.log(position);
//                    if (debug) console.log(tArray[position]);
                    autocompletePos = parseInt($(elem).css("padding-top"), 10) + ((position + 1) *  lineHeight);
                    $(elem).autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos, collision: "none" } ).autocomplete("search", tArray[position]);
                    this.currentLine = position;
                    this.showSuggest = false;
                }
            }
        },
        _createTextArea: function () {
            if (debug) { console.log("createTextArea"); }
            //for callbacks that need this scope
            var base = this;
            var templateHtml = '';
            var logObject = $.extend(true, {}, this.options.template);
            var options  = this.options;
            if (logObject) {
                this.$element.css({
                    width: options.width,
                    height: options.height,
                    background: options.background,
                    padding: '2px',
                    resize: 'none'
                }).append($('<div>', {
                    'id':this.nameSpace + 'header',
                    'css': {'margin-bottom': '10px'}
                }).append($('<b>', {
                    'text':logObject.name + ' '
                })).append($('<input>', {
                    'id':this.nameSpace + 'boldCheck',
                    'checked':options.title.bold,
                    'type':'checkbox',
                    'change': function () {
                        base.options.title.bold = $(this).is(':checked');
                        base._setTitleFormat.apply(base);
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'boldCheck',
                    'html':'<b>B</b>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'italicsCheck',
                    'checked':options.title.italics,
                    'type':'checkbox',
                    'change': function () {
                        options.title.italics = $(this).is(':checked');
                        base._setTitleFormat.apply(base);
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'italicsCheck',
                    'html':'<i>I</i>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'underlineCheck',
                    'checked':options.title.underline,
                    'type':'checkbox',
                    'change': function () {
                        options.title.underline = $(this).is(':checked');
                        base._setTitleFormat.apply(base);
                    }
                })).append($('<label>', {
                    'for':this.nameSpace + 'underlineCheck',
                    'html':'<u>U</u>'
                })).append($('<input>', {
                    'id':this.nameSpace + 'titleColor',
                    'type':'color',
                    'val': options.title.color,
                    'css':{'width':'16px', 'height':'16px', 'margin-left':'10px', 'padding': '0px 1px'},
                    'change': function () {
                        options.title.color = $(this).val();
                        base._setTitleFormat.apply(base);
                        //that.options.title.underline = $(this).is(':checked');
                    }
                })).buttonset()
                ).append($('<div>', {
                    'id':this.nameSpace + 'body'
                }));
                $('.ui-button', '#' + this.nameSpace + 'header').css({"height": "14px", "width": "24px"});
                $('.ui-button-text', '#' + this.nameSpace + 'header').css({"padding": "0px 2px", "margin": "0px auto", 'font-size': '0.9em'});
                
                this.$worklogBody = $('#' + this.nameSpace + 'body');
                $.each(logObject.sections, function (index, value){
                    base.addSection.apply(base, [index, value]);
                });
                if (logObject.sig !=  null){
                    base.$worklogBody.append($('<div>', {
                        'id':base.nameSpace + 'sig',
                        'class':'editable'
                    }).data({type: 'sig', base: base}).html('<b>' + logObject.sig + '</b>'));
                }
            }
            $('.editable').attr('contentEditable', 'true').css('white-space', 'pre').keydown(function(event) {
                var keyCode = $.ui.keyCode;
                var action = null;
				var currentSelection, range, elem, caretStart,currentNode;
                if (event.keyCode == keyCode.UP) {
                    //if (debug) console.log("Up");
                    event.stopImmediatePropagation();
                    if (base.currentLine === 0 || base.currentLine == null) {
                        currentSelection = window.getSelection();
                        range = document.createRange();
                        elem = currentSelection.getRangeAt(0).startContainer.parentElement;
                        caretStart = currentSelection.getRangeAt(0).startOffset;
                        var prevElem = base._prevEditable.apply(base, [base.focusedElem]);
                        if (prevElem) {
                            prevElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
                            currentNode = window.getSelection().getRangeAt(0).startContainer;
                            range.setStart(currentNode, Math.min(caretStart, currentNode.length));
                            range.collapse(true);
                            setTimeout ( function () {
                                var sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }, 1);
                        }
                    }
                } else if (event.keyCode == keyCode.DOWN) {
                    //if (debug) console.log("Down");
                    event.stopImmediatePropagation();
                    //var lastLine = base.focusedElem.innerText.split('\n').length - 1;
                    var lastLine = $(base.focusedElem).html().replace(/(.*)<br>$/i, "$1").split("<br>").length - 1;
                    if (base.currentLine === lastLine || base.currentLine == null) {
                        currentSelection = window.getSelection();
                        range = document.createRange();
                        elem = currentSelection.getRangeAt(0).startContainer.parentElement;
                        caretStart = currentSelection.getRangeAt(0).startOffset;
                        var nextElem = base._nextEditable.apply(base, [base.focusedElem]);
                        if (nextElem) {
                            nextElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
                            currentNode = window.getSelection().getRangeAt(0).startContainer
                            range.setStart(currentNode, Math.min(caretStart, currentNode.length));
                            range.collapse(true);
                            setTimeout ( function () {
                                var sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }, 1);
                        }
                    }
                } else if (event.keyCode == keyCode.ENTER) {
                    if ($(this).data('type') === 'section'){
                        document.execCommand('insertHTML', false, '<br><br>');
                    }
                    return false;
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
						$(this).find('*:not(br)').contents().unwrap();
                        var sectionText = $(this).html().replace(/(.*)<br>$/i, "$1").split("<br>");
                        if(base.log.firstLineTitle) {
                            base.log.sections[elemObj.index] = [base.log.sections[elemObj.index][0]].concat(sectionText);
                        } else {
                           base.log.sections[elemObj.index] =  sectionText;
                        }
                        break;
                    case 'sig':
                        base.log.sig = this.innerText;
                        break;
                }
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
            if (options.autoSuggest) {
                $('.autosuggest').autocomplete({
                    source: function (request, response) {
                        var term = request.term.trim();
                        if (debug) { console.log(term); }
                        var result = [];
                        var firstWord = [];
                        var inLine = [];
                        $.each(base.autoSuggestLines, function (index, value) {
                            if (firstWord.length >= options.suggestLength) {
                                if (debug) { console.log("Max suggestions reached"); }
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
                        result = result.concat(firstWord.slice(0, options.suggestLength)).concat(inLine.slice(0, options.suggestLength - result.length));
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
                        if (debug) { console.log("Select"); }
                        //console.log(event);
                        if (debug) { console.log(ui.item.value); }
                        base.setCurrentLine(ui.item.value, $(this).data().index);
                        return false;
                    },
                    position: { my : "right top", at: "right bottom" },
                    delay: 0,
                    autoFocus: this.options.autoFocus
                }).focus(function () {
                    base.checkInterval = setInterval(function () { base._checkCursorPosition(); }, 100);
                }).blur(function () {
                    clearInterval(base.checkInterval);
                });
            }
            //$(':focus').css('background-color', 'rgba( 255, 255, 255, 0.7)');
        },
        _setTitleFormat: function () {
            if (debug) { console.log('Setting Title Format'); }
            if (debug) { console.log(this.log); }
            var logObject = this.log;
            var options = this.options;
            var nameSpace = this.nameSpace;
            $.each(logObject.sections, function (index, value) {
                if (logObject.firstLineTitle){
                    switch(options.format) {
                        case "html":
                            var titleString = value[0];
                            if (options.title.italics) {
                                titleString = '<i>' + titleString + '</i>';
                            }
                            if (options.title.underline) {
                                titleString = '<u>' + titleString + '</u>';
                            }
                            if (options.title.bold) {
                                titleString = '<b>' + titleString + '</b>';
                            }
                            $('#' + nameSpace + 'title' + index).html('<font color="' + options.title.color + '">' + titleString + '</font>');
                            break;
                        case "plain":
                            break;
                    }
                }
                
            });
        },
        addSection: function (index, value) {
            if (debug) { console.log('Adding Section'); }
            //console.log(value);
            var base = this;
            var logObj = this.log;
            var options = this.options;
            if (logObj.firstLineTitle){
                switch(options.format) {
                    case "html":
                        var titleString = value.shift();
                        if (options.title.italics) {
                            titleString = '<i>' + titleString + '</i>';
                        }
                        if (options.title.underline) {
                            titleString = '<u>' + titleString + '</u>';
                        }
                        if (options.title.bold) {
                            titleString = '<b>' + titleString + '</b>';
                        }
                        base.$worklogBody.append($('<div>', {
                            'id':base.nameSpace+ 'title' + index,
                            'class':'editable'
                        }).append($('<font color="' + options.title.color + '">').html(titleString)
                        ).data({type: 'title', index: index, base: base}));
                        break;
                    case "plain":
                        break;
                }
            }
            if (value.length){
                base.$worklogBody.append($('<div>', {
                    'id':base.nameSpace + 'section' + index,
                    'class':'editable autosuggest'
                }).data({type: 'section', index: index, base: base}).html(value.join("<br>"))).append('<br>');
            }
        },
        refreshSection: function (index) {
            if (debug) { console.log('Refreshing Section'); }
            console.log(this.log.sections[index]);
            var base = this;
            var logObj = $.extend(true, {}, this.log);
            var section = logObj.sections[index];
            var options = this.options;
            if (logObj.firstLineTitle){
                switch(options.format) {
                    case "html":
                        var titleString = section.shift();
                        if (options.title.italics) {
                            titleString = '<i>' + titleString + '</i>';
                        }
                        if (options.title.underline) {
                            titleString = '<u>' + titleString + '</u>';
                        }
                        if (options.title.bold) {
                            titleString = '<b>' + titleString + '</b>';
                        }
                        $('#' + base.nameSpace+ 'title' + index).html($('<font color="' + options.title.color + '">').html(titleString));
                        break;
                    case "plain":
                        break;
                }
            }
            if (section.length){
                $('#' + base.nameSpace + 'section' + index).html(section.join("<br>"));
            }
        },
        findLineInSection: function (search, sectionNum, startIndex, endIndex) {
            if (debug) { console.log('Finding Line In Section'); }
			if (search === '') {
				search = '^$';
			}
			var re = new RegExp(search);
            var section = this.log.sections[sectionNum];
            startIndex = startIndex != null ? startIndex : 0;
            endIndex = endIndex != null ? endIndex : section.length;
            var lineNum = false;
			if (typeof startIndex === 'string') {
				startIndex = this.findLineInSection(startIndex, sectionNum);
				if (startIndex === false) {
					return false;
				}
				startIndex++;
			}
			if (typeof endIndex === 'string') {
				endIndex = this.findLineInSection(endIndex, sectionNum);
				if (endIndex === false) {
					return false;
				}
			}
            $.each(section, function (index, value){
				if ((re.test(value)) && (index >= startIndex) && (index < endIndex)) {
				//if ((value === search || value.indexOf(search) !== -1) && (index >= startIndex) && (index < endIndex)) {
					lineNum = index;
					return false;
				}
            });
            return lineNum;
        },
		findLine: function (search, sectionNum, startIndex, endIndex) {
            if (debug) { console.log('Finding Line'); }
            var base = this;
            var logObj = this.log;
            var lineNum = false;
            if (sectionNum != null) {
                lineNum = this.findLineInSection(search, sectionNum, startIndex, endIndex);
            } else {
                $.each(this.log.sections, function (index, value){
                    lineNum = base.findLineInSection.apply(base, [search, index, startIndex, endIndex]);
                    if (lineNum !== false) {
                        sectionNum = index;
                        return false;
                    }
                });
            }
			return lineNum !== false ? {section: sectionNum, line: lineNum} : false;
		},
		addLine: function (value, sectionNum, lineNum) {
            if (debug) { console.log('Adding Line'); }
			sectionNum = sectionNum != null ? sectionNum : this.log.sections.length -1;
            var section = this.log.sections[sectionNum];
			lineNum = lineNum != null ? lineNum : section.length;
            //var cursorPos = this.$worklog[0].selectionStart;
			if (Array.isArray(value)) {
				section = section.slice(0, lineNum).concat(value).concat(section.slice(lineNum));
				
			} else {
				section.splice(lineNum, 0, value);
			}
            console.log(sectionNum);
            this.refreshSection(sectionNum);
		},
        setLine: function (lineNum, value, sectionNum) {
            if (debug) { console.log('Setting Line'); }
            this.log.sections[sectionNum][lineNum] = value;
            this.refreshSection(sectionNum);
        },
        setCurrentLine: function (value, section) {
            if (debug) { console.log('Setting Current Line'); }
            var lineNum = this.currentLine;
            if (this.log.firstLineTitle) {
                lineNum++;
            }
			this.setLine.apply(this, [lineNum, value, section]);
        },
		replace: function (findVal, replaceVal, sectionNum, startIndex, endIndex) {
            if (debug) { console.log('Replacing'); }
			var lineNum = this.findLine(findVal, sectionNum, startIndex, endIndex);
            if (debug) { console.log(lineNum); }
			if (lineNum !== false) {
                var re = new RegExp(findVal);
                if (debug) { console.log(this.log.sections[lineNum.section][lineNum.line]); }
                var oldVal = this.log.sections[lineNum.section][lineNum.line];
                var newVal = oldVal.replace(re, replaceVal);
				this.setLine(lineNum.line, newVal, lineNum.section);
				return lineNum;
			} else {
				return false;
			}
		},
		replaceLine: function (findVal, replaceVal, sectionNum, startIndex, endIndex) {
            if (debug) { console.log('Replacing Line'); }
			//findVal = findVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			//var re = new RegExp(findVal);
			var lineNum = this.findLine(findVal, sectionNum, startIndex, endIndex);
			if (lineNum !== false) {
				this.setLine(lineNum.line, replaceVal, lineNum.section);
				return lineNum;
			} else {
				return false;
			}
		},
		toArray: function () {
            if (debug) { console.log('toArray'); }
            var logArray = [];
            var logObject = $.extend(true, {}, this.log);
            var options = this.options;
            $.each(logObject.sections, function (index, value) {
                if (logObject.firstLineTitle){
                    switch(options.format) {
                        case "html":
                            var titleString = value.shift();
                            if (options.title.italics) {
                                titleString = '<i>' + titleString + '</i>';
                            }
                            if (options.title.underline) {
                                titleString = '<u>' + titleString + '</u>';
                            }
                            if (options.title.bold) {
                                titleString = '<b>' + titleString + '</b>';
                            }
                            logArray.push('<font color="' + options.title.color + '">' + titleString + '</font>');
                            break;
                        case "plain":
                            break;
                    }
                }
                if (value.length){
                    $.merge(logArray, value);
                    logArray.push("");
                }
            });
            if (logObject.sig !=  null){
                logArray.push('<b>' + logObject.sig + '</b>');
            }
			return logArray;
		},
		value: function () {
            if (debug) { console.log('value'); }
			return this.toArray().join('\n');
		}
	});
})( jQuery, window, document );