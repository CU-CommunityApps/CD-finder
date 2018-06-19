(function ($, Drupal, drupalSettings) {

    function findGetParameter(parameterName) {
        var result = "",
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
              tmp = item.split("=");
              if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    }


    var servicelist = [
 //           { name: "Shared File Services", matches: [1,2,4,5,6,7] }
        ];

    let servicehelp = {}; // this is the help text for each service


    // define the templates
    // WHAT IS THIS MUSTACHE STUFF ??? :-)
    // see:  http://mustache.github.io/mustache.5.html

    $.Mustache.add("question-checkbox-template",
        "{{#questions}}\
        <li>\
        <div class='question-wrapper'>\
        <h4 id='question-{{id}}'>{{question}}</h4>\
        <a aria-haspopup='true' class='popup' data-hidden='true' href='#explanation-{{id}}''>\
            <span class='fa fa-info-circle' aria-hidden='true'></span>\
            <span class='sr-only'>More info about {{question}}</span>\
        </a>\
        </div>\
        <div class='help' id='explanation-{{id}}'><h3>{{question}}</h3><p>{{{description}}}</p></div>\
        <fieldset aria-labelledby='question-{{id}}'>\
        {{#choices}}\
            <div class='checkbox' facetid='{{id}}'>\
            <label for='facet-{{id}}'>\
            <input type='checkbox' name='facet-{{id}}' id='facet-{{id}}' {{checked}} class='facet' facetid='{{id}}'> {{text}}\
            </label>\
            </div>\
        {{/choices}}\
        </fieldset>\
        </li>\
        {{/questions}}");

    $.Mustache.add("checkbox-facet-template","<input type='checkbox' id='facet-{{id}}'>");

    $.Mustache.add("radio-facet-template","<input type='radio' id='facet-{{id}}'>");

    $.Mustache.add("services-template",
        "{{#services}}\
        <div class='service-panel' id='service-{{id}}' service='{{id}}'>\
            <label>\
            <input type='checkbox' class='cardcheckbox' {{checked}}/> \
            <div class='control-indicator'></div>\
            <h4 class='service-title'>{{title}}</h4>\
            <p>{{summary}}</p>\
            </label>\
        </div>\
        {{/services}}"
    );

        var errors = [];
        var facets = [];

        // The list of services which could be visible in the grid.
        // Only 3 of them are going to actually be visible.
        var visible_classes = []; // items like ".service-23"
        var first_visible = 0;

        var jump_delay = false;

        var questionlist = [
            {
                id: "security",
                question: 'What is the security risk associated with your data?',
                control_type: 'radio',
                choices: [
                    {id:1, text:'low risk', selected: false, turnoff: [2,3]},
                    {id:2, text:'moderate risk', selected: false, turnoff: [1,3]},
                    {id:3, text:'high risk', selected: false, turnoff: [1,2]}
                ]
            },

            {
                id: "protection",
                question: 'What additional protection do you need for your data?',
                control_type: "checkbox",
                choices: [
                    {id:6, text:"replication", selected: false, turnoff: []},
                    {id:7, text:"backup / snapshots", selected: false, turnoff: []}
                ]
            }
        ];

    // read the data from JSON endpoints

    $.getJSON( "/rest/finder_settings", function( response ) {
        //alert(JSON.stringify(response));
        $('#pagetitle').html(response.title.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pagesubtitle').html(response.subtitle.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pagequestionheader').html(response.question_header.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pageserviceheader').html(response.service_header.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pagechartheader').html(response.chart_header.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pageemailformheader').html(response.email_form_header.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        //$('#pageemailaddress').html(response.data.email_address);
        //$('#pageemailname').html(response.data.email_name);
        //$('#pageemailbody').html(response.email_body.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('#pagemainheader').html(response.main_header.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        $('.selectall-button').html(response.button_select_all);
        $('.clear-button').html(response.button_clear_selections);
    });


    $.getJSON( "/rest/facettree", function( response ) {

        // JSON responses are automatically parsed.

        // here, see if there are selected facets in the URL
        facetsselected = [];
        inputparameters = findGetParameter("facets");
        if (inputparameters.length > 0) {
            facetsselected = inputparameters.split(",");
        }

        questionlist = [];

        readfacets = response;
        for (i=0;i<readfacets.length;i++) {

            question = new Object();
            question.id = readfacets[i].id;
            question.question = readfacets[i].name;
            question.control_type = readfacets[i].control_type;
            question.description = readfacets[i].description;
            question.choices = [];
            // get all choice_ids to aid computing turnoff array
            choice_ids = readfacets[i].choices.map(function(a) {return a.id;});
            for (j=0;j<readfacets[i].choices.length;j++) {
                choicein = readfacets[i].choices[j];
                var facet = new Object();
                facet.id = choicein.id;
                facet.text = choicein.name;
                facet.checked = "";
                facet.selected = (facetsselected.indexOf(""+facet.id) > -1);
                if (facet.selected) {facet.checked = "checked";}
                //facet.selected = false;
                facet.turnoff = [];
                if (question.control_type == "radio") {
                    // copy choice_ids, remove current id, use as turnoff
                    var turnoff = choice_ids.slice(); // duplicate array
                    var index = turnoff.indexOf(facet.id);
                    turnoff.splice(index, 1);
                    facet.turnoff = turnoff;
                }

                question.choices.push(facet);
            }
            //alert(JSON.stringify(question));
            questionlist.push(question);
        }

        // render the questions

        $("#questionlist").append($.Mustache.render('question-checkbox-template', {questions: questionlist} ));

            $(".facet").on("change", function (thefacet) {
                var a = find_facet($(this).attr("facetid"));

                $('.jump-to-chart').hide();

                a.selected = ! a.selected;
                if (! a.selected) {
                    $("#facet-"+a.id).prop("checked", false);
                }

                // if this question has radio buttons, turn off some radio
                // buttons as necessary
                if (a.selected) {
                    for (var k=0; k<a.turnoff.length; k++) {
                        off = a.turnoff[k];
                        for (var i=0; i<questionlist.length; i++) {
                            question = questionlist[i];
                            for (var j=0; j<question.choices.length; j++) {
                                choice = question.choices[j];
                                //alert(choice.id+" vs "+off);
                                if (choice.id*1 == off*1) {  // force to numbers
                                    choice.selected = false;
                                    $("#facet-"+choice.id).prop("checked", false);
                                }
                            }
                        }
                    };
                }
                // need to turn off the card checkboxes.
                // or maybe not -- leave selected services selelcted when clicking facets
                //$(".cardcheckbox").prop("checked",false);

                evaluate_services();

            });
    });


    // load the services
    $.getJSON( "/rest/servicelist", function( responseb ) {
        services = responseb;
        //servicelist = responseb.data;

        // here, see if there are selected services in the URL
        var servicesselected = [];
        var inputServiceParameters = findGetParameter("services");
        if (inputServiceParameters.length > 0) {
            servicesselected = inputServiceParameters.split(",");
        }

        $.each(responseb, function (ind, val) {
            if (val.title == "Help") {
                servicehelp = val;
                //alert(JSON.stringify(servicehelp));
            } else {
                if(servicesselected.includes(val.id))
                {
                    val.checked = "checked";
                    var service = 'service-'+val.id;
                    visible_classes.push(service);
                    visible_classes.sort();
                    $(".service").hide();
                    first_visible=0;
                    $.each(visible_classes, function (index,service)  {$(service).show(); });
                }
                else{
                    val.checked = "";
                }
                servicelist.push(val);
            }

        });

        // alert(JSON.stringify(servicelist));
        //
        // render the services grid
        $("#modularstorage-services").append($.Mustache.render('services-template', {services: servicelist} ));
        // render the comparison chart


// instead of labels, we have field_data[field]["label"]

        help_text_counter = 0;
        chart = "<thead><tr><td></td>";
        for (i=0;i<servicelist.length;i++) {
            chart = chart + "<th class='service service-"+servicelist[i].id+"' scope='col'>"+servicelist[i]["title"]+"</th>";
        }
        chart = chart + "</tr></thead>"; // end first row
        //alert(chart);

        // we need the order of the rows, get this in sortedfields
        fieldweight = {};
        for (field in servicelist[0].field_data) {

            //alert ("field is "+field+" weight is "+servicelist[0].field_data[field].weight);
            fieldweight[field] = servicelist[0].field_data[field].weight;
        }

        sortedfields = Object.keys(fieldweight).sort(function(a,b){return fieldweight[a]-fieldweight[b]})
        // every other row
        for (var i=0;i<sortedfields.length;i++) {
            field = sortedfields[i];
            //alert(field);
            chart = chart + "<tr>";
            chart = chart + "<th scope='row'>"+servicelist[0].field_data[field].label;
            help_text_counter++;
            help =  servicehelp.field_data[field].value ? "<a class='popup' aria-haspop='true' href='#help-"+help_text_counter+"'><span class='sr-only'>More information about "+servicelist[0].field_data[field].label+"</span><span class='fa fa-info-circle'></span></a><div class='help' id='help-"+help_text_counter+"'><h3>"+servicelist[0].field_data[field].label+"</h3>"+servicehelp.field_data[field].value+"</div>" : "";
            chart = chart + help;
            chart = chart +"</th>"; // row title
                for (var j=0;j<servicelist.length;j++) {
                    chart = chart + "<td class='service service-"+servicelist[j].id+"' data-label='"+servicelist[0].field_data[field].label+"'>"+servicelist[j].field_data[field].value+"</td>";
                }
            chart = chart + "</tr>";
        }

        $("#comparisonchart").html(chart);

        //alert(chart);
        //chart = chart+"</div>"; // end of chart
        evaluate_services();
        if (inputServiceParameters.length > 0) {
            $('#container34').show();
        }

    });







    // utility function to show or hide services.
    // services have id="service-{{id}}"

    function evaluate_services(){
        // get a list of selected facet ids
        $(".service-panel").removeClass("mismatch").find(".cardcheckbox").removeAttr("disabled");
        selected = [];
        questionlist.forEach(function(question) {
            question.choices.forEach(function(choice) {
                if (choice.selected == true) {
                    selected.push(choice.id);
                }
            });
        })
        // now set the visibility of each service. These are in the manual checkbox list
        visible_classes=[];
        visible_services=[]; // list of ids for the url parameter
        number_visible = 0;
        comparisonlist = "";

        for (i=0;i<servicelist.length;i++) {
            service = servicelist[i];
            var hidden = "no";
            for (var j = 0; j < selected.length; j++) {
                if ( service.facet_matches.indexOf(selected[j]) < 0) {
                    $("#service-"+service.id) // card
                        .addClass('mismatch')
                        .find(".cardcheckbox")
                        .prop('checked', false)
                        .attr('disabled', true);
                    $(".service-"+service.id).hide(); // table column
                    servicelist[i]["hidden"]="yes";
                    hidden = "yes";
                }
            };

            // look at the card checkbox. if not checked, this service is hidden from the chart
            if ($("#service-"+service.id).find('.cardcheckbox').prop('checked') == false) { // card
                hidden = "yes";
                servicelist[i]["hidden"]="yes";
                //$("#service-"+service.id).addClass("mismatch") // card
                $(".service-"+service.id).hide(); // table column
            }

            if (hidden == "no") {
                $("#service-"+service.id).removeClass('mismatch'); // card
                $(".service-"+service.id).show(); // table column
                servicelist[i]["hidden"]="no";
                number_visible = number_visible + 1;
                visible_classes.push(".service-" + service.id);  // table column
                comparisonlist = comparisonlist +
                "<label><input type='checkbox' id='comparison-"+service.id+
                "' service='.service-"+service.id+"' class='manualcheckbox' checked name='manualcheckbox-"+service.id+"'> "+
                service.title+"<div class='control-indicator'></div></label>";
            }

            var service_count = $('.cardcheckbox:checked').length;
            $('#selection-number').text(service_count);
        };

        $(".comparisonlist-wrapper").html(comparisonlist);

        // first_visible = 0;
        // $(".service").hide();

        // show = visible_classes.slice(first_visible,first_visible+columns_to_show);
        // $.each(show, (index,service) => {$(service).show(); });

        // this event handler is for the list of manual checkboxes.  The effect is to
        // show or hide services which match the Step 1 criteria in the comparison chart

        $(".manualcheckbox").click( function() {
            var service = $(this).attr("service");
            if ($(this).prop("checked")) {
                visible_classes.push(service);
            } else {
                var index = visible_classes.indexOf(service);
                if (index > -1) {
                    visible_classes.splice(index, 1);
                }
            }
            visible_classes.sort();
            $(".service").hide();
            $.each(visible_classes, function (index,service)  {$(service).show(); });
        });

        $('.chart-select-all').click(function() {
            $('.manualcheckbox').prop("checked", true);
            visible_classes = [];
            $(".manualcheckbox").each( function () {
                var service = $(this).attr("service");
                visible_classes.push(service);
            });
            visible_classes.sort();
            $(".service").hide();
            first_visible=0;
            //show = visible_classes.slice(first_visible,first_visible+columns_to_show);
            show = visible_classes;  // use all of them when scrolling the table.
            $.each(show, function (index,service)  {$(service).show(); });
        });

        $('.chart-select-none').click(function() {
            $('.manualcheckbox').prop("checked", false);
            visible_classes = [];
            $(".service").hide();
        });
        //psw STSM events
        addEvents();

        facetlist = selected.join(","); // list of facets which are "on"
        $("#return").html("<a href='"+document.location.protocol+"//"+document.location.host+"/finder?facets="+facetlist+"'>Return</a>");
    }

    $(document).on("change", ".cardcheckbox",function () {
        evaluate_services();
        var service_count = $('.cardcheckbox:checked').length;
        if (service_count < 1) { $('#container34').hide(); }
    });

    $(".jump_button").click(function(){
      jump_delay = true;
      setTimeout(function(){ jump_delay = false }, 500);
      $('html, body').animate({
        scrollTop: $(".comparisonchart-wrapper-wrapper").offset().top
      }, 500);
      $(".jump-to-chart").hide();
    });

    $( "#modularstorage-services" ).on('click', '.cardcheckbox', function() {
        $('.jump-to-chart').show();
        var service_count = $('.cardcheckbox:checked').length;
        if (service_count < 1) {
              $('#container34').hide();
            $(".jump-to-chart").hide();
        } else {
            $('#container34').show();
        }
        listenForScrollEvent($('#comparisonchart tbody'));
    });

    $('.btn-clear-filters').click(function(){
        $('.facet').each( function () {
            if ($(this).prop('checked')) {
                $(this).trigger('click');
            }
        });
        $('.cardcheckbox').prop('checked', false);
    });

    $('.btn-select-all').click(function(){
        $('.cardcheckbox').not('.mismatch .cardcheckbox').prop('checked', true);
        evaluate_services();
        $('.jump-to-chart').show();
        $('#container34').show();
        listenForScrollEvent($('#comparisonchart tbody'));
    });

    $('.btn-select-none').click(function(){
        $('.cardcheckbox').prop('checked', false);
        evaluate_services();
        $('.jump-to-chart').hide();
        $('#container34').hide();  // not sure we want this
    });

    $('.btn-compare-all-table').click(function(){
        $('.manualcheckbox:visible').prop('checked', true);
    });

    $('.btn-clear-all-table').click(function(){
        $('.manualcheckbox:visible').prop('checked', false);
    });

    // var stickCompareBar = throttle(function(){
    //     // this doesn't  need to happen if there are no services checked
    //     var service_count = $('.cardcheckbox:checked').length;
    //     if (service_count > 1 && (jump_delay == false)) {
    //         // here, we choose the cards container since we know that'll be around when the JS runs
    //         $el = $('#modularstorage-services');

    //         // find the bottom of that el
    //         var bottom = $el.offset().top + $el.outerHeight(true);

    //         // add an offset so the compare bar will go away when the screen is scrolled to 200 pixels above the bottom of the comparison chart - this is just a rough approximation of when they might be able to see the table.

    //         if ($(window).scrollTop() >= (bottom - 200)) {
    //             $('.jump-to-chart').hide();
    //         } else {
    //             $('.jump-to-chart').show();
    //         }
    //     }
    // }, 200);


    function listenForScrollEvent(el){
        el.on("scroll", function(){
            el.trigger("custom-scroll");
        })
        //psw look for STSM events
        addEvents();
    }

    //$(document).scroll(stickCompareBar);


    // find the facet with the given id
    function find_facet(facetid) {
        for (i=0;i<questionlist.length;i++) {
            question = questionlist[i];
            for (j=0;j<question.choices.length;j++) {
                facet = question.choices[j];
                if (facet.id == facetid) {
                    return facet;
                }
            }
        }
        return null;
    }

/* jQuery Validate Emails with Regex */
function validateEmail(Email) {
    var pattern = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

    return $.trim(Email).match(pattern) ? true : false;
}

    $("#send_email").click(function () {
        name = $("#name").val();
        email = $("#emailaddr").val();

        if (name == "") {
            alert("You must provide your name to send email.");
            return;
        }

        if (!validateEmail(email)) {
            alert("You must provide a valid email address");
            return;
        }


        qdata = [];

        questionlist.forEach(function(question) {
            question.choices.forEach(function(choice) {
                if (choice.selected == true) {
                    qdata.push([question.id, choice.id]);
                }
            });
        })

        sdata = [];


        for (i=0;i<servicelist.length;i++) {
            if (servicelist[i]["hidden"] == "no") {
                sdata.push(servicelist[i].id);
            }
        }


        $("#name").val(""); // clear the input fields
        $("#emailaddr").val("");

        emailaddresses = [];
        if ($("#emailtoself").prop("checked")) {
            emailaddresses.push(email);
        }
        if ($("#emailtordmsg").prop("checked")) {
            emailaddresses.push("rich.marisa@gmail.com"); // rdmsg-services@cornell.edu
        }
        if (emailaddresses.length > 0) {
            var csrf_token;
            $.getJSON( "/rest/session/token", function( response ) {
                csrf_token = response.data;
            });

            emaildata = {
                    name: name,
                    email: emailaddresses.join(","),
                    qdata: qdata,
                    sdata: sdata
            };

            //alert(JSON.stringify(emaildata));

            $.ajax({
                url: '/rest/sendemail',
                type: 'POST',
                data: JSON.stringify(emaildata),
                headers: {
                    'X-CSRF-Token': csrf_token,
                },
                contentType: "application/json",
                success: function (data) {
                    alert("Email sent");
                    console.info(data);
                },
                error: function (data) {
                    console.info(data);
                }
            });
        }
        //window.location.href = 'mailto:rjm2@cornell.edu?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);

    })


// the question highlighting only works if the control key is pressed :-)

    $(document).on("mouseover", ".service-panel",
    function(event) {
        if (event.ctrlKey) {
            serviceid = $(this).attr("service");
            //alert("enter "+serviceid);
            for (i=0; i<servicelist.length; i++) {
                if (servicelist[i].id == serviceid) {
                    var facetlist = servicelist[i].facet_matches; //arr of strings
                    $('.checkbox').each( function () {
                        if ($.inArray($(this).attr("facetid"), facetlist) < 0) {
                            $(this).addClass('blocker');
                        }
                    });
                }
            }
        }
    });

    $(document).on("mouseleave", ".service-panel",
    function (event) {
        //alert("leave");
        $('.checkbox').removeClass('blocker');
    });

    /*scroll To See More functions to add notification if scroll bar is shown
        hides notification if scroll bar changes
        css located at finder/themes/custom/rdmsg/css/customizations.css
    */
    //var used to skip redundant STSM show
    var SCROLL_CONF = false;
    //create the Notification element
    /*
    $(document).on("change", ".cardcheckbox",function () {
    });
    */

    function addEvents(){
        var htmlTxt = "Scroll to See More";
        var $so = $(".scrolling-outer");
        var $som = $("#scroll-to-see-more");
        //see if scrolling outer exists and scroll to see more element exists
        if (($so.length == 1)&&($som.length==0)){
            //build scroll to see more notification
            $(".scrolling-outer").after('<div id="scroll-to-see-more" role="alert" aria-label="Scroll to see more" class="my-hidden" >'+
                                        '<ul class="notifications"><li><i class="material-icons">'+htmlTxt+
                                        '</i><span class="fa fa-arrow-right"></span></li></ul></div>');

        }
        $(".manualcheckbox").on("change", function(){
            show_STSM();
        });
        $(".chart-select-all").on("click", function(){
            show_STSM();
        });
        //if NONE filter is selected hie stsm
        $(".chart-select-none").on("click", function(){
            $('#scroll-to-see-more').removeClass('my-show');
            $('#scroll-to-see-more').addClass('my-hidden');
        });

        show_STSM();
        add_focus_events();
    }

    //if the scroll bar is present show STSM
    $( window ).resize(function() {
        if (!SCROLL_CONF){
            show_STSM();
        }
    });

    //test to see if scroll bar exists if it does show STSM
    //for some reason scroll bar width is 6000+ when first rendered?
    function show_STSM(){
        var elementSO = $(".scrolling-outer").get(0);
        if (elementSO && !SCROLL_CONF){
            var selected = $("#selection-number").text();
            var compChecked = $(".manualcheckbox:checked").length;
            if (parseInt(selected) > 12 ){
                //really big table just show
                if (compChecked == selected){
                    $('#scroll-to-see-more').removeClass('my-hidden');
                    $('#scroll-to-see-more').addClass('my-show');
                }else if(elementSO.offsetWidth < elementSO.scrollWidth){
                    $('#scroll-to-see-more').removeClass('my-hidden');
                    $('#scroll-to-see-more').addClass('my-show');
                }else{
                    $('#scroll-to-see-more').removeClass('my-show');
                    $('#scroll-to-see-more').addClass('my-hidden');
                }
            }else if ((elementSO.offsetWidth < elementSO.scrollWidth) && (elementSO.scrollWidth < 5000)) {
                //console.log("has overflow "+elementSO.offsetWidth+" < "+elementSO.scrollWidth);
                $('#scroll-to-see-more').removeClass('my-hidden');
                $('#scroll-to-see-more').addClass('my-show');

            } else {
                $('#scroll-to-see-more').removeClass('my-show');
                $('#scroll-to-see-more').addClass('my-hidden');
            }
            //add scrolling outer event to hide STSM on scroll this could be in
            $(".scrolling-outer").scroll(function(){
                $('#scroll-to-see-more').removeClass('my-show');
                $('#scroll-to-see-more').addClass('my-hidden');
                SCROLL_CONF = true;
            });
        }
    }
    /* end of scroll to see more */

    //apply same style to all buttons
    $(".btn-clear-filters").removeClass("btn-secondary");
    $(".btn-clear-filters").addClass("btn-primary");
    $(".btn-select-none").removeClass("btn-secondary");
    $(".btn-select-none").addClass("btn-primary");

    //WA fix for tabing to table header only used if user is tabing through table
    //shows or hides overlay
    function add_focus_events(){
        var my_attr = $(".floating-row-header").find("a").attr('data-hidden');
        if( !my_attr){
            $("#comparisonchart th").find("a").on("focus", function(){
                $(".floating-row-header").hide();
            });

            $("#comparisonchart th").find("a").on("focusout", function(){
                $(".floating-row-header").show();
            });

            $(".floating-row-header a").attr({
                tabindex: '-1',
                "data-hidden" : "true"
            });

        };
    }

})(jQuery, Drupal, drupalSettings);
