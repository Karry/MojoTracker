
function Config(){
    // get config cookies or define it as default
    this.unitsCookie = new Mojo.Model.Cookie('units');
    this.units = this.unitsCookie.get();
    if (this.units === undefined)
        this.setUnits(Config.METRIC_UNITS);
    
    this.splitExportFileCookie = new Mojo.Model.Cookie( 'splitExportFile' );
    this.splitExportFile = this.splitExportFileCookie.get();
    if (this.splitExportFile === undefined)
        this.setSplitExportFiles( true );
        
    this.posFormatCookie = new Mojo.Model.Cookie( 'posFormat' );
    this.posFormat = this.posFormatCookie.get();
    if (this.posFormat === undefined)
        this.setPosFormat(Config.DEFAULT_POS_FORMAT);
		
		
    this.formatCookie = new Mojo.Model.Cookie( 'exportFormat' );
    this.exportFormat = this.formatCookie.get();
    if (this.exportFormat === undefined)
        this.setExportFormat(Config.DEFAULT_EXPORT_FORMAT);		
		
    // TODO: make this variable configurable
    this.maxHorizAccuracy = 30;
    this.maxVertAccuracy = 50;
    this.updateTimeout = 30; // in second
    this.ignoredCount = 7; // num. of nodes at beginning for skip
    this.maxGraphSpace = 3*60; // [seconds], maximum space between continuous graph values
}

Config.instance = null;

Config.getInstance = function(){
    if (!this.instance)
        this.instance = new Config();
    return this.instance;
};

Config.METRIC_UNITS = 0;
Config.IMPERIAL_UNITS = 1;

Config.DEFAULT_EXPORT_FORMAT = "gpx"; 

Config.DEFAULT_POS_FORMAT = 0;
Config.GEOCACHING_POS_FORMAT = 1;
Config.DEGREES_POS_FORMAT = 2;

Config.prototype.splitExportFiles = function(){
    return this.splitExportFile;
}

Config.prototype.getMaxGraphSpace = function(){
    return this.maxGraphSpace;
}

Config.prototype.setSplitExportFiles = function( b ){
    this.splitExportFile = b;
    this.splitExportFileCookie.put(b);
}

Config.prototype.setPosFormat = function(format){
    this.posFormat = format;
    this.posFormatCookie.put(format);
}

Config.prototype.getPosFormat = function(){
    return this.posFormat;
}

Config.prototype.getIgnoredCount = function(){
    return this.ignoredCount;
}

Config.prototype.getUpdateTimeout = function(){
    return this.updateTimeout;
}

Config.prototype.setUnits = function( units ){
    this.units = units;
    this.unitsCookie.put( units );
}

Config.prototype.getUnits = function(){
    return this.units;
}

Config.prototype.userVelocity = function(velocityMPS){
    if (velocityMPS == null || velocityMPS<0)
        return "?";
    
    if (this.units == Config.IMPERIAL_UNITS){
        /* FIXME: I'am not sure that it is right */
        return (velocityMPS * 2.237).toFixed(0)+" MPH";
    }
    if (this.units == Config.METRIC_UNITS){
        return (velocityMPS * 3.6).toFixed(0)+" km/h";
    }
    return velocityMPS+ " m/s";
}


Config.prototype.userSmallDistance = function(distanceM, canNegative){
    if ((distanceM == null) || ((distanceM < 0) && (!canNegative)))
        return "?";
    
    if (this.units == Config.IMPERIAL_UNITS){
        /* FIXME: I'am not sure that it is right */
        return (distanceM * 3.2808).toFixed(0)+" ft";
    }
    if (this.units == Config.METRIC_UNITS){
        return (distanceM * 1.0).toFixed(0)+" m";
    }
    return distanceM+" m";
}

Config.prototype.getMaxVertAccuracy = function(){
    return this.maxVertAccuracy;
}

Config.prototype.getMaxHorizAccuracy = function(){
    return this.maxHorizAccuracy;
}

Config.prototype.userDistance = function(distanceM, canNegative){
    if ((distanceM == null) || ((distanceM < 0) && (!canNegative)))
        return "?";
    
    if (this.units == Config.METRIC_UNITS){        
            tmp = (distanceM / 1000);
            return (tmp >= 10? tmp.toFixed(0): tmp.toFixed(1))+" km";
    }
    if (this.units == Config.IMPERIAL_UNITS){
            /* FIXME: I'am not sure that it is right */
            tmp = (distanceM / 1609.344);
            return (tmp >= 10? tmp.toFixed(0): tmp.toFixed(1))+" miles";
    }
    
    return distanceM+" m";    
}

Config.prototype.formatDateTime = function(dateobj){
    // FIXME: add support for locale, or configurable format
	strRes = "NA";
	secs = dateobj.getSeconds(); if (secs > 9) strSecs = String(secs); else strSecs = "0" + String(secs);
	mins = dateobj.getMinutes(); if (mins > 9) strMins = String(mins); else strMins = "0" + String(mins);
	hrs  = dateobj.getHours(); if (hrs > 9) strHrs = String(hrs); else strHrs = "0" + String(hrs);
	day  = dateobj.getDate(); if (day > 9) strDays = String(day); else strDays = "0" + String(day);
	mnth = dateobj.getMonth() + 1; if (mnth > 9) strMnth = String(mnth); else strMnth = "0" + String(mnth);
	yr   = dateobj.getFullYear(); strYr = String(yr);
    
    return strDays + "/" + strMnth + "/" + strYr + " " + strHrs + ":" + strMins + ":" + strSecs;    
}

