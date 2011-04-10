/**
 * singleton helper library for mojotracker app
*/

/**
 * constructor
 */
function Mojotracker(){
    Mojo.log("Mojotracker constructor...");
    this.dbConnect();
	this.distanceFromPrevious = 0;

	this.R = 6371 * 1000; // Earth radius (mean) in metres {6371, 6367}
	
	strSQL = "CREATE TABLE IF NOT EXISTS `timeouts` ( time TEXT NOT NULL )";
	this.executeSQL(strSQL,[], 
            function(tx, result) {}.bind(this),
            function(tx, error) {}.bind(this)
        );    
	strSQL = "CREATE TABLE IF NOT EXISTS `track_list` ( `name` TEXT NOT NULL, `display_name` TEXT NOT NULL )";
	this.executeSQL(strSQL,[], 
            function(tx, result) {}.bind(this),
            function(tx, error) {}.bind(this)
        );
	this.updateDBSchema();
}

Mojotracker.instance = null;

Mojotracker.getInstance = function(){
    if (!this.instance)
        this.instance = new Mojotracker();
    return this.instance;
};

Mojotracker.prototype.db = null;

Mojotracker.prototype.tracename = null;

Mojotracker.prototype.dbConnect = function(){
    // Open DB to store tracks
    this.db = openDatabase('ext:OsmDb', '', 'Sample Data Store', 65536);
}

Mojotracker.prototype.appendTrack = function(trackName, successHandler, errorHandler){
    if (!this.db){
        Mojo.log("no db!");
        return;
    }

    if (this.tracename)
        closeTrack();

	strSQL = "SELECT * FROM `"+trackName+"`;";
    this.executeSQL(strSQL,[], 
            function(tx, result) {
				this.tracename = trackName;
				
				this.total = this.saved = result.rows.length;
				this.lastAcceptedPoint = this.lastPoint = (result.rows.length > 0) ?
												result.rows.item( result.rows.length -1 ) : null;

				this.trackLength = 0;
				this.minAltitude = null;
				this.maxAltitude = null;
				this.maxVelocity = null;
				for (var i = 0; i < result.rows.length; i++) {
					var row = result.rows.item(i);
					this.trackLength += row.distanceFromPrev;
					if (this.minAltitude == null || row.altitude < this.minAltitude)
						this.minAltitude = row.altitude;
					if (this.maxAltitude == null || row.altitude > this.maxAltitude)
						this.maxAltitude = row.altitude;
					if (this.maxVelocity == null || row.velocity > this.maxVelocity)
						this.maxVelocity = row.velocity;
				}
				
                successHandler(result);
            }.bind(this),
            function(tx, error) {
                errorHandler(error);
            }.bind(this)                    
        );	
}

Mojotracker.prototype.createTrack = function(name, errorHandler){
    if (!this.db){
        Mojo.log("no db!");
        return;
    }

    if (this.tracename)
        closeTrack();
        
    // create table
    this.tracename = name;
    var strSQL = 'CREATE TABLE `' + this.tracename + '` ('
        + 'lat TEXT NOT NULL , '
        + 'lon TEXT NOT NULL , '
        + 'altitude INT NULL , '
        + 'time TEXT NOT NULL , '
        + 'velocity INT NOT NULL DEFAULT -1, '
        + 'horizAccuracy INT NOT NULL DEFAULT -1, '
        + 'vertAccuracy INT NOT NULL DEFAULT -1,'
        + 'distanceFromPrev DOUBLE NOT NULL DEFAULT 0'
        +'); GO;';
	var strSQL2 = 'CREATE TABLE `W' + this.tracename + '` ('
        + 'lat TEXT NOT NULL , '
        + 'lon TEXT NOT NULL , '
        + 'alt INT NULL , '
        + 'time TEXT NOT NULL , '
        + 'title TEXT NOT NULL , '
        + 'description TEXT NOT NULL '
        +'); GO;';
	var strSQL3 = "INSERT INTO `track_list` (`name`, `display_name`) VALUES (?, ?); GO;";
    this.db.transaction
    ( 
            (function (transaction)
            {
                    transaction.executeSql('DROP TABLE IF EXISTS `' + this.tracename + '`; GO;', []);
                    transaction.executeSql(strSQL, [], this.createTableDataHandler.bind(this), errorHandler);
                    transaction.executeSql(strSQL2, [], this.createTableDataHandler.bind(this), errorHandler);
                    transaction.executeSql(strSQL3, [this.tracename, this.tracename], this.createTableDataHandler.bind(this), errorHandler);
            } ).bind(this) 
    );
    this.total = 0;
	this.saved = 0;
    this.lastPoint = null;
	this.lastAcceptedPoint = null;
    this.trackLength = 0;
    this.minAltitude = null;
    this.maxAltitude = null;
	this.maxVelocity = null;
}

