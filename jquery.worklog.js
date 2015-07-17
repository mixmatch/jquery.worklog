/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released as public domain.
 */
/*global jQuery, $*/
;
(function($, window, document, undefined) {
  var debug = false;
  $.widget('mixmatch.worklog', {
    //Options to be used as defaults
    options: {
      // These are the defaults.
      width: "650px", //CSS width
      height: "200px", //CSS height
      background: "#FFF",//CSS background
      format: "plain", //plain or html
      title: { //Section title formatting
          color: "#000",
          bold: true,
          underline: true,
          italics: false
      },
      fixMinHeight: false,
      template: false, //Log template to load
      autoSuggest: false, //Add Autosuggest
      autoFocus: false, //If set to true the first item will automatically be focused when the menu is shown.
      suggestLength: 24, //Number of values in autosuggest list
      editable: true //Is worklog editable?
    },
    _create: function() {
      //            if (debug) { console.log("_create"); }
      //            if (debug) { console.log(this.eventNamespace); }
      //            if (debug) { console.log(this.namespace); }
      //            if (debug) { console.log(this.widgetEventPrefix); }
      //            if (debug) { console.log(this.widgetFullName); }
      //            if (debug) { console.log(this.widgetName); }
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
      this.element.removeClass(this.nameSpace).text('');
      $(this.$worklogBody).off();
    },
    _setAutoSuggestLines: function() {
      if (debug) {
        console.log('setAutoSuggestLines');
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
    // http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container
    _getCaretOffsetHTML: function(element) {
      var caretOffset = 0;
      var doc = element.ownerDocument || element.document;
      var win = doc.defaultView || doc.parentWindow;
      var sel;
      var selHTML = null;
      if (typeof win.getSelection != 'undefined') {
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
      } else if ((sel = doc.selection) && sel.type != 'Control') {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint('EndToEnd', textRange);
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
        var tArray = $elem.html().replace(/(.*)<br>$/i, '$1').split('<br>');
        var position = $elem.html().substr(0, charOffset).split('<br>').length - 1;
        var lineHeight = parseInt($(elem).css('height'), 10) / (tArray.length || 1);
        var autocompletePos;
        if (position !== this.currentLine || this.showSuggest) {
          //                    if (debug) console.log(lineHeight);
          //                    if (debug) console.log(position);
          //                    if (debug) console.log(tArray[position]);
          autocompletePos = parseInt($(elem).css('padding-top'), 10) + ((position + 1) * lineHeight);
          $(elem).autocomplete('option', 'position', {
            my: 'right top',
            at: 'right top+' + autocompletePos,
            collision: 'none'
          }).autocomplete('search', tArray[position]);
          this.currentLine = position;
          this.showSuggest = false;
        }
      }
    },
    _upKey: function(event, base) {
      event.stopImmediatePropagation();
      var selection, range, offset, previous, domNode;
      if (base.currentLine === 0 || base.currentLine == null) {
        selection = window.getSelection();
        range = document.createRange();
        offset = selection.getRangeAt(0).startOffset;
        previous = base._prevEditable.apply(base, [base.focusedElem]);
        if (previous) {
          previous.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
          if (previous.hasClass('section')) {
            domNode = previous.contents().last()[0];
          } else {
            domNode = window.getSelection().getRangeAt(0).startContainer;
          }
          range.setStart(domNode, Math.min(offset, domNode.length));
          range.collapse(true);
          setTimeout(function() {
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }, 1);
        }
      }
    },
    _downKey: function(event, base) {
      event.stopImmediatePropagation();
      var lastLine, selection, range, offset, next, domNode;
      lastLine = $(base.focusedElem).html().replace(/(.*)<br>$/i, '$1').split('<br>').length - 1;
      if (base.currentLine === lastLine || base.currentLine == null) {
        selection = window.getSelection();
        range = document.createRange();
        selection.getRangeAt(0);
        offset = selection.getRangeAt(0).startOffset;
        next = base._nextEditable.apply(base, [base.focusedElem]);
        if (next) {
          next.focus().css('background-color', 'rgba( 255, 255, 255, 0.7)');
          domNode = window.getSelection().getRangeAt(0).startContainer;
          range.setStart(domNode, Math.min(offset, domNode.length));
          range.collapse(true);
          setTimeout(function() {
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }, 1);
        }
      }
    },
    _addAutoSuggest: function($section) {
      var base = this;
      var options = this.options;
      $($section).keydown(function(event) {
        var keyCode = $.ui.keyCode;
        if (event.keyCode == keyCode.UP) {
          base._upKey(event, base);
        } else if (event.keyCode == keyCode.DOWN) {
          base._downKey(event, base);
        }
      }).autocomplete({
        source: function(request, response) {
          var term = request.term.trim();
          var result = [];
          var firstWord = [];
          var inLine = [];
          var termIndex;
          $.each(base.autoSuggestLines, function(index, value) {
            if (firstWord.length >= options.suggestLength) {
              return false;
            }
            termIndex = value.toLowerCase().indexOf(term.toLowerCase());
            if (0 === termIndex) {
              if (value.trim() !== term) {
                firstWord.push(value);
              }
            } else if (0 < termIndex) {
              inLine.push(value);
            }
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
          base.setCurrentLine(ui.item.value, $('.section').index($(this)));
          base._trigger('edit');
          return false;
        },
        position: {
          my: 'right top',
          at: 'right bottom'
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
    },
    _createTextArea: function() {
      if (debug) {
        console.log('createTextArea');
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
          'box-sizing': 'border-box',
          padding: '2px',
          'border-radius': '5px',
          resize: 'none'
        }).append($('<div>', {
          id: this.nameSpace + 'header',
          css: {
            'margin-bottom': '5px',
            height: '18px',
            background: 'rgba(0,0,0,0.15)',
            'vertical-align': 'bottom',
            'border-radius': '4px',
            position: 'relative'
          }
        }).append($('<b>', {
          text: logObject.name + ' Work Log ',
          css: {
            padding: '3px',
            position: 'absolute',
            bottom: '0',
            left: '0'
          }
        })).append($('<button>', {
          id: this.nameSpace + 'addSectionBtn',
          text: 'Add Section',
          css: {
            'float': 'right'
          },
          type: 'button',
          click: function() {
            base.addSection(['Section Header', 'Section Lines']);
            base._trigger('edit');
          }
        })).append($('<div>', {
          id: this.nameSpace + 'headerFormat',
          css: {
            'float': 'right'
          }
        }).append($('<input>', {
          id: this.nameSpace + 'boldCheck',
          checked: options.title.bold,
          type: 'checkbox',
          change: function() {
            base.options.title.bold = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'boldCheck',
          html: '<b>B</b>'
        })).append($('<input>', {
          id: this.nameSpace + 'italicsCheck',
          checked: options.title.italics,
          type: 'checkbox',
          change: function() {
            options.title.italics = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'italicsCheck',
          html: '<i>I</i>'
        })).append($('<input>', {
          id: this.nameSpace + 'underlineCheck',
          checked: options.title.underline,
          type: 'checkbox',
          change: function() {
            options.title.underline = $(this).is(':checked');
            base._setTitleFormat.apply(base);
          }
        })).append($('<label>', {
          'for': this.nameSpace + 'underlineCheck',
          html: '<u>U</u>'
        })).append($('<input>', {
          id: this.nameSpace + 'titleColor',
          type: 'color',
          val: options.title.color,
          css: {
            width: '16px',
            height: '16px',
            'margin-left': '10px',
            padding: '0px 1px'
          },
          change: function() {
            options.title.color = $(this).val();
            base._setTitleFormat.apply(base);
          }
        })).buttonset())).append($('<div>', {
          id: this.nameSpace + 'body'
        }));
        $('#' + this.nameSpace + 'addSectionBtn').button();
        $('.ui-button', '#' + this.nameSpace + 'header')
          .not(':contains("Add Section")').css({
            height: '14px',
            width: '24px'
          });
        $('.ui-button-text', '#' + this.nameSpace + 'header').css({
          padding: '0px 2px',
          margin: '0px auto',
          'font-size': '0.9em'
        });
        this.$worklogBody = $('#' + this.nameSpace + 'body');
        $.each(logObject.sections, function(index, value) {
          base.addSection.apply(base, [value, index]);
        });
        if (logObject.sig != null) {
          base.$worklogBody.append($('<div>', {
            id: base.nameSpace + 'sig',
            'class': this.nameSpace + ' sig' + (base.options.editable ? ' editable': ''),
            contentEditable: base.options.editable
          }).html('<b>' + logObject.sig + '</b>'));
        }
      }
      $(this.$worklogBody).on('keydown', '.editable', function(event) {
        var keyCode = $.ui.keyCode;
        var section;
        var currentSelection;
        var lastLine;
        if (event.keyCode == keyCode.UP) {
          base._upKey(event, base);
        } else if (event.keyCode == keyCode.DOWN) {
          base._downKey(event, base);
        } else if (event.keyCode == keyCode.ENTER) {
          event.stopImmediatePropagation();
          if ($(this).hasClass('section')) {
            section = $('.section').index($(this));
            if (base.log.firstLineTitle) {
              lastLine = base.log.sections[section].length - 2;
            } else {
              lastLine = base.log.sections[section].length - 1;
            }
            if (base.currentLine !== lastLine) {
              document.execCommand('insertHTML', false, '<br><br>');
              currentSelection = window.getSelection();
              currentSelection.modify('move', 'backward', 'line');
            } else {
              document.execCommand('insertHTML', false, '<br><br>');
            }
          }
          return false;
         }
      }).on('paste', '.editable', function(event) {
        var origE = event.originalEvent;
        var pasteData;
        var text;
        if (origE && origE.clipboardData && origE.clipboardData.getData) {
          pasteData = origE.clipboardData.getData('text/plain');
          event.preventDefault();
          text = pasteData.replace(/\r?\n|\r/g, '<br>');
          document.execCommand('insertHTML', false, text);
        }
      }).on('input', '.editable', function() {
        var section;
        if ($(this).hasClass('title')) {
          section = $('.title').index($(this));
          base.log.sections[section][0] = this.innerText;
        } else if ($(this).hasClass('section')) {
          section = $('.section').index($(this));
          var d = base._capitalizeFirst(
            $(this).html().replace(/(.*)<br>$/i, '$1').split('<br>')
          );
          if (base.log.firstLineTitle) {
            base.log.sections[section] = [base.log.sections[section][0]].concat(d);
          } else {
            base.log.sections[section] = d;
          }
          base.refreshSectionBar(section);
        } else if ($(this).hasClass('sig')) {
          base.log.sig = this.innerText;
        }
        base.showSuggest = true;
        base._trigger('change');
        base._trigger('edit');
      }).on('mouseenter mouseleave', '.editable', function(event) {
        if (event.type === 'mouseenter') {
          $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
        } else {
          $(this).css('background-color', 'transparent');
        }
      }).on('focus', '.editable', function() {
        base.showSuggest = false;
        $(this).css('background-color', 'rgba( 255, 255, 255, 0.7)');
        base.focusedElem = this;
      }).on('blur', '.editable', function() {
        $(this).css('background-color', 'transparent');
        base.currentLine = null;
        base.focusedElem = null;
      }).on('mouseenter mouseleave', '.ui-icon-trash', function(event) {
        event.stopPropagation();
        if (event.type === 'mouseenter') {
          $(this).parent().css('background-color', 'rgba(255, 194, 194, 0.7)');
          $(this).parent().next()
            .css('background-color', 'rgba(255, 194, 194, 0.7)');
          $(this).parent().next().next()
            .css('background-color', 'rgba(255, 194, 194, 0.7)');
        } else {
          $(this).parent().css('background-color', 'transparent');
          $(this).parent().next().css('background-color', 'transparent');
          $(this).parent().next().next().css('background-color', 'transparent');
        }
      }).on('click', '.ui-icon-trash', function(event) {
        event.stopImmediatePropagation();
        logObject = $('.title').index($(this).parent());
        console.log(logObject);
        base.log.sections.splice(logObject, 1);
        console.log(base.log);
        $(this).parent().next().next().next().remove();
        $(this).parent().next().next().remove();
        $(this).parent().next().remove();
        $(this).parent().remove();
      });
    },
    _formatTitleHTML: function(text, formatting) {
      if (formatting.italics) {
        text = '<i>' + text + '</i>';
      }
      if (formatting.underline) {
        text = '<u>' + text + '</u>';
      }
      if (formatting.bold) {
        text = '<b>' + text + '</b>';
      }
      return '<font color="' + formatting.color + '">' + text + '</font><span class="' + this.nameSpace + ' ui-icon ui-icon-trash" style="cursor: pointer; float: right;"></span>';
    },
    _setTitleFormat: function() {
      var base = this;
      var logObject = this.log;
      var options = this.options;
      $.each(logObject.sections, function(index, value) {
        if (logObject.firstLineTitle) {
          switch (options.format) {
            case 'html':
              var titleString = value[0];
              var titleHTML = base._formatTitleHTML(titleString, options.title);
              $('.title:eq(' + index + ')').html(titleHTML);
              break;
            case 'plain':
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
      this.$element.text('');
      this._createTextArea();
    },
    addSection: function(value, index) {
      if (debug) {
        console.log('Adding Section');
      }
      if (index == null) {
        index = this.log.sections.length;
      }
      this.log.sections[index] = value.slice();
      var logObj = this.log;
      var options = this.options;
      if (logObj.firstLineTitle) {
        switch (options.format) {
          case 'html':
            var titleString = value.shift();
            $title = $('<div>', {
              'class': this.nameSpace + ' title' + (this.options.editable ? ' editable': ''),
              contentEditable: this.options.editable
            }).append(this._formatTitleHTML(titleString, options.title));
            if ($('.sig').length) {
              $('.sig').before($title);
            } else {
              this.$worklogBody.append($title);
            }
            break;
          case 'plain':
            break;
        }
      }
      if (value.length) {
        var $sectionBar = $('<div>', {
          'class': this.nameSpace + ' sectionBar',
          css: {
            'float': 'left',
            width: '13px'
          }
        });
        var $section = $('<div>', {
          'class': this.nameSpace + ' autosuggest section' + (this.options.editable ? ' editable': ''),
          contentEditable: this.options.editable,
          css: {
            overflow: 'hidden',
            'white-space': 'pre'
          },
          html: value.join('<br>') + '<br>'
        });
        if ($('.sig').length) {
          $('.sig').before($sectionBar).before($section).before('<br>');
        } else {
          this.$worklogBody.append($sectionBar).append($section).append('<br>');
        }
        if (options.autoSuggest) {
          this._addAutoSuggest($section);
        }
        if (this.options.editable) {
          this.refreshSectionBar(index);
        } else {
          $('#' + this.nameSpace + 'section' + index + 'bar').hide();
        }
      }
    },
    refreshSection: function(sectionNum) {
      var logObj = $.extend(true, {}, this.log);
      var section = logObj.sections[sectionNum];
      var options = this.options;
      if (logObj.firstLineTitle) {
        switch (options.format) {
          case 'html':
            logObj = section.shift();
            $('.title:eq(' + sectionNum + ')')
              .html(this._formatTitleHTML(logObj, options.title));
            break;
          case 'plain':
            break;
        }
      }
      if (section.length) {
        $('.section:eq(' + sectionNum + ')')
          .html(section.join('<br>') + '<br>');
        this.refreshSectionBar(sectionNum);
      }
    },
    refreshSectionBar: function(sectionNum) {
      var base = this;
      if (this.log.sections[sectionNum] == null) {
        return false;
      }
      if ($('.section:eq(' + sectionNum + ')').css('height') === '0px') {
        setTimeout(function() {
          base.refreshSectionBar(sectionNum);
        }, 1000);
        return  false;
      }
      var logObj = $.extend(true, {}, this.log);
      var section = logObj.sections[sectionNum];
      $('.sectionBar:eq(' + sectionNum + ')').html('');
      sectionLength = section.length;
      if (logObj.firstLineTitle) {
        sectionLength--;
      }
      var lineHeight = parseInt($('.section:eq(' + sectionNum + ')').css('height'), 10) / sectionLength;
      for (f = 0; f < sectionLength; f++) {
        $('.sectionBar:eq(' + sectionNum + ')').append($('<span>', {
          'class': base.nameSpace + ' ui-icon ui-icon-close deleteLine',
          css: {
            cursor: 'pointer',
            width: '13px',
            height: lineHeight + 'px'
          }
        }));
      }
      $('.sectionBar:eq(' + sectionNum + ')').css('height', $('.section:eq(' + sectionNum + ')').css('height'));
      $('.deleteLine').off('click').on('click', function() {
        var line = $('.deleteLine', $(this).parent()).index($(this));
        var section = $('.sectionBar').index($(this).parent());
        base.removeLine(section, line);
        base._trigger('edit');
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
      if (startIndex == null) {
        startIndex = 0;
      }
      if (endIndex == null) {
        endIndex = section.length;
      }
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
          lineNum = base.findLineInSection
            .apply(base, [search, index, startIndex, endIndex]);
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
      if (sectionNum == null) {
        sectionNum = this.log.sections.length - 1;
      }
      var section = this.log.sections[sectionNum];
      //lineNum = lineNum != null ? lineNum : section.length;
      if (lineNum == null) {
        if (section[section.length - 1] === '') {
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
      this._trigger('change');
    },
    setLine: function(lineNum, value, sectionNum) {
      if (debug) {
        console.log('Setting Line');
      }
      value = this._capitalizeFirst(value);
      this.log.sections[sectionNum][lineNum] = value;
      this.refreshSection(sectionNum);
      this._trigger('change');
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
      var sectionLength = this.log.sections[sectionNum].length;
      if (this.log.firstLineTitle) {
        index++;
        sectionLength--;
      }
      if (sectionLength > 1) {
        this.log.sections[sectionNum].splice(index, 1);
      } else {
        this.log.sections[sectionNum][index] = '';
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
              case 'html':
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
              case 'plain':
                break;
            }
          }
          if (value.length) {
            $.merge(logArray, value);
            logArray.push('');
          }
        });
        if (logObject.sig != null) {
          logArray.push('<b>' + logObject.sig + '</b>');
        }
      } else {
        if (logObject.firstLineTitle) {
          switch (options.format) {
            case 'html':
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
            case 'plain':
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
