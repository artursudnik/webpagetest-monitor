#!/bin/sh

touch jobProcessor_log.html
chown www-data:www-data jobProcessor_log.html

touch QueueStatus.ini
chown www-data:www-data QueueStatus.ini

mkdir temp
chown -R www-data:www-data temp

mkdir templates_c
chown www-data:www-data templates_c
chown www-data:www-data templates_c/*.tpl.php

mkdir graph/cache
chown www-data:www-data graph/cache
chown www-data:www-data graph/cache/*.xml
chown www-data:www-data graph/cache/.xml
mkdir graph/staticGraphData
chown www-data:www-data graph/staticGraphData

touch db/wpt_monitor.sqlite
chown www-data:www-data db/wpt_monitor.sqlite