$(window).on('load', function(){
    if (window.location.pathname != "/login") {
        setControls();
        setToday();
        // Execute first SIP status check, which also will act as auth check
        checkSipStatus()
    }
});

function checkSipStatus() {
    $.getJSON($SCRIPT_ROOT + '/_sip_status', {
    }).done(function(data) {
        // Schedule next sip_status check in 1 minute
        setTimeout(checkSipStatus, 15*1000);

        if ("error" in data){
            status_title = "Offline"
            status_details = data["error"]
            status_dot_class = "dot dot-lg dot-danger"
        } else if ("status" in data){
            status_title = "Online"
            status_details = data["status"]
            if (status_details == "In use"){
                status_dot_class = "dot dot-lg dot-warning"
            }else if (status_details == "Not in use"){
                status_dot_class = "dot dot-lg dot-success"
            }
        }

        $("#sip_status_label").text(status_title);
        $("#sip_status_label").attr("title", status_details);
        $("#sip_status_dot").attr("class", status_dot_class);
        $("#sip_status_dot").attr("title", status_details);

    }).fail(function(data){
        if (data.status != 500){
            window.location.replace("/login");
        }
    });
}

function setControls(){
    $("#oneday_picker").datetimepicker({
        format: 'L',
        MaxDate: moment()
    });

    $("#date_start_picker").datetimepicker({
        format: 'L',
        MaxDate: moment()
    });

    $("#date_end_picker").datetimepicker({
        format: 'L',
        MaxDate: moment()
    });

    $("#time_start_picker").datetimepicker({
        format: 'HH:mm',
        stepping: 30
    });
    $("#time_end_picker").datetimepicker({
        format: 'HH:mm',
        stepping: 30,
    });

    $('#oneday_radio').on("click", function() {
        $(".period_controls").hide()
        $(".oneday_controls").show()
    });

    $('#range_radio').on("click", function() {
        $(".oneday_controls").hide()
        $(".period_controls").show()
    });

    $("#date_start_picker").on("change.datetimepicker", function (e) {
        $('#date_end_picker').datetimepicker('minDate', e.date);
    });
    $("#date_end_picker").on("change.datetimepicker", function (e) {
        $('#date_start_picker').datetimepicker('maxDate', e.date);
    });

    $("#time_start_picker").on("change.datetimepicker", function (e) {
        $('#time_end_picker').datetimepicker('minDate', moment(e.date).add(30, 'm').toDate());
    });
    $("#time_end_picker").on("change.datetimepicker", function (e) {
        $('#time_start_picker').datetimepicker('maxDate', moment(e.date).add(-30, 'm').toDate());
    });

};

function setLastHour(){
    $("#oneday_picker").datetimepicker('date', moment());
    $("#date_start_picker").datetimepicker('date', moment());
    $("#date_end_picker").datetimepicker('date', moment());

    var timeStart = moment().toDate();
    var timeEnd = moment().add(1, 'h').toDate();
    timeStart.setMinutes(0,0,0)
    timeEnd.setMinutes(0,0,0)
    $("#time_start_picker").datetimepicker('date', timeStart);
    $("#time_end_picker").datetimepicker('date', timeEnd);

    $('#oneday_radio').click()
    $('#hide_outgoing_missed_check').prop('checked', true);
    LoadCallsData()
}

function setToday(){
    $("#oneday_picker").datetimepicker('date', moment());
    $("#date_start_picker").datetimepicker('date', moment());
    $("#date_end_picker").datetimepicker('date', moment());

    var timeStart = moment().toDate();
    var timeEnd = moment().toDate();
    timeStart.setHours(7, 0,0,0)
    timeEnd.setHours(20, 0,0,0)
    $("#time_start_picker").datetimepicker('date', timeStart);
    $("#time_end_picker").datetimepicker('date', timeEnd);

    $('#oneday_radio').click()
    $('#hide_outgoing_missed_check').prop('checked', true);
    LoadCallsData()
}

function setYesterday(){
    $("#oneday_picker").datetimepicker('date', moment().subtract(1, 'days'));
    $("#date_start_picker").datetimepicker('date', moment());
    $("#date_end_picker").datetimepicker('date', moment());

    var timeStart = moment().subtract(1, 'days').toDate();
    var timeEnd = moment().subtract(1, 'days').toDate();
    timeStart.setHours(7, 0,0,0)
    timeEnd.setHours(20, 0,0,0)
    $("#time_start_picker").datetimepicker('date', timeStart);
    $("#time_end_picker").datetimepicker('date', timeEnd);

    $('#oneday_radio').click()
    $('#hide_outgoing_missed_check').prop('checked', true);
    LoadCallsData()
}

