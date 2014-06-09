"use strict";
var wptmonitor = (function(window, $, wptmonitor){

    var chart;

    $(document).ready(function() {
        "use strict";

        var act = wptmonitor.graph.action;

        $('#graphJSONButton').on('click', function(){
            var chartContainerIsHidden = isChartContainerHidden();
            submitFormAJAX()
            .done(function(){
                if(chartContainerIsHidden){
                    scrollToGraph();
                }
            })
            .fail(function(e){
                console.error(e);
            });
        });

        $('#hideGraph').click(function(e){
            e.preventDefault();
            $('#graphContainer').slideUp(function(){
                $('#graphOverlay').show();
                $('#graph').empty();
                chart = null;
            });
        });

        if(act && act === "graph") {
            if(getJobCount() > 0){
                setTimeout(function(){
                    $('#graphJSONButton').trigger('click');
                }, 50);
            }
        }

        function scrollToGraph() {
            var container = $("#graphContainer");
            $('html, body').animate({
                'scrollTop': container.offset().top - $(window).height() + container.height() },
                1000,
                'swing'
            );
        }

    });

    function submitFormAJAX() {
        "use strict";
        var deferred=$.Deferred();
        var serializedFormData = $('#updateForm').serializeArray();

        if(!checkJobCount()) {
            deferred.reject("No jobs selected");
        } else {
            getChartDataWithGUIBehavior(serializedFormData)
            .done(function(d){
                try {
                    d = convertData2avgCharts(d);
                    drawChart(d);
                } catch(e) {
                    alert('Error occured while drawing chart: ' + e);
                    deferred.reject(e);
                    return;
                }

                deferred.resolve();

            })
            .fail(function(a){
                deferred.reject(a.message);
            });
        }

        return deferred.promise();
    }

    function showChartContainer(){
        "use strict";
        var d = $.Deferred();
        var container = $("#graphContainer");

        if(container.is(":hidden")){
            container.slideDown(1000, function(){
                d.resolve();
            });
        } else {
            d.resolve();
        }

        return d.promise();
    }

    function isChartContainerHidden() {
        return $("#graphContainer").is(":hidden");
    }

    function getChartData(params){
        "use strict";
        var d = $.Deferred();
        $.ajax({
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
        }).error(function(jqxhr){
            d.reject({
                status: jqxhr.status,
                message: jqxhr.statusText
            });
        });
        return d.promise();
    }

    function getChartDataWithGUIBehavior(params){
        "use strict";
        var d = $.Deferred();
        var button = $("#graphJSONButton");

        $.when(
            getChartData(params),
            $(button).attr('disabled', 'disabled')
            ,showChartContainer().done(function(){
                $('#graphOverlay').fadeIn(100);
            })
        ).done(function(data){
            d.resolve(data);
        }).fail(function(a){
            alert('Error getting data from the server\n'+a.message+' ('+a.status+')');
            d.reject(a);
        }).always(function(){
            $('#graphOverlay').fadeOut(600, function(){
                $(button).removeAttr('disabled');
            });
        });

        return d.promise();
    }


    /**
     * Converts data returned by server to format that can be consumed by AmCharts Serial chart
     * @param {Array} data
     */
    function convertData2avgCharts (data) {
        "use strict";
        var chartData = [];
        var seriesToJobNameMap = {};
        var seriesToMetricNameMap = {};
        var seriesToJobIdMap ={};
        var valueFields = [];
        var numberOfSeries = 0;
        var previousJobId = null;
        var i, j, k;

        for(i in data.series) {
            if(data.series.hasOwnProperty(i)){
                if(previousJobId !== null) {
                    if(data.series[previousJobId].dataSet.length !== data.series[i].dataSet.length) {
                        throw "Not equal datasets";
                    }
                }
                previousJobId = i;
                numberOfSeries++;
            }
        }

        /**
         *  Iterate all jobs and metrics to create mappings between value fields names and other data
         */
        for (k=0; k < data.metrics.length; k++) {
            for(i=0; i < data.jobs.length; i++) {
                seriesToJobNameMap[data.metrics[k] + "-" + data.jobs[i]] = data.series[data.jobs[i]].jobName;
                seriesToMetricNameMap[data.metrics[k] + "-" + data.jobs[i]] = data.metrics[k];
                seriesToJobIdMap[data.metrics[k] + "-" + data.jobs[i]] = data.jobs[i];
                valueFields.push(data.metrics[k] + "-" + data.jobs[i]);
            }
        }

        /**
         *  Functions to be put on every data point to be accessible from click event handler
         */
        var getJobName    = function(seriesName){
            return seriesToJobNameMap[seriesName];
        };

        var getMetricName = function(seriesName){
            return seriesToMetricNameMap[seriesName];
        };
        var getJobId      = function(seriesName){
            return seriesToJobIdMap[seriesName];
        };

        var getInterval   = function(){
            return data.interval;
        };


        /**
         *  Iterate all points and then all series to put all series in different fields but in one data serie
         */
        for(i=0; i<data.series[previousJobId].dataSet.length; i++) {
            var tmpPoint = {};
            tmpPoint['date'] = data.series[previousJobId].dataSet[i].DateFormatted;
            tmpPoint['timestamp'] = data.series[previousJobId].dataSet[i].UnixTimestamp;
            for(j in data.jobs) {
                if(data.jobs.hasOwnProperty(j)) {
                    for (k = 0; k < data.metrics.length; k++) {
                        if (data.series[data.jobs[j]].dataSet[i][data.metrics[k]]) {
                            tmpPoint[data.metrics[k] + "-" + data.jobs[j]] = (data.series[data.jobs[j]].dataSet[i][data.metrics[k]] / 1000).toFixed(2);
                            tmpPoint.getJobId = getJobId;
                            tmpPoint.getJobName = getJobName;
                            tmpPoint.getMetricName = getMetricName;
                            tmpPoint.getInterval = getInterval;
                        }
                    }
                }
            }
            chartData.push(tmpPoint);
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
        "use strict";

        var getMetricName = data.getMetricName || function() {return 'No getMetricName function';};
        var getJobName    = data.getJobName ||    function() {return 'No getJobName function';};
        var getJobId      = data.getJobId ||      function() {return 'No getJobId function';};
        var graphs = [];

        /**
         *  Prepare graphs configs for all data series
         */
        for(var i in data.valueFields){
            if(data.valueFields.hasOwnProperty(i)) {
                graphs.push({
                    id                         : data.valueFields[i],
                    balloonText                : "[[category]]<br /><b><span style='font-size:14px;'>" + getMetricName(data.valueFields[i]) + ": [[value]]</span></b>",
                    bullet                     : "round",
                    bulletSize                 : 1,
                    bulletBorderAlpha          : 1,
                    bulletColor                : "#FFFFFF",
                    hideBulletsCount           : 0,
                    title                      : getJobName(data.valueFields[i]) + " " + getMetricName(data.valueFields[i]),
                    valueField                 : data.valueFields[i],
                    useLineColorForBulletBorder: true
                });
            }
        }

        var chartScrollbar = {
            autoGridCount    : true,
            graph            : data.valueFields[0],
            "scrollbarHeight": 20, hideResizeGrips: true
            // ,updateOnReleaseOnly: true
        };

        if(chart){
            /**
             *  If a chart is already instantiated new data provider is set and the chart redrawn.
             */
            chart.dataProvider = data.series;
            chart.graphs = graphs;

            chart.removeChartScrollbar();
            chart.chartScrollbar = chartScrollbar;

            chart.validateData();
        } else {
            // chart is instantiated from scratch
            chart = AmCharts.makeChart("graph", {
                type               : "serial",
                theme              : "none",
                pathToImages       : "js/amcharts/images/",
                dataProvider       : data.series,
                zoomOutOnDataUpdate: false,
                valueAxes          : [
                    {
                        axisAlpha : 0.2,
                        dashLength: 1,
                        position  : "left",
                        minimum   : 0,
                        unit      : "s"
                    }
                ],
                graphs             : graphs,
                chartScrollbar     : chartScrollbar,
                chartCursor        : {
                    cursorPosition           : "mouse",
                    categoryBalloonDateFormat: "MMM DD JJ:NN:SS", cursorAlpha: 0.5, graphBulletSize: 2
                },
                categoryField      : "date",
                dataDateFormat     : "YYYY-MM-DD JJ:NN:SS",
                categoryAxis       : {
                    parseDates: true,
                    minorGridEnabled: false,
                    minPeriod : "ss"
                },
                legend             : {
                    fontSize: 9
                },
                exportConfig       : {}
            });

            chart.addListener("clickGraphItem", function(e){
                var dataContext = e.item.dataContext;
                var valueField = e.graph.valueField;
                var resultsURL = getResultsURL(dataContext.getJobId(valueField), dataContext.timestamp, dataContext.getInterval());
                window.open(resultsURL);

            });
        }

        function getResultsURL(jobId, startDateTime, interval){
            var params = {
                currentPage  : 1,
                filterField  : "WPTJob.Id",
                filterValue  : jobId,
                startDateTime: startDateTime,
                endDateTime  : startDateTime + interval
            };
            console.log(params);
            return "listResults.php?"+$.param(params);
        }
        // drawTable(data);
    }

    function getJobCount(){
        var val = $('#jobs').val();
        var count;

        if(val === null) {count = 0;}
        else {count = val.length;}

        return count;
    }

    window.getChart      = function(){return chart;};

    wptmonitor.graph = {initialized: true};

    return wptmonitor;
})(window, jQuery, wptmonitor || {});
