(function(window, $){
        
    var chart = {};
    
    $(document).ready(function() {
        $("#updateForm").validate();
        onloadInit();
      
        var endh = document.getElementsByName("endHour")[0];
        var starth = document.getElementsByName("startHour")[0];
        endh.addEventListener('change',checkInterval, false);
        starth.addEventListener('change',checkInterval, false);
    
        
        function showChartContainer(){
            var d = $.Deferred();
            
            if($("#graphContainer").is(":hidden")){
                $("#graphContainer").slideDown(200, function(){
                    d.resolve();
                });
            } else {
                d.resolve();
            }
            
            return d.promise();
        }

        function getChartData(params){
            var d = $.Deferred();
            var ajaxRequestPromise = $.ajax({
                url: 'jash/flashGraph.json.php',
                data: params,
                method: "POST"
            }).done(function(data){
                if(data.status !== 200) {
                    d.reject({
                        status:  data.status,
                        message: data.message
                    });
                } else {
                    d.resolve(data.results);
                }
            }).error(function(jqxhr, err){
                d.reject({
                    status: jqxhr.status,
                    message: jqxhr.statusText
                });
            }); 
            return d.promise();
        }     
        
        function getChartDataWithGUIBehavior(params){
            var d = $.Deferred();
            var button = $("#graphJSONButton");     

            $.when(
                getChartData(params),
                $(button).attr('disabled', 'disabled'),
                $('#graphOverlay').fadeIn(100)
                ,showChartContainer()
            ).done(function(data){
                d.resolve(data);
            }).fail(function(a, b, c){
                alert('Error getting data from the server\n'+a.message+' ('+a.status+')');
                d.reject(a);
            }).always(function(a, b, c){
                $(button).removeAttr('disabled');
                $('#graphOverlay').fadeOut();
            });
            
            return d.promise();
        }
        
        $('#graphJSONButton').on('click', function(e){
            var serializedFormData = $('#updateForm').serializeArray();
            
            if(!checkJobCount()) {
                return;
            }
            
            getChartDataWithGUIBehavior(serializedFormData)
            .done(function(d){
                console.log(d);
                drawChart(chart, d);
            });
        });
    });
    
    function drawChart(chart, data) {
        
        // http://jsfiddle.net/martynasma/j9gUu/10/
        
        var chartData = [];
        
        var numberOfSeries = 0;
        var previousJobId = null;
        
        for(var i in data) {
            if(previousJobId !== null) {
                if(data[previousJobId].dataSet.length !== data[i].dataSet.length) {
                    console.error('not equal datasets');
                }
            }
            previousJobId = i;
            numberOfSeries++;
        }
        
        for(var i=0; i<data[previousJobId].dataSet.length; i++) {
            var tmpPoint = {};
            tmpPoint['date'] = data[previousJobId].dataSet[i].DateFormatted;
            tmpPoint['timestamp'] = data[previousJobId].dataSet[i].UnixTimestamp;
            for(var j in data) {
                // tmpPoint[j]
            }
            chartData.push(tmpPoint);
        }
        
        console.log(chartData);

        try{

        } catch(e){
            console.error(e);
        }
        
        
        console.log(chart);
        
    }
    
    function onloadInit() {
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
      if (!validateForm()) {
        return false;
      }
      document.getElementById('graphButton').disabled = true;
      document.updateForm.act.value="graph";
      document.updateForm.submit();
    }
    
    //exporting functions to global namespace
    window.updateGraph      = updateGraph;
    window.checkJobCount    = checkJobCount;
    window.checkInterval    = checkInterval;
    window.adjustTimeFrame  = adjustTimeFrame;
    
})(window, jQuery);
