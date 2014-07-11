<?php

//require("login/login.php");
include 'monitor.inc';
include_once 'graph_functions.inc';
include_once 'firephp/0.3.2/fb.php';

$smarty->display('report/staticGraph.tpl');