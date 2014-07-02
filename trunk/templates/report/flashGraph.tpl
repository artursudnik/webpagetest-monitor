<!DOCTYPE html>
<html>
<head>
{assign var="version" value="1.9"}
<title>WebPageTest Monitor - Reports</title>
{include file="headIncludes.tpl"}
<link rel="stylesheet" href="css/reports/flashGraph.css?v={$version}" type="text/css">
<style type="text/css">
  {literal}
  label {
    width: 15em;
    float: none;
    font-weight: normal;
  }
  {/literal}
</style>
<script type="text/javascript" src="js/amcharts/amcharts.js?v={$version}"></script>
<script type="text/javascript" src="js/amcharts/serial.js?v={$version}"></script>
<script type="text/javascript" src="js/amcharts/exporting/amexport.js?v={$version}"></script>
<script type="text/javascript" src="js/amcharts/exporting/rgbcolor.js?v={$version}"></script>
<script type="text/javascript" src="js/amcharts/exporting/canvg.js?v={$version}"></script>
<script type="text/javascript" src="js/amcharts/exporting/filesaver.js?v={$version}"></script>
<script type="text/javascript" src="js/reports/flashGraphOld.js?v={$version}"></script>
<script type="text/javascript" src="js/reports/flashGraph.js?v={$version}"></script>
<script type="text/javascript" src="js/reports/histograms.js?v={$version}"></script>
</head>
<!--[if lt IE 7 ]> <body class="ie6"> <![endif]-->
<!--[if IE 7 ]>    <body class="ie7"> <![endif]-->
<!--[if IE 8 ]>    <body class="ie8"> <![endif]-->
<!--[if IE 9 ]>    <body class="ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <body class=""> <!--<![endif]-->
<div class="page">
{include file='header.tpl'}
{include file='navbar.tpl'}
<div id="main">
<div class="level_2">
<div class="content-wrap">
<div class="content">
  <table>
    <tr>
      <td>
        <form name="folderForm">
        <label for="folderId"><a href="listFolders.php?folder=Job"><b>Folder:</b></a></label> <select id="folderId" name="folderId" onchange="wptmonitor.graph.doNotPreventUnloadConfirmation(); document.folderForm.submit();">
      {html_select_tree permission=$smarty.const.PERMISSION_READ shares=$shares tree=$folderTree selected=$folderId}
  </select>
  </form>
  </td>
    <td>
    <form name="showInactiveJobsForm">
        <input type="hidden" name="showInactiveJobsGraph" value="0">
      <input id="showInactiveJobs" type="checkbox" name="showInactiveJobsGraph" value="1" {if $showInactiveJobsGraph}checked="checked"{/if} onclick="wptmonitor.graph.doNotPreventUnloadConfirmation(); document.showInactiveJobsForm.submit()"><label for="showInactiveJobs"> Show Inactive Jobs</label>
    </form>
  </td></tr></table>
  <form name="updateForm" class="cmxform" action="flashGraph.php" id="updateForm" onsubmit="validateForm();">
    {if isset($cacheKey)}<input type="hidden" value="{$cacheKey}" name="cacheKey">{/if}
    <input type="hidden" name="act" value="">
    <table style="width:100%">
      <tr>
        <td>
          <select onchange="checkJobCount();" id="jobs" multiple="multiple"
                  name="job_id[]"
                  size="7"
                  style="width:440px; height:280px">{html_options options=$jobs selected=$job_ids}</select>

          <div style="font-size:x-small;"><label for="jobs">Select up to 3 jobs</label></div>
        </td>
        <td style="vertical-align:top">
            <fieldset id="timeframeFieldset" class="wptmon">
                <legend>Time Frame</legend>
                <input id="startTime" type="hidden" name="startTime">
                <input id="endTime" type="hidden" name="endTime">
                <div>
                    <label for="timeFrame"></label>
                    <select id="timeFrame" name="timeFrame" onchange="adjustTimeFrame();">
                        <option {if $timeFrame eq 0}selected="selected"{/if} value="0">Custom</option>
                        <option {if $timeFrame eq 900}selected="selected"{/if} value="900">15 Minutes</option>
                        <option {if $timeFrame eq 1800}selected="selected"{/if} value="1800">30 Minutes</option>
                        <option {if $timeFrame eq 3600}selected="selected"{/if} value="3600">1 Hour</option>
                        <option {if $timeFrame eq 10800}selected="selected"{/if} value="10800">3 Hours</option>
                        <option {if $timeFrame eq 21600}selected="selected"{/if} value="21600">6 Hours</option>
                        <option {if $timeFrame eq 43200}selected="selected"{/if} value="43200">12 Hours</option>
                        <option {if $timeFrame eq 86400}selected="selected"{/if} value="86400">Day</option>
                        <option {if $timeFrame eq 604800}selected="selected"{/if} value="604800">Week</option>
                        <option {if $timeFrame eq 1209600}selected="selected"{/if} value="1209600">2 Weeks</option>
                        <option {if $timeFrame eq 2419200}selected="selected"{/if} value="2419200">4 weeks</option>
                    </select>
                </div>
                <div id="startTimeSelect">
                    <label>Start:</label>
                    {html_select_date start_year='2010' onchange='checkInterval();' prefix='start' time=$startTime} {html_select_time prefix='start' time=$startTime display_minutes=false display_seconds=false}
                </div>
                <div id="endTimeSelect">
                    <label>End:</label>
                    {html_select_date start_year='2010' onchange='checkInterval();' prefix='end' time=$endTime} {html_select_time prefix='end' time=$endTime display_minutes=false display_seconds=false}
                </div>
            </fieldset>
            <fieldset id="graphFieldset" class="wptmon">
                <legend>Graph</legend>
                <div>
                    <label for="interval">Interval:</label>
                    <select id="interval" name="interval" onchange="checkInterval();">
                        <option {if $interval eq 1}selected="selected"{/if} value="1">Max</option>
                        <option {if $interval eq 300}selected="selected"{/if} value="300">5 Minutes</option>
                        <option {if $interval eq 900}selected="selected"{/if} value="900">15 Minutes</option>
                        <option {if $interval eq 1800}selected="selected"{/if} value="1800">30 Minutes</option>
                        <option {if $interval eq 3600 or $interval eq 0}selected="selected"{/if} value="3600">1 Hour</option>
                        <option {if $interval eq 10800}selected="selected"{/if} value="10800">3 Hours</option>
                        <option {if $interval eq 21600}selected="selected"{/if} value="21600">6 Hours</option>
                        <option {if $interval eq 43200}selected="selected"{/if} value="43200">12 Hours</option>
                        <option {if $interval eq 86400}selected="selected"{/if} value="86400">Daily</option>
                        <option {if $interval eq 604800}selected="selected"{/if} value="604800">Weekly</option>
                    </select>
                </div>
                <div>
                    <label for="aggregateMethod">Aggregate:</label>
                    <select id="aggregateMethod" name="aggregateMethod">
                        <option value="avg"  {if $aggregateMethod eq  "avg"}selected="selected"{/if}>Average</option>
                        <option value="25th" {if $aggregateMethod eq "25th"}selected="selected"{/if}>25th percentile</option>
                        <option value="50th" {if $aggregateMethod eq "50th"}selected="selected"{/if}>50th percentile</option>
                        <option value="75th" {if $aggregateMethod eq "75th"}selected="selected"{/if}>75th percentile</option>
                        <option value="90th" {if $aggregateMethod eq "90th"}selected="selected"{/if}>90th percentile</option>
                        <option value="95th" {if $aggregateMethod eq "95th"}selected="selected"{/if}>95th percentile</option>
                        <option value="99th" {if $aggregateMethod eq "99th"}selected="selected"{/if}>99th percentile</option>
                    </select>
                </div>
                <div style="visibility: hidden">
                    <label for="chartType">Chart type:</label>
                    <select id="chartType" name="chartType" >
                        <option {if $chartType eq "Line"}selected="selected"{/if} value="line">Line</option>
                        <option {if $chartType eq "scatter"}selected="selected" {/if} value="scatter">Scatter</option>
                    </select>
                </div>
            </fieldset>
            <fieldset id="graphFilteringFieldset" class="wptmon">
                <legend>Graph data filtering</legend>
                <div>
                    <label for="adjustUsing">Filter Using:</label>
                    <select id="adjustUsing" name="adjustUsing">
                        <optgroup label="First view">
                            <option value="AvgFirstViewFirstByte"
                                    {if $adjustUsing eq 'AvgFirstViewFirstByte'}selected="selected"{/if}>Time to first byte
                            </option>
                            <option value="AvgFirstViewStartRender"
                                    {if $adjustUsing eq 'AvgFirstViewStartRender'}selected="selected"{/if}>Start Render
                            </option>
                            <option value="AvgFirstViewDocCompleteTime"
                                    {if $adjustUsing eq 'AvgFirstViewDocCompleteTime'}selected="selected"{/if}>Doc Time
                            </option>
                            <option value="AvgFirstViewDomTime"
                                    {if $adjustUsing eq 'AvgFirstViewDomTime'}selected="selected"{/if}>Dom
                                                                                                       Time
                            </option>
                            <option value="AvgFirstViewFullyLoadedTime"
                                    {if $adjustUsing eq 'AvgFirstViewFullyLoadedTime'}selected="selected"{/if}>Fully Loaded
                            </option>
                        </optgroup>
                        <optgroup label="Repeat view">
                            <option value="AvgRepeatViewFirstByte"
                                    {if $adjustUsing eq 'AvgRepeatViewFirstByte'}selected=""{/if}>Time to first byte
                            </option>
                            <option value="AvgRepeatViewStartRender"
                                    {if $adjustUsing eq 'AvgRepeatViewStartRender'}selected=""{/if}>Start Render
                            </option>
                            <option value="AvgRepeatViewDocCompleteTime"
                                    {if $adjustUsing eq 'AvgRepeatViewDocCompleteTime'}selected=""{/if}>Doc Time
                            </option>
                            <option value="AvgRepeatViewDomTime"
                                    {if $adjustUsing eq 'AvgRepeatViewDomTime'}selected=""{/if}>Dom
                                                                                                Time
                            </option>
                            <option value="AvgRepeatViewFullyLoadedTime"
                                    {if $adjustUsing eq 'AvgRepeatViewFullyLoadedTime'}selected=""{/if}>Fully Loaded
                            </option>
                        </optgroup>
                    </select>
                </div>
                <div>
                    <label for="percentile">Percentile:</label>
                    <select id="percentile" name="percentile">
                        <option {if $percentile eq "1"}selected="selected"{/if} value="1">Max</option>
                        <option {if $percentile eq "0.95"}selected="selected"{/if} value="0.95">95th</option>
                        <option {if $percentile eq "0.9"}selected="selected"{/if} value="0.9">90th</option>
                        <option {if $percentile eq "0.8"}selected="selected"{/if} value="0.8">80th</option>
                        <option {if $percentile eq "0.7"}selected="selected"{/if} value="0.7">70th</option>
                        <option {if $percentile eq "0.6"}selected="selected"{/if} value="0.6">60th</option>
                        <option {if $percentile eq "0.5"}selected="selected"{/if} value="0.5">50th</option>
                    </select>
                </div>
                <div>
                    <label for="trimAbove">Trim above:</label>
                    <input class="number" id="trimAbove" type="text"
                           name="trimAbove" size="6" value="{$trimAbove}">
                    <label for="trimBelow">Trim below:</label>
                    <input class="number" id="trimBelow" type="text"
                           name="trimBelow" size="6" value="{$trimBelow}">
                </div>
            </fieldset>
            <fieldset id="histogramFieldset" class="wptmon">
                <legend>Histogram</legend>
                <div>
                    <label for="histogramMinLimit">Minimum value:</label>
                    {*<input type="text" class="number" size="6" id="histogramMinLimit" name="histogramMinLimit"/>*}
                    <select id="histogramMinLimit" name="histogramMinLimit">
                        <option value="0">0</option>
                        <option value="0.5">0.5</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                    </select>
                </div>
                <div>
                    <label for="histogramMaxLimit">Maximum value:</label>
                    {*<input type="text" class="number" size="6"*}
                           {*id="histogramMaxLimit"*}
                           {*name="histogramMaxLimit"/>*}
                    <select id="histogramMaxLimit"
                            name="histogramMaxLimit">
                        <option value="0">0</option>
                        <option value="0.5">0.5</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                        <option value="-1" selected="">unlimited</option>
                    </select>
                </div>
            </fieldset>
        </td>
      </tr>
      <tr>
        <td>
          <div style="font-size:x-small;">
            {html_checkboxes name="fields" options=$availFieldKeysFV selected=$fieldsToDisplay separator=" "}<br>
            {html_checkboxes name="fields" options=$availFieldKeysRV selected=$fieldsToDisplay separator=" "}
          </div>
        </td>
        <td style="text-align: center">
              <input id="histogramButton" type="button" name="histogramButton" value="Histogram" />
              <input type="button" id="graphJSONButton" value="Graph" style="margin:0"/>
              {if $smarty.session.ls_admin}
                  <input id="graphButton" type="button" name="action"
                                                        onclick="updateGraph();" value="Graph (reload)">
                  <input id="reportButton" type="button" name="action"
                                                        onclick="updateReport();" value="Report">
                  <input type="button" name="action" onclick="downloadData();" value="Download">
              {/if}
              <input type="reset" value="Reset">
        </td>
      </tr>
    </table>
{if $action eq 'report'}
{include file='report/report.tpl'}
<br>
<div style="padding:15px;background-color:#f5f5f5;">
  <h4><label for="shareUrl">Share URL:</label></h4> <textarea onClick="this.focus();this.select();" readonly="" id="shareUrl" style="width:100%;height:75px"></textarea>
