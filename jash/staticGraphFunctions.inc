<?php

function generateSubDirs($filename)
{
    return substr($filename, 0, 2) . '/' . substr($filename, 2, 2) . '/';
}