<?php

//require("login/login.php");
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'jash/functions.inc';
include_once 'jash/staticGraphFunctions.inc';
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

$filePath='graph/staticGraphData/'.$graphType.'/';

$fileName = $_GET['id'].'.json.gz';

if(!file_exists($filePath.generateSubDirs($fileName).$fileName)) {
    setHttpResponseCode('404');
    echo 'Data missing';
    die();
}

$fileContent = implode(gzfile($filePath.generateSubDirs($fileName).$fileName));


$smarty->assign('data', $fileContent);
$smarty->assign('graphType', $graphType);

$smarty->display('report/staticGraph.tpl');