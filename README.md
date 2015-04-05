<h1>MojoTracker</h1>

<p>MojoTracker is an aplication for WebOS mobile platform used on Palm mobile devices like Palm Pre. It show current position informations from device GPS reciever, and/or from GSM cell. It allows logs your tracks to internal database and show basic statistics. Later, you can export logs to standard gpx file directly on your phone.</p>

<p>It can be used for many purposes. For touristics, contributing to <a href='http://www.openstreetmap.org/'>OpenStreatMap project</a>, localizing our photos with <a href='http://www.kipi-plugins.org/drupal/node/16'>GPS Sync Kipi plugin</a> inside <a href='http://www.digikam.org/drupal/node/349'>digiKam photo manager</a>...</p>

**For more information see Wiki pages:**

  * [Install](Install.md)
  * [Export Tracks](ExportTracks.md)
  * [Plans for next release](PlansForNextRelease.md)
  * [Howto contribute](HowtoContribute.md)
  * [Related aplications](RelatedApps.md)

<h2>Video</h2>

<div>
<a href='http://www.youtube.com/watch?feature=player_embedded&v=RuE90URHX84' target='_blank'><img src='http://img.youtube.com/vi/RuE90URHX84/0.jpg' width='425' height=344 /></a><br>
</div>

<h2>Screenshots</h2>

<a href='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/mainscreen.png'><img src='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/mainscreen.png' alt='Main screen' width='200' /></a>
<a href='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/trackinfo.png'><img src='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/trackinfo.png' alt='Track informations' width='200' /></a>
<a href='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.2.3/map_preview.png'><img src='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.2.3/map_preview.png' alt='Map preview' width='200' /></a>
<a href='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/tracklist.png'><img src='http://mojotracker.googlecode.com/svn/wiki/images/screenshots/0.1.29/tracklist.png' alt='Track list' width='200' /></a>



<h2>Changelog</h2>
<ul>

<li>
<strong>0.3.2</strong>
<ul>
<li>Add Chinese translation</li>
<li>Option for export all tracks</li>
<li>Fix for map resolution on Pre^3</li>
</ul>
</li>

<li>
<strong>0.3.1</strong>
<ul>
<li>Add French translation</li>
</ul>
</li>

<li>
<strong>0.3.0</strong>
<ul>
<li>Optionally discard nodes with high error from export</li>
</ul>
</li>

<li>
<strong>0.2.9</strong>
<ul>
<li>Fix ohloh.net widget</li>
</ul>
</li>

<li>
<strong>0.2.8</strong>
<ul>
<li>Fix export for long tracks</li>
<li>Fix time on graphs</li>
</ul>
</li>

<li>
<strong>0.2.7</strong>
<ul>
<li>Some improvements around map preview</li>
<li>Fixes for devices with different screen resolution</li>
<li>Add Ohloh widget to "About" page</li>
</ul>
</li>

<li>
<strong>0.2.6</strong>
<ul>
<li>Change track ordering</li>
<li>Fix for webOS 2</li>
</ul>
</li>

<li>
<strong>0.2.5</strong>
<ul>
<li>Fixed map drawing for south hemisphere</li>
</ul>
</li>
<li>
<strong>0.2.4</strong>
<ul>
<li>Make possible rename track</li>
<li>Fixed waypoint list handling on "info" page</li>
</ul>
</li>
<li>
<strong>0.2.3</strong>
<ul>
<li>Draw waypoints on map preview</li>
<li>Fix timezone handling</li>
</ul>
</li>
<li>
<strong>0.2.2</strong>
<ul>
<li>Add option for export waypoints (to <code>*</code>.loc file)</li>
<li>Add map preview to info page (use OpenStreetMap.org exports)</li>
</ul>
</li>
<li>
<strong>0.2.1</strong>
<ul>
<li>Split export files is no longer needed</li>
<li>Reduce nodes count when device isn't moving</li>
</ul>
</li>
<li>
<strong>0.2.0</strong>
<ul>
<li>Add waypoints support</li>
<li>Prevent sleep when tracking is on</li>
<li>Make MojoTracker translatable</li>
<li>Add popup menu to location (copy to clipboard, share via SMS/email)</li>
<li>Fixed export to kml (null values issue)</li>
</ul>
</li>
<li>
<strong>0.1.29</strong>
<ul>
<li>Added screen with detailed track info</li>
<li>Added altitude and speed graphs</li>
<li>Added export to kml data format</li>
</ul>
</li>
<li>
<strong>0.1.28</strong>
<ul>
<li><strong>Warning: DB format isn't compatible with previous release</strong></li>
<li>Display and store more informations like altitude, position accuracy, speed...</li>
<li>Add preference page, make posibile specify prefered units.</li>
<li>Add page with list of saved track</li>
<li>Add posibility delete saved track</li>
<li>Add export button, <a href='http://www.precentral.net/homebrew-apps/filemgr-service'>FileMgr service</a> is requiered for this functionality (tested with FileMgr 0.5.1 api)</li>
<li>Add compass</li>
</ul>
</li>
<li>
<strong>0.1.27</strong>
<ul>
<li><strong>First public release</strong></li>
<li>Display position informations from internal GPS</li>
<li>Store tracks to LiteSQL file on internal storage</li>
<li>For export tracks to gpx file is required external tool</li>
</ul>
</li>
</ul>

