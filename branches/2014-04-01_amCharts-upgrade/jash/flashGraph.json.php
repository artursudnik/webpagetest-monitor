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

FB::log($requestData);