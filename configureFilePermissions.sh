#!/bin/sh

touch jobProcessor_log.html
chown www-data:www-data jobProcessor_log.html

touch QueueStatus.ini
chown www-data:www-data QueueStatus.ini

touch temp
chown -R www-data:www-data temp

touch templates_c
chown www-data:www-data templates_c
chown www-data:www-data templates_c/*.tpl.php

touch graph/cache
chown www-data:www-data graph/cache
chown www-data:www-data graph/cache/*.xml
chown www-data:www-data graph/cache/.xml

touch db/wpt_monitor.sqlite
chown www-data:www-data db/wpt_monitor.sqlite