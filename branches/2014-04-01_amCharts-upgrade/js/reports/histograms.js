var wptmonitor = (function(window, $, wptmonitor){
    
    $(document).ready(function(){
        $('#histogramButton').on('click', function(e){
            var button = $(this); 
            button.attr('disabled', 'disabled');
            var selectedJobs = $.makeArray($('#updateForm select#jobs option:selected').map(function(){return this.value;}));

            try{
                $.when.apply($, $(selectedJobs).map(function(){
                    return getHistogramDataForJob(this); 
                }))
                .done(function(){
                    console.log(arguments);
                })
                .always(function(){
                    button.removeAttr('disabled');
                })
                .fail(function(){
                    console.error(arguments);
                });                
            }catch(e){
                alert("Error: " + e);
            }            
        });
    });
      
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
