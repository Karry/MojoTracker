# MojoTracker

MojoTracker is an aplication for WebOS mobile platform used on Palm mobile devices like Palm Pre. It show current position informations from device GPS reciever, and/or from GSM cell. It allows logs your tracks to internal database and show basic statistics. Later, you can export logs to standard gpx file directly on your phone.

It can be used for many purposes. For touristics, contributing to [OpenStreatMap project](http://www.openstreetmap.org/), localizing our photos with [GPS Sync Kipi plugin](http://www.kipi-plugins.org/drupal/node/16') inside [digiKam photo manager](http://www.digikam.org/drupal/node/349')...

**For more information see Wiki pages:**

  * [Install](https://github.com/Karry/MojoTracker/blob/wiki/Install.md)
  * [Export Tracks](https://github.com/Karry/MojoTracker/blob/wiki/ExportTracks.md)
  * [Plans for next release](https://github.com/Karry/MojoTracker/blob/wiki/PlansForNextRelease.md)
  * [Howto contribute](https://github.com/Karry/MojoTracker/blob/wiki/HowtoContribute.md)
  * [Related aplications](https://github.com/Karry/MojoTracker/blob/wiki/RelatedApps.md)

## Download

Binary packages (ipk format) are available in "releases" branch. Latest version is [0.3.3](https://github.com/Karry/MojoTracker/blob/releases/com.osm.mojotracker_0.3.3_all.ipk?raw=true).

## Video

<a href='http://www.youtube.com/watch?feature=player_embedded&v=RuE90URHX84' target='_blank'><img src='http://img.youtube.com/vi/RuE90URHX84/0.jpg' width='425' height=344 /></a>

## Screenshots

<a href='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/mainscreen.png'><img src='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/mainscreen.png'  width='200' /></a>
<a href='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/trackinfo.png'><img src='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/trackinfo.png'  width='200' /></a>
<a href='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.2.3/map_preview.png'><img src='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.2.3/map_preview.png' width='200' /></a>
<a href='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/tracklist.png'><img src='https://raw.githubusercontent.com/Karry/MojoTracker/wiki/images/screenshots/0.1.29/tracklist.png'  width='200' /></a>



## Changelog

 * 0.3.2
   * Add Chinese translation
   * Option for export all tracks
   * Fix for map resolution on Pre^3
 * 0.3.1
   * Add French translation
 * 0.3.0
   * Optionally discard nodes with high error from export
 * 0.2.9
   * Fix ohloh.net widget
 * 0.2.8
   * Fix export for long tracks
   * Fix time on graphs
 * 0.2.7
   * Some improvements around map preview
   * Fixes for devices with different screen resolution
   * Add Ohloh widget to "About" page
 * 0.2.6
   * Change track ordering
   * Fix for webOS 1
 * 0.2.5
   * Fixed map drawing for south hemisphere
 * 0.2.4
   * Make possible rename track
   * Fixed waypoint list handling on "info" page
 * 0.2.3
   * Draw waypoints on map preview
   * Fix timezone handling
 * 0.2.2
   * Add option for export waypoints (to <code>*</code>.loc file)
   * Add map preview to info page (use OpenStreetMap.org exports)
 * 0.2.1
   * Split export files is no longer needed
   * Reduce nodes count when device isn't moving
 * 0.2.0
   * Add waypoints support
   * Prevent sleep when tracking is on
   * Make MojoTracker translatable
   * Add popup menu to location (copy to clipboard, share via SMS/email)
   * Fixed export to kml (null values issue)
 * 0.1.29
   * Added screen with detailed track info
   * Added altitude and speed graphs
   * Added export to kml data format
 * 0.1.28
   * Warning: DB format isn't compatible with previous release
   * Display and store more informations like altitude, position accuracy, speed...
   * Add preference page, make posibile specify prefered units.
   * Add page with list of saved track
   * Add posibility delete saved track
   * Add export button, <a href='http://www.precentral.net/homebrew-apps/filemgr-service'>FileMgr service</a> is requiered for this functionality (tested with FileMgr 0.5.1 api)
   * Add compass
 * 0.1.27
   * First public release
   * Display position informations from internal GPS
   * Store tracks to LiteSQL file on internal storage
   * For export tracks to gpx file is required external tool
