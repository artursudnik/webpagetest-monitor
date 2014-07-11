<!DOCTYPE html>
<html>
<head>
    {assign var="version" value="1.18"}
    <title>WebPageTest Monitor - Static graphical results</title>
    {*<link rel="stylesheet" href="css/pagestyle.css" type="text/css">*}
    <link rel="stylesheet" href="css/html5-doctor-reset-stylesheet.css?v={$version}" type="text/css">
    <link rel="stylesheet" href="css/reports/staticGraph.css?v={$version}" type="text/css">
    <link rel="stylesheet" href="css/reports/flashGraph.css?v={$version}" type="text/css">
    <script src="js/jquery-1.11.0.js" type="text/javascript"></script>
    <script type="text/javascript" src="js/amcharts/amcharts.js?v={$version}"></script>
    <script type="text/javascript" src="js/amcharts/serial.js?v={$version}"></script>
    <script type="text/javascript" src="js/amcharts/exporting/amexport.js?v={$version}"></script>
    <script type="text/javascript" src="js/amcharts/exporting/rgbcolor.js?v={$version}"></script>
    <script type="text/javascript" src="js/amcharts/exporting/canvg.js?v={$version}"></script>
    <script type="text/javascript" src="js/amcharts/exporting/filesaver.js?v={$version}"></script>
    {*<script type="text/javascript" src="js/reports/flashGraphOld.js?v={$version}"></script>*}
    <script type="text/javascript" src="js/reports/flashGraph.js?v={$version}"></script>
    <script type="text/javascript" src="js/reports/histograms.js?v={$version}"></script>
    <script type="text/javascript">
        var graphType = '{$graphType}';
        switch(graphType) {
            case 'graph':
                break;
            case 'histogram':
                break;
        }
        var data={$data};
    </script>
</head>
<!--[if lt IE 7 ]> <body class="ie6"> <![endif]-->
<!--[if IE 7 ]>    <body class="ie7"> <![endif]-->
<!--[if IE 8 ]>    <body class="ie8"> <![endif]-->
<!--[if IE 9 ]>    <body class="ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <body class=""> <!--<![endif]-->

<div id="pageContainer">
    <div id="incompMessages">
        <div class="message">
            Warning! Your version of Internet Explorer does not support saving graph to file. Use any other modern browser or version 10 or greater of IE.
        </div>
    </div>
    <table id="abbreviations">
        <tr style="font-size:x-small;">
            <td><strong>FV</strong> - First View</td>
            <td>|</td>
            <td><strong>RV</strong> - Repeat View</td>
            <td>|</td>
            <td><strong>TTFB</strong> - Time to first byte</td>
            <td>|</td>
            <td><strong>Render</strong> - Start rendering</td>
            <td>|</td>
            <td><strong>DOM</strong> - Dom Marker Time</td>
            <td>|</td>
            <td><strong>Doc</strong> - Document loaded</td>
            <td>|</td>
            <td><strong>Fully</strong> - Fully loaded</td>
        </tr>
    </table>
    <div id="histogramsContainer" style="position: relative;">
        <div id="histogram"></div>
    </div>
    <div id="graphContainer" style="position: relative">
        <div id="graph"></div>
    </div>
</div>


</body>
</html>