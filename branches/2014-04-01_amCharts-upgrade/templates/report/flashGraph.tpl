<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
{include file="headIncludes.tpl"}
{literal}
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
        <form name="folderForm" action="">
        <a href="listFolders.php?folder=Job"><b>Folder:</b></a> <select name="folderId" onchange="document.folderForm.submit();">
      {html_select_tree permission=$smarty.const.PERMISSION_READ shares=$shares tree=$folderTree selected=$folderId}
  </select>
  </form>
  </td>
    <td>
    <form action="" name="showInactiveJobsForm">
        <input type="hidden" name="showInactiveJobsGraph" value="0">
      <input id="showInactiveJobs" type="checkbox" name="showInactiveJobsGraph" value="1" {if $showInactiveJobsGraph}checked="true"{/if} onclick="document.showInactiveJobsForm.submit()"><label for="showInactiveJobs"> Show Inactive Jobs</label>
    </form>
  </td></tr></table>
  <form name="updateForm" class="cmxform" action="flashGraph.php" id="updateForm" onsubmit="validateForm();">
    {if isset($cacheKey)}<input type="hidden" value="{$cacheKey}" name="cacheKey">{/if}
    <input type="hidden" name="act" value="">
    <table width="100%" border=0>
      <tr>
        <td align="left" valign="top">
          <select onchange="checkJobCount();" id="jobs" multiple="true"
                  name="job_id[]"
                  size="7"
                  style="width:440px; height:280px">{html_options options=$jobs selected=$job_ids}</select>

          <div style="font-size:x-small;">Select up to 3 jobs</div>
        </td>
        <td valign="top" align="left">
          <input id="startTime" type="hidden" name="startTime">
          <input id="endTime" type="hidden" name="endTime">
          <table>
            <tr>
              <td align="right">Time Frame:</td>
              <td>
                <select id="timeFrame" name="timeFrame" onchange="adjustTimeFrame();">
                <option {if $timeFrame eq 0}selected="true"{/if} value="0">Manual</option>
                <option {if $timeFrame eq 900}selected="true"{/if} value="900">15 Minutes</option>
                <option {if $timeFrame eq 1800}selected="true"{/if} value="1800">30 Minutes</option>
                <option {if $timeFrame eq 3600}selected="true"{/if} value="3600">1 Hour</option>
                <option {if $timeFrame eq 10800}selected="true"{/if} value="10800">3 Hours</option>
                <option {if $timeFrame eq 21600}selected="true"{/if} value="21600">6 Hours</option>
                <option {if $timeFrame eq 43200}selected="true"{/if} value="43200">12 Hours</option>
                <option {if $timeFrame eq 86400}selected="true"{/if} value="86400">Day</option>
                <option {if $timeFrame eq 604800}selected="true"{/if} value="604800">Week</option>
                <option {if $timeFrame eq 1209600}selected="true"{/if} value="1209600">2 Weeks</option>
                <option {if $timeFrame eq 2419200}selected="true"{/if} value="2419200">4 weeks</option>
                </select>
              </td>
            </tr>

            <tr id="startTimeSelect">
              <td align="right">Start:</td>
              <td>{html_select_date start_year='2010' onchange='checkInterval();' prefix='start' time=$startTime} {html_select_time prefix='start' time=$startTime display_minutes=false display_seconds=false}</td>
            </tr>
            <tr id="endTimeSelect">
              <td align="right">End:</td>
              <td nowrap="true">{html_select_date start_year='2010' onchange='checkInterval();' prefix='end' time=$endTime} {html_select_time prefix='end' time=$endTime display_minutes=false display_seconds=false}</td>
            </tr>
            <tr>
              <td align="right" valign="middle">Interval:</td>
              <td valign="top"><select id="interval" name="interval" onchange="checkInterval();">
                <option {if $interval eq 1}selected="true"{/if} value="1">Max</option>
                <option {if $interval eq 300}selected="true"{/if} value="300">5 Minutes</option>
                <option {if $interval eq 900}selected="true"{/if} value="900">15 Minutes</option>
                <option {if $interval eq 1800}selected="true"{/if} value="1800">30 Minutes</option>
                <option {if $interval eq 3600 or $interval eq 0}selected="true"{/if} value="3600">1 Hour</option>
                <option {if $interval eq 10800}selected="true"{/if} value="10800">3 Hours</option>
                <option {if $interval eq 21600}selected="true"{/if} value="21600">6 Hours</option>
                <option {if $interval eq 43200}selected="true"{/if} value="43200">12 Hours</option>
                <option {if $interval eq 86400}selected="true"{/if} value="86400">Daily</option>
                <option {if $interval eq 604800}selected="true"{/if} value="604800">Weekly</option>
              </select>&nbsp;
              {*{if $intervalAuto}{$intervalAuto}{/if}*}
              </td>
            </tr>
            <tr>
              <td colspan="1" align="right">
                Chart type:
              </td>
              <td>
                <select id="chartType" name="chartType" >
                  <option {if $chartType eq "Line"}selected="true"{/if} value="line">Line</option>
                  <option {if $chartType eq "scatter"}selected="true" {/if} value="scatter">Scatter</option>
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
        <td valign="top" align="right" nowrap="true" style="padding:0%;">
          <table width=100% cellpadding="0" cellspacing="0">
            <tr>
              <td colspan="1" align="right">
                Filter Using:
              </td>
              <td><select name="adjustUsing">
                <optgroup label="First view">
                    <option value="AvgFirstViewFirstByte"
                            {if $adjustUsing eq 'AvgFirstViewFirstByte'}selected="true"{/if}>Time to first byte
                    </option>
                    <option value="AvgFirstViewStartRender"
                            {if $adjustUsing eq 'AvgFirstViewStartRender'}selected="true"{/if}>Start Render
                    </option>
                    <option value="AvgFirstViewDocCompleteTime"
                            {if $adjustUsing eq 'AvgFirstViewDocCompleteTime'}selected="true"{/if}>Doc Time
                    </option>
                    <option value="AvgFirstViewDomTime"
                            {if $adjustUsing eq 'AvgFirstViewDomTime'}selected="true"{/if}>Dom
                      Time
                    </option>
                    <option value="AvgFirstViewFullyLoadedTime"
                            {if $adjustUsing eq 'AvgFirstViewFullyLoadedTime'}selected="true"{/if}>Fully Loaded
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
              <td align="right">
                Percentile:
              </td>
              <td><select name="percentile">
                <option {if $percentile eq "1"}selected="true"{/if} value="1">Max</option>
                <option {if $percentile eq "0.95"}selected="true"{/if} value="0.95">95th</option>
                <option {if $percentile eq "0.9"}selected="true"{/if} value="0.9">90th</option>
                <option {if $percentile eq "0.8"}selected="true"{/if} value="0.8">80th</option>
                <option {if $percentile eq "0.7"}selected="true"{/if} value="0.7">70th</option>
                <option {if $percentile eq "0.6"}selected="true"{/if} value="0.6">60th</option>
                <option {if $percentile eq "0.5"}selected="true"{/if} value="0.5">50th</option>
              </select>
              </td>
            </tr>
            <tr>
              <td align="right">Trim above:</td>
              <td><input class="number" id="trimAbove" type="text"
                         name="trimAbove" size="6" value="{$trimAbove}">
              </td>
            </tr>
            <tr>
              <td align="right">Trim below:</td>
              <td><input class="number" id="trimBelow" type="text"
                         name="trimBelow" size="6" value="{$trimBelow}">
              </td>
            </tr>
            <tr>
              <td align="right" colspan="2">
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" nowrap="true">
          <div align="left" style="font-size:x-small;">
            {html_checkboxes name="fields" options=$availFieldKeysFV selected=$fieldsToDisplay separator=" "}<br>
            {html_checkboxes name="fields" options=$availFieldKeysRV selected=$fieldsToDisplay separator=" "}
          </div>
        </td>
        <td colspan="2">
          <table style="cellpadding:0px;cellspacing:0px;margin:0px;border-spacing:0px">
            <tr>
              <td align="right" valign="top"><input id="graphButton" type="button" name="action"
                                                    onclick="updateGraph();" value="Graph"
                                                    style="margin:0px;margin-right:3px;"></td>
              <td align="right" valign="top"><input id="reportButton" type="button" name="action"
                                                    onclick="updateReport();" value="Report"
                                                    style="margin:0px;margin-right:3px;"></td>
              <td align="center" valign="top"><input type="button" name="action" onclick="downloadData();" value="Download"></td>
              <td align="left" valign="top"><input type="reset" value="Reset" style="margin:0px;"></td>
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
  {*<td align="center" valign="top"><input type="button" name="action" onclick="shareReport();" value="Share"></td>*}
{/if}
    {assign var="changeNoteFileName" value=""}
{if $action eq 'graph'}
    {if $graphDataFile}
    {if $chartType eq "scatter"}

    {literal}
      <script type="text/javascript" src="lib/amcharts/amxy/swfobject.js"></script>
      <div style="width:auto;" align="center" id="flashcontent"><strong>You need to upgrade your Flash
        Player</strong></div>

    <script type="text/javascript">
    // <![CDATA[
    var so = new SWFObject("lib/amcharts/amxy/amxy.swf", "amchart", "100%", "600", "8", "#E2E2E2");
    so.addVariable("chart_id", "amchart"); // if you have more then one chart in one page, set different chart_id for each chart
    so.addVariable("path", "lib/amcharts/amxy");
    so.addVariable("settings_file", escape('{/literal}{$graphDataFile}{literal}'),escape('{/literal}{$changeNoteFileName}{literal}'));
    so.write("flashcontent");
    // ]]>
    </script>
    {/literal}
    {else}
    {literal}
      <script type="text/javascript" src="lib/amcharts/amline/swfobject.js"></script>
      <div style="width:auto;" align="center" id="flashcontent"><strong>You need to upgrade your Flash
        Player</strong></div>

    <script type="text/javascript">
    // <![CDATA[
    var so = new SWFObject("lib/amcharts/amline/amline.swf", "amchart", "100%", "600", "8", "#E2E2E2");
    so.addVariable("chart_id", "amchart"); // if you have more then one chart in one page, set different chart_id for each chart
    so.addVariable("path", "lib/amcharts/amline");
    so.addVariable("settings_file", escape('{/literal}{$graphDataFile}{literal}'),escape('{/literal}{$changeNoteFileName}{literal}'));
    so.write("flashcontent");
    // ]]>
    </script>
    {/literal}
    {/if}
      <div align="right"><input type="button" value="Save" onclick="exportGraph();"></div><br>
    {/if}
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
{literal}

</body>
<script type="text/javascript">
  /**
   *Called when the chart inits
   */
  var flashMovie;
  function amChartInited(chart_id) {
    flashMovie = document.getElementById(chart_id);
    document.getElementById("chartfinished").value = chart_id;
  }
  function reloadData() {
    return flashMovie.reloadAll();
  }
  function exportGraph() {
    flashMovie.exportImage();
  }
  endh = document.getElementsByName("endHour")[0];
  starth = document.getElementsByName("startHour")[0];
  endh.addEventListener('change',checkInterval, false);
  starth.addEventListener('change',checkInterval, false);
</script>
{/literal}
</html>