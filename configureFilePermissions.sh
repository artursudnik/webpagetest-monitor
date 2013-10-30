#!/bin/sh

touch jobProcessor_log.html
chown www-data:www-data jobProcessor_log.html

touch QueueStatus.ini
chown www-data:www-data QueueStatus.ini

touch temp
chown www-data:www-data temp

touch templates_c
chown www-data:www-data templates_c

touch graph/cache
chown www-data:www-data graph/cache
