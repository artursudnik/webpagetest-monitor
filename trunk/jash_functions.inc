<?php

function getDelaysForLocationsAggregated() {
    $conn = Doctrine_Manager::getInstance()->getCurrentConnection();
    $pdo = $conn->execute("
        SELECT Location, Agent, count(*) NumberOfJobs, MAX(delayedJobs.delay) AS MaximumDelay
        FROM (
            SELECT 
             j.id, f.label AS Folder, j.label AS JobLabel, j.location AS Agent, l.label Location, FROM_UNIXTIME(lastrun) LastRun, frequency, FROM_UNIXTIME(lastrun + frequency*60) AS NextPlannedRun, round((UNIX_TIMESTAMP() - lastrun)/60 - frequency)*60 delay
            FROM WPTJob j
            JOIN WPTJobFolder f ON f.id = j.wptjobfolderid
            JOIN WPTLocation l ON j.location = l.location
            WHERE j.active = 1 AND (lastrun IS NULL OR lastrun + frequency*60 < UNIX_TIMESTAMP())
        ) delayedJobs
        GROUP BY Agent, Location
    ");
    $pdo->setFetchMode(Doctrine_Core::FETCH_ASSOC);
    return $locations = $pdo->fetchAll();
}
