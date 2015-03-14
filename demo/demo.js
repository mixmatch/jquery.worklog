var suggestLength = 16;
$(document).ready(function () {
    //$('#worklog').worklog();  
    $('#worklog').worklog({
        // These are the defaults.
        width: "100%",
        height: "100%",
        background: "rgba(255,255,255,0.8)",
        format: "html",
        title: {
            color: "#557799",
            bold: true,
            underline: true,
            italics: false
        },
        template: {
            name: "Default",
            firstLineTitle: true,
            sections: [ 
                ['Section 1 Header', 'Section 1 line 1', 'Section 1 line 2', ''],
                ['Section 2 Header', 'Section 2 line 1', 'Section 2 line 2']
            ],
            sig: "Yours truly, Bob"
        },
        autoSuggest: [
            {"line":"Section 1 line 1 suggestion 1 ","count":1,"lastUsed":0},
            {"line":"Section 1 line 1 suggestion 2 ","count":1,"lastUsed":0},
            {"line":"Section 1 line 2 noodles ","count":1,"lastUsed":0},
            {"line":"Section 1 line 2 dragon ","count":1,"lastUsed":0}
        ],
        autoFocus: false,
        suggestLength: suggestLength
    }).bind( "worklogchange", function() {
        console.log( "Changed" );
    });
});