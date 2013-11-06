<?php
require_once('bootstrap.php');

        
    $conn = Doctrine_Manager::getInstance()->getCurrentConnection();
    $pdo = $conn->execute("
        SELECT Location, Agent, count(*) NumberOfJobs, MAX(delayedJobs.delay) AS MaximumDelay
        FROM (
            SELECT 
             j.id, f.label AS Folder, j.label AS JobLabel, j.location AS Agent, l.label Location, FROM_UNIXTIME(lastrun) LastRun, frequency, FROM_UNIXTIME(lastrun + frequency*60) AS NextPlannedRun, SEC_TO_TIME(((UNIX_TIMESTAMP() - lastrun)/60 - frequency)*60) delay
            FROM WPTJob j
            JOIN WPTJobFolder f ON f.id = j.wptjobfolderid
            JOIN WPTLocation l ON j.location = l.location
            WHERE j.active = 1 AND (lastrun IS NULL OR lastrun + frequency*60 < UNIX_TIMESTAMP())
        ) delayedJobs
        GROUP BY Agent, Location
    ");
    $pdo->setFetchMode(Doctrine_Core::FETCH_ASSOC);
    $locations = $pdo->fetchAll();
    header('Content-type: application/json');
    // print_r(
    echo json_encode(
        array(
            'count'     => count($locations),
            'locations' => $locations
        )
    );
