/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */
/*jslint browser: true, devel: true, nomen: true, eqeq: true, plusplus: true, sloppy: true, white: true, maxerr: 999 */
/*global jQuery, $*/
;
(function($, window, document, undefined) {
  var debug = false;
  $.widget("mixmatch.worklog", {
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
      suggestLength: 24,
      editable: true
    },
    _create: function() {
      //            if (debug) { console.log("_create"); }
      //            if (debug) { console.log(this.eventNamespace); }
      //            if (debug) { console.log(this.namespace); }
      //            if (debug) { console.log(this.widgetEventPrefix); }
      //            if (debug) { console.log(this.widgetFullName); }
      //            if (debug) { console.log(this.widgetName); }
      this.nameSpace = this.eventNamespace.replace(/[.]/g, "");
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
    },
    _setOption: function(key, value) {
      this._super(key, value);
    },
    _setOptions: function(options) {
      this._super(options);
      this.refresh();
    },
    _blur: function() {
      this.$worklog.blur();
    },
    _constrain: function(value) {

    },
    _destroy: function() {
      this.element.removeClass(this.nameSpace).text("");
      $(this.$worklogBody).off();
    },
    _setAutoSuggestLines: function() {
      if (debug) {
        console.log("setAutoSuggestLines");
      }
      if (this.options.autoSuggest) {
        var base = this;
        $.each(this.options.autoSuggest, function(index, value) {
          //if (debug) console.log(that);
          base.autoSuggestLines.push(value.line);
        });
      }
    },
    _prevEditable: function(elem) {
      //            if (debug) console.log(elem);
      var prevElem = $(elem).prev('.editable');
      if (prevElem.length) {
        return prevElem;
      } else if ($(elem).prev().length) {
        return this._prevEditable.apply(this, $(elem).prev());
      } else if ($(elem).parent().length) {
        return this._prevEditable.apply(this, $(elem).parent());
      } else {
        return false;
      }
    },
    _nextEditable: function(elem) {
      //            if (debug) console.log(elem);
      var nextElem = $(elem).next('.editable');
      if (nextElem.length) {
        return nextElem;
      } else if ($(elem).next().length) {
        return this._nextEditable.apply(this, $(elem).next());
      } else if ($(elem).parent().length) {
        return this._nextEditable.apply(this, $(elem).parent());
      } else {
        return false;
      }
    },
    _getCaretOffsetHTML: function(element) {
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
      } else if (sel = doc.selection && sel.type != "Control") {
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
    _checkCursorPosition: function() {
      var elem = this.focusedElem;
      var $elem = $(elem);
      if (this.options.autoSuggest && elem != null) {
        var charOffset = this._getCaretOffsetHTML(elem);
        var tArray = $elem.html().replace(/(.*)<br>$/i, "$1").split("<br>");
        var position = $elem.html().substr(0, charOffset).split("<br>").length - 1;
        var lineHeight = parseInt($(elem).css("height"), 10) / (tArray.length || 1);
        var autocompletePos;
        if (position !== this.currentLine || this.showSuggest) {
          //                    if (debug) console.log(lineHeight);
          //                    if (debug) console.log(position);
          //                    if (debug) console.log(tArray[position]);
          autocompletePos = parseInt($(elem).css("padding-top"), 10) + ((position + 1) * lineHeight);
          $(elem).autocomplete("option", "position", {
            my: "right top",
            at: "right top+" + autocompletePos,
            collision: "none"
          }).autocomplete("search", tArray[position]);
          this.currentLine = position;
          this.showSuggest = false;
        }
      }
    },
    _upKey: function(event, base) {
      event.stopImmediatePropagation();
      var c, e, f;
      if (0 === base.currentLine || null == base.currentLine) {
        if (c = window.getSelection(), e = document.createRange(), c.getRangeAt(0), c = c.getRangeAt(0).startOffset, f = base._prevEditable.apply(base, [base.focusedElem])) f.focus().css("background-color", "rgba( 255, 255, 255, 0.7)"), f = f.hasClass("section") ? f.contents().last()[0] : window.getSelection().getRangeAt(0).startContainer, e.setStart(f, Math.min(c, f.length)), e.collapse(true), setTimeout(function() {
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(e);
        }, 1)
      }
    },
    _downKey: function(event, base) {
      event.stopImmediatePropagation();
      var d, e, f;
      d = $(base.focusedElem).html().replace(/(.*)<br>$/i, "$1").split("<br>").length - 1;
      if (base.currentLine === d || null == base.currentLine) {
        if (d = window.getSelection(), e = document.createRange(), d.getRangeAt(0), d = d.getRangeAt(0).startOffset, f = base._nextEditable.apply(base, [base.focusedElem])) f.focus().css("background-color", "rgba( 255, 255, 255, 0.7)"), f = window.getSelection().getRangeAt(0).startContainer, e.setStart(f, Math.min(d, f.length)), e.collapse(true), setTimeout(function() {
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(e);
        }, 1)
      }
    },
    _addAutoSuggest: function($section) {
      var base = this;
      var options = this.options;
      $($section).keydown(function(event) {
        var keyCode = $.ui.keyCode;
        event.keyCode == keyCode.UP ? base._upKey(event, base) : event.keyCode == keyCode.DOWN && base._downKey(event, base)
      }).autocomplete({
        source: function(request, response) {
          var term = request.term.trim();
          var result = [];
          var firstWord = [];
          var inLine = [];
          $.each(base.autoSuggestLines, function(index, value) {
            if (firstWord.length >= options.suggestLength) return false;
            var termIndex = value.toLowerCase().indexOf(term.toLowerCase());
            0 === termIndex ? value.trim() !== term && firstWord.push(value) : 0 < termIndex && inLine.push(value);
          });
          firstWord = firstWord.slice(0, options.suggestLength);
          inLine = inLine.slice(0, options.suggestLength - firstWord.length);
          result = result.concat(firstWord).concat(inLine);
          response(result);
        },
        focus: function(event, ui) {
          return false;
        },
        select: function(event, ui) {
          base.setCurrentLine(ui.item.value, $(".section").index($(this)));
          base._trigger("edit");
          return false;
        },
        position: {
          my: "right top",
          at: "right bottom"
        },
        delay: 0,
        autoFocus: this.options.autoFocus
      }).focus(function() {
        base.checkInterval = setInterval(function() {
          base._checkCursorPosition();
        }, 100)
      }).blur(function() {
        clearInterval(base.checkInterval);
      })
    },
    _createTextArea: function() {
      if (debug) {
        console.log("createTextArea");
      }
      //for callbacks that need this scope
      var base = this;
      var templateHtml = '';
      var log = this.log || this.options.template;
      var logObject = $.extend(true, {}, log);
      if (debug) {
        console.log(logObject);
      }
      var options = this.options;
      if (logObject) {
        this.$element.css({
          width: options.width,
          height: options.height,
          background: options.background,
          "box-sizing": "border-box",
          padding: "2px",
          "border-radius": "5px",
          resize: "none"
        }).append($("<div>", {
          id: this.nameSpace + "header",
          css: {
            "margin-bottom": "5px",
            height: "18px",
            background: "rgba(0,0,0,0.15)",
            "vertical-align": "bottom",
            "border-radius": "4px",
            position: "relative"
          }
        }).append($("<b>", {
          text: logObject.name + " Work Log ",
          css: {
            padding: "3px",
            position: "absolute",
            bottom: "0",
            left: "0"
          }
        })).append($("<button>", {
          id: this.nameSpace + "addSectionBtn",
          text: "Add Section",
          css: {
            "float": "right"
          },
          type: "button",
          click: function() {
            base.addSection(["Section Header", "Section Lines"]);
            base._trigger("edit")
          }
        })).append($('<div>', {
          'id': this.nameSpace + 'headerFormat',
          'css': {
            'float': 'right'
          }
        }).append($('<input>', {
          'id': this.nameSpace + 'boldCheck',
          'checked': options.title.bold,
          'type': 'checkbox',
          'change': function() {
            base.options.title.bold = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'boldCheck',
          'html': '<b>B</b>'
        })).append($('<input>', {
          'id': this.nameSpace + 'italicsCheck',
          'checked': options.title.italics,
          'type': 'checkbox',
          'change': function() {
            options.title.italics = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'italicsCheck',
          'html': '<i>I</i>'
        })).append($('<input>', {
          'id': this.nameSpace + 'underlineCheck',
          'checked': options.title.underline,
          'type': 'checkbox',
          'change': function() {
            options.title.underline = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'underlineCheck',
          'html': '<u>U</u>'
        })).append($('<input>', {
          'id': this.nameSpace + 'titleColor',
          'type': 'color',
          'val': options.title.color,
          'css': {
            'width': '16px',
            'height': '16px',
            'margin-left': '10px',
            'padding': '0px 1px'
          },
          'change': function() {
            options.title.color = $(this).val();
            base._setTitleFormat.apply(base);
            //that.options.title.underline = $(this).is(':checked');
          }
        })).buttonset())).append($('<div>', {
          'id': this.nameSpace + 'body'
        }));
        $('.ui-button', '#' + this.nameSpace + 'header').css({
          "height": "14px",
          "width": "24px"
        });
        $('.ui-button-text', '#' + this.nameSpace + 'header').css({
          "padding": "0px 2px",
          "margin": "0px auto",
          'font-size': '0.9em'
        });

        this.$worklogBody = $('#' + this.nameSpace + 'body');
        $.each(logObject.sections, function(index, value) {
          base.addSection.apply(base, [index, value]);
        });
        if (logObject.sig != null) {
          base.$worklogBody.append($('<div>', {
            'id': base.nameSpace + 'sig',
            'class': base.options.editable ? 'editable' : null
          }).data({
            type: 'sig',
            base: base
          }).html('<b>' + logObject.sig + '</b>'));
        }
      }
      $('.editable').attr('contentEditable', 'true').css('white-space', 'pre').keydown(function(event) {
        var keyCode = $.ui.keyCode;
        var action = null;
        var currentSelection, range, elem, caretStart, currentNode;
        if (event.keyCode == keyCode.UP) {
          //if (debug) console.log("Up");
          event.stopImmediatePropagation();
          if (base.currentLine === 0 || base.currentLine == null) {
            currentSelection = window.getSelection();
            range = document.createRange();
            elem = currentSelection.getRangeAt(0).startContainer.parentElement;
            caretStart = currentSelection.getRangeAt(0).startOffset;
            var $prevElem = base._prevEditable.apply(base, [base.focusedElem]);
            if ($prevElem) {
              $prevElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
              if ($prevElem.data('type') === 'section') {
                currentNode = $prevElem.contents().last()[0];
              } else {
                currentNode = window.getSelection().getRangeAt(0).startContainer;
              }
              if (debug) {
                console.log(currentNode);
              }
              range.setStart(currentNode, Math.min(caretStart, currentNode.length));
              range.collapse(true);
              setTimeout(function() {
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
            var $nextElem = base._nextEditable.apply(base, [base.focusedElem]);
            if ($nextElem) {
              $nextElem.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
              currentNode = window.getSelection().getRangeAt(0).startContainer
              range.setStart(currentNode, Math.min(caretStart, currentNode.length));
              range.collapse(true);
              setTimeout(function() {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              }, 1);
            }
          }
        } else if (event.keyCode == keyCode.ENTER) {
          event.stopImmediatePropagation();
          if ($(this).data('type') === 'section') {
            if (debug) console.log($(this).data('index'));
            if (debug) console.log(base.log.sections[$(this).data('index')]);
            if (debug) console.log(base.log.sections[$(this).data('index')].length - 2);
            if (debug) console.log(base.currentLine);
            var lastLine;
            if (base.log.firstLineTitle) {
              lastLine = base.log.sections[$(this).data('index')].length - 2;
            } else {
              lastLine = base.log.sections[$(this).data('index')].length - 1;
            }
            if (base.currentLine !== lastLine) {
              document.execCommand('insertHTML', false, '<br><br>');
              currentSelection = window.getSelection();
              currentSelection.modify('move', 'backward', 'line');
              //                            if (debug) console.log(currentSelection);
              //                            if (debug) console.log(range);
              //                            if (debug) console.log(currentNode);
            } else {
              document.execCommand('insertHTML', false, '<br><br>');
            }
            //                        if (base.currentLine === base.log.sections[$(this).data('index')].length - 2) {
            //                            if (debug) console.log('<br><br>');
            //                            document.execCommand('insertHTML', false, '<br><br>');
            //                        } else {
            //                            if (debug) console.log('<br>');
            //                            document.execCommand('insertHTML', false, '<br>');
            //                        }
          }
          return false;
        }
      }).on('paste', function(e) {
        if (debug) {
          console.log(e.originalEvent.clipboardData.getData("text/plain"));
        }
        var origE = e.originalEvent;
        if (origE && origE.clipboardData && origE.clipboardData.getData) {
          var pasteData = origE.clipboardData.getData("text/plain");
          e.preventDefault();
          var text = pasteData.replace(/\r?\n|\r/g, '<br>');
          if (debug) {
            console.log(text);
          }
          document.execCommand("insertHTML", false, text);
        }
      }).on('input', function() {
        //if (debug) { console.log(this.innerText); }
        //if (debug) { console.log($(this).data()); }
        var elemObj = $(this).data();
        switch (elemObj.type) {
          case 'title':
            base.log.sections[elemObj.index][0] = this.innerText;
            break;
          case 'section':
            //$(this).find('*:not(br)').contents().unwrap();
            var sectionText = base._capitalizeFirst($(this).html().replace(/(.*)<br>$/i, "$1").split("<br>"));
            if (base.log.firstLineTitle) {
              base.log.sections[elemObj.index] = [base.log.sections[elemObj.index][0]].concat(sectionText);
            } else {
              base.log.sections[elemObj.index] = sectionText;
            }
            base.refreshSectionBar(elemObj.index);
            break;
          case 'sig':
            base.log.sig = this.innerText;
            break;
        }
        base.showSuggest = true;
        base._trigger("change");
        base._trigger("edit");
      }).hover(function(e) {
        if (e.type === "mouseenter") {
          $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
        } else if ($(base.focusedElem).attr('id') != $(this).attr('id')) {
          $(this).css('background-color', 'transparent');
        }
      }).focus(function() {
        base.showSuggest = false;
        $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
        base.focusedElem = this;
      }).blur(function() {
        $(this).css('background-color', 'transparent');
        base.currentLine = null;
        base.focusedElem = null;
      });
      if (options.autoSuggest) {
        $('.autosuggest').autocomplete({
          source: function(request, response) {
            var term = request.term.trim();
            if (debug) {
              console.log(term);
            }
            var result = [];
            var firstWord = [];
            var inLine = [];
            $.each(base.autoSuggestLines, function(index, value) {
              if (firstWord.length >= options.suggestLength) {
                if (debug) {
                  console.log("Max suggestions reached");
                }
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
            firstWord = firstWord.slice(0, options.suggestLength);
            inLine = inLine.slice(0, options.suggestLength - firstWord.length);
            //suggestLength
            result = result.concat(firstWord).concat(inLine);
            //                        if (result.length === 1 && result[0].trim() === term) {
            //                            result = [];
            //                        }
            response(result); //this will show in the selection box.
            //response(term);
          },
          focus: function(event, ui) {
            return false;
          },
          select: function(event, ui) {
            if (debug) {
              console.log("Select");
            }
            //if (debug) { console.log(event); }
            if (debug) {
              console.log(ui.item.value);
            }
            base.setCurrentLine(ui.item.value, $(this).data().index);
            base._trigger("edit");
            return false;
          },
          position: {
            my: "right top",
            at: "right bottom"
          },
          delay: 0,
          autoFocus: this.options.autoFocus
        }).focus(function() {
          base.checkInterval = setInterval(function() {
            base._checkCursorPosition();
          }, 100);
        }).blur(function() {
          clearInterval(base.checkInterval);
        });
      }
      //$(':focus').css('background-color', 'rgba( 255, 255, 255, 0.7)');
    },
    _setTitleFormat: function() {
      if (debug) {
        console.log('Setting Title Format');
      }
      if (debug) {
        console.log(this.log);
      }
      var logObject = this.log;
      var options = this.options;
      var nameSpace = this.nameSpace;
      $.each(logObject.sections, function(index, value) {
        if (logObject.firstLineTitle) {
          switch (options.format) {
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
    _capitalizeFirst: function(text) {
      if (Array.isArray(text)) {
        var base = this;
        $.each(text, function(index, value) {
          text[index] = base._capitalizeFirst(value);
        });
        return text;
      } else {
        return text.charAt(0).toUpperCase() + text.slice(1);
      }
    },
    refresh: function() {
      //this.$element.html("");
      this.$element.text("");
      this._createTextArea();
    },
    addSection: function(index, value) {
      if (debug) {
        console.log('Adding Section');
      }
      //if (debug) { console.log(value); }
      var base = this;
      var logObj = this.log;
      var options = this.options;
      if (logObj.firstLineTitle) {
        switch (options.format) {
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
              'id': base.nameSpace + 'title' + index,
              'class': base.options.editable ? 'editable' : null
            }).append($('<font color="' + options.title.color + '">').html(titleString)).data({
              type: 'title',
              index: index,
              base: base
            }));
            break;
          case "plain":
            break;
        }
      }
      if (value.length) {
        base.$worklogBody.append($('<div>', {
          'id': base.nameSpace + 'section' + index + 'bar',
          'css': {
            'float': 'left',
            width: '13px'
          }
        })).append($('<div>', {
          'id': base.nameSpace + 'section' + index,
          'class': base.options.editable ? 'editable autosuggest' : null,
          'css': {
            'overflow': 'hidden'
          },
          'data': {
            type: 'section',
            index: index,
            base: base
          },
          'html': value.join('<br>') + '<br>'
        })).append('<br>');
        base.refreshSectionBar(index);
      }
      if (!base.options.editable) {
        $('#' + base.nameSpace + 'section' + index + 'bar').hide();
      }
    },
    refreshSection: function(sectionNum) {
      if (debug) {
        console.log('Refreshing Section');
      }
      if (debug) {
        console.log(this.log.sections[sectionNum]);
      }
      var base = this;
      var logObj = $.extend(true, {}, this.log);
      var section = logObj.sections[sectionNum];
      var options = this.options;
      if (logObj.firstLineTitle) {
        switch (options.format) {
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
            $('#' + base.nameSpace + 'title' + sectionNum).html($('<font color="' + options.title.color + '">').html(titleString));
            break;
          case "plain":
            break;
        }
      }
      if (section.length) {
        $('#' + base.nameSpace + 'section' + sectionNum).html(section.join("<br>") + '<br>');
        base.refreshSectionBar(sectionNum);
      }
    },
    refreshSectionBar: function(sectionNum) {
      if (debug) {
        console.log('Refreshing Section Bar');
      }
      var base = this;
      var logObj = $.extend(true, {}, this.log);
      var section = logObj.sections[sectionNum];
      $('#' + this.nameSpace + 'section' + sectionNum + 'bar').html("");
      var sectionLength = section.length;
      if (logObj.firstLineTitle) {
        sectionLength--;
      }
      for (var i = 0; i < sectionLength; i++) {
        if (debug) console.log(parseInt($('#' + this.nameSpace + 'section' + sectionNum).css('height'), 10) / sectionLength);
        $('#' + this.nameSpace + 'section' + sectionNum + 'bar').append($('<span>', {
          'class': 'ui-icon ui-icon-close deleteLine',
          'css': {
            'cursor': 'pointer',
            'width': '13px',
            'height': parseInt($('#' + this.nameSpace + 'section' + sectionNum).css('height'), 10) / sectionLength
          },
          'data': {
            section: sectionNum,
            line: i
          }
        }));
      }
      $('#' + this.nameSpace + 'section' + sectionNum + 'bar')
        .css('height', $('#' + this.nameSpace + 'section' + sectionNum).css('height'));
      $('.deleteLine').off('click').on('click', function() {
        var objData = $(this).data();
        if (debug) console.log(objData);
        base.removeLine(objData.section, objData.line);
        base._trigger("edit");
      });
    },
    findLineInSection: function(search, sectionNum, startIndex, endIndex) {
      if (debug) {
        console.log('Finding Line In Section');
      }
      if (search === '') {
        search = '^$';
      }
      var re = new RegExp(search, 'i');
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
      $.each(section, function(index, value) {
        if ((re.test(value)) && (index >= startIndex) && (index < endIndex)) {
          //if ((value === search || value.indexOf(search) !== -1) && (index >= startIndex) && (index < endIndex)) {
          lineNum = index;
          return false;
        }
      });
      return lineNum;
    },
    findLine: function(search, sectionNum, startIndex, endIndex) {
      if (debug) {
        console.log('Finding Line');
      }
      var base = this;
      var logObj = this.log;
      var lineNum = false;
      if (sectionNum != null) {
        lineNum = this.findLineInSection(search, sectionNum, startIndex, endIndex);
      } else {
        $.each(this.log.sections, function(index, value) {
          lineNum = base.findLineInSection.apply(base, [search, index, startIndex, endIndex]);
          if (lineNum !== false) {
            sectionNum = index;
            return false;
          }
        });
      }
      return lineNum !== false ? {
        section: sectionNum,
        line: lineNum
      } : false;
    },
    addLine: function(value, sectionNum, lineNum) {
      if (debug) {
        console.log('Adding Line');
      }
      value = this._capitalizeFirst(value);
      sectionNum = sectionNum != null ? sectionNum : this.log.sections.length - 1;
      var section = this.log.sections[sectionNum];
      //lineNum = lineNum != null ? lineNum : section.length;
      if (lineNum == null) {
        if (section[section.length - 1] === "") {
          section.pop();
        }
        lineNum = section.length;
      }
      //var cursorPos = this.$worklog[0].selectionStart;
      if (Array.isArray(value)) {
        if (debug) {
          console.log('Adding Line');
        }
        section = section.slice(0, lineNum).concat(value).concat(section.slice(lineNum));

      } else {
        section.splice(lineNum, 0, value);
      }
      this.log.sections[sectionNum] = section;
      this.refreshSection(sectionNum);
      this._trigger("change");
    },
    setLine: function(lineNum, value, sectionNum) {
      if (debug) {
        console.log('Setting Line');
      }
      value = this._capitalizeFirst(value);
      this.log.sections[sectionNum][lineNum] = value;
      this.refreshSection(sectionNum);
      this._trigger("change");
    },
    setCurrentLine: function(value, section) {
      if (debug) {
        console.log('Setting Current Line');
      }
      var lineNum = this.currentLine;
      if (this.log.firstLineTitle) {
        lineNum++;
      }
      this.setLine.apply(this, [lineNum, value, section]);
    },
    replace: function(findVal, replaceVal, sectionNum, startIndex, endIndex) {
      if (debug) {
        console.log('Replacing');
        console.log(replaceVal);
      }
      var lineNum = this.findLine(findVal, sectionNum, startIndex, endIndex);
      var newVal;
      var base = this;
      if (debug) {
        console.log(lineNum);
      }
      if (lineNum !== false) {
        var re = new RegExp(findVal, 'i');
        if (debug) {
          console.log(this.log.sections[lineNum.section][lineNum.line]);
        }
        var oldVal = this.log.sections[lineNum.section][lineNum.line];
        if (Array.isArray(replaceVal)) {
          newVal = oldVal.replace(re, replaceVal.shift());
          this.setLine(lineNum.line, newVal, lineNum.section);
          $.each(replaceVal, function(index, value) {
            base.addLine(value, lineNum.section);
          });
        } else {
          newVal = oldVal.replace(re, replaceVal);
          this.setLine(lineNum.line, newVal, lineNum.section);
        }
        return lineNum;
      } else {
        return false;
      }
    },
    replaceLine: function(findVal, replaceVal, sectionNum, startIndex, endIndex) {
      if (debug) {
        console.log('Replacing Line');
      }
      var lineNum = this.findLine(findVal, sectionNum, startIndex, endIndex);
      if (lineNum !== false) {
        this.setLine(lineNum.line, replaceVal, lineNum.section);
        return lineNum;
      } else {
        return false;
      }
    },
    removeLine: function(sectionNum, index) {
      if (debug) {
        console.log('Removing Line');
        console.log(sectionNum);
        console.log(index);
      }
      var section = this.log.sections[sectionNum];
      var sectionLength = section.length;
      if (this.log.firstLineTitle) {
        index++;
        sectionLength--;
      }
      if (sectionLength > 1) {
        this.log.sections[sectionNum].splice(index, 1);
      } else {
        this.log.sections[sectionNum][index] = "";
      }
      this.refreshSection(sectionNum);
    },
    toArray: function(sectionNum) {
      if (debug) {
        console.log('toArray');
      }
      var logArray = [];
      var logObject = $.extend(true, {}, this.log);
      var options = this.options;
      if (sectionNum == null) {
        $.each(logObject.sections, function(index, value) {
          if (logObject.firstLineTitle) {
            switch (options.format) {
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
          if (value.length) {
            $.merge(logArray, value);
            logArray.push("");
          }
        });
        if (logObject.sig != null) {
          logArray.push('<b>' + logObject.sig + '</b>');
        }
      } else {
        if (logObject.firstLineTitle) {
          switch (options.format) {
            case "html":
              var titleString = logObject.sections[sectionNum].shift();
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
        if (logObject.sections[sectionNum].length) {
          $.merge(logArray, logObject.sections[sectionNum]);
        }
      }
      return logArray;
    },
    value: function(sectionNum) {
      if (debug) {
        console.log('value');
      }
      return this.toArray(sectionNum).join('\n');
    },
    logObj: function() {
      return this.log;
    }
  });
})(jQuery, window, document);
