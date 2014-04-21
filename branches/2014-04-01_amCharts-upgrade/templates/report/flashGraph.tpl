<!DOCTYPE html>
<html>
<head>
<title>WebPageTest Monitor - Reports</title>
{include file="headIncludes.tpl"}
{literal}
<link rel="stylesheet" href="css/reports/flashGraph.css" type="text/css">
<style type="text/css">
  label {
    width: 15em;
    float: none;
    font-weight: normal;
  }
</style>
<script type="text/javascript" src="js/reports/flashGraph.js"></script>
{/literal}
</head>
<body>
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
        <a href="listFolders.php?folder=Job"><b>Folder:</b></a> <select name="folderId" onchange="document.folderForm.submit();">
      {html_select_tree permission=$smarty.const.PERMISSION_READ shares=$shares tree=$folderTree selected=$folderId}
  </select>
  </form>
  </td>
    <td>
    <form name="showInactiveJobsForm">
        <input type="hidden" name="showInactiveJobsGraph" value="0">
      <input id="showInactiveJobs" type="checkbox" name="showInactiveJobsGraph" value="1" {if $showInactiveJobsGraph}checked="checked"{/if} onclick="document.showInactiveJobsForm.submit()"><label for="showInactiveJobs"> Show Inactive Jobs</label>
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

          <div style="font-size:x-small;">Select up to 3 jobs</div>
        </td>
        <td style="vertical-align:top">
          <input id="startTime" type="hidden" name="startTime">
          <input id="endTime" type="hidden" name="endTime">
          <table style="width: 315px">
            <tr>
              <td style="text-align:right">Time Frame:</td>
              <td>
                <select id="timeFrame" name="timeFrame" onchange="adjustTimeFrame();">
                <option {if $timeFrame eq 0}selected="selected"{/if} value="0">Manual</option>
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
              </td>
            </tr>

            <tr id="startTimeSelect">
              <td style="text-align:right">Start:</td>
              <td>{html_select_date start_year='2010' onchange='checkInterval();' prefix='start' time=$startTime} {html_select_time prefix='start' time=$startTime display_minutes=false display_seconds=false}</td>
            </tr>
            <tr id="endTimeSelect">
              <td style="text-align:right">End:</td>
              <td>{html_select_date start_year='2010' onchange='checkInterval();' prefix='end' time=$endTime} {html_select_time prefix='end' time=$endTime display_minutes=false display_seconds=false}</td>
            </tr>
            <tr>
              <td style="text-align:right">Interval:</td>
              <td><select id="interval" name="interval" onchange="checkInterval();">
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
              </select>&nbsp;
              {*{if $intervalAuto}{$intervalAuto}{/if}*}
              </td>
            </tr>
            <tr>
              <td colspan="1" style="text-align:right">
                Chart type:
              </td>
              <td>
                <select id="chartType" name="chartType" >
                  <option {if $chartType eq "Line"}selected="selected"{/if} value="line">Line</option>
                  <option {if $chartType eq "scatter"}selected="selected" {/if} value="scatter">Scatter</option>
                </select>
              </td>
            </tr>
            <tr>
                <td align="right">
                    Aggregate:
                </td>
                <td>
                    <select id="aggregateMethod" name="aggregateMethod">
                        <option value="avg"  {if $aggregateMethod eq  "avg"}selected="selected"{/if}>Average</option>
                        <option value="25th" {if $aggregateMethod eq "25th"}selected="selected"{/if}>25th percentile</option>
                        <option value="50th" {if $aggregateMethod eq "50th"}selected="selected"{/if}>50th percentile</option>
                        <option value="75th" {if $aggregateMethod eq "75th"}selected="selected"{/if}>75th percentile</option>
                        <option value="90th" {if $aggregateMethod eq "90th"}selected="selected"{/if}>90th percentile</option>
                        <option value="95th" {if $aggregateMethod eq "95th"}selected="selected"{/if}>95th percentile</option>
                        <option value="99th" {if $aggregateMethod eq "99th"}selected="selected"{/if}>99th percentile</option>
                    </select>
                </td>
            </tr>
          </table>
        </td>
        <td style="vertical-align:top; padding:0%">
          <table style="float: right">
            <tr>
              <td colspan="1" style="text-align:right">
                Filter Using:
              </td>
              <td><select name="adjustUsing">
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
                            {if $adjustUsing eq 'AvgRepeatViewFirstByte'}selected="true"{/if}>Time to first byte
                    </option>
                    <option value="AvgRepeatViewStartRender"
                            {if $adjustUsing eq 'AvgRepeatViewStartRender'}selected="true"{/if}>Start Render
                    </option>
                    <option value="AvgRepeatViewDocCompleteTime"
                            {if $adjustUsing eq 'AvgRepeatViewDocCompleteTime'}selected="true"{/if}>Doc Time
                    </option>
                    <option value="AvgRepeatViewDomTime"
                            {if $adjustUsing eq 'AvgRepeatViewDomTime'}selected="true"{/if}>Dom
                      Time
                    </option>
                    <option value="AvgRepeatViewFullyLoadedTime"
                            {if $adjustUsing eq 'AvgRepeatViewFullyLoadedTime'}selected="true"{/if}>Fully Loaded
                    </option>
                </optgroup>                
              </select></td>
            </tr>
            <tr>
              <td style="text-align:right">
                Percentile:
              </td>
              <td><select name="percentile">
                <option {if $percentile eq "1"}selected="selected"{/if} value="1">Max</option>
                <option {if $percentile eq "0.95"}selected="selected"{/if} value="0.95">95th</option>
                <option {if $percentile eq "0.9"}selected="selected"{/if} value="0.9">90th</option>
                <option {if $percentile eq "0.8"}selected="selected"{/if} value="0.8">80th</option>
                <option {if $percentile eq "0.7"}selected="selected"{/if} value="0.7">70th</option>
                <option {if $percentile eq "0.6"}selected="selected"{/if} value="0.6">60th</option>
                <option {if $percentile eq "0.5"}selected="selected"{/if} value="0.5">50th</option>
              </select>
              </td>
            </tr>
            <tr>
              <td style="text-align:right">Trim above:</td>
              <td><input class="number" id="trimAbove" type="text"
                         name="trimAbove" size="6" value="{$trimAbove}">
              </td>
            </tr>
            <tr>
              <td style="text-align:right">Trim below:</td>
              <td><input class="number" id="trimBelow" type="text"
                         name="trimBelow" size="6" value="{$trimBelow}">
              </td>
            </tr>
            <tr>
              <td colspan="2" style="text-align:right">
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <div style="font-size:x-small;">
            {html_checkboxes name="fields" options=$availFieldKeysFV selected=$fieldsToDisplay separator=" "}<br>
            {html_checkboxes name="fields" options=$availFieldKeysRV selected=$fieldsToDisplay separator=" "}
          </div>
        </td>
        <td>
          <table style="cellpadding:0px;cellspacing:0px;margin:0px;border-spacing:0px">
            <tr>
              <td><input id="graphButton" type="button" name="action"
                                                    onclick="updateGraph();" value="Graph"
                                                    style="margin:0px;margin-right:3px;"></td>
              <td><input id="reportButton" type="button" name="action"
                                                    onclick="updateReport();" value="Report"
                                                    style="margin:0px;margin-right:3px;"></td>
              <td><input type="button" name="action" onclick="downloadData();" value="Download"></td>
              <td><input type="reset" value="Reset" style="margin:0px;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
{if $action eq 'report'}
{include file='report/report.tpl'}
<br>
<div style="padding:15px;background-color:#f5f5f5;">
  <h4>Share URL:</h4> <textarea onClick="javascript:this.focus();this.select();" readonly="true" id="shareUrl" style="width:100%;height:75px"></textarea>
</div><br>
<script>
  loc = document.location.toString();
  base = loc.substring(0,loc.indexOf(".php")+4);

  document.getElementById('shareUrl').value=base+'?___k={$cryptQueryString}'</script>
  {*<td align="center"><input type="button" name="action" onclick="shareReport();" value="Share"></td>*}
{/if}
    {assign var="changeNoteFileName" value=""}
{if $action eq 'graph'}
<div id="graph"></div>
{/if}
    {*<a href="javascript:document.getElementById('abbreviations').style.visibility='visible';">+</a>*}
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
  </form>
</div>
</div>
</div>
</div>
</div>
</body>
</html>