Mojotracker.prototype.isActive = function( name){
    return this.tracename == name;
}

Mojotracker.prototype.getCurrentTrack = function(){
    return this.tracename;
}

Mojotracker.prototype.getTrackLength = function(){
    return  this.trackLength;
}

Mojotracker.prototype.getAltitudeProfile = function(item, callback){
    var strSQL = "SELECT `time`, `altitude`, `vertAccuracy` FROM `" + item.name + "` WHERE `altitude` != 'nothing' AND `altitude` != 'null'; GO;";
    
    this.executeSQL(strSQL,[], 
            function(tx, result) {
                //this.drawAltitudeProfile1(canvas, result, item, callback);
                callback.handleResult(result);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );    
}

Mojotracker.prototype.getAllPoints = function(item, callback, maxAccuracy){
    var strSQL = "SELECT `time`, `lat`, `lon`, `horizAccuracy`, `distanceFromPrev`, `time`  FROM `" + item.name + "` WHERE `lat` != 'nothing' AND `lat` != 'null' AND `horizAccuracy` <= "+maxAccuracy+"; GO;";
    
    this.executeSQL(strSQL,[], 
            function(tx, result) {
				this.getWaypoints(  item.name,
						function(tx, waypointsResult){
							callback.handleResult(result, waypointsResult);
						}.bind(this),
						function(tx, error) {
							callback.errorHandler(error);
						}.bind(this)
				);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );	
}

Mojotracker.prototype.getVelocityProfile = function(item, callback){

    var strSQL = "SELECT `time`, `velocity` FROM `" + item.name + "` WHERE `velocity` >= 0; GO;";
    
    this.executeSQL(strSQL,[], 
            function(tx, result) {
                //this.drawAltitudeProfile1(canvas, result, item, callback);
                callback.handleResult(result);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );    
}

Mojotracker.prototype.getDistanceFromPrevious = function(){
	return this.distanceFromPrevious;	
}

Mojotracker.prototype.addWaypoint = function(title, description, lat, lon, alt, strUTC, errorHandler ){
    var strSQL = "INSERT INTO `W" + this.tracename + "` "
        + "(lat, lon, alt, time, title, description) "
        + "VALUES ('" + lat + "','" + lon + "','" + alt + "', "
        + "'" + strUTC + "', ?, ?); GO;";
		
	//errorHandler(null, {code: 1, message:strSQL});
    this.executeSQL(strSQL, [title, description], this.createRecordDataHandler.bind(this), errorHandler); 
	
}

Mojotracker.prototype.approximateDistance = function(lat1, lon1, lat2, lon2){
	var lat1Rad = lat1*( Math.PI / 180);
	var lon1Rad = lon1*( Math.PI / 180);
	var lat2Rad = lat2*( Math.PI / 180);
	var lon2Rad = lon2*( Math.PI / 180);
	
	var dLat = lat2Rad - lat1Rad;
	var dLon = lon2Rad - lon1Rad;

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
			Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return this.R * c;
}

Mojotracker.prototype.movePoint = function(p, horizontal, vertical){
	var latRad = p.lat*( Math.PI / 180);
	var lonRad = p.lon*( Math.PI / 180);

	var latCircleR = Math.sin( Math.PI/2 - latRad) * this.R;
	var horizRad = latCircleR == 0? 0: horizontal / latCircleR;
	var vertRad = vertical / this.R;
	
	latRad -= vertRad;
	lonRad += horizRad;
	
	return {lat : (latRad / (Math.PI / 180)),
			lon : (lonRad / (Math.PI / 180))};
}

Mojotracker.prototype.addNode = function( lat, lon, alt, strUTC, velocity, horizAccuracy,
                                         vertAccuracy, errorHandler ){

    if ((!this.tracename) || (!this.db)){
        Mojo.log("no track is opened");
        return;
    }
	
	this.total ++;
	
	if (this.lastAcceptedPoint != null
		&& alt == this.lastAcceptedPoint.alt
		&& lon == this.lastAcceptedPoint.lon
		&& lat == this.lastAcceptedPoint.lat
		&& horizAccuracy == this.lastAcceptedPoint.horizAccuracy
		&& vertAccuracy == this.lastAcceptedPoint.vertAccuracy
		&& (new Date()).getTime() < (this.lastAcceptedPoint.when + (8*60*1000)) // don't produce spaces larger than eight minutes (for continuous graphs)
		){
		Mojo.log("we ignore this point..."); // we reduce nodes count when device isn't moving
		return;
	}
    
    this.distanceFromPrevious = 0;
    if (horizAccuracy < Config.getInstance().getMaxHorizAccuracy()){
        if (this.lastPoint != null){
			this.distanceFromPrevious = this.approximateDistance(this.lastPoint.lat, this.lastPoint.lon, lat, lon);
        }
        this.lastPoint = {
            lat: lat,
            lon: lon,
			alt: alt,
			horizAccuracy: horizAccuracy,
			vertAccuracy: vertAccuracy
        }
    }
    this.trackLength += this.distanceFromPrevious;

	this.lastAcceptedPoint = {
		lat: lat,
		lon: lon,
		alt: alt,
		horizAccuracy: horizAccuracy,
		vertAccuracy: vertAccuracy,
		when: (new Date()).getTime()
	}
    
    if ((vertAccuracy < Config.getInstance().getMaxVertAccuracy()) && (alt != null) &&
        (this.total > Config.getInstance().getIgnoredCount())) // data at beginning is mostly bad...
    {
        if ((this.minAltitude == null) || (alt < this.minAltitude))
            this.minAltitude = alt;
        if ((this.maxAltitude == null) || (alt > this.maxAltitude))
            this.maxAltitude = alt;
    }
    if ((this.maxVelocity == null) || (velocity > this.maxVelocity))
        this.maxVelocity = velocity;
    
    var strSQL = "INSERT INTO `" + this.tracename + "` "
        + "(lat, lon, altitude, time, velocity, horizAccuracy, vertAccuracy, distanceFromPrev)"
        + "VALUES ('" + lat + "','" + lon + "', " + alt + ", "
        + "'" + strUTC + "', " + velocity + ", " + horizAccuracy + ", " + vertAccuracy + ", " + this.distanceFromPrevious + "); GO;";
    this.executeSQL(strSQL, [], this.createRecordDataHandler.bind(this), errorHandler); 
	this.saved ++;
}

Mojotracker.prototype.getMaxVelocity = function(){
    return this.maxVelocity;
}

Mojotracker.prototype.getMaxAltitude = function(){
    return this.maxAltitude;
}

Mojotracker.prototype.getMinAltitude = function(){
    return this.minAltitude;
}

Mojotracker.prototype.getTrackNames = function(resultHandler, errorHandler){
	var strSQL = "SELECT t.`name`, t.`display_name` FROM `track_list` AS t "
		+ "JOIN sqlite_master AS m ON m.name = t.name ORDER BY t.`name` DESC; GO; " ;
	this.executeSQL(strSQL, [],  resultHandler, errorHandler);
}

/**
 * this method fill table track_list that was added in version 0.2.4
 */
Mojotracker.prototype.updateDBSchema = function(){
	var strSQL = "SELECT m.`name` FROM sqlite_master AS m  "
		+"LEFT JOIN `track_list` AS t ON t.`name` = m.`name` "
		+"WHERE t.`name` IS NULL AND m.type='table' AND m.`name` LIKE 'G%'; GO;";
    this.executeSQL(strSQL, [], function(tx,result){
			if (result.rows.length > 0){				
				for (i=0; i< result.rows.length; i++){
					item = result.rows.item(i);
					strSQL = "INSERT INTO `track_list` (`name`, `display_name`) VALUES "
						+"('"+item.name+"', '"+item.name+"'); GO;";
					this.executeSQL(strSQL, [],  function(){}, function(){});
					Mojo.Log.error("error "+strSQL);
				}
			}
		}.bind(this),
		function(tx, error){
			Mojo.Log.error("error "+JSON.stringify(error));
		}.bind(this)); 

}

Mojotracker.prototype.executeSQL = function(strSQL, replacement, resultHandler, errorHandler){
    this.db.transaction(
        (
            function (transaction){
                transaction.executeSql(strSQL, replacement, resultHandler, errorHandler);
            }
        ).bind(this) 
    );    
}

Mojotracker.prototype.removeTrack = function(name, errorHandler){
    if (this.isActive(name))
        return;
    
    var strSQL = "DROP TABLE `"+name+"`; GO;";
    var strSQL2 = "DROP TABLE `W"+name+"`; GO;";
	var strSQL3 = "DELETE FROM `track_list` WHERE `name` = '"+name+"' LIMIT 1; GO;";
    this.executeSQL(strSQL, [], this.createRecordDataHandler.bind(this), errorHandler);
    this.executeSQL(strSQL2, [], this.createRecordDataHandler.bind(this), errorHandler);
}

Mojotracker.prototype.getWaypoints = function( name, infoHandler, errorHandler ){
    var strSQL = "SELECT * FROM `W"+name+"`; GO; "
	this.executeSQL(strSQL, [], infoHandler, errorHandler);
}

Mojotracker.prototype.getTrackInfo = function( track, infoHandler, errorHandler ){
    var strSQL = "SELECT " +
		"'"+track.name+"' AS name, " +
		"? AS display_name, " +
        "COUNT(*) AS nodes, " +
        "MIN(`time`) AS start, " +
        "MAX(`time`) AS stop, " +
        "MIN(`altitude`) AS minAltitude, " +
        "(SELECT MAX(`altitude`) FROM `"+track.name+"` WHERE `altitude` != 'nothing' AND `altitude` != 'null') AS maxAltitude, " +
        "MAX(`velocity`) AS maxVelocity, " +
        "SUM(`distanceFromPrev`) AS trackLength " +
        "FROM `"+track.name+"` ; GO;";

    this.executeSQL(strSQL, [track.display_name], infoHandler, errorHandler);
}

Mojotracker.prototype.rename = function(track, newDisplayName, infoHandler, errorHandler){
	strSQL = "UPDATE `track_list` SET `display_name` = ? WHERE `name` = ?; GO; ";
	this.executeSQL(strSQL, [newDisplayName, track.name],
					function(tx, result){
						track.display_name = newDisplayName;
						//Mojo.Log.error("notify "+track.name+" > "+track.display_name);
						infoHandler(track);
					}, errorHandler);
}

Mojotracker.prototype.getNodes = function(){
    return this.saved;
}

Mojotracker.prototype.closeTrack = function(){
    this.tracename = null;
	this.distanceFromPrevious = 0;
}

Mojotracker.prototype.createTableDataHandler = function(transaction, results) {
    // nothing to do 
} 

Mojotracker.prototype.createRecordDataHandler = function(transaction, results) {	
    // nothing to do 
}

Mojotracker.prototype.exportData = function(controller, track, callback, type) {
    
    this.getWaypoints(  track.name,
						function(transaction, results){
							if (type == 'loc'){
								this.createLocXmlContent(controller, track.name, callback, results.rows);
							}else{
								this.storeGpx2(controller, track, callback, results.rows, type);
							}
						}.bind(this),
						function(transaction, error){
							if (error.code != 1){ // no such table... we continue without waypoints
								callback.errorHandler( error );
								return;
							}
							this.storeGpx2(controller, track, callback, [], type);
						}.bind(this) );	
}

Mojotracker.prototype.storeGpx2 = function(controller, track, callback, waypoints, type) {
	var strSQL = "SELECT * FROM `" + track.name + "` ; GO;";
    
    this.executeSQL(strSQL,[], 
            function(tx, result) {
				this.createGPXContent(controller, result, waypoints, track, callback, type);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );
}

Mojotracker.prototype.createLocXmlContent = function(controller, name, callback, waypoints){
    if (!waypoints){
        callback.errorHandler( $L("BAD base result"));
        Mojo.Log.error("BAD base result");
        return;
    }
    if (waypoints.length == 0){
        callback.errorHandler( $L("This track has no waypoints"));
        Mojo.Log.error("This track has no waypoints");
        return;
    }
	
	try{
		name = name+".loc";
		
		var data = "";
		data += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<loc version=\"1.0\" src=\"MojoTracker\">\n";
		for (var i = 0; i < waypoints.length; i++) {
			try{
				data += "<waypoint>\n";
				var row = waypoints.item(i);
				if ((!row.alt) || (row.alt == "null"))
					row.alt = 0;
				data += "<name>"+ row.title.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +""
				if (row.description != "")
					data += "\n - "+ row.description.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
				data += "</name>\n";
				data += "<coord lon=\""+row.lon+"\" lat=\""+row.lat+"\" ele=\""+row.alt+"\"/>\n";
				data += "</waypoint>\n";
			}catch(e){
				Mojo.Log.error("Error 1.2: "+e);
			}
		}
		data += "</loc>\n";
		
        callback.progress(1,1, $L("xml data built..."));

        setTimeout(this.writeGPXFile.bind(this), 500,
                   controller, name, data,
                   callback, 0);
    } catch (e) {
        Mojo.Log.error(e);
        callback.errorHandler("Error 2: "+e);
    }
}

Mojotracker.prototype.timeoutOccured = function(strUTC){
	var strSQL = "INSERT INTO `timeouts` VALUES ('"+strUTC+"'; GO;";
    
    this.executeSQL(strSQL,[], 
            function(tx, result) {},
            function(tx, error) {}
        );
}

Mojotracker.prototype.createGPXContent = function(controller, result, waypoints, track, callback, type) {
    if (!result.rows){
        callback.errorHandler( $L("BAD base result"));
        Mojo.Log.error("BAD base result");
        return;
    }
	Mojo.Log.error("create export content...");

	name = track.name;
	safeDisplayName = track.display_name.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    try {
		var data = "";
		if (type == "kml"){
			data += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
			data += "<kml xmlns=\"http://www.opengis.net/kml/2.2\"\n";
			data += " xmlns:gx=\"http://www.google.com/kml/ext/2.2\"\n";
			data += " xmlns:kml=\"http://www.opengis.net/kml/2.2\" \n";
			data += " xmlns:atom=\"http://www.w3.org/2005/Atom\">\n";
			data += "<Document><name>"+safeDisplayName+"</name><open>1</open><Style id=\"path0Style\"><LineStyle><color>ffff4040</color><width>6</width></LineStyle></Style>\n";
			data += "  <StyleMap id=\"waypoint\"><IconStyle><scale>1.2</scale><Icon><href>http://maps.google.com/mapfiles/kml/pal4/icon61.png</href></Icon></IconStyle></StyleMap>\n";
			
			Mojo.Log.error("waypoints...");
			data += "<Folder><name>Waypoints</name><visibility>1</visibility><open>1</open>\n";
			for (var i = 0; i < waypoints.length; i++) {
				try{
					var row = waypoints.item(i);
					if ((!row.alt) || (row.alt == "null"))
						row.alt = 0;
					data += "<Placemark>\n<name>"+ row.title.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +"</name>\n<visibility>1</visibility>\n"
					data += "<styleUrl>#waypoint</styleUrl>\n";
					data += "<description>"+ row.description.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +"</description>\n";
					data += "<Point><coordinates>"+row.lon+","+row.lat+","+row.alt+"</coordinates></Point>\n</Placemark>\n";
				}catch(e){
					Mojo.Log.error("Error 1.2: "+e);
				}
			}
			data += "</Folder>\n";
			
			data += "<Folder><name>Tracks</name><Placemark><name>"+name+"</name><visibility>1</visibility><styleUrl>#path0Style</styleUrl><MultiGeometry><LineString><coordinates>\n";
			
			Mojo.Log.error("track...");			
			setTimeout(this.appendContent.bind(this), 10,
					   type,controller, name, data, result, 0,
					   callback, 0);			

		}else{
			// gpx
			data += "<?xml version='1.0' encoding='UTF-8'?>\n";
			data += "<gpx version='1.1'\n";
			data += "creator='MojoTracker - http://code.google.com/p/mojotracker/'\n";
			data += "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'\n";
			data += "xmlns='http://www.topografix.com/GPX/1/1'\n";
			data += "xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'>\n";
			
			Mojo.Log.error("waypoints...");
			for (var i = 0; i < waypoints.length; i++) {
				try{
					var row = waypoints.item(i);
						
					data += "<wpt lat=\""+row.lat+"\" lon=\""+row.lon+"\">\n";
					if ((row.alt) && (row.alt != "null"))
						data += "\t<ele>"+row.alt+"</ele>\n";
					
					description = row.description.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
					data += "\t<name>"+ row.title.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +"</name>\n";
					data += "\t<cmt>"+description+"</cmt>\n";
					data += "\t<desc>"+description+"</desc>\n";
					data += "\t<time>" + row.time + "</time>\n";
					data += "</wpt>\n";

				}catch(e){
					Mojo.Log.error("Error 1.2: "+e);
				}
			}
			
			Mojo.Log.error("track...");
			data += "<trk>\n<name>" + safeDisplayName + "</name>\n<trkseg>\n";
			
			setTimeout(this.appendContent.bind(this), 10,
					   type, controller, name, data, result, 0,
					   callback, 0);
		}
    } catch (e) {
        Mojo.Log.error("error while build content "+e);
        callback.errorHandler("Error 2: "+e);
    }
}
Mojotracker.prototype.appendContent = function(type, controller, name, data, result, i, callback){
	var counter = 0;
	for (; i < result.rows.length && counter < 500; i++) {
		try {
			var row = result.rows.item(i);
			if (type == "kml"){
				data += "" + row.lon + "," + row.lat + ",";
				if ((!row.altitude) || (row.altitude == "null")){
					data += ""+lastAlt;
				}else{
					data += "" + row.altitude + " ";
					lastAlt = row.altitude;
				}
				data += "\n";
			}else{ // gpx
				data += "<trkpt lat='" + row.lat + "' lon='" + row.lon + "'>\n";
				data += "\t<time>" + row.time + "</time>\n";
				data += ((row.altitude) && (row.altitude != "null"))?"\t<ele>" + row.altitude + "</ele>\n"                : "";
				data += (row.velocity>=0) ? "\t<speed>" +row.velocity+ "</speed>\n"         : "";
				data += (row.horizAccuracy>0)?"\t<hdop>" + row.horizAccuracy + "</hdop>\n"  : "";
				data += (row.vertAccuracy>0)?"\t<vdop>" + row.vertAccuracy + "</vdop>\n"    : "";
				data += "</trkpt>\n";				
			}
			
			if (i % 10 == 0){
				callback.progress(i, result.rows.length, $L("building xml data (#{progress}/#{sum})...")
					.interpolate({progress: i, sum: result.rows.length }));
			}
		} catch (e) {
			Mojo.Log.error("Error 1: "+e);
		}
		counter ++;
	}
	
	Mojo.Log.error(type+" points... ("+i+"/"+result.rows.length+")");
	if (i == result.rows.length){
		if (type == "kml"){
			data += "</coordinates></LineString></MultiGeometry></Placemark></Folder></Document></kml>\n";
			name = name+".kml";
		}else{// gpx
			data += "</trkseg>\n</trk>\n";
			data += "</gpx>\n";
			
			name = name+".gpx";			
		}
		callback.progress(1,1, $L("xml data built..."));
		
		Mojo.Log.error("content is done... ("+data.length+")");
		setTimeout(this.writeGPXFile.bind(this), 100,
				   controller, name, data,
				   callback, 0);
	}else{
		setTimeout(this.appendContent.bind(this), 10,
				   type, controller, name, data, result, i,
				   callback, 0);
	}
}

Mojotracker.prototype.fillZeros = function(num){
    res = "" + num;
    if (num < 10) res = "0"+res;
    if (num < 100) res = "0"+res;
    return res;
}

Mojotracker.prototype.writeGPXFile = function(controller, name, content, callback, offset) {
    
    // WARNING: filemgr fails with writing from offset...
    limit = 50000;
    largeFile = content.length > limit;
    
	/*
    if (largeFile && Config.getInstance().splitExportFiles()){
        from = 0;
        fileName = name +"."+this.fillZeros(((offset / limit)+1));
    }else{
	*/
        from = offset;
        fileName = name ;
    //}
	successRecieved = false;
	Mojo.Log.error("write to "+fileName+" from "+offset);
    callback.progress(offset, content.length, $L("Saving data (#{offst} / #{len})...")
                            .interpolate({offst: offset , len: content.length, i:((offset / limit)+1), count: (content.length/limit)}));
    
    try {
		// filemgr service behaves weird.. why we get two onSuccess callback?
		// uaaaa... I want opensource file service!
        controller.serviceRequest('palm://ca.canucksoftware.filemgr', {
            method: 'write',
            parameters: {
                    file: "/media/internal/" + fileName,
                    str: content.substr(offset, limit),
                    append: (offset > 0)
            },
            onSuccess: function(){
                //offset += limit;
				Mojo.Log.error("onSuccess "+offset+" "+successRecieved);
				if (successRecieved)
					return;
				successRecieved = true;
                if ((content.length - offset)> limit) {
                    //this.writeGPXFile(controller, name,  content.substr(limit), errorHandler, successHandler, offset+limit);
                    setTimeout(this.writeGPXFile.bind(this), 100,
                                   controller, name, content,
                                   callback, offset + limit);                    
                } else {
                    callback.successHandler(fileName);
                }
                    
                }.bind(this),
            onFailure: function(err) {

                Mojo.Log.error("onFailure: ", err.errorText);
                callback.errorHandler(err.errorText + " ["+name + ".gpx len " + offset + "+" +content.length  + "]");
            }
            });

	} catch (e) {
            Mojo.Log.error("Error 3");
            Mojo.Log.error(e);
            callback.errorHandler("Error 3: "+e);
	}
};


