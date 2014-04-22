#!/bin/sh

touch jobProcessor_log.html
chown www-data:www-data jobProcessor_log.html

touch QueueStatus.ini
chown www-data:www-data QueueStatus.ini

touch temp
chown -R www-data:www-data temp

touch templates_c
chown -R www-data:www-data templates_c

touch graph/cache
chown -R www-data:www-data graph/cache

touch db/wpt_monitor.sqlite
chown www-data:www-data db/wpt_monitor.sqlite