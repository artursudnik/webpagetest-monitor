<?php
chdir('..');
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'firephp/0.3.2/fb.php';
header('Content-Type: application/json');
header('Cache-Control: public', TRUE);

$requestData = $_POST;

$response = array();

echo json_encode($response);

$sanitizedData = sanitizeData($requestData);


$sanitizedData['fields'] = mapFields($requestData['fields']);
$sanitizedData = addTimestamps($sanitizedData);

FB::log($requestData);
FB::log($sanitizedData);

function sanitizeData($requestArray) {
    $resultArray = array();
    
    $resultArray['startDay']   = filter_var((int)$requestArray['startDay'],   FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 1, 'max_range' => 31));
    $resultArray['startMonth'] = filter_var((int)$requestArray['startMonth'], FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 1, 'max_range' => 12));
    $resultArray['startYear']  = filter_var((int)$requestArray['startYear'],  FILTER_VALIDATE_INT);
    $resultArray['startHour']  = filter_var((int)$requestArray['startHour'],  FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 0, 'max_range' => 23));
    
    $resultArray['endDay']     = filter_var((int)$requestArray['endDay'],     FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 1, 'max_range' => 31));
    $resultArray['endMonth']   = filter_var((int)$requestArray['endMonth'],   FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 1, 'max_range' => 12));
    $resultArray['endYear']    = filter_var((int)$requestArray['endYear'],    FILTER_VALIDATE_INT);
    $resultArray['endHour']    = filter_var((int)$requestArray['endHour'],    FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 0, 'max_range' => 23));

    $resultArray['interval']   = filter_var((int)$requestArray['interval'],   FILTER_VALIDATE_INT, array('default' => 3600, 'min_range' => 1));
    
    $resultArray['percentile'] = filter_var((float)$requestArray['percentile'], FILTER_VALIDATE_FLOAT, array('default' => 1, 'min_range' => 0, 'max_range' => 1));
    $resultArray['trimAbove']  = filter_var(       $requestArray['trimAbove'],  FILTER_VALIDATE_FLOAT, array('default' => null, 'min_range' => 0, 'max_range' => 1));
    $resultArray['trimBelow']  = filter_var(       $requestArray['trimBelow'],  FILTER_VALIDATE_FLOAT, array('default' => null, 'min_range' => 0, 'max_range' => 1));
     
    $resultArray['aggregateMethod'] = $requestArray['aggregateMethod'];
    $resultArray[job_id] = array();
    foreach ($requestArray['job_id'] as $key => $value) {
        $resultArray[job_id][] = (int) $value;
    }
    
    return $resultArray;
}

/**
 * Maps fields from html form to database fields from WPTResult table
 */
function mapFields($fieldsArray) {
    
    $mappedArray = array();
    
    $availFields = array();
    $availFields['FV_TTFB']     = "AvgFirstViewFirstByte";
    $availFields['FV_Render']   = "AvgFirstViewStartRender";
    $availFields['FV_Doc']      = "AvgFirstViewDocCompleteTime";
    $availFields['FV_Dom']      = "AvgFirstViewDomTime";
    $availFields['FV_Fully']    = "AvgFirstViewFullyLoadedTime";
    $availFields['RV_TTFB']     = "AvgRepeatViewFirstByte";
    $availFields['RV_Render']   = "AvgRepeatViewStartRender";
    $availFields['RV_Doc']      = "AvgRepeatViewDocCompleteTime";
    $availFields['RV_Dom']      = "AvgRepeatViewDomTime";
    $availFields['RV_Fully']    = "AvgRepeatViewFullyLoadedTime";
    
    foreach ($fieldsArray as $key => $value) {
        $mappedArray[] = $availFields[$value];
    }
    
    return $mappedArray;
}

function addTimestamps($requestArray) {
    
    $requestArray[startTimestamp] = mktime($requestArray['startHour'], 0, 0, $requestArray['startMonth'], $requestArray['startDay'], $requestArray['startYear']);
    $requestArray[endTimestamp]   = mktime($requestArray['endHour'], 0, 0,   $requestArray['endMonth'],   $requestArray['endDay'],   $requestArray['endYear']);
    
    return $requestArray;
}
