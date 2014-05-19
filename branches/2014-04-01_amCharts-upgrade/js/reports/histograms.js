var wptmonitor = (function(window, $, wptmonitor){
    "use strict";
        
    $(document).ready(function(){
        $('#histogramButton').on('click', function(e){
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
            showHistogramContainer();
            console.log(data);
        })
        .fail(function(e){
            deferred.reject(e);
        });
        
        return deferred.promise();
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
    }
 
    function getHistogramDataForJob(jobId) {
        "use strict";
        var deferred = $.Deferred();
        var params = {
            field: 'FV_Fully',
            job: jobId
        };
        
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
    
    wptmonitor.histograms = {initialized: true};  
    return wptmonitor;
})(window, jQuery, wptmonitor || {});
