"use strict";
var wptmonitor = (function(window, $, wptmonitor){

    var chart;
    var lastData;

    var preventUnload = true;

    $(document).ready(function(){
        initialize();
    });

    function initialize() {
        var act = wptmonitor.graph.action;

        $('#graphJSONButton').on('click', function(){
            if(!checkJobCount()) {
                return;
            }
            var chartContainerIsHidden = isChartContainerHidden();
            submitFormAJAX()
                .done(function(){
                          if(chartContainerIsHidden){
                              scrollToGraph();
                          }
                      })
                .fail(function(e){
                          alert(e);
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

        $("#getGraphStaticLink").click(function(e){
            e.preventDefault();
            $.ajax({
                       url : 'jash/createStaticGraph.php',
                       type: 'POST',
                       data: {
                           chartData: JSON.stringify(lastData),
                           chartType: 'graph'
                       }
                   })
                .done(function(data){
                          window.open(data.staticGraphUrl)
                      });
        });

        $('#timeFrame').on('change', function(){
            markUnsafeResolutions();
        });

        $('#startTimeSelect').find('select').on('change', function(){
            markUnsafeResolutions();
        });

        $('#endTimeSelect').find('select').on('change', function(){
            markUnsafeResolutions();
        });

        $('#interval').on('change', function(){
            markUnsafeResolutions();
        });

        markUnsafeResolutions();

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

        $(window).bind("beforeunload", function() {
            if(preventUnload){
                return "You are leaving this page.";
            }
        });

    }

    function doNotPreventUnloadConfirmation(){
        preventUnload = false;
    }

    function submitFormAJAX() {
        var deferred=$.Deferred();
        var serializedFormData = $('#updateForm').serializeArray();

        getChartDataWithGUIBehavior(serializedFormData)
        .done(function(d){
            lastData = d;
            try {
                d = convertData2avgCharts(d);
                drawChart(d);
            } catch(e) {
                deferred.reject('Error occured while drawing chart: ' + e);
                return;
            }

            deferred.resolve();

        })
        .fail(function(error){
            deferred.reject(error);
        });

        return deferred.promise();
    }

    function showChartContainer(){
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

    function scrollbarToBeDisplayed(){
        return $('input[name="displayGraphScrollbar"]').prop('checked');
    }

    function getChartData(params){
        var d = $.Deferred();
        getServersideMaxExecutionTime()
            .done(function(maxExecutionTime){
                $.ajax({
                    url: 'jash/flashGraph.json.php',
                    data: params,
                    method: "POST",
                    timeout: maxExecutionTime * 1000
                }).done(function(data){
                    if(data.status !== 200) {
                        d.reject('Server-side error: ' + data.status + ' ' + data.message);
                    } else {
                        d.resolve(data.results);
                    }
                }).error(function(jqxhr, textStatus, errorThrown){
                    switch (textStatus) {
                        case 'parsererror':
                            d.reject('Wrong response from server: parsererror');
                            break;
                        case 'timeout':
                            d.reject('Server side processing time limit ('+maxExecutionTime+'s) exceeded.');
                            break;
                        default:
                            d.reject(textStatus);
                    }
                });
            }).fail(function(e){
                d.reject('Error while getting execution time limit from server: ' + e);
            });

        return d.promise();
    }

    var getServersideMaxExecutionTime = (function(){
        var maxExecTime;
        return function(){
            var d = $.Deferred();
            $.ajax({
                url: 'jash/flashGraph.json.php',
                data: {action: 'getMaxExecutionTime'}
            }).done(function(data){
                maxExecTime=data.results.max_execution_time;
                d.resolve(maxExecTime);
            }).error(function(jqxhr, textStatus, errorThrown){
                d.reject(textStatus);
            });
            return d.promise();
        }
    })();


    function getChartDataWithGUIBehavior(params){
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
        }).fail(function(e){
            d.reject(e);
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

        var chartScrollbar;

        if(scrollbarToBeDisplayed()){
            chartScrollbar = {
                autoGridCount    : true,
                graph            : data.valueFields[0],
                "scrollbarHeight": 20, hideResizeGrips: true
                // ,updateOnReleaseOnly: true
            }
        }


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
                    parseDates      : true,
                    minorGridEnabled: false,
                    minPeriod       : "mm"
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

    var getResolutionOptionsValues = (function(){
        var values;

        return function() {
            if(values === undefined) {
                values = $('#interval').find('option').map(function(){
                    return this.value;
                });
            }
            return values;
        }
    })();


    function getStartEndTimeDifference() {
        var start, end;
        var formValues =  {
            startYear : parseInt($('select[name="startYear"]').val()),
            startMonth: parseInt($('select[name="startMonth"]').val()),
            startDay  : parseInt($('select[name="startDay"]').val()),
            startHour : parseInt($('select[name="startHour"]').val()),
            endYear   : parseInt($('select[name="endYear"]').val()),
            endMonth  : parseInt($('select[name="endMonth"]').val()),
            endDay    : parseInt($('select[name="endDay"]').val()),
            endHour   : parseInt($('select[name="endHour"]').val())
        };
        var timeDifference;
        var timeFramePresetValue = $('#timeFrame').val();

        if(timeFramePresetValue == 0) {
            start = new Date(formValues.startYear, formValues.startMonth - 1, formValues.startDay, formValues.startHour);
            end   = new Date(formValues.endYear, formValues.endMonth - 1, formValues.endDay, formValues.endHour);
            timeDifference = (end - start) / 1000;
        } else {
            timeDifference = timeFramePresetValue;
        }

        return timeDifference;
    }

    function getSafeInterval(){
        var safeNumberOfGraphPoints = 300;
        var timeFrameInSeconds = getStartEndTimeDifference();
        return timeFrameInSeconds/safeNumberOfGraphPoints;
    }

    function markUnsafeResolutions() {
        var safeInterval = getSafeInterval();
        var intervalSelect = $('#interval');

        intervalSelect.find('option')
            .removeClass('notSafe')
            .removeClass('safe');

        intervalSelect.find('option').filter(function(){
            return this.value < safeInterval;
        }).addClass('notSafe');

        intervalSelect.find('option').filter(function(){
            return this.value >= safeInterval;
        }).addClass('safe');

        if(intervalSelect.val() < safeInterval) {
            intervalSelect.addClass('notSafe');
        }else {
            intervalSelect.removeClass('notSafe');
        }

    }

    window.getChart      = function(){return chart;};

    wptmonitor.graph = {
        initialized: true,
        doNotPreventUnloadConfirmation: doNotPreventUnloadConfirmation
    };

    return wptmonitor;
})(window, jQuery, wptmonitor || {});
