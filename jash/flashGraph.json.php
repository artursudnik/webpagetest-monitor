<?php
chdir('..');
include_once ('monitor.inc');
include_once ('graph_functions.inc');
include_once ('firephp/0.3.2/fb.php');
include_once ('utils.inc');
include_once ('jash/functions.inc');
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

if(array_key_exists('action', $_GET) && $_GET['action'] == 'getMaxExecutionTime') {
    header("Expires: ".gmdate("D, d M Y H:i:s", time() + 60)." GMT");
    header_remove("Pragma");
    $response['status'] = 200;
    $response['message'] = 'OK';
    $response['results'] = array('max_execution_time' => ini_get('max_execution_time'));

    echo json_encode($response);
    die();
}


$sanitizedData = sanitizeData($requestData);


$sanitizedData['fields'] = mapFields($requestData['fields']);
$fieldsArray = $sanitizedData['fields'];
$sanitizedData['fields'] = serializeFields($sanitizedData['fields']);
$fieldsSerialized = $sanitizedData['fields'];
$sanitizedData = addTimestamps($sanitizedData);

try {

    $resultDataset = array();

    $jobTable = Doctrine_Core::getTable('WPTJob');

    foreach ($sanitizedData['job_id'] as $key => $jobId) {

        $job = $jobTable->find($jobId);

        $resultDataset[$jobId] = getGraphData(
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
            'jobId'   => $job['Id'],
            'jobName' => $job['Label'],
            'dataSet' => getResultsDataAvgMod(
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
    $response['results']['jobs']    = $sanitizedData['job_id'];
    $response['results']['interval'] = $sanitizedData['interval'];
    $response['results']['datarange'] = array(
        'start' => $sanitizedData['startTimestamp'],
        'end'   => $sanitizedData['endTimestamp'],
    );

} catch(exception $e) {
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

    $resultArray['startDay']   = filter_var((int)$requestArray['startDay'],   FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['startMonth'] = filter_var((int)$requestArray['startMonth'], FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['startYear']  = filter_var((int)$requestArray['startYear'],  FILTER_VALIDATE_INT);
    $resultArray['startHour']  = filter_var((int)$requestArray['startHour'],  FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['endDay']     = filter_var((int)$requestArray['endDay'],     FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['endMonth']   = filter_var((int)$requestArray['endMonth'],   FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['endYear']    = filter_var((int)$requestArray['endYear'],    FILTER_VALIDATE_INT);
    $resultArray['endHour']    = filter_var((int)$requestArray['endHour'],    FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['timeFrame']  = filter_var((int)$requestArray['timeFrame'],    FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 2419200)));

    $resultArray['interval']   = filter_var((int)$requestArray['interval'],   FILTER_VALIDATE_INT, array('options' =>array('default' => 3600, 'min_range' => 1)));

    $resultArray['percentile'] = filter_var((float)$requestArray['percentile'], FILTER_VALIDATE_FLOAT, array('options' =>array('default' => 1, 'min_range' => 0, 'max_range' => 1)));
    $resultArray['trimAbove']  = filter_var(       $requestArray['trimAbove'],  FILTER_VALIDATE_FLOAT, array('options' =>array('default' => null, 'min_range' => 0, 'max_range' => 1)));
    $resultArray['trimBelow']  = filter_var(       $requestArray['trimBelow'],  FILTER_VALIDATE_FLOAT, array('options' =>array('default' => null, 'min_range' => 0, 'max_range' => 1)));

    $resultArray['aggregateMethod'] = $requestArray['aggregateMethod'];
    $resultArray['job_id'] = array();
    foreach ($requestArray['job_id'] as $value) {
        $resultArray['job_id'][] = (int) $value;
    }

    $resultArray['adjustUsing'] = $requestArray['adjustUsing'];

    return $resultArray;
}

function serializeFields($fieldsArray){
    $serializedFields = "r.date";

    foreach ($fieldsArray as $field) {
        $serializedFields .= ", r.".$field;
    }

    return $serializedFields;
}