Config.prototype.formatTime = function(dateobj, shortFormat){
    // FIXME: add support for locale, or configurable format
	strRes = "NA";
	secs = dateobj.getSeconds(); if (secs > 9) strSecs = String(secs); else strSecs = "0" + String(secs);
	mins = dateobj.getMinutes(); if (mins > 9) strMins = String(mins); else strMins = "0" + String(mins);
	hrs  = dateobj.getHours(); if (hrs > 9) strHrs = String(hrs); else strHrs = "0" + String(hrs);
    
    return shortFormat? (strHrs + ":" + strMins) :
            (strHrs + ":" + strMins + ":" + strSecs);
}

Config.prototype.generageXAxis = function( minTime, maxTime ){
    result = new Array();
    length = maxTime - minTime;
    align = 5*60*1000; // 5 minutes
    maxLines = 6;
    if (length / align > maxLines) align =    10*60*1000;
    if (length / align > maxLines) align =    15*60*1000;
    if (length / align > maxLines) align =    30*60*1000;
    if (length / align > maxLines) align = 1* 60*60*1000;
    
    dateobj = new Date(minTime);
    startOfDay = Date.parse( dateobj.getFullYear() + '-' + dateobj.getMonth() + '-' + dateobj.getDate() + ' 0:00' );
    alignedStart = minTime + ( align - ((minTime - startOfDay) % align));
    
    var i = 0;
    for (time = alignedStart; time < maxTime ; time += align){
        result[ i++ ] = {
            time : time,
            label : this.formatTime( new Date(time), true)
        };  
    }

    return result; 
}

Config.prototype.generageYAxis = function(min, max, unitMultiply, unit){
    result = new Array();
    range = max - min;
    align = 1 / unitMultiply;
    maxLines = 9;
    alignArr = new Array(2,5,10,20,25,50,100,150,200,250,500,1000);
    for ( var i = 0 ; (i < alignArr.length) && (range / align > maxLines) ; i++){
        align =  alignArr[i] / unitMultiply;
    }

    alignedStart = (min % align == 0)? min : min + ( align - (min % align));
    var i = 0;
    for (val = alignedStart; val < max ; val += align){
        result[ i++ ] = {
            value : val,
            label : (val * unitMultiply).toFixed(0) // + unit
        };  
    }
    
    return result;
}

Config.prototype.generageAltitudeAxis = function(min, max){
    unit = "m";
    unitMultiply = 1;
    
    if (this.units == Config.IMPERIAL_UNITS){
        unitMultiply = 3.2808;
        unit = "ft";
    }
    return this.generageYAxis(min, max, unitMultiply, unit);
}

Config.prototype.generageSpeedAxis = function(min, max){
    restVal = 1;
    unit = "m/s";
    
    if (this.units == Config.IMPERIAL_UNITS){
        unitMultiply = 2.237;
        unit = "MPH";
    }
    if (this.units == Config.METRIC_UNITS){
        unitMultiply = 3.6;
        unit = "km/h";
    }
    
    return this.generageYAxis(min, max, unitMultiply, unit);
}

Config.prototype.userDegree = function(degree){
    minutes = (degree - Math.floor(degree)) * 60;
    seconds = (minutes - Math.floor(minutes )) * 60;
    return Math.floor(degree) + "°"
        + (minutes<10?"0":"") + Math.floor(minutes) + "'"
        + (seconds<10?"0":"") + seconds.toFixed(2) + "\"";
}

Config.prototype.userDegreeLikeGeocaching = function(degree){
    minutes = (degree - Math.floor(degree)) * 60;
    return Math.floor(degree) + "°"
        + (minutes<10?"0":"") + minutes.toFixed(3) + "'"
}

Config.prototype.userLatitude = function(degree){
    if (this.posFormat == Config.DEGREES_POS_FORMAT)
        return degree;

    if (this.posFormat == Config.GEOCACHING_POS_FORMAT)
	    return (degree>0? "N":"S") +" "+ this.userDegreeLikeGeocaching( Math.abs(degree) );

    return this.userDegree( Math.abs(degree) ) + (degree>0? "N":"S");
}

Config.prototype.userLongitude = function(degree){
    if (this.posFormat == Config.DEGREES_POS_FORMAT)
        return degree;
	
    if (this.posFormat == Config.GEOCACHING_POS_FORMAT)
	    return (degree>0? "E":"W") +" "+ this.userDegreeLikeGeocaching( Math.abs(degree) );

    return this.userDegree( Math.abs(degree) ) + (degree>0? "E":"W");
}

Config.prototype.setExportFormat = function(format){
	this.exportFormat = format;
	this.formatCookie.put( format );
}

Config.prototype.getExportFormat = function(){
	return this.exportFormat;
}