function setCurrentWeek(){
    // Order of date range important
    $("#date_end_picker").datetimepicker('date', moment());
    $("#date_start_picker").datetimepicker('date', moment().startOf('isoWeek'));

    $('#range_radio').click()
    $('#hide_outgoing_missed_check').prop('checked', true);
    LoadCallsData()
}

function setLastWeek(){
    $("#date_start_picker").datetimepicker('date', moment().subtract(1, 'weeks').startOf('isoWeek'));
    $("#date_end_picker").datetimepicker('date', moment().subtract(1, 'weeks').endOf('isoWeek'));

    $('#range_radio').click()
    $('#hide_outgoing_missed_check').prop('checked', true);
    LoadCallsData()
}

function LoadCallsData() {
    oneday_checked = $('#oneday_radio')[0].checked
    range_checked = $('#range_radio')[0].checked

    endpoint = "/_raw_data"

    if (oneday_checked) {
        var time_start = $("#time_start_picker").datetimepicker('date').format('HH:mm:00')
        var time_end = $("#time_end_picker").datetimepicker('date').format('HH:mm:00')
        var oneday =  $("#oneday_picker").datetimepicker('date').format('YYYY-MM-DD')

        // Handle the case for TempusDominos stupid selector
        if (time_end == "00:00:00"){
            time_end = "23:59:59"
        }
        var date_start = oneday + ' ' + time_start
        var date_end = oneday + ' ' + time_end
    }else if(range_checked){
        var date_start = $("#date_start_picker").datetimepicker('date').format('YYYY-MM-DD 00:00:00')
        var date_end = $("#date_end_picker").datetimepicker('date').format('YYYY-MM-DD 23:59:59')
    }

    $('#all-records-table').bootstrapTable('removeAll')
    $('#important-records-table').bootstrapTable('removeAll')

    //Show loading spinner
    $('#loadingspinner').modal('show');

    $.getJSON($SCRIPT_ROOT + endpoint, {
        date_start: date_start,
        date_end: date_end
    }).done(function(data) {
        GenerateTableData(data)
    }).fail(function(data){
        if (data.status != 200){
            $("#alertbox .modal-title").text(data.statusText);
            $("#alertbox .modal-body").text(data.status + ': Please contact support to fix it!');
            $('#alertbox').modal();
        }else{
            window.location.replace("/login");
        }
    });
};

function GenerateTableData(data){

    if("result" in data){
        $('#alertbox').modal('hide');

        var all_records = data["result"]
        hide_outgoing_missed = $('#hide_outgoing_missed_check')[0].checked

        if (hide_outgoing_missed){
            var important_records = data["result"].filter(function(item) {
                return !(item["disposition"] == "ANSWERED" && item['direction'] == "Incoming")
                    && !(item["direction"] == "Outgoing" || item["direction"] == "Internal");
            });
        }else{
            var important_records = data["result"].filter(function(item) {
                return !(item["disposition"] == "ANSWERED");
            });
        }
        updateTable(important_records, all_records)
    }else if ("error" in data){
        $("#alertbox .modal-title").text("Operational Error");
        $("#alertbox .modal-body").text(data["error"]);
        $('#alertbox').modal();
    }
}

