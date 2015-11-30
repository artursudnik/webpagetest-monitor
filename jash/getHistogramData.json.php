<?php
$start = microtime(1);
chdir('..');
include_once ('monitor.inc');
include_once ('graph_functions.inc');
include_once ('firephp/0.3.2/fb.php');
include_once ('utils.inc');
include_once ('jash/functions.inc');
header('Content-Type: application/json');
header('Cache-Control: public', TRUE);

$requestData = $_GET;

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

session_write_close();

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

    $minBucket = null;
    $maxBucket = null;

    foreach ($fields as $key => $field) {
        $select = "($field - $field%$bucketWidth) as bucket, count(*) as count";
        $q = Doctrine_Query::create()
        ->select($select)->from('WPTResult r')
        ->where('r.ValidationState < ?', 2)
        // ->andWhere("$field is not null")
        ->andWhere("$field > 0")

        ->andWhere("date > ?", $requestDataSanitized['startTimestamp'])
        ->andWhere("date < ?", $requestDataSanitized['endTimestamp'])
        // ->andWhere('r.AvgFirstViewFirstByte > 0')
        // ->andWhere('r.AvgFirstViewDocCompleteTime > 0')
        // ->andWhere('r.AvgFirstViewDocCompleteTime != ?', '')
        ->andWhere('r.WPTJobId = ?', $requestDataSanitized['job']);
        // Including only working hours
        if($requestDataSanitized['todStartHour'] < $requestDataSanitized['todEndHour']) {
            $q->andWhere('hour(from_unixtime(r.Date)) >= ? AND hour(from_unixtime(r.Date)) < ?', array($requestDataSanitized['todStartHour'], $requestDataSanitized['todEndHour']));
        } elseif($requestDataSanitized['todStartHour'] > $requestDataSanitized['todEndHour']) {
            $q->andWhere('hour(from_unixtime(r.Date)) >= ? OR hour(from_unixtime(r.Date)) < ?', array($requestDataSanitized['todStartHour'], $requestDataSanitized['todEndHour']));
        }

        $q->andWhereNotIn('r.Status', getStatusesToNotInclude())
        ->groupBy("bucket")
        ->orderBy("bucket");

        if($requestDataSanitized['histMinLimit'] > 0) {
            $q->andWhere("$field >= ?", $requestDataSanitized['histMinLimit']*1000);
        }

        if($requestDataSanitized['histMaxLimit'] > 0) {
            $q->andWhere("$field <= ?", $requestDataSanitized['histMaxLimit']*1000);
        }

        $series = $q->fetchArray();

        //doctrine returns strings so we have to convert types to proper ones
        foreach ($series as $key2 => $value) {
            $series[$key2]['bucket'] = (int)$series[$key2]['bucket'];
            $series[$key2]['count']  = (int)$series[$key2]['count'];
        }

        if(!empty($series)) {
            $result[] = array(
                'series'    => $series,
                'metric'    => mapMetricFieldDb2Form($field),
                'minBucket' => $series[0]['bucket'],
                'maxBucket' => $series[count($series)-1]['bucket']
            );

            if($minBucket === null or $minBucket > $series[0]['bucket']) {
                $minBucket = $series[0]['bucket'];
            }

            if($maxBucket === null or $maxBucket < $series[count($series)-1]['bucket']) {
                $maxBucket = $series[count($series)-1]['bucket'];
            }
        }else {
            $result[] = array(
                'series'    => array(),
                'metric'    => mapMetricFieldDb2Form($field),
                'minBucket' => 0,
                'maxBucket' => 0
            );

        }
    }

    if($minBucket === null) $minBucket = 0;
    if($maxBucket === null) $maxBucket = 0;

    $response = array(
                    'status'  => 200,
                    'message' => 'OK'
                );

    $response['results']['jobLabel'] = $jobLabel;
    $response['results']['jobId'] = $requestDataSanitized['job'];
    $response['results']['fields'] = $requestData['field'];
    $response['results']['datasets'] = $result;
    $response['results']['minBucket'] = $minBucket;
    $response['results']['maxBucket'] = $maxBucket;
    $response['results']['bucketWidth'] = $bucketWidth;

} catch(exception $e) {
    $response['status'] = 500;
    $response['message'] = $e->getMessage();
    setHttpResponseCode(500);
}


$response['processingTime'] = microtime(1) - $start;

echo json_encode($response);

die();

/**
 * @param $requestArray array
 * @return array
 */
function sanitizeData($requestArray) {
    $resultArray = array();

    $currentY  = (int)date("Y");
    $currentMo = (int)date("n");
    $currentD  = (int)date("j");
    $currentH  = (int)date("G");

    $resultArray['timeFrame']  = @filter_var((int)$requestArray['timeFrame'],    FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 47304000)));

    $resultArray['startDay']   = @filter_var((int)$requestArray['startDay'],   FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['startMonth'] = @filter_var((int)$requestArray['startMonth'], FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['startYear']  = @filter_var((int)$requestArray['startYear'],  FILTER_VALIDATE_INT, array('options' => array('default' => 1970, 'min_range' => 1970)));
    $resultArray['startHour']  = @filter_var((int)$requestArray['startHour'],  FILTER_VALIDATE_INT, array('options' => array('default' => 1, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['endDay']     = @filter_var((int)$requestArray['endDay'],     FILTER_VALIDATE_INT, array('options' => array('default' => $currentD, 'min_range' => 1, 'max_range' => 31)));
    $resultArray['endMonth']   = @filter_var((int)$requestArray['endMonth'],   FILTER_VALIDATE_INT, array('options' => array('default' => $currentMo, 'min_range' => 1, 'max_range' => 12)));
    $resultArray['endYear']    = @filter_var((int)$requestArray['endYear'],    FILTER_VALIDATE_INT, array('options' => array('default' => $currentY)));
    $resultArray['endHour']    = @filter_var((int)$requestArray['endHour'],    FILTER_VALIDATE_INT, array('options' => array('default' => $currentH, 'min_range' => 0, 'max_range' => 23)));

    $resultArray['todStartHour']  = filter_var((int)$requestArray['todStartHour'], FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 23)));
    $resultArray['todEndHour']  = filter_var((int)$requestArray['todEndHour'],     FILTER_VALIDATE_INT, array('options' =>array('default' => 0, 'min_range' => 0, 'max_range' => 23)));


    $resultArray['width']      = @filter_var((int)$requestArray['histogramResolution'], FILTER_VALIDATE_INT, array('options' => array('default' => 100, 'min_range' => 1)));
    $resultArray['job']        = @filter_var((int)$requestArray['job'],   FILTER_VALIDATE_INT, array('options' => array('default' => 0, 'min_range' => 1)));

    $resultArray['histMinLimit']   = @filter_var((int)$requestArray['histMinLimit'], FILTER_VALIDATE_INT, array('options' => array('default' => 0, 'min_range' => 0)));
    $resultArray['histMaxLimit']   = @filter_var((int)$requestArray['histMaxLimit'], FILTER_VALIDATE_INT, array('options' => array('default' => -1, 'min_range' => -1)));

    return $resultArray;
}
