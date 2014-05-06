(function(window, $){

    var chart;

    $(document).ready(function() {
        var act = "";
        if(typeof action !== "undefined") {
            act = action;
        };
        $("#updateForm").validate();
        onloadInit();

        var endh = document.getElementsByName("endHour")[0];
        var starth = document.getElementsByName("startHour")[0];
        endh.addEventListener('change',checkInterval, false);
        starth.addEventListener('change',checkInterval, false);


        $('#graphJSONButton').on('click', function(e){
            submitFormAJAX()
            .fail(function(e){
                console.error(e);
            });
        });

        if(act && act === "graph") {
            if(getJobCount() > 0){
                setTimeout(function(){
                    $('html, body').animate({
                        'scrollTop': $("#main").offset().top},
                        'slow',
                        'swing'
                    );
                    submitFormAJAX()
                    .fail(function(e){
                        console.error(e);
                    });
                }, 50);
            }
        }
    });

    function submitFormAJAX() {
        var deferred=$.Deferred();
        var serializedFormData = $('#updateForm').serializeArray();

        if(!checkJobCount()) {
            return;
        }

        getChartDataWithGUIBehavior(serializedFormData)
        .done(function(d){
            try {
                d = convertData2avgCharts(d);
            } catch(e) {
                deferred.reject(e);
                return;
            }
            drawChart(d);
            deferred.resolve();

        })
        .fail(function(a){
            deferred.reject(a.message);
        });
        return deferred.promise();
    }

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


    /**
     *  Returns all possible names of metric fields
     */
    function getFormMetricFields(){
        return ['FV_TTFB', 'FV_Render', 'FV_Doc', 'FV_Dom', 'FV_Fully', 'RV_TTFB', 'RV_Render', 'RV_Doc', 'RV_Dom', 'RV_Fully'];
    }

    /**
     * Converts data returned by server to format that can be consumed by AmCharts Serial chart
     * @param {Array} data
     */
    function convertData2avgCharts (data) {
        var chartData = [];
        var seriesToJobNameMap = {};
        var seriesToMetricNameMap = {};
        var seriesToJobIdMap ={};
        var valueFields = [];
        var numberOfSeries = 0;
        var previousJobId = null;

        for(var i in data.series) {
            if(previousJobId !== null) {
                if(data.series[previousJobId].dataSet.length !== data.series[i].dataSet.length) {
                    throw "Not equal datasets";
                }
            }
            previousJobId = i;
            numberOfSeries++;
        }

        /**
         *  Iterate all points and then all series to put all series in different fields but in one data serie
         */
        for(var i=0; i<data.series[previousJobId].dataSet.length; i++) {
            var tmpPoint = {};
            tmpPoint['date'] = data.series[previousJobId].dataSet[i].DateFormatted;
            tmpPoint['timestamp'] = data.series[previousJobId].dataSet[i].UnixTimestamp;
            for(var j in data.jobs) {
                for (var k=0; k < data.metrics.length; k++) {
                    if(data.series[data.jobs[j]].dataSet[i][data.metrics[k]]){
                        tmpPoint[data.metrics[k] + "-" + data.jobs[j]] = (data.series[data.jobs[j]].dataSet[i][data.metrics[k]]/1000).toFixed(2);
                    }
                };
            }
            chartData.push(tmpPoint);
        }

        for (var k=0; k < data.metrics.length; k++) {
            for(var i=0; i < data.jobs.length; i++) {
                seriesToJobNameMap[data.metrics[k] + "-" + data.jobs[i]] = data.series[data.jobs[i]].jobName;
                seriesToMetricNameMap[data.metrics[k] + "-" + data.jobs[i]] = data.metrics[k];
                seriesToJobIdMap[data.metrics[k] + "-" + data.jobs[i]] = data.jobs[i];
                valueFields.push(data.metrics[k] + "-" + data.jobs[i]);
            }
        }

        return {
            getJobName    : function(seriesName){return seriesToJobNameMap[seriesName];},
            getMetricName : function(seriesName){return seriesToMetricNameMap[seriesName];},
            getJobId      : function(seriesName){return seriesToJobIdMap[seriesName];},
            valueFields: valueFields,
            series: chartData
        };
    }

    function drawChart(data) {

        function drawTable(data) {
            var table = $(document.createElement('table'));

            var headerRow = $(document.createElement('tr'))
                .addClass("header");

            headerRow.append(
                $(document.createElement('th'))
                    .addClass("date")
                    .html("Date")
            );

            for(var i in data.valueFields) {
                headerRow.append(
                    $(document.createElement("th"))
                        .addClass("metric")
                        .html(
                            getJobName(data.valueFields[i]) + " " + getMetricName(data.valueFields[i])
                        )
                );
            }

            table.append(headerRow);

            var row;
            var evenOddClass = "";
            for(var i in data.series) {
                if(i % 2) {
                    evenOddClass = "odd";
                }else {
                    evenOddClass = "even";
                }
                row = $(document.createElement("tr"));
                row.addClass(evenOddClass);
                row.append(
                        $(document.createElement("td"))
                            .addClass("date")
                            .html(
                                data.series[i].date
                            )
                );

                for(var j in data.valueFields) {
                    row.append(
                        $(document.createElement("td"))
                            .addClass("metric")
                            .html(function(value){
                                if(value) return (value/1000).toFixed(3);
                                else      return null;
                            }(data.series[i][data.valueFields[j]]))
                    );
                }
                table.append(row);
            }

            $("#graph").html("");

            $("#graph").append(table);

        }
        // http://jsfiddle.net/martynasma/j9gUu/10/

        var getMetricName = data.getMetricName || function(a) {return 'No getMetricName function';};
        var getJobName    = data.getJobName ||    function(a) {return 'No getJobName function';};
        var getJobId      = data.getJobId ||      function(a) {return 'No getJobId function';};
        var graphs = [];

        /**
         *  Prepare graphs configs for all data series
         */
        for(var i in data.valueFields){
            graphs.push({
                id:data.valueFields[i],
                balloonText: "[[category]]<br /><b><span style='font-size:14px;'>"+getMetricName(data.valueFields[i])+": [[value]]</span></b>",
                bullet: "round",
                bulletSize: 1,
                bulletBorderAlpha: 1,
                bulletColor:"#FFFFFF",
                hideBulletsCount: 0,
                title: getJobName(data.valueFields[i]) + " " + getMetricName(data.valueFields[i]),
                valueField: data.valueFields[i],
                useLineColorForBulletBorder:true
            });
        }
        if(chart){    
            /**
             *  If a chart is already instantiated new data provider is set and the chart redrawn. 
             */    
            chart.dataProvider = data.series;
            chart.graphs = graphs;
            chart.validateData();
        } else {
            // chart is instantiated from scratch
            chart = AmCharts.makeChart("graph", {
                type: "serial",
                theme: "none",
                pathToImages: "js/amcharts/images/",
                dataProvider: data.series,
                zoomOutOnDataUpdate: false,
                valueAxes: [{
                    axisAlpha: 0.2,
                    dashLength: 1,
                    position: "left"
                }],
                graphs: graphs,
                chartScrollbar: {
                    autoGridCount: true,
                    // graph: "g1",
                    "scrollbarHeight": 40
                },
                chartCursor: {
                    cursorPosition: "mouse",
                    categoryBalloonDateFormat: "MMM DD JJ:NN:SS"
                },
                categoryField: "date",
                dataDateFormat: "YYYY-MM-DD JJ:NN:SS",
                categoryAxis: {
                    parseDates: true,
                    minPeriod: "ss",
                    //categoryFunction: function(category, dataItem, categoryAxis){return new Date(dataItem*1000);},
                    //axisColor: "#DADADA",
                    //dashLength: 1,
                    minorGridEnabled: true
                },
                legend: {
    
                }
            });
    
            chart.addListener("clickGraphItem", function(e){
                var dataContext = e.item.dataContext;
                var valueField = e.graph.valueField;
                console.log("Clicked", getJobName(valueField) + " " + getMetricName(valueField) + ": ", dataContext[valueField]);
            });
        }

        // drawTable(data);
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

    function getJobCount(){
        var val = $('#jobs').val();
        var count;

        if(val === null) {count = 0;}
        else {count = val.length;}

        return count;
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
    window.updateReport     = updateReport;
    window.downloadData     = downloadData;
    window.checkJobCount    = checkJobCount;
    window.checkInterval    = checkInterval;
    window.adjustTimeFrame  = adjustTimeFrame;

    window.getChart      = function(){return chart;};

})(window, jQuery);
