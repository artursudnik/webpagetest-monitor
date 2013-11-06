<?php
require_once('bootstrap.php');
require_once 'jash_functions.inc';
        
    $locations = getDelaysForLocationsAggregated();
    header('Content-type: application/json');
    // print_r(
    echo json_encode(
        array(
            'count'     => count($locations),
            'locations' => $locations
        )
    );