</div><br>
<script>
  loc = document.location.toString();
  base = loc.substring(0,loc.indexOf(".php")+4);

  document.getElementById('shareUrl').value=base+'?___k={$cryptQueryString}'</script>
  {*<td align="center"><input type="button" name="action" onclick="shareReport();" value="Share"></td>*}
{/if}
    {assign var="changeNoteFileName" value=""}
</form>

<div id="incompMessages">
    <div class="message">
        Warning! Your version of Internet Explorer does not support saving graph to file. Use any other modern browser or version 10 or greater of IE.
    </div>
</div>
<div id="histogramsContainer" style="position: relative;">
    <div id="histogram"></div>
    <a href="#" id="hideHistograms" class="hide"><img src="img/silkicons/icons/cross.png" alt="Hide graph"/></a>
    <div id="histogramOverlay">
        <div style="padding-top: 30%;">
            Working...
        </div>
    </div>
</div>
<div id="graphContainer" style="position: relative">
    <div id="graph"></div>
    <a href="#" id="hideGraph" class="hide"><img src="img/silkicons/icons/cross.png" alt="Hide graph"/></a>
    <div id="graphOverlay">
        <div style="padding-top: 30%;">
            Working...
        </div>
    </div>
    <div id="abbreviations" style="visibility:visible;">
      <table class="pretty">
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
    </div>
</div>

</div>
</div>
</div>
</div>
</div>
{if $action eq 'graph'}
{literal}
    <script type="text/javascript">
        wptmonitor.graph.action = "graph";
    </script>
{/literal}
{/if}
</body>
</html>