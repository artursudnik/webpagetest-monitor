<?php
chdir('..');
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'firephp/0.3.2/fb.php';
include_once ('utils.inc');
header('Content-Type: application/json');
header('Cache-Control: public', TRUE);

$requestData = $_POST;

$response = array(
    'status'    => null,
    'message'   => null,
    'results'   => null
);

if(null === $userId = getCurrentUserId()) {
    $response['message'] = 'Not logged in.';
    $response['status']  = 401;
    echo json_encode($response);
    die();
}



$sanitizedData = sanitizeData($requestData);


$sanitizedData['fields'] = mapFields($requestData['fields']);
$fieldsArray = $sanitizedData['fields'];
$sanitizedData['fields'] = serializeFields($sanitizedData['fields']);
$fieldsSerialized = $sanitizedData['fields'];
$sanitizedData = addTimestamps($sanitizedData);

// FB::log($requestData);
// FB::log($sanitizedData);

try {

    $resultDataset = array();

    $jobTable = Doctrine_Core::getTable('WPTJob');

    foreach ($sanitizedData['job_id'] as $key => $jobId) {

        $job = $jobTable->find($jobId);

        $resultDataset[$jobId] = getGraphData(
            $userId,
            $jobId, //jobId
            $sanitizedData['startTimestamp'],
            $sanitizedData['endTimestamp'],
            $sanitizedData['percentile'],
            $sanitizedData['trimAbove'],
            $sanitizedData['adjustUsing'], // adjustUsing
            $sanitizedData['trimBelow'],
            $fieldsSerialized
        );

        $resultDataset[$jobId] = array(
            jobId   => $job['Id'],
            jobName => $job['Label'],
            dataSet => getResultsDataAvgMod(
                $sanitizedData['startTimestamp'],
                $sanitizedData['endTimestamp'],
                $sanitizedData['interval'],
                $resultDataset[$jobId],
                $fieldsArray,
                $sanitizedData['aggregateMethod']
            )
        );

    }
    $response['status'] = 200;
    $response['message'] = 'OK';
    $response['results']['series'] = $resultDataset;
    $response['results']['metrics'] = $requestData['fields'];
    $response['results']['jobs']    = $requestData['job_id'];
    $response['results']['interval'] = $requestData['interval'];
    $response['results']['datarange'] = array(
        'start' => $sanitizedData['startTimestamp'],
        'end'   => $sanitizedData['endTimestamp'],
    );

} catch(exception $e) {
    FB::log($e);
    $response['status'] = 500;
    $response['message'] = $e->getMessage();
    setHttpResponseCode(500);
}

echo json_encode($response);

die();

/**
 * FUNCTIONS DECLARATIONS
 */

function getResultsDataAvgMod($startDateTime, $endDateTime, $interval, $datas, $fields, $aggregateMethod) {
    $results = getResultsDataAvg($startDateTime, $endDateTime, $interval, $datas, $fields, $aggregateMethod);

    foreach ($results as $key => $value) {
        $results[$key]['UnixTimestamp'] = $value['Date'];
        $results[$key]['DateFormatted'] = date('Y-m-d H:i:s \G\M\TO (T)', $value['Date']);
        unset($results[$key]['Date']);

        foreach (getMetricsFieldsMappingsDb2Form() as $dbFieldName => $formFieldName) {
            if(key_exists($dbFieldName, $value)){
                $results[$key][mapMetricFieldDb2Form($dbFieldName)] = $value[$dbFieldName];
                unset($results[$key][$dbFieldName]);
            }
        }

    }

    return $results;
}

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

    $resultArray['timeFrame']  = filter_var((int)$requestArray['timeFrame'],    FILTER_VALIDATE_INT, array('default' => 0, 'min_range' => 0, 'max_range' => 2419200));

    $resultArray['interval']   = filter_var((int)$requestArray['interval'],   FILTER_VALIDATE_INT, array('default' => 3600, 'min_range' => 1));

    $resultArray['percentile'] = filter_var((float)$requestArray['percentile'], FILTER_VALIDATE_FLOAT, array('default' => 1, 'min_range' => 0, 'max_range' => 1));
    $resultArray['trimAbove']  = filter_var(       $requestArray['trimAbove'],  FILTER_VALIDATE_FLOAT, array('default' => null, 'min_range' => 0, 'max_range' => 1));
    $resultArray['trimBelow']  = filter_var(       $requestArray['trimBelow'],  FILTER_VALIDATE_FLOAT, array('default' => null, 'min_range' => 0, 'max_range' => 1));

    $resultArray['aggregateMethod'] = $requestArray['aggregateMethod'];
    $resultArray[job_id] = array();
    foreach ($requestArray['job_id'] as $key => $value) {
        $resultArray[job_id][] = (int) $value;
    }

    $resultArray['adjustUsing'] = $requestArray['adjustUsing'];

    return $resultArray;
}

/**
 * Maps fields from html form to database fields from WPTResult table
 */
function mapFields($fieldsArray) {

    $mappedArray = array();

    foreach ($fieldsArray as $key => $value) {
        $mappedArray[] = mapMetricFieldForm2Db($value);
    }

    return $mappedArray;
}

