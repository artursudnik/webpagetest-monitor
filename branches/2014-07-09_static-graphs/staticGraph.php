<?php

//require("login/login.php");
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'jash/functions.inc';
include_once 'firephp/0.3.2/fb.php';

switch ($_GET['type']) {
    case 'graph':
        $graphType = 'graph';
        break;
    case 'histogram':
        $graphType = 'histogram';
        break;
    default:
        setHttpResponseCode('404');
        echo 'Unknown type';
        die();

}

$smarty->assign('graphType', $graphType);

$smarty->display('report/staticGraph.tpl');