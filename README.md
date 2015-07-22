# jquery.worklog
contentEditable Divs + Auto Suggest. Generates a work log element using conentEditable div elements, with autosuggest and automatic growth based on content. Supports HTML and plain text formatting of headers.

# Options
Defaults:
```javascript
options: {
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
}
```

# Methods
- refresh
- addSection
- refreshSection
- refreshSectionBar
- findLineInSection
- findLine
- addLine
- setLine
- setCurrentLine
- replace
- replaceLine
- removeLine
- toArray
- value
- logObj

# Events
- edit
- change

# Dependencies
- jQuery
- jQuery UI

# License
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
