/*
    Author: Mike Sharp 
    Created: 10-May-2014 
    Modified: 12-May-2014
    Description: SaleCycle V1 to V2 Email template converter/parser. 
    Version: 0.02
*/

__mds = (typeof __mds == "undefined") ? {} : __mds;
__mds.templateconverter = __mds.templateconverter || {};
__mds.templateconverter.styleText = '';
__mds.templateconverter.bodyText = '';
__mds.templateconverter.sessionData = [];
__mds.templateconverter.itemData = [];

// I've added this to my project from Stackoverflow: http://stackoverflow.com/questions/280793/case-insensitive-string-replacement-in-javascript
// credit where credit is due. This prepares a string for a regex search when you don't want the regex engine to recognise any of the regex characters
function preg_quote(str) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

    return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

__mds.templateconverter.converttemplate = function (str) {
    var body, style;
    var sessionDataSection = '';

    __mds.templateconverter.styleText = '';
    __mds.templateconverter.bodyText = ';'
    __mds.templateconverter.sessionData = [];
    __mds.templateconverter.itemData = [];

    // carry out various transformations on old template string and return new V2 Style Razor template.
    // extract style and body from raw document 
    __mds.templateconverter.splitbodystyle(str);
    __mds.templateconverter.convertplaceholders();
    __mds.templateconverter.upgradelinks();
    // build up our list of item fields
    __mds.templateconverter.replaceitemrepeater();
    __mds.templateconverter.applysessiondata();


    // add extra @ to @media in body 
    __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split('@media').join('@@media');


    // finalize changes 

   // if (document.getElementById('radioEscapeAtYes').checked) {
        __mds.templateconverter.styleText = '<head>\n<style type="text/css">\n' + __mds.templateconverter.styleText.split('@').join('@@') + '\n</style>\n</head>';
   // }

    //if (document.getElementById('encodeBodyYes').checked) {
    //  //  document.getElementById('bodyArea').value = encodeURIComponent(__mds.templateconverter.bodyText);
    //}
    //else {
    //  //  document.getElementById('bodyArea').value = __mds.templateconverter.bodyText;
    //}

    //if (document.getElementById('encodeStyleYes').checked) {
    //   // document.getElementById('styleArea').value = encodeURIComponent(__mds.templateconverter.styleText);
    //}
    //else {
    //  //  document.getElementById('styleArea').value = __mds.templateconverter.styleText;
    //}
        __mds.templateconverter.bodyText = '<!DOCTYPE html>\n<html>\n'
        + "\n@* Required Dependencies *@ @using System.Globalization; @* Helpers *@ @helper RenderCurrencySymbol() { /* Reference the .NET Currency symbol libraries to obtain correct currency code*/ string symbol = string.Empty; CultureInfo[] cultures = CultureInfo.GetCultures(CultureTypes.SpecificCultures); foreach (CultureInfo ci in cultures) { RegionInfo ri = new RegionInfo(ci.LCID); if (ri.ISOCurrencySymbol == Model.CurrencyCode) { symbol = ri.CurrencySymbol; break; } } /*render the symbol*/ <span>@(symbol)</span> }\n"
        + __mds.templateconverter.styleText + '\n<body>\n'
        +__mds.templateconverter.bodyText + '\n</body>\n</html>';

    document.getElementById('bodyArea').value = __mds.templateconverter.bodyText;
    //document.getElementById('styleArea').value = __mds.templateconverter.styleText;



}

__mds.templateconverter.applysessiondata = function () {

    //define a session data section
    sessionDataSection = '@{ ';
    sessionDataSection += '\nvar firstProduct = Model.Products.FirstOrDefault();'; 
    for (var i = 0; i < __mds.templateconverter.sessionData.length; i++) {
        sessionDataSection += '\n' + __mds.templateconverter.sessionData[i];
    }
    sessionDataSection += ' }';
    //append the various data sections to main body of document 
    __mds.templateconverter.bodyText = sessionDataSection + ' ' + __mds.templateconverter.bodyText;
}
__mds.templateconverter.splitbodystyle = function (html) {

    // Some assumptions made here, the first style tag is start of CSS, file may contain additional closing style tags, so I'm taking last closing style tag of 'head' as my end point
    __mds.templateconverter.styleText = html.substring(html.indexOf('<style'), html.lastIndexOf('</head>'));
    __mds.templateconverter.styleText = __mds.templateconverter.styleText.substring(__mds.templateconverter.styleText.indexOf('>') + 1, __mds.templateconverter.styleText.lastIndexOf('</style>'));

    // take first closing tag (of body) as place to start parsing 
    __mds.templateconverter.bodyText = html.substring(html.indexOf('<body'));
    __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.substring(__mds.templateconverter.bodyText.indexOf('>') + 1, __mds.templateconverter.bodyText.lastIndexOf('</body>'));

}

