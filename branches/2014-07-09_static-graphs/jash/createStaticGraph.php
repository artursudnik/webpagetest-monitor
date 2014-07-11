<?php

chdir('..');

include_once('utils.inc');
include_once('jash/functions.inc');
include_once('jash/staticGraphFunctions.inc');

header('Content-Type: application/json');
header('Cache-Control: public', TRUE);

switch ($_POST['chartType']) {
    case 'graph':
        $chartType = 'graph';
        break;
    case 'histogram':
        $chartType = 'histogram';
        break;
    default:
        die('bad data');
}


const ORGANIZE_IN_SUBFOLDERS=false;

$filePath='graph/staticGraphData/'.$chartType.'/';

$data=$_POST['chartData'];

$filename=generateFileName($data);

if(ORGANIZE_IN_SUBFOLDERS){
    $subPath=generateSubDirs($filename);
}else {
    $subPath='';
}

if(! file_exists($filePath . $subPath)){
    mkdir($filePath . $subPath, 0777, true);
}

$file=gzopen($filePath . $subPath . $filename, 'w9');


if($file){
    gzwrite($file, $data);
    gzclose($file);
}

$graphId = explode('.', $filename);

echo json_encode(
    array(
        'staticGraphUrl' => 'staticGraph.php?id='.$graphId[0].'&type='.$chartType
    )
);

/**
 * Nothing executes below
 */

die();

function generateFileName($data)
{
    $salt='jash122334';
    return md5($data . $salt) . '.json.gz';
}

