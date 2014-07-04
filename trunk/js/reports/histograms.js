var wptmonitor = (function(window, $, wptmonitor){
    "use strict";

    var chart;
    var zoomOutOnce = false;
    var previousResolution;

    $(document).ready(function(){
        $('#histogramButton').on('click', function () {
            if(getSelectedJobsCount() == 0){
                alert('Please select job(s).');
                return;
            }
            var button = $(this);
            button.attr('disabled', 'disabled');
            var selectedJobs = $.makeArray($('#updateForm').find('select#jobs option:selected').map(function(){return this.value;}));

            try{
                drawHistogramForJobs(selectedJobs)
                .always(function(){
                    button.removeAttr('disabled');
                })
                .fail(function(e){
                    alert(e);
                });
            }catch(e){
                alert("Error: " + e);
                button.removeAttr('disabled');
            }
        });

        $('#hideHistograms').click(function(e){
            e.preventDefault();
            $('#histogramsContainer').slideUp(function(){
                $('#histogramOverlay').show();
                $('#histogram').empty();
                chart = null;
            });
        });
        $('#histogramResolution').change(function(){
            resolutionChangedHandler();
        });
    });


    function isHistogramContainerHidden() {
        return $("#histogramsContainer").is(":hidden");
    }

    function showHistogramContainer(){
        var deferred = $.Deferred();
        var container = $("#histogramsContainer");
        if(container.is(":hidden")){
            container.slideDown(1000, function(){
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise();
    }

    function drawHistogramForJobs(jobId) {
        var deferred = $.Deferred();
        var histogramContainerWasHidden = isHistogramContainerHidden();

        $.when(
            getHistogramDataForJobs(jobId),
            showHistogramContainer().done(function(){
                $('#histogramOverlay').fadeIn(100);
            })
        )
        .done(function(data){
            try{
                drawChart(data);
            }catch(e) {
                deferred.reject(e);
            }
            setTimeout(function(){
                $('#histogramOverlay').fadeOut(600, function(){
                    deferred.resolve();
                });
                if(histogramContainerWasHidden){
                    scrollToGraph();
                }
            }, 10);
        })
        .fail(function(e){
            deferred.reject(e);
        }).always(function(){
            setTimeout(function(){
                $('#histogramOverlay').fadeOut(600, function(){
                    deferred.resolve();
                });
            }, 10);
        });

        return deferred.promise();

    }

    function scrollToGraph() {
        var container = $("#histogramsContainer");
        $('html, body').animate({
            'scrollTop': container.offset().top - $(window).height() + container.height() },
            1000,
            'swing'
        );
    }

    function drawChart(data) {

        var graphs = [];

        for(var i in data.fields) {
            if(data.fields.hasOwnProperty(i)){
                var field = data.fields[i];
                graphs.push({
                    id         : data.fields[i],
                    title      : data.fieldJobLabelMap[field] + " " + data.fieldMetricMap[field],
                    balloonText: "[[title]]<br><b>[[value]]</b> samples for <b>[[category]]</b> seconds",
                    valueField : field,
                    type       : 'smoothedLine',
                    fillAlphas : 0.5
                });
            }
        }

        var chartScrollbar;

        if(scrollbarToBeDisplayed()) {
            chartScrollbar = {
                autoGridCount    : true,
                graph            : data.fields[0],
                "scrollbarHeight": 20, hideResizeGrips: true
                // ,updateOnReleaseOnly: true
            };
        }

        if(chart){
            chart.dataProvider = data.dataset;
            chart.graphs = graphs;

            chart.removeChartScrollbar();
            chart.chartScrollbar = chartScrollbar;
            chart.zoomOutOnDataUpdate = zoomOutOnce;
            if(zoomOutOnce) {
                zoomOutOnce = false;
            }
            chart.validateData();
        }else {
            chart = AmCharts.makeChart("histogram", {
                type               : "serial",
                theme              : "none",
                pathToImages       : "js/amcharts/images/",
                dataProvider       : data.dataset,
                zoomOutOnDataUpdate: false,
                valueAxes: [
                    {
                        title     : 'samples count',
                        titleBold : false,
                        axisAlpha : 0.2,
                        dashLength: 1,
                        position  : "left",
                        minimum   : 0
                        // ,unit: "s"
                    }
                ],
                graphs        : graphs,
                chartScrollbar: chartScrollbar,
                chartCursor: {
                    cursorPosition           : "mouse",
                    categoryBalloonDateFormat: "MMM DD JJ:NN:SS",
                    cursorAlpha              : 0.5,
                    graphBulletSize          : 2
                },
                categoryField: "bucket",
                categoryAxis: {
                    minorGridEnabled: false,
                    title           : 'time in seconds',
                    titleBold       : false,
                    minimum         : 0,
                    categoryFunction: function (e) {
                        return (e / 1000).toString();
                    }
                },
                legend: {
                    fontSize: 9
                },
                exportConfig : {}
            });
        }
        previousResolution = $('select[name="histogramResolution"]').val();
    }

    function getHistogramDataForJobs(jobId) {
        var deferred = $.Deferred();
        $.when.apply($, $(jobId).map(function(){
                    return getHistogramDataForJob(this);
                }))
                .done(function(){
                    try{
                        var dataConverted = convertHistogramData(arguments);
                        deferred.resolve(dataConverted);
                    }catch(e) {
                        deferred.reject(e);
                        throw e;
                    }
                })
                .always(function(){

                })
                .fail(function(e){
                    deferred.reject(e);
                });
        return deferred.promise();
    }

    /**
     *
     * @param {{bucketWidth, minBucket, maxBucket, jobId, fields: [], datasets: {metric, series: {bucket, count}[], maxBucket, minBucket}[], jobLabel}[]} data
     * @returns {{dataset: {}, fields: Array, fieldJobIdMap: {}, fieldJobLabelMap: {}, fieldMetricMap: {}}}
     */
    function convertHistogramData(data) {

        var dataConverted = {};
        var minBucket = getMinBucket();
        var maxBucket = getMaxBucket();
        var bucketWidth = getBucketWidth();
        var fields = [];
        var fieldJobIdMap = {};
        var fieldJobLabelMap = {};
        var fieldMetricMap = {};
        var i, j, k; //iterators

        if(maxBucket > minBucket) {
            for (i=minBucket-bucketWidth; i <= maxBucket+bucketWidth; i+=bucketWidth) {
              if(i < 0) {
                  continue;
              }
              dataConverted[i] = {bucket: i};
              for(j in data){
                  if(data.hasOwnProperty(j)){
                      for(k in data[j].fields){
                          if(data[j].fields.hasOwnProperty(k)){
                              dataConverted[i][data[j].fields[k] + "-" + data[j].jobId] = 0;
                          }
                      }
                  }
              }
            }
        }

        for(var jobIndex in data) {
            if(data.hasOwnProperty(jobIndex)) {
                for (var metricIndex in data[jobIndex].datasets) {
                    if(data[jobIndex].datasets.hasOwnProperty(metricIndex)){
                        var valueField = data[jobIndex].datasets[metricIndex].metric + "-" + data[jobIndex].jobId;
                        for (i in data[jobIndex].datasets[metricIndex].series) {
                            if(data[jobIndex].datasets[metricIndex].series.hasOwnProperty(i)){
                                dataConverted[data[jobIndex].datasets[metricIndex].series[i].bucket][valueField] = data[jobIndex].datasets[metricIndex].series[i].count;
                            }
                        }
                        fields.push(valueField);
                        fieldJobIdMap[valueField] = data[jobIndex].jobId;
                        fieldJobLabelMap[valueField] = data[jobIndex].jobLabel;
                        fieldMetricMap[valueField] = data[jobIndex].datasets[metricIndex].metric;
                    }
                }
            }
        }

        dataConverted = $.map(dataConverted, function(element){
            return element;
        });

        return {
            dataset         : dataConverted,
            fields          : fields,
            fieldJobIdMap   : fieldJobIdMap,
            fieldJobLabelMap: fieldJobLabelMap,
            fieldMetricMap  : fieldMetricMap
        };

        function getMinBucket() {
            var minBucket = null;
            for(var i in data){
                if(data.hasOwnProperty(i)) {
                    if (minBucket === null || minBucket > data[i].minBucket) {
                        minBucket = data[i].minBucket;
                    }
                }
            }
            return minBucket;
        }

        function getMaxBucket() {
            var maxBucket = null;
            for(var i in data){
                if(data.hasOwnProperty(i)) {
                    if (maxBucket === null || maxBucket < data[i].maxBucket) {
                        maxBucket = data[i].maxBucket;
                    }
                }
            }
            return maxBucket;
        }

        function getBucketWidth() {
            var bucketWidth = null;

            for(var i in data){
                if(data.hasOwnProperty(i)){
                    if(bucketWidth !== null && bucketWidth !== data[i].bucketWidth) {
                        throw "Different bucket widths in datasets";
                    }
                    bucketWidth = data[i].bucketWidth;
                }
            }

            return bucketWidth;
        }

    }

    function getHistogramDataForJob(jobId) {
        var deferred = $.Deferred();

        var params = getFormParams();

        params.job = jobId;

        $.ajax({
           url: 'jash/getHistogramData.json.php',
           data: params
        }).done(function(data){
            if(data.status !== 200) {
                deferred.reject(data.message);
            } else {
                deferred.resolve(data.results);
            }
        }).error(function(jqxhr, errorType, exception){
            var errorMessage = exception || errorType;
            deferred.reject(errorMessage);
        });

        return deferred.promise();
    }

    function getSelectedJobsCount() {
        var val = $('#jobs').val();
        if(val == null) {
            return 0;
        }
        return val.length;
    }

    function getFormParams() {
        return {
            startYear  : $('select[name="startYear"]').val(),
            startMonth : $('select[name="startMonth"]').val(),
            startDay   : $('select[name="startDay"]').val(),
            startHour  : $('select[name="startHour"]').val(),
            endYear    : $('select[name="endYear"]').val(),
            endMonth   : $('select[name="endMonth"]').val(),
            endDay     : $('select[name="endDay"]').val(),
            endHour    : $('select[name="endHour"]').val(),
            timeFrame  : $("#timeFrame").val(),
            field      : $.makeArray($("input[name='fields[]']:checked").map(function(){
                return $(this).val();
            })),
            histMinLimit: $('select[name="histogramMinLimit"]').val(),
            histMaxLimit: $('select[name="histogramMaxLimit"]').val(),
            histogramResolution: $('select[name="histogramResolution"]').val()
        };
    }

    function scrollbarToBeDisplayed() {
        return $('input[name="displayHistogramScrollbar"]').prop('checked');
    }

    function resolutionChangedHandler(){
        if(chart && $('select[name="histogramResolution"]').val() !== previousResolution) {
            zoomOutOnce = true;
        } else {
            zoomOutOnce = false;
        }
    }

    wptmonitor.histograms = {
        initialized: true,
        getChart   : function () {
            return chart;
        },
        resolutionChangedHandler: resolutionChangedHandler
    };

    return wptmonitor;
})(window, jQuery, wptmonitor || {});
