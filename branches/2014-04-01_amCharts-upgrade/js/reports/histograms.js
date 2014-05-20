var wptmonitor = (function(window, $, wptmonitor){
    "use strict";

    var chart;

    $(document).ready(function(){
        $('#histogramButton').on('click', function(e){
            if(getSelectedJobsCount() == 0){
                return;
            }
            var button = $(this);
            button.attr('disabled', 'disabled');
            var selectedJobs = $.makeArray($('#updateForm select#jobs option:selected').map(function(){return this.value;}));

            try{
                drawHistogramForJobs(selectedJobs)
                .always(function(){
                    button.removeAttr('disabled');
                });
            }catch(e){
                alert("Error: " + e);
            }
        });
    });


    function showHistogramContainer(){
        var deferred = $.Deferred();

        if($("#histogramsContainer").is(":hidden")){
            $("#histogramsContainer").slideDown(200, function(){
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise();
    }

    function drawHistogramForJobs(jobId) {
        var deferred = $.Deferred();
        getHistogramDataForJobs(jobId)
        .done(function(data){
            deferred.resolve();
            showHistogramContainer().done(function(){
                drawChart(data);
            });
            console.log(data);
        })
        .fail(function(e){
            deferred.reject(e);
        });

        return deferred.promise();

        function drawChart(data) {
            chart = [];
        }

    }

    function getHistogramDataForJobs(jobId) {
        var deferred = $.Deferred();
        $.when.apply($, $(jobId).map(function(){
                    return getHistogramDataForJob(this);
                }))
                .done(function(){
                    deferred.resolve(convertHistogramData(arguments));
                })
                .always(function(){

                })
                .fail(function(e){
                    deferred.reject(e);
                    console.error(arguments);
                });
        return deferred.promise();
    }

    function convertHistogramData(data) {
        return data;

        function getMinBucket() {
            var minBucket = null;
            for(var i in data){
                if(minBucket === null || minBucket > data[i].minBucket) {
                    minBucket = data[i].minBucket;
                }
            }
            return minBucket;
        }

        function getMaxBucket() {
            var maxBucket = null;
            for(var i in data){
                if(maxBucket === null || maxBucket < data[i].maxBucket) {
                    maxBucket = data[i].maxBucket;
                }
            }
            return maxBucket;
        }

        function getBucketWidth() {
            var bucketWidth = null;

            for(var i in data){
                if(bucketWidth !== null && bucketWidth !== data[i].bucketWidth) {
                    throw "Different bucket widths in datasets";
                }
                bucketWidth = data[i].bucketWidth;
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
                deferred.reject({
                    status:  data.status,
                    message: data.message
                });
            } else {
                deferred.resolve(data.results);
            }
        }).error(function(jqxhr, err){
            deferred.reject({
                status: jqxhr.status,
                message: jqxhr.statusText
            });
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
        var result = {};
        var form = $("#updateForm")[0];

        result = {
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
            }))
        };

        return result;
    };

    wptmonitor.histograms = {
        initialized: true,
        getChart: function() {
            return chart;
        }
    };

    return wptmonitor;
})(window, jQuery, wptmonitor || {});