function updateTable(important_records, all_records){

    var columns_all = [
        {
            "field": "calldate",
            "title": "Date",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "direction",
            "title": "Direction",
            "formatter": "CallDirectionFormatter",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "src",
            "title": "From",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "dst",
            "title": "To",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "disposition",
            "title": "Status",
            "formatter": "CallDispositionFormatter",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "waiting_duration",
            "title": "Wait, sec",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "talking_duration",
            "title": "Talk, sec",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        // {
        //     "field": "record_file",
        //     "title": "Call record",
        //     "formatter": "CallRecordFileFormatter",
        //     "halign": "center",
        //     "align": "center",
        //     "sortable": true
        // }
    ]
    var columns_important = [
        {
            "field": "calldate",
            "title": "Date",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "direction",
            "title": "Direction",
            "formatter": "CallDirectionFormatter",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "src",
            "title": "From",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "dst",
            "title": "To",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "disposition",
            "title": "Status",
            "formatter": "CallDispositionFormatter",
            "halign": "center",
            "align": "center",
            "sortable": true
        },
        {
            "field": "waiting_duration",
            "title": "Wait, sec",
            "halign": "center",
            "align": "center",
            "sortable": true
        }
    ]

    $('#all-records-table').bootstrapTable({
        columns: columns_all,
        rowStyle: rowStyle,
        pageSize: 25,
        rowAttributes: rowAttributes,
        exportDataType: "all",
        exportTypes: ['excel', 'pdf'],
        exportOptions:{
            fileName: 'call_report',
            worksheetName: 'Call Report',
            tableName: 'call_report',
            mso: {
                fileFormat: 'xlshtml',
                onMsoNumberFormat: doOnMsoNumberFormat
            }
        }
     });

    $('#all-records-table').on('all.bs.table', function (e) {
        $('[data-toggle="popover"]').popover()
    })

    $('#all-records-table').bootstrapTable('load', all_records);


    $('#important-records-table').bootstrapTable({
        columns: columns_important,
        rowStyle: rowStyle,
        pageSize: 25,
        rowAttributes: rowAttributes,
        exportDataType: "all",
        exportTypes: ['excel', 'pdf'],
        exportOptions:{
            fileName: 'call_report',
            worksheetName: 'Call Report',
            tableName: 'call_report',
            mso: {
                fileFormat: 'xlshtml',
                onMsoNumberFormat: doOnMsoNumberFormat
            }
        }
    });

    $('#important-records-table').on('all.bs.table', function (e) {
        $('[data-toggle="popover"]').popover()
    })

    $('#important-records-table').bootstrapTable('load', important_records);

    //Hide loading spinner
    setTimeout(hideSpinnerLoading, 250)
};


function hideSpinnerLoading() {
    if ($('#loadingspinner').hasClass('show')){
        $('#loadingspinner').modal('hide');
    }else{
        $('#loadingspinner').on('shown.bs.modal', function (e) {
            $('#loadingspinner').modal('hide');
        })
    }
}

function doOnMsoNumberFormat(cell, row, col){
    var result = "";
    if (row > 0 && col == 2){
        result = "\\@";
    }
    return result;
}

function rowStyle(row, index) {
    if (row.disposition == "ANSWERED"){
        if ("missed" in row){
            css_class = "alert-primary"
        }else{
            css_class = "alert-success"
        }
    } else if (row.disposition == "MISSED") {
        if ("callback" in row) {
            css_class = "alert-primary"
        } else {
            css_class = "alert-danger"
        }
    } else if (row.disposition == "NO ANSWER") {
        css_class = "alert alert-warning"
    } else {
        css_class = "alert-secondary"
    }

    return {
        classes: css_class,
        css: {"font-size": "13px", "padding": ".2rem"}
    };
}

function rowAttributes(row, index) {
    var result = {
        'data-toggle': 'popover',
        'data-placement': 'top',
        'data-trigger': 'hover',
        'data-html': true
    }

    if ("callback" in row && row.direction == "Incoming" && row.disposition == "MISSED") {
        result["data-content"] = [
                'Callback at: ' + row.callback.calldate,
                'By: ' + row.callback.src,
                'Before callback elapsed: ' + secondsToHms(row.callback.before_call)
            ].join('<br>')
    } else if ("missed" in row && (row.direction == "Outgoing" || row.direction == "Internal")){
        missed_calls = []
        for (call_index in row.missed){
            missed_call = [
                'Missed at: ' + row.missed[call_index].calldate,
                'By: ' + row.missed[call_index].src,
                'After call missed elapsed: ' + secondsToHms(row.missed[call_index].before_call)
            ].join('<br>')
            missed_calls.push(missed_call)
        }
        result["data-content"] = missed_calls.join('<hr>')
    }

    return result
}

function CallDirectionFormatter(value, row) {
    var icon
    if (row.direction == "Incoming"){
        icon = "fa fa-sign-in"
    } else if (row.direction == "Outgoing"){
        icon = "fa fa-sign-out"
    }
    return '<i class="' + icon + '" aria-hidden="true" style="font-size:20px"></i> ' + row.direction
}

function CallDispositionFormatter(value, row) {
    var icon
    if (row.disposition == "NO ANSWER" || row.disposition == "MISSED"){
        icon = "fa fa-reply-all"
    }else if (row.disposition != "ANSWERED"){
        icon = "fa fa-exclamation-triangle"
    }else {
        icon = ''
    }
    return '<i class="' + icon + '" aria-hidden="true" style="font-size:20px"></i> ' + value
}

function CallRecordFileFormatter(value, row) {
    if (row.record_file) {
        return "<div class='mw-100'><audio class='mw-100' src='" + row.record_file + "' controls></audio></div>"
    }
}

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + "h:" : "";
    var mDisplay = m > 0 ? m + "m:" : "";
    var sDisplay = s + "s";
    return hDisplay + mDisplay + sDisplay;
}