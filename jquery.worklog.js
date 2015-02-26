(function( $ ) {
    var debug = true;
    $.fn.worklog = function(options) {
        if (debug) console.log("worklog");
        // Apply options
        var settings = $.extend({}, $.fn.worklog.defaults, options );
        return this.each(function() {
            var dom = $(this);
            // This won't work with live queries as there is no specific element to attach this
            // one way to deal with this could be to store a reference to self and then compare that in click?
            if (dom.data('worklog'))
                return; // already an editor here
            dom.data('worklog', true);
            new WorkLog(settings, dom).init();
        });
    };
 
    // Plugin defaults
    $.fn.worklog.defaults = {
        // These are the defaults.
        width: "650px",
        height: "200px",
        background: "rgba(255,255,255,0.8)",
        format: "html",
        titleColor: "#000000",
        template: {
            name: "Default",
            firstLineTitle: true,
            sections: [ 
                ['Section 1 Header', 'Section 1 line 1', 'Section 1 line 2'],
                ['Section 2 Header', 'Section 2 line 1', 'Section 2 line 2']
            ],
            sig: "here"
        },
        autoSuggest: [
            {"line":"Section 1 line 1 suggestion 1 ","count":1,"lastUsed":0},
            {"line":"Section 1 line 1 suggestion 2 ","count":1,"lastUsed":0},
            {"line":"Section 1 line 2 suggestion 1 ","count":1,"lastUsed":0},
            {"line":"Section 1 line 2 noodles ","count":1,"lastUsed":0},
            {"line":"Section 1 line 2 dragon ","count":1,"lastUsed":0}
        ],
        autoFocus: false,
        suggestLength: 24
    };
    //
    function WorkLog(settings, dom) {
        this.settings = settings;
        this.dom = dom;
        this.autoSuggestLines = [];
        this.$worklog = null;
        this.checkInterval = null;
        this.currLine = 1;
        this.lineHeight = 15;
    };
    //
    $.extend(WorkLog.prototype, {
        init: function() {
            if (debug) console.log("init");
            this.setAutoSuggestLines();
            this.createTextArea();
            this.loadLog();
            this.lineHeight =parseInt(this.$worklog.css("height").replace('px', ''), 10)/this.$worklog.data("linesArray").length;
            if (debug) console.log(this)
        },
        setAutoSuggestLines: function () {
            if (debug) console.log("setAutoSuggestLines");
            //this.autoSuggestLines = new Array();
            var that = this;
            $.each(this.settings.autoSuggest, function (index, value){
                //console.log(that);
                that.autoSuggestLines.push(value.line);
            });
        },
        checkCursorPosition: function (obj) {
            if (debug) console.log("checkCursorPosition");
            if (obj.$worklog != null) {
                var t = obj.$worklog[0];
                var tArray = t.value.split("\n");
                var position = t.value.substr(0, t.selectionStart).split("\n").length - 1;
                var autocompletePos;
                if (position !== obj.currLine) {
                    if (debug) console.log(position);
                    obj.currLine = position;
                    autocompletePos = parseInt(obj.$worklog.css("padding-top").replace('px', ''), 10) + ((obj.currLine+1) *  obj.lineHeight);
                    obj.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos } ).autocomplete("search", tArray[position]);
                } else if (tArray[position] !== obj.$worklog.data("linesArray")[position]) {
                    if (debug) console.log(tArray[position]);
                    obj.$worklog.data("linesArray", t.value.split("\n"));
                    autocompletePos = parseInt(obj.$worklog.css("padding-top").replace('px', ''), 10) + ((obj.currLine+1) *  obj.lineHeight);
                    console.log(autocompletePos);
                    obj.$worklog.autocomplete( "option", "position", { my : "right top", at: "right top+" + autocompletePos } ).autocomplete("search", tArray[position]);
                }
                return position;
            } else {
                return false;   
            }
        },
        createTextArea: function () {
            if (debug) console.log("createTextArea");
            var that = this;
            this.dom.html("<b>" + this.settings.template.name + '</b><br><textarea class="worklog" autofocus="false"></textarea>');
            this.$worklog = $('textarea', this.dom);
            this.$worklog.css({
                width: this.settings.width,
                height: this.settings.height,
                background: this.settings.background,
                resize: 'none'
            }).attr({
                minWidth: this.settings.width
            })
            .autogrow({
                vertical : true,
                horizontal : true,
                fixMinHeight: false
            })
            .focus(function () {
                that.checkInterval = setInterval(that.checkCursorPosition, 250, that);
            }).blur(function () {
                clearInterval(that.checkInterval);
            }).keydown(function(event) {
                var keyCode = $.ui.keyCode;
                if (event.keyCode == keyCode.UP || event.keyCode == keyCode.DOWN) {
                      event.stopImmediatePropagation();
                }
            }).autocomplete({
                source: function (request, response) {
                    var term = request.term.trim();
                    console.log(term);
                    var result = [];
                    var firstWord = [];
                    var inLine = [];
                    $.each(that.autoSuggestLines, function (index, value) {
                        if (firstWord.length >= that.settings.suggestLength) {
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
                    result = result.concat(firstWord.slice(0, that.settings.suggestLength)).concat(inLine.slice(0, that.settings.suggestLength - result.length));
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
                autoFocus: this.settings.autoFocus
            }).focus();
        },
        loadLog: function () {
            if (debug) console.log("loadLog");
            var that = this;
            var worklogVal = "";
            var logObject = this.settings.template;
            $.each(logObject.sections, function (index, value){
                //console.log(value);
                if (logObject.firstLineTitle){
                    switch(that.settings.format) {
                        case "html":
                            worklogVal += '<font color="' + that.settings.titleColor + '"><b><u>' + value.shift() + '</u></b></font>\n';
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
        },
        setCurrentLine: function (value, obj) {
            var logLines = obj.$worklog.data("linesArray");
            logLines[obj.currLine] = value;
            var cursorPos = obj.$worklog[0].selectionStart;
            obj.$worklog.val(logLines.join('\n'));
            var newPos = cursorPos + obj.$worklog.val().substring(cursorPos).indexOf("\n");
            obj.$worklog[0].setSelectionRange(newPos, newPos);
        }
    });
}(jQuery));