function mapMetricFieldForm2Db($fieldName) {
    $mappingArray = getMetricsFieldsMappingsForm2Db();
    if(key_exists($fieldName, $mappingArray)) {
        return $mappingArray[$fieldName];
    }else {
        throw new Exception("Unknow form field name $fieldName", 1);
    }
}

function mapMetricFieldDb2Form($fieldName){
    $mappingArray = getMetricsFieldsMappingsDb2Form();
    if(key_exists($fieldName, $mappingArray)) {
        return $mappingArray[$fieldName];
    }else {
        throw new Exception("Unknow form field name $fieldName", 1);
    }
}

function getMetricsFieldsMappingsForm2Db() {
    return array(
        'FV_TTFB'     => 'AvgFirstViewFirstByte',
        'FV_Render'   => 'AvgFirstViewStartRender',
        'FV_Doc'      => 'AvgFirstViewDocCompleteTime',
        'FV_Dom'      => 'AvgFirstViewDomTime',
        'FV_Fully'    => 'AvgFirstViewFullyLoadedTime',
        'RV_TTFB'     => 'AvgRepeatViewFirstByte',
        'RV_Render'   => 'AvgRepeatViewStartRender',
        'RV_Doc'      => 'AvgRepeatViewDocCompleteTime',
        'RV_Dom'      => 'AvgRepeatViewDomTime',
        'RV_Fully'    => 'AvgRepeatViewFullyLoadedTime'
    );
}

function getMetricsFieldsMappingsDb2Form(){
    return array_flip(getMetricsFieldsMappingsForm2Db());
}

function addTimestamps($requestArray) {

    if($requestArray['timeFrame'] == 0){
        $requestArray['startTimestamp'] = mktime($requestArray['startHour'], 0, 0, $requestArray['startMonth'], $requestArray['startDay'], $requestArray['startYear']);
        $requestArray['endTimestamp']   = mktime($requestArray['endHour'], 59, 59,   $requestArray['endMonth'],   $requestArray['endDay'],   $requestArray['endYear']);
    } else {
        $requestArray['endTimestamp'] = gmdate('U') + 3600;
        $requestArray['startTimestamp'] = $requestArray['endTimestamp'] - $requestArray['timeFrame'];
        // FB::log($requestArray['endTimestamp'] - $requestArray['startTimestamp']);
    }

    $keysToDelete = array(
        'startHour',
        'startDay',
        'startMonth',
        'startYear',
        'endHour',
        'endDay',
        'endMonth',
        'endYear'
    );

    foreach ($keysToDelete as $key => $value) {
        unset($requestArray[$value]);
    }

    return $requestArray;
}

function serializeFields($fieldsArray){
    $serializedFields = "r.date";

    foreach ($fieldsArray as $key => $value) {
        $serializedFields .= ", r.".$value;
    }

    return $serializedFields;
}

function setHttpResponseCode($code = NULL) {

    switch ($code) {
        case 100: $text = 'Continue'; break;
        case 101: $text = 'Switching Protocols'; break;
        case 200: $text = 'OK'; break;
        case 201: $text = 'Created'; break;
        case 202: $text = 'Accepted'; break;
        case 203: $text = 'Non-Authoritative Information'; break;
        case 204: $text = 'No Content'; break;
        case 205: $text = 'Reset Content'; break;
        case 206: $text = 'Partial Content'; break;
        case 300: $text = 'Multiple Choices'; break;
        case 301: $text = 'Moved Permanently'; break;
        case 302: $text = 'Moved Temporarily'; break;
        case 303: $text = 'See Other'; break;
        case 304: $text = 'Not Modified'; break;
        case 305: $text = 'Use Proxy'; break;
        case 400: $text = 'Bad Request'; break;
        case 401: $text = 'Unauthorized'; break;
        case 402: $text = 'Payment Required'; break;
        case 403: $text = 'Forbidden'; break;
        case 404: $text = 'Not Found'; break;
        case 405: $text = 'Method Not Allowed'; break;
        case 406: $text = 'Not Acceptable'; break;
        case 407: $text = 'Proxy Authentication Required'; break;
        case 408: $text = 'Request Time-out'; break;
        case 409: $text = 'Conflict'; break;
        case 410: $text = 'Gone'; break;
        case 411: $text = 'Length Required'; break;
        case 412: $text = 'Precondition Failed'; break;
        case 413: $text = 'Request Entity Too Large'; break;
        case 414: $text = 'Request-URI Too Large'; break;
        case 415: $text = 'Unsupported Media Type'; break;
        case 500: $text = 'Internal Server Error'; break;
        case 501: $text = 'Not Implemented'; break;
        case 502: $text = 'Bad Gateway'; break;
        case 503: $text = 'Service Unavailable'; break;
        case 504: $text = 'Gateway Time-out'; break;
        case 505: $text = 'HTTP Version not supported'; break;
        default:
            exit('Unknown http status code "' . htmlentities($code) . '"');
        break;
    }

    $protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0');

    header($protocol . ' ' . $code . ' ' . $text);
}
