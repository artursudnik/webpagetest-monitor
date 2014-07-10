<?php

chdir('..');

include_once('utils.inc');
include_once('jash/functions.inc');

header('Content-Type: application/json');
header('Cache-Control: public', TRUE);
header('Content-Encoding: gzip');

const ORGANIZE_IN_SUBFOLDERS=false;

$filePath='graph/staticGraphData/';

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

/**
 * Nothing executes below
 */

die();

function generateFileName($data)
{
    $salt='jash122334';
    return md5($data . $salt) . '.json.gz';
}

function generateSubDirs($filename)
{
    return substr($filename, 0, 2) . '/' . substr($filename, 2, 2) . '/';
}