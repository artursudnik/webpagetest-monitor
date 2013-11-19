<?php

function smarty_modifier_time_difference($timestamp) {
    if (!is_numeric($timestamp)) {
        return $timestamp;
    }

    $d_start = new DateTime(date('Y-m-d H:i:s', 0));

    $diff = $d_start->diff(new DateTime(date('Y-m-d H:i:s', $timestamp)));

    $resultSting='';

    if($diff->y) $resultSting.=$diff->y.'y';
    if($diff->m) $resultSting.=' '.$diff->m.'m';
    if($diff->d) $resultSting.=' '.$diff->d.'d';
    if($diff->h) $resultSting.=' '.$diff->h.'h';
    if($diff->i) $resultSting.=' '.$diff->i.'m';
    if($diff->s) $resultSting.=' '.$diff->s.'s';

    return $resultSting;
}
