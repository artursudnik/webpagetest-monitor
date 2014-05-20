<?php
$start = microtime(1);
chdir('..');
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'firephp/0.3.2/fb.php';
include_once ('utils.inc');
include_once 'functions.inc';
header('Content-Type: application/json');
header('Cache-Control: public', TRUE);

$requestData = $_GET;
$bucketWidth = 100;
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

try{
    $requestDataSanitized = sanitizeData($requestData);

    $requestDataSanitized = addTimestamps($requestDataSanitized);

    $bucketWidth = $requestDataSanitized['width'];

    if(!is_array($requestData['field'])) {
        $requestData['field'] = array($requestData['field']);
    }

    $jobTable = Doctrine_Core::getTable('WPTJob');
    $job = $jobTable->find($requestDataSanitized['job']);
    $jobLabel = $job['Label'];

    $fields = array();

    foreach ($requestData['field'] as $key => $fieldName) {
        $fields[] = mapMetricFieldForm2Db($fieldName);
    }


    $result = array();

    foreach ($fields as $key => $field) {
        $q = Doctrine_Query::create()
        ->select("($field - $field%$bucketWidth) as bucket, count(*) as count")->from('WPTResult r')
        ->where('r.ValidationState < ?', 2)
        ->andWhere("$field is not null")
        ->andWhere("date > ?", $requestDataSanitized['startTimestamp'])
        ->andWhere("date < ?", $requestDataSanitized['endTimestamp'])
        ->andWhere('r.AvgFirstViewFirstByte > 0')
        ->andWhere('r.AvgFirstViewDocCompleteTime > 0')
        ->andWhere('r.AvgFirstViewDocCompleteTime != ?', '')
        ->andWhere('r.WPTJobId = ?', $requestDataSanitized['job'])
        ->groupBy("bucket")
        ->orderBy("bucket");

        $result[mapMetricFieldDb2Form($field)] = $q->fetchArray();
    }

    $response = array(
                    'status'  => 200,
                    'message' => 'OK'
                );

    $response['results']['jobLabel'] = $jobLabel;
    $response['results']['datasets'] = $result;
} catch(exception $e) {
    FB::log($e);
    $response['status'] = 500;
    $response['message'] = $e->getMessage();
    setHttpResponseCode(500);
}


$response['processingTime'] = microtime(1) - $start;

echo json_encode($response);

die();

function sanitizeData($requestArray) {
    $resultArray = array();

    $currentY = (int)date("Y");
    $currentMo = (int)date("n");
    $currentD = (int)date("j");
    $currentH = (int)date("G");
    $currentMi = (int)date("i");
    $currentS = (int)date("s");

    $resultArray['timeFrame']  = @filter_var((int)$requestArray['timeFrame'],    FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 2419200)));

    $resultArray['startDay']   = @filter_var((int)$requestArray['startDay'],   FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['startMonth'] = @filter_var((int)$requestArray['startMonth'], FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['startYear']  = @filter_var((int)$requestArray['startYear'],  FILTER_VALIDATE_INT, array('options' => array('default' => 1970, 'min_range' => 1970)));
    $resultArray['startHour']  = @filter_var((int)$requestArray['startHour'],  FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['endDay']     = @filter_var((int)$requestArray['endDay'],     FILTER_VALIDATE_INT, array('options' => array('default' => $currentD, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['endMonth']   = @filter_var((int)$requestArray['endMonth'],   FILTER_VALIDATE_INT, array('options' => array('default' => $currentMo, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['endYear']    = @filter_var((int)$requestArray['endYear'],    FILTER_VALIDATE_INT, array('options' => array('default' => $currentY)));
    $resultArray['endHour']    = @filter_var((int)$requestArray['endHour'],    FILTER_VALIDATE_INT, array('options' => array('default' => $currentH, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['width']      = @filter_var((int)$requestArray['width'], FILTER_VALIDATE_INT, array('options' => array('default' => 100, 'min_range' => 10)));
    $resultArray['job']        = @filter_var((int)$requestArray['job'],   FILTER_VALIDATE_INT, array('options' => array('default' => 0, 'min_range' => 1)));

    return $resultArray;
}
