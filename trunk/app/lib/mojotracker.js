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
    this.db.transaction
    ( 
            (function (transaction)
            {
                    transaction.executeSql('DROP TABLE IF EXISTS `' + this.tracename + '`; GO;', []);
                    transaction.executeSql(strSQL, [], this.createTableDataHandler.bind(this), errorHandler);
            } ).bind(this) 
    );
    this.total = 0;
    this.lastPoint = null;
    this.trackLength = 0;
    this.minAltitude = null;
    this.maxAltitude = null;
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
    
    this.executeSQL(strSQL,
            function(tx, result) {
                //this.drawAltitudeProfile1(canvas, result, item, callback);
                callback.handleResult(result);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );    
}

Mojotracker.prototype.getVelocityProfile = function(item, callback){

    var strSQL = "SELECT `time`, `velocity` FROM `" + item.name + "` WHERE `velocity` >= 0; GO;";
    
    this.executeSQL(strSQL,
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

Mojotracker.prototype.addNode = function( lat, lon, alt, strUTC, velocity, horizAccuracy,
                                         vertAccuracy, errorHandler ){

    if ((!this.tracename) || (!this.db)){
        Mojo.log("no track is opened");
        return;
    }
    
    this.distanceFromPrevious = 0;
    if (horizAccuracy < Config.getInstance().getMaxHorizAccuracy()){
        if (this.lastPoint != null){
            var lat1Rad = this.lastPoint.lat*( Math.PI / 180);
            var lon1Rad = this.lastPoint.lon*( Math.PI / 180);
            var lat2Rad = lat*( Math.PI / 180);
            var lon2Rad = lon*( Math.PI / 180);
            
            var R = 6371000; // Earth radius (mean) in metres
            var dLat = lat2Rad - lat1Rad;
            var dLon = lon2Rad - lon1Rad; 
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2); 
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            this.distanceFromPrevious = R * c;
        }
        this.lastPoint = {
            lat: lat,
            lon: lon
        }
    }
    this.trackLength += this.distanceFromPrevious;
    
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
    this.executeSQL(strSQL, this.createRecordDataHandler.bind(this), errorHandler); 
    this.total ++;
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
    var strSQL = "SELECT `name` FROM sqlite_master WHERE type='table' AND `name` LIKE 'G%' ORDER BY `name`; GO;";
    this.executeSQL(strSQL, resultHandler, errorHandler); 
}

Mojotracker.prototype.executeSQL = function(strSQL, resultHandler, errorHandler){
    this.db.transaction(
        (
            function (transaction){
                transaction.executeSql(strSQL, [], resultHandler, errorHandler);
            }
        ).bind(this) 
    );    
}

Mojotracker.prototype.removeTrack = function(name, errorHandler){
    if (this.isActive(name))
        return;
    
    var strSQL = "DROP TABLE `"+name+"`; GO;";
    this.executeSQL(strSQL, this.createRecordDataHandler.bind(this), errorHandler);
}


Mojotracker.prototype.getTrackInfo = function( name, infoHandler, errorHandler ){
    var strSQL = "SELECT '"+name+"' AS name, " +
        "COUNT(*) AS nodes, " +
        "MIN(`time`) AS start, " +
        "MAX(`time`) AS stop, " +
        "MIN(`altitude`) AS minAltitude, " +
        "(SELECT MAX(`altitude`) FROM `"+name+"` WHERE `altitude` != 'nothing' AND `altitude` != 'null') AS maxAltitude, " +
        "MAX(`velocity`) AS maxVelocity, " +
        "SUM(`distanceFromPrev`) AS trackLength " +
        "FROM `"+name+"` ; GO;";

    this.executeSQL(strSQL, infoHandler, errorHandler);
}

Mojotracker.prototype.getNodes = function(){
    return this.total;
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

Mojotracker.prototype.storeGpx = function(controller, name, callback) {
    var strSQL = "SELECT * FROM `" + name + "` ; GO;";
    
    this.executeSQL(strSQL,
            function(tx, result) {
                this.createGPXContent(controller, result, name, callback);
            }.bind(this),
            function(tx, error) {
                callback.errorHandler(error);
            }.bind(this)                    
        );
}

Mojotracker.prototype.createGPXContent = function(controller, result, name, callback) {
    if (!result.rows){
        callback.errorHandler("BAD base result");
        Mojo.Log.error("BAD base result");
        return;
    }

    try {
		var data = "";
		if (Config.getInstance().getExportFormat() == "kml"){
			data += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
			data += "<kml xmlns=\"http://www.opengis.net/kml/2.2\"\n";
			data += " xmlns:gx=\"http://www.google.com/kml/ext/2.2\"\n";
			data += " xmlns:kml=\"http://www.opengis.net/kml/2.2\" \n";
			data += " xmlns:atom=\"http://www.w3.org/2005/Atom\">\n";
			data += "<Document><name>"+name+"</name><open>1</open><Style id=\"path0Style\"><LineStyle><color>ffff4040</color><width>6</width></LineStyle></Style>\n";
			data += "<Folder><name>Tracks</name><Placemark><name>"+name+"</name><visibility>1</visibility><styleUrl>#path0Style</styleUrl><MultiGeometry><LineString><coordinates>\n";
			
			var lastAlt = 0;
			for (var i = 0; i < result.rows.length; i++) {
				try {
					var row = result.rows.item(i);
					data += "" + row.lon + "," + row.lat + ",";
					if ((!row.altitude) || (row.altitude == "null")){
						data += ""+lastAlt;
					}else{
						data += "" + row.altitude + " ";
						lastAlt = row.altitude;
					}
					
					data += "\n";
					
					if (i % 10 == 0){
						callback.progress(i, result.rows.length, "building xml data ("+i+")...");
					}
				} catch (e) {
					Mojo.Log.error("Error 1");
					Mojo.Log.error("Error 1: "+e);
				}
			}
			
			data += "</coordinates></LineString></MultiGeometry></Placemark></Folder></Document></kml>\n";
			
			name = name+".kml";
		}else{
			// gpx
			data += "<?xml version='1.0' encoding='ISO-8859-1'?>\n";
			data += "<gpx version='1.1'\n";
			data += "creator='MojoTracker - http://code.google.com/p/mojotracker/'\n";
			data += "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'\n";
			data += "xmlns='http://www.topografix.com/GPX/1/1'\n";
			data += "xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'>\n";
			data += "<trk>\n<name>" + name + "</name>\n<trkseg>\n";
			for (var i = 0; i < result.rows.length; i++) {
				try {
					var row = result.rows.item(i);
					data += "<trkpt lat='" + row.lat + "' lon='" + row.lon + "'>\n";
					data += "\t<time>" + row.time + "</time>\n";
					data += ((row.altitude) && (row.altitude != "null"))?"\t<ele>" + row.altitude + "</ele>\n"                : "";
					data += (row.velocity>=0) ? "\t<speed>" +row.velocity+ "</speed>\n"         : "";
					data += (row.horizAccuracy>0)?"\t<hdop>" + row.horizAccuracy + "</hdop>\n"  : "";
					data += (row.vertAccuracy>0)?"\t<vdop>" + row.vertAccuracy + "</vdop>\n"    : "";
					data += "</trkpt>\n";
					
					if (i % 10 == 0){
						callback.progress(i, result.rows.length, "building xml data ("+i+")...");
					}
				} catch (e) {
					Mojo.Log.error("Error 1");
					Mojo.Log.error("Error 1: "+e);
				}
			}
			data += "</trkseg>\n</trk>\n";
			data += "</gpx>\n";

			name = name+".gpx";
		}

        callback.progress(1,1, "xml data built...");

        setTimeout(this.writeGPXFile.bind(this), 500,
                   controller, name, data,
                   callback, 0);
    } catch (e) {
        Mojo.Log.error(e);
        callback.errorHandler("Error 2: "+e);
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
    
    if (largeFile && Config.getInstance().splitExportFiles()){
        from = 0;
        fileName = name +"."+this.fillZeros(((offset / limit)+1));
    }else{
        from = offset;
        fileName = name ;
    }
    callback.progress(offset, content.length, "Saving data ("+offset+" / "+content.length+")...");
    
    try {  
        controller.serviceRequest('palm://ca.canucksoftware.filemgr', {
            method: 'write',
            parameters: {
                    file: "/media/internal/" + fileName,
                    str: content.substr(offset, limit),
                    offset: from
            },
            onSuccess: function(){
                //offset += limit;
                if ((content.length - offset)> limit) {
                    //this.writeGPXFile(controller, name,  content.substr(limit), errorHandler, successHandler, offset+limit);
                    setTimeout(this.writeGPXFile.bind(this), 500,
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


