var wptmonitor = (function(window, $, wptmonitor){

    $(document).ready(function(){
        "use strict";
        $("#updateForm").validate();
        onloadInit();

        var endh = document.getElementsByName("endHour")[0];
        var starth = document.getElementsByName("startHour")[0];
        endh.addEventListener('change',checkInterval, false);
        starth.addEventListener('change',checkInterval, false);
    });

    function onloadInit() {
        "use strict";
        checkInterval();
        adjustTimeFrame();
    }


    function adjustTimeFrame(){
        timeFrameElement = document.getElementById('timeFrame');
        timeFrameValue = timeFrameElement[timeFrameElement.selectedIndex].value;

        startSelectElement = document.getElementById('startTimeSelect');
        endSelectElement = document.getElementById('endTimeSelect');

        if ( timeFrameValue > 0 ){
            startSelectElement.style.visibility='hidden';
            endSelectElement.style.visibility='hidden';
        } else {
            startSelectElement.style.visibility='visible';
            endSelectElement.style.visibility='visible';

        }

        currentInterval = intervalElement.options[intervalElement.selectedIndex].value;
        intervalElement = document.getElementById('interval');

        ival = timeFrameValue / 150;
        interval = 0;
        if (ival > 300)  interval = 300;
        if (ival > 900)  interval = 900;
        if (ival > 1800) interval = 1800;
        if (ival > 3600) interval = 3600;
        if (ival > 10800)interval = 10800;
        if (ival > 21600)interval = 21600;
        if (ival > 43200)interval = 43200;
        if (ival > 86400)interval = 86400;
        if (currentInterval < interval) {
            //intervalElement.value = interval;
        }

        //disableIntervalOptionsBelow(interval);
    }


    function checkInterval() {
        intervalElement = document.getElementById('interval');
        currentInterval = intervalElement.options[intervalElement.selectedIndex].value;
        startMonthElement = document.getElementsByName('startMonth')[0];
        startMonth = startMonthElement.options[startMonthElement.selectedIndex].value;
        startDayElement = document.getElementsByName('startDay')[0];
        startDay = startDayElement.options[startDayElement.selectedIndex].value;
        startYearElement = document.getElementsByName('startYear')[0];
        startYear = startYearElement.options[startYearElement.selectedIndex].value;
        startHourElement = document.getElementsByName('startHour')[0];
        startHour = startHourElement.options[startHourElement.selectedIndex].value;
        start = ((new Date(startYear, startMonth, startDay, startHour)).getTime()) / 1000;

        endMonthElement = document.getElementsByName('endMonth')[0];
        endMonth = endMonthElement.options[endMonthElement.selectedIndex].value;
        endDayElement = document.getElementsByName('endDay')[0];
        endDay = endDayElement.options[endDayElement.selectedIndex].value;
        endYearElement = document.getElementsByName('endYear')[0];
        endYear = endYearElement.options[endYearElement.selectedIndex].value;
        endHourElement = document.getElementsByName('endHour')[0];
        endHour = endHourElement.options[endHourElement.selectedIndex].value;
        end = ((new Date(endYear, endMonth, endDay, endHour)).getTime()) / 1000;

        span = end - start;

        ival = span / 150;
        interval = 0;
        if (ival > 300)  interval = 300;
        if (ival > 900)  interval = 900;
        if (ival > 1800) interval = 1800;
        if (ival > 3600) interval = 3600;
        if (ival > 10800)interval = 10800;
        if (ival > 21600)interval = 21600;
        if (ival > 43200)interval = 43200;
        if (ival > 86400)interval = 86400;

        if (currentInterval < interval) {
            //intervalElement.value = interval;
        }

        if(start >= end) {
            alert('Warning! Start time is not smaller that end date.');
            $('#startTimeSelect').addClass('badValue');
            $('#endTimeSelect').addClass('badValue');
        } else {
            $('#startTimeSelect').removeClass('badValue');
            $('#endTimeSelect').removeClass('badValue');
        }

        //disableIntervalOptionsBelow(interval);

    }


    function disableIntervalOptionsBelow(value) {
        // First reenable all of them
        intervalElement = document.getElementById('interval');
        for (i = intervalElement.length - 1; i >= 1; i--) {
            intervalElement.options[i].disabled = false;
        }
        for (i = intervalElement.length - 1; i >= 1; i--) {
            if (intervalElement.options[i].value < value) {
                intervalElement.options[i].disabled = true;
            }
        }
    }


    function validateForm() {
        return checkJobCount();
    }


    // Limit number of jobs to select
    function checkJobCount() {
        "use strict";
        var maxJobs = 8;
        if ($('#jobs').val() == null) {
            alert('Please select job(s)');
            return false;
        } else  if ($('#jobs').val().length > maxJobs) {
            alert('Please Select '+maxJobs+' or less jobs');
            return false;
        } else {
            return true;
        }
    }

    function updateReport() {
        if (!validateForm()) {
            return false;
        }
        document.updateForm.act.value="report";
        document.updateForm.submit();
    }


    function downloadData() {
        if (!validateForm()) {
            return false;
        }
        document.updateForm.act.value="download";
        document.updateForm.submit();
    }


    function updateGraph() {
        "use strict";
        if (!validateForm()) {
            return false;
        }
        document.getElementById('graphButton').disabled = true;
        document.updateForm.act.value="graph";
        window.wptmonitor.graph.doNotPreventUnloadConfirmation();
        document.updateForm.submit();
    }

    //exporting functions to global namespace
    window.updateGraph      = updateGraph;
    window.updateReport     = updateReport;
    window.downloadData     = downloadData;
    window.checkJobCount    = checkJobCount;
    window.checkInterval    = checkInterval;
    window.adjustTimeFrame  = adjustTimeFrame;
    window.validateForm     = validateForm;

})(window, jQuery, wptmonitor || {});