__mds.templateconverter.convertplaceholders = function () {
    // regex gets all old style placeholders  (without the colon)
    //var placeholders = __mds.templateconverter.bodyText.match(/\[\[[^\^:[]+\]\]/g);

    var placeholders = __mds.templateconverter.bodyText.match(/(\[){2}([^\[:\]])+(\]){2}/gi);

    if (placeholders != null && placeholders.length > 0) {
        // remove duplicates (case sensitive)
        placeholders = placeholders.filter(function (elem, pos, self) {
            return self.indexOf(elem) == pos;
        });

        // convert all 'default' placeholders, i.e. the old style ones that usually correlate with a DB field
        __mds.templateconverter.schema.placeholders.map(function (obj) {
            for (var i = 0; i < placeholders.length; i++) {
                // check each placeholder in a non-case sensitive manner 
                //if (placeholders[i].toLowerCase() == '[[customername]]' && obj.name.toLowerCase() == '[[customername]]' && document.getElementById('useCustomSalutationYes').checked) {
                //    __mds.templateconverter.compileSalutation();
                //}
                //else 
                if (obj.name.toLowerCase() == placeholders[i].toLowerCase()) {

                    if (typeof obj.legacy == "undefined" || obj.legacy == null) {

                        // added prepend and append variables so we can replace functionality lost from moving to V2 portal (e.g. image replace URL) 
                        var prepend = '';
                        var append = '';

                        if (typeof obj.prepend != "undefined" && obj.prepend != null) {
                            prepend = eval('document.getElementById(\"' + obj.prepend.id + '\").' + obj.prepend.value);
                        }
                        if (typeof obj.append != "undefined" && obj.append != null) {
                            append = eval('document.getElementById(\"' + obj.append.id + '\").' + obj.append.value);
                        }

                        var overrideType = null;


                        overrideType = __mds.templateconverter.hasoverride(obj.name.toLowerCase());

                        //replace the immediate placholder with a var 
                        if (overrideType != null) {


                            var reg = new RegExp("(" + preg_quote(placeholders[i]) + ")", 'gi');

                            if (obj[overrideType + '_razor'] != null && typeof obj[overrideType + '_razor'] != undefined && obj[overrideType + '_razor'] != '') {
                                __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(reg, prepend + '@(' + obj[overrideType + '_razor'] + ')' + append);
                            }
                            else {
                                __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(reg, prepend + append);

                            }

                            if (typeof obj[overrideType] != "undefined" && obj[overrideType] != null) {

                                // add a declaration in the session or item data sections (in C#) 
                                if (obj.scope == 'session') {
                                    __mds.templateconverter.sessionData.push(obj[overrideType]);
                                }
                                else if (obj.scope == 'item') {
                                    __mds.templateconverter.itemData.push(obj[overrideType]);
                                }
                            }
                            break;
                        }
                        else {
                            var reg = new RegExp("(" + preg_quote(placeholders[i]) + ")", 'gi');

                            __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(reg, prepend + '@(' + obj.razor + ')' + append);
                            if (typeof obj.code != "undefined" && obj.code != null) {

                                // add a declaration in the session or item data sections (in C#) 
                                if (obj.scope == 'session') {
                                    __mds.templateconverter.sessionData.push(obj.code);
                                }
                                else if (obj.scope == 'item') {
                                    __mds.templateconverter.itemData.push(obj.code);
                                }
                            }
                            break;
                        }



                    }
                    else if (typeof obj.legacy != "undefined" || obj.legacy != null && obj.legacy == true) {
                        // lowercase legacy placeholders
                        __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split(placeholders[i]).join(placeholders[i].toLowerCase());
                    }
                    // make no changes if template in V2 is using the legacy placeholder
                }
            }
        });
    }



    // now for the 'custom' session and item fields that contain a colon, these are session and items fields defined by implementation in the script
    var customPlaceholders = __mds.templateconverter.bodyText.match(/\[\[([iI]|[sS])(ession|tem):[A-z0-9-_^\[]+\]\]/gi);

    if (customPlaceholders != null && customPlaceholders.length > 0) {
        // remove duplicates (in a case insensitive manner)
        customPlaceholders = customPlaceholders.filter(function (elem, pos, self) {
            return self.indexOf(elem) == pos;
        });

        for (var i = 0; i < customPlaceholders.length; i++) {
            //extract the placeholder name from old placeholder 
            var itemVar = customPlaceholders[i].substring(customPlaceholders[i].indexOf(':') + 1).match(/[^\]]+/);



            // check the scope of the placeholder and push into appropriate data section 
            if (customPlaceholders[i].toLowerCase().indexOf('item:') > -1) {

                if (document.getElementById('downcasePlaceholdersYes').checked) {
                    itemVar[0] = itemVar[0].toLowerCase();
                }

                // paste new style razor placeholder into markup (global replace)
                __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split(customPlaceholders[i]).join('@(' + 'item_' + itemVar[0] + ')');
                __mds.templateconverter.itemData.push('var ' + 'item_' + itemVar[0] + ' = ' + '@TryGetItemField(@product, \"' + itemVar[0] + '\");');
            }
            else if (customPlaceholders[i].toLowerCase().indexOf('session:') > -1) {
                __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split(customPlaceholders[i]).join('@(' + 'session_' + itemVar[0] + ')');
                __mds.templateconverter.sessionData.push('var ' + 'session_' + itemVar[0] + ' = ' + '@TryGetSessionField(\"' + itemVar[0] + '\");');
            }
        }
    }
}




__mds.templateconverter.hasoverride = function (key) {

    //if (key == '[[currencycode]]' || key == '[[currencysymbol]]') {
    //    if (document.getElementById('overrideCurrencyYes').checked) {
    //        return "override_1";
    //    }
    //    else if (document.getElementById('overrideCurrencyCustom').checked) {
    //        return "override_2";
    //    }
    //}
    return null;
}

__mds.templateconverter.replaceitemrepeater = function () {

    // obtain existing repeater strings (irrespective of case)
    // repeater tags may additionally be surrounded with <!-- -->, so we take that into account
    var productListStart = __mds.templateconverter.bodyText.match(/(<!--){0,1}\[\[productlist:start\]\](-->){0,1}/gi);
    var productListEnd = __mds.templateconverter.bodyText.match(/(<!--){0,1}\[\[productlist:end\]\](-->){0,1}/gi);
    var itemDataString = '';

    if (productListStart != null && productListStart.length > 0 && productListEnd != null && productListEnd.length > 0) {
        itemDataString = '\n@{ ';

        for (var i = 0; i < __mds.templateconverter.itemData.length; i++) {
            itemDataString += '\n' + __mds.templateconverter.itemData[i];
        }

        itemDataString += '\n}';

        // add new foreach loop around area where product list tags were 
        productListStart.map(function (start) {
            __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split(start).join('@foreach(var product in Model.Products){');
        });

        productListEnd.map(function (end) {
            __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.split(end).join('}');
        });

        __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace('<!--@foreach(var product in Model.Products){-->', '@foreach(var product in Model.Products){')
        __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(__mds.templateconverter.bodyText.match(/\@foreach\(var product in Model\.Products[^>]+>/)[0], __mds.templateconverter.bodyText.match(/\@foreach\(var product in Model\.Products[^>]+>/)[0] + ' ' + itemDataString);
    }
    else {
        console.log('ERROR: This page contains no productlist start/end tags or there is a tag mismatch.');
    }
}

__mds.templateconverter.upgradelinks = function () {
    // match all links, it is assumed that a link will always close with a closing speech mark with the old style 
    var links = __mds.templateconverter.bodyText.match(/\[\[[Ll]ink\]\][0-9]+\|[^"]+/g);

    if (links != null && links.length > 0) {

        links.map(function (el) {
            // remove the old start tag and replace with new starting and closing tags
            var replaceWith = el.replace(/\[\[[Ll]ink\]\][0-9]+\|/, '[[link]]');
            replaceWith += '[[/link]]';
            __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(el, replaceWith);
        });
    }
}

__mds.templateconverter.gatherLinks = function () {
    var links = null;
    var indexes = [];
    indexes.push(0);
    __mds.templateconverter.bodyText = document.getElementById('bodyArea').value;
    if (__mds.templateconverter.bodyText.length > 0) {
        links = __mds.templateconverter.bodyText.match(/\[\[link\]\](.*?)\[\[\/link\]\]/g);

        if (links != null) {
            for (var i = 0; i < links.length; i++) {
                //   indexes.push(__mds.templateconverter.bodyText.substring(indexes[i], __mds.templateconverter.bodyText.length - indexes[i]).search(/\[\[link\]\](.*?)\[\[\/link\]\]/g));
                //   console.log(__mds.templateconverter.bodyText.substring(indexes[i], __mds.templateconverter.bodyText.length - indexes[i]).search(/\[\[link\]\](.*?)\[\[\/link\]\]/g));
            }
        }


    }
}

__mds.templateconverter.compileSalutation = function () {

    if ($('#salutationList').children().length == 0) {
        var salutationText = $('#fallbackSalutationArea').val().trim();
        salutationText = salutationText.split(' ').join('&nbsp;');
        salutationText = '<text>' + salutationText + '</text>';
        __mds.templateconverter.bodyText = __mds.templateconverter.bodyText.replace(/(\[\[customername\]\])/gi, salutationText);
    }
    else {
        var razorLadder = '';

        var salutationRules = []; 

        $.each($('#salutationList').children(), function (ix) {
            var salutationString = '';
            var conditions = []; 
            salutationString = $(this).find('.salutationArea:first').val();
            conditions = salutationString.match(/(@Model.Customer){1}([^\s-])+/gi);

            salutationString = 'if('

            console.log('**** START OF CONDITION ' + ix + ' *****');
            for (var i = 0; i < conditions.length; i++) {
                salutationString += (' ' + conditions[i] + ' != null ' + '&& string.Format({0}, ' + conditions[i] +') != "" '  +  ((i < conditions.length-1) ? '&&' : '' )); 
            }
            salutationString += ')';

            if (ix != 0) {
                salutationString = 'else ' + salutationString; 
            }

            console.log(salutationString);
        });

    }

}


document.addEventListener('DOMContentLoaded', function () {
    //initialse fancy JQuery UI, this is the only part of the code that references JQuery, no other parts should use it
    $("#tabs").tabs();

    var icons = {
        header: " ui-icon-gear"
    };

    $("#accordion").accordion({
        header: "h3", collapsible: true, active: false, icons: icons
    });
    $("#radioEncodeStyle").buttonset();
    $("#radioEncodeBody").buttonset();
    $('#radioEscapeAt').buttonset();
    $('#radioDowncasePlaceholders').buttonset();
  //  $('#radioOverrideCurrency').buttonset();
    $('#radioUseCustomSalutation').buttonset();
    $("input[type=submit], a, button")
     .button();


    //SALUTATION 
    $('#addSaluation').on('click', function (event) {
        console.log('add another salutation to DOM');
        $('#salutationList').append(
              '<li>'
                    + '<div class="ui-widget-header ui-corner-all salutationSection">'
                     + '<textarea class="salutationArea"></textarea>'
                      + '<ul>'
                       + '<li>'
                        + '<button class="salutationRaisePriority"><span class="ui-icon ui-icon-arrowthick-1-n "></span></button>'
                         + '</li>'
                          + '<li>'
                           + '<button class="salutationLowerPriority"><span class="ui-icon ui-icon-arrowthick-1-s"></span></button>'
                           + '</li>'
                        + '</ul>'
                         + ' <button class="removeSalutationOption"><span class="">Remove</span></button>'
                    + '</div>'
                + '</li>'
        )

        $('#salutationList button').button();
    });

    $('#salutationList').on('click', 'button.removeSalutationOption', function (event) {
        $(this).parent().parent().remove();
    });

    $('#salutationList').on('click', '.salutationLowerPriority', function (event) {
        var current = $(this).parent().parent().parent().parent();
        current.next().after(current);
    });
    $('#salutationList').on('click', '.salutationRaisePriority', function (event) {
        var current = $(this).parent().parent().parent().parent();
        current.prev().before(current);
    });



    var button, templateArea;
    button = document.getElementById('convert');
    templateArea = document.getElementById('templateArea');
    var request;

    request = new XMLHttpRequest();
    request.open('GET', 'schema/placeholder.js', true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            // obtain the schema containing the rules for dealing with old placeholders 
            __mds.templateconverter.schema = JSON.parse(request.responseText);

            // add all of our listeners 
            // button click event to fire process off
            button.addEventListener('click', function (event) {
                if (templateArea.value.length > 0) {
                    __mds.templateconverter.converttemplate(templateArea.value);
                }
                else {
                    alert('Please Add a V1 Template to the \'Raw HTML\' Field');
                }
            });

        } else {
            // We reached our target server, but it returned an error
            console.log('failed to retrieve schema');
        }
    };

    request.onerror = function () {
        // There was a connection error of some sort
        console.log('failed to retrieve schema');
    };

    // get schema on page ready
    request.send();
});

