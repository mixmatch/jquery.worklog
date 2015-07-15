/*
 *  Project: jquery.worklog.js
 *  Description: Worklog with templating + autogrow + autosuggest
 *  Author: Daniel Petty
 *  License: This is free and unencumbered software released into the public domain.
 */
/*jslint browser: true, devel: true, nomen: true, eqeq: true, plusplus: true, sloppy: true, white: true, maxerr: 999 */
/*global jQuery, $*/

 ; (function ($, window, document, undefined) {
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
            if (debug) { console.log("setAutoSuggestLines"); }
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
        _nextEditable: function(elem) {
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
        _upKey: function(event, base) {
            event.stopImmediatePropagation();
            var c, e, f;
            if (0 === base.currentLine || null == base.currentLine)
                if (c = window.getSelection(), e = document.createRange(), c.getRangeAt(0), c = c.getRangeAt(0).startOffset, f = base._prevEditable.apply(base, [base.focusedElem])) f.focus().css("background-color", "rgba( 255, 255, 255, 0.7)"), f = f.hasClass("section") ? f.contents().last()[0] : window.getSelection().getRangeAt(0).startContainer, e.setStart(f, Math.min(c, f.length)), e.collapse(true), setTimeout(function() {
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(e);
                }, 1)
        },
        _downKey: function(event, base) {
            event.stopImmediatePropagation();
            var d, e, f;
            d = $(base.focusedElem).html().replace(/(.*)<br>$/i, "$1").split("<br>").length - 1;
            if (base.currentLine === d || null == base.currentLine)
                if (d = window.getSelection(), e = document.createRange(), d.getRangeAt(0), d = d.getRangeAt(0).startOffset, f = base._nextEditable.apply(base, [base.focusedElem])) f.focus().css("background-color", "rgba( 255, 255, 255, 0.7)"), f = window.getSelection().getRangeAt(0).startContainer, e.setStart(f, Math.min(d, f.length)), e.collapse(true), setTimeout(function() {
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(e);
                }, 1)
        },
        _addAutoSuggest: function(a) {
            var base = this,
                d = this.options;
            $(a).keydown(function(a) {
                var d = $.ui.keyCode;
                a.keyCode == d.UP ? base._upKey(a, base) : a.keyCode == d.DOWN && base._downKey(a, base)
            }).autocomplete({
                source: function(a, f) {
                    var g = a.term.trim(),
                        m = [],
                        h = [],
                        k = [];
                    $.each(base.autoSuggestLines, function(a, b) {
                        if (h.length >= d.suggestLength) return false;
                        var c = b.toLowerCase().indexOf(g.toLowerCase());
                        0 === c ? b.trim() !== g && h.push(b) : 0 < c && k.push(b)
                    });
                    h = h.slice(0, d.suggestLength);
                    k = k.slice(0, d.suggestLength -
                        h.length);
                    m = m.concat(h).concat(k);
                    f(m)
                },
                focus: function(a, base) {
                    return false
                },
                select: function(a, d) {
                    base.setCurrentLine(d.item.value, $(".section").index($(this)));
                    base._trigger("edit");
                    return false
                },
                position: {
                    my: "right top",
                    at: "right bottom"
                },
                delay: 0,
                autoFocus: this.options.autoFocus
            }).focus(function() {
                base.checkInterval = setInterval(function() {
                    base._checkCursorPosition()
                }, 100)
            }).blur(function() {
                clearInterval(base.checkInterval)
            })
        },
        _createTextArea: function() {
            if (debug) { console.log("createTextArea"); }
            //for callbacks that need this scope
            var base = this;
            var templateHtml = '';
            var log = this.log || this.options.template;
            var logObject = $.extend(true, {}, log);
            if (debug) { console.log(logObject); }
            var options  = this.options;
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
              })).append($("<div>", {
                  id: this.nameSpace + "headerFormat",
                  css: {
                      "float": "right"
                  }
              }).append($("<input>", {
                  id: this.nameSpace + "boldCheck",
                  checked: options.title.bold,
                  type: "checkbox",
                  change: function() {
                      base.options.title.bold = $(this).is(":checked");
                      base._setTitleFormat.apply(base)
                  }
              })).append($("<label>", {
                  "for": this.nameSpace + "boldCheck",
                  html: "<b>B</b>"
              })).append($("<input>", {
                  id: this.nameSpace +
                      "italicsCheck",
                  checked: options.title.italics,
                  type: "checkbox",
                  change: function() {
                      options.title.italics = $(this).is(":checked");
                      base._setTitleFormat.apply(base)
                  }
              })).append($("<label>", {
                  "for": this.nameSpace + "italicsCheck",
                  html: "<i>I</i>"
              })).append($("<input>", {
                  id: this.nameSpace + "underlineCheck",
                  checked: options.title.underline,
                  type: "checkbox",
                  change: function() {
                      options.title.underline = $(this).is(":checked");
                      base._setTitleFormat.apply(base)
                  }
              })).append($("<label>", {
                  "for": this.nameSpace + "underlineCheck",
                  html: "<u>U</u>"
              })).append($("<input>", {
                  id: this.nameSpace + "titleColor",
                  type: "color",
                  val: options.title.color,
                  css: {
                      width: "16px",
                      height: "16px",
                      "margin-left": "10px",
                      padding: "0px 1px"
                  },
                  change: function() {
                      options.title.color = $(this).val();
                      base._setTitleFormat.apply(base)
                  }
              })).buttonset())).append($("<div>", {
                  id: this.nameSpace + "body"
              }));
              $("#" + this.nameSpace + "addSectionBtn").button();
              $(".ui-button", "#" + this.nameSpace + "header").not(':contains("Add Section")').css({
                  height: "14px",
                  width: "24px"
              });
              $(".ui-button-text", "#" + this.nameSpace + "header").css({
                  padding: "0px 2px",
                  margin: "0px auto",
                  "font-size": "0.9em"
              });
              this.$worklogBody = $("#" + this.nameSpace + "body");
              $.each(logObject.sections, function(index, value) {
                  base.addSection.apply(base, [value, index]);
              });
              if (logObject.sig !=  null) {
                  base.$worklogBody.append($("<div>", {
                      id: base.nameSpace + "sig",
                      "class": this.nameSpace + " editable sig",
                      contentEditable: base.options.editable
                  }).html("<b>" + logObject.sig + "</b>"));
              }
            }
            $(this.$worklogBody).on("keydown", ".editable", function(event) {
                var keyCode = $.ui.keyCode;
                if (event.keyCode == keyCode.UP) {
                  base._upKey(event, base);
                } else if (event.keyCode == keyCode.DOWN) {
                  base._downKey(event, base);
                } else if (event.keyCode == keyCode.ENTER) return event.stopImmediatePropagation(),
                    $(this).hasClass("section") && (b = $(".section").index($(this)), base.currentLine !== (base.log.firstLineTitle ? base.log.sections[b].length - 2 : base.log.sections[b].length - 1) ? (document.execCommand("insertHTML", false, "<br><br>"), b = window.getSelection(), b.modify("move", "backward", "line")) : document.execCommand("insertHTML", false, "<br><br>")), false
            }).on("paste", ".editable", function(event) {
                var b = event.originalEvent;
                b && b.clipboardData && b.clipboardData.getData && (b = b.clipboardData.getData("text/plain"), event.preventDefault(), a = b.replace(/\r?\n|\r/g, "<br>"), document.execCommand("insertHTML", false, a))
            }).on("input", ".editable", function() {
                var b;
                if ($(this).hasClass("title")) {
                  b = $(".title").index($(this));
                  base.log.sections[b][0] = this.innerText;
                } else if ($(this).hasClass("section")) {
                    b = $(".section").index($(this));
                    var d = base._capitalizeFirst($(this).html().replace(/(.*)<br>$/i, "$1").split("<br>"));
                    base.log.sections[b] = base.log.firstLineTitle ? [base.log.sections[b][0]].concat(d) : d;
                    base.refreshSectionBar(b)
                } else $(this).hasClass("sig") && (base.log.sig = this.innerText);
                base.showSuggest = true;
                base._trigger("change");
                base._trigger("edit")
            }).on("mouseenter mouseleave", ".editable", function(event) {
                if (event.type === "mouseenter"){
                  $(this).css("background-color", "rgba( 255, 255, 255, 0.7)");
                } else {
                  $(this).css("background-color", "transparent");
                }
            }).on("focus", ".editable", function() {
                base.showSuggest = false;
                $(this).css("background-color", "rgba( 255, 255, 255, 0.7)");
                base.focusedElem = this;
            }).on("blur", ".editable", function() {
                $(this).css("background-color", "transparent");
                base.currentLine = null;
                base.focusedElem = null;
            }).on("mouseenter mouseleave", ".ui-icon-trash", function(event) {
                event.stopPropagation();
                if (event.type === "mouseenter"){
                  $(this).parent().css("background-color", "rgba(255, 194, 194, 0.7)");
                  $(this).parent().next().css("background-color", "rgba(255, 194, 194, 0.7)");
                  $(this).parent().next().next().css("background-color", "rgba(255, 194, 194, 0.7)");
                } else {
                  $(this).parent().css("background-color", "transparent");
                  $(this).parent().next().css("background-color", "transparent");
                  $(this).parent().next().next().css("background-color", "transparent");
                }
            }).on("click", ".ui-icon-trash", function(event) {
                event.stopImmediatePropagation();
                logObject = $(".title").index($(this).parent());
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
            formatting.italics && (text = "<i>" + text + "</i>");
            formatting.underline && (text = "<u>" + text + "</u>");
            formatting.bold && (text = "<b>" + text + "</b>");
            return '<font color="' + formatting.color + '">' + text + '</font><span class="' + this.nameSpace + ' ui-icon ui-icon-trash" style="cursor: pointer; float: right;"></span>'
        },
        _setTitleFormat: function() {
            var a = this;
            var b = this.log;
            var d = this.options;
            $.each(b.sections, function(e, f) {
                if (b.firstLineTitle) switch (d.format) {
                    case "html":
                        var g = f[0];
                        $(".title:eq(" + e + ")").html(a._formatTitleHTML(g, d.title))
                }
            })
        },
        _capitalizeFirst: function(a) {
            if (Array.isArray(a)) {
                var b = this;
                $.each(a, function(c, e) {
                    a[c] = b._capitalizeFirst(e)
                });
                return a;
            }
            return a.charAt(0).toUpperCase() + a.slice(1);
        },
        refresh: function() {
            this.$element.text("");
            this._createTextArea();
        },
        //(index, value)
        addSection: function(value, index) {
          //a = value, b = index
            var d = this.options;
            if (index == null){
              index = this.log.sections.length;
            }
            this.log.sections[index] = value.slice();
            var e = this.log,
                d = this.options;
            if (e.firstLineTitle) switch (d.format) {
                case "html":
                    e = value.shift(), e = $("<div>", {
                        "class": this.nameSpace + " editable title",
                        contentEditable: this.options.editable
                    }).append(this._formatTitleHTML(e, d.title));
                    $(".sig").length ? $(".sig").before(e) : this.$worklogBody.append(e);
            }
            if (value.length) {
                var e = $("<div>", {
                        "class": this.nameSpace + " sectionBar",
                        css: {
                            "float": "left",
                            width: "13px"
                        }
                    }),
                    f = $("<div>", {
                        "class": this.nameSpace + " editable autosuggest section",
                        contentEditable: this.options.editable,
                        css: {
                            overflow: "hidden",
                            "white-space": "pre"
                        },
                        html: value.join("<br>") + "<br>"
                    });
                $(".sig").length ? $(".sig").before(e).before(f).before("<br>") : this.$worklogBody.append(e).append(f).append("<br>");
                d.autoSuggest && this._addAutoSuggest(f);
                this.refreshSectionBar(index);
            }
        },
        refreshSection: function(section) {
            var b = $.extend(true, {}, this.log);
            var d = b.sections[section];
            var e = this.options;
            if (b.firstLineTitle) switch (e.format) {
                case "html":
                    b = d.shift();
                    $(".title:eq(" + section + ")").html(this._formatTitleHTML(b, e.title));
            }
            d.length && ($(".section:eq(" + section + ")").html(d.join("<br>") + "<br>"), this.refreshSectionBar(section));
        },
        refreshSectionBar: function(a) {
            var b = this;
            if (null == this.log.sections[a]) return false;
            if ("0px" === $(".section:eq(" + a + ")").css("height")) return setTimeout(function() {
                b.refreshSectionBar(a)
            }, 1E3), false;
            var d = $.extend(true, {}, this.log),
                e = d.sections[a];
            $(".sectionBar:eq(" + a + ")").html("");
            e = e.length;
            d.firstLineTitle && e--;
            for (var d = parseInt($(".section:eq(" + a + ")").css("height"), 10) / e, f = 0; f < e; f++) $(".sectionBar:eq(" + a + ")").append($("<span>", {
                "class": b.nameSpace + " ui-icon ui-icon-close deleteLine",
                css: {
                    cursor: "pointer",
                    width: "13px",
                    height: d + "px"
                }
            }));
            $(".sectionBar:eq(" + a + ")").css("height", $(".section:eq(" + a + ")").css("height"));
            $(".deleteLine").off("click").on("click", function() {
                var a = $(".deleteLine", $(this).parent()).index($(this)),
                    d = $(".sectionBar").index($(this).parent());
                b.removeLine(d, a);
                b._trigger("edit")
            })
        },
        findLineInSection: function(a, b, d, e) {
            "" === a && (a = "^$");
            var f = new RegExp(a, "i");
            a = this.log.sections[b];
            d = null != d ? d : 0;
            e = null != e ? e : a.length;
            var g = false;
            if ("string" === typeof d) {
                d = this.findLineInSection(d, b);
                if (false ===
                    d) return false;
                d++
            }
            if ("string" === typeof e && (e = this.findLineInSection(e, b), false === e)) return false;
            $.each(a, function(a, b) {
                if (f.test(b) && a >= d && a < e) return g = a, false
            });
            return g
        },
        findLine: function(a, b, d, e) {
            var f = this,
                g = false;
            null != b ? g = this.findLineInSection(a, b, d, e) : $.each(this.log.sections, function(c, h) {
                g = f.findLineInSection.apply(f, [a, c, d, e]);
                if (false !== g) return b = c, false
            });
            return false !== g ? {
                section: b,
                line: g
            } : false
        },
        addLine: function(a, b, c) {
            a = this._capitalizeFirst(a);
            b = null != b ? b : this.log.sections.length - 1;
            var e = this.log.sections[b];
            console.log(e.length);
            null == c && ("" === e[e.length - 1] && e.pop(), c = e.length);
            Array.isArray(a) ? e = e.slice(0, c).concat(a).concat(e.slice(c)) : e.splice(c, 0, a);
            this.log.sections[b] = e;
            this.refreshSection(b);
            this._trigger("change")
        },
        setLine: function(a, b, c) {
            b = this._capitalizeFirst(b);
            this.log.sections[c][a] = b;
            this.refreshSection(c);
            this._trigger("change")
        },
        setCurrentLine: function(a, b) {
            var c = this.currentLine;
            this.log.firstLineTitle && c++;
            this.setLine.apply(this, [c, a, b])
        },
        replace: function(a, b, d, e, f) {
            var g = this.findLine(a,
                    d, e, f),
                k = this;
            return false !== g ? (a = new RegExp(a, "i"), d = this.log.sections[g.section][g.line], Array.isArray(b) ? (a = d.replace(a, b.shift()), this.setLine(g.line, a, g.section), $.each(b, function(a, b) {
                k.addLine(b, g.section)
            })) : (a = d.replace(a, b), this.setLine(g.line, a, g.section)), g) : false
        },
        replaceLine: function(a, b, c, e, f) {
            a = this.findLine(a, c, e, f);
            return false !== a ? (this.setLine(a.line, b, a.section), a) : false
        },
        removeLine: function(a, b) {
            var c = this.log.sections[a].length;
            this.log.firstLineTitle && (b++, c--);
            1 < c ? this.log.sections[a].splice(b,
                1) : this.log.sections[a][b] = "";
            this.refreshSection(a)
        },
        toArray: function(a) {
            var b = [],
                d = $.extend(true, {}, this.log),
                e = this.options;
            if (null == a) $.each(d.sections, function(a, f) {
                if (d.firstLineTitle) switch (e.format) {
                    case "html":
                        var h = f.shift();
                        e.title.italics && (h = "<i>" + h + "</i>");
                        e.title.underline && (h = "<u>" + h + "</u>");
                        e.title.bold && (h = "<b>" + h + "</b>");
                        b.push('<font color="' + e.title.color + '">' + h + "</font>")
                }
                f.length && ($.merge(b, f), b.push(""))
            }), null != d.sig && b.push("<b>" + d.sig + "</b>");
            else {
                if (d.firstLineTitle) switch (e.format) {
                    case "html":
                        var f =
                            d.sections[a].shift();
                        e.title.italics && (f = "<i>" + f + "</i>");
                        e.title.underline && (f = "<u>" + f + "</u>");
                        e.title.bold && (f = "<b>" + f + "</b>");
                        b.push('<font color="' + e.title.color + '">' + f + "</font>")
                }
                d.sections[a].length && $.merge(b, d.sections[a])
            }
            return b;
        },
        value: function(sectionNum) {
            if (debug) { console.log('value'); }
            return this.toArray(sectionNum).join('\n');
        },
        logObj: function() {
            return this.log;
        }
    });
})(jQuery, window, document);
