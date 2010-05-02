
function Config(){
    // get config cookies or define it as default
    this.unitsCookie = new Mojo.Model.Cookie('units');
    this.units = this.unitsCookie.get();
    if (this.units === undefined)
        this.setUnits(Config.METRIC_UNITS);
    
    this.splitExportFileCookie = new Mojo.Model.Cookie( 'splitExportFile' );
    this.splitExportFile = this.splitExportFileCookie.get();
    if (this.splitExportFile === undefined)
        this.setSplitExportFiles( false );
        
    this.posFormatCookie = new Mojo.Model.Cookie( 'posFormat' );
    this.posFormat = this.posFormatCookie.get();
    if (this.posFormat === undefined)
        this.setPosFormat(Config.DEFAULT_POS_FORMAT);
        
    // TODO: make this variable configurable
    this.maxHorizAccuracy = 30;
    this.maxVertAccuracy = 50;
    this.updateTimeout = 30; // in second
    this.ignoredCount = 7; // num. of nodes at beginning for skip
}

Config.instance = null;

Config.getInstance = function(){
    if (!this.instance)
        this.instance = new Config();
    return this.instance;
};

Config.METRIC_UNITS = 0;
Config.IMPERIAL_UNITS = 1;

Config.DEFAULT_POS_FORMAT = 0;
Config.DEGREES_POS_FORMAT = 1;

Config.prototype.splitExportFiles = function(){
    return this.splitExportFile;
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
    // FIXME: add support locale, or configurable format
	strRes = "NA";
	secs = dateobj.getSeconds(); if (secs > 9) strSecs = String(secs); else strSecs = "0" + String(secs);
	mins = dateobj.getMinutes(); if (mins > 9) strMins = String(mins); else strMins = "0" + String(mins);
	hrs  = dateobj.getHours(); if (hrs > 9) strHrs = String(hrs); else strHrs = "0" + String(hrs);
	day  = dateobj.getDate(); if (day > 9) strDays = String(day); else strDays = "0" + String(day);
	mnth = dateobj.getMonth() + 1; if (mnth > 9) strMnth = String(mnth); else strMnth = "0" + String(mnth);
	yr   = dateobj.getFullYear(); strYr = String(yr);
    
    return strDays + "/" + strMnth + "/" + strYr + " " + strHrs + ":" + strMins + ":" + strSecs;    
}

Config.prototype.userDegree = function(degree){
    minutes = (degree - Math.floor(degree)) * 60;
    seconds = (minutes - Math.floor(minutes )) * 60;
    return Math.floor(degree) + "°"
        + (minutes<10?"0":"") + Math.floor(minutes) + "'"
        + (seconds<10?"0":"") + seconds.toFixed(2) + "\"";
}

Config.prototype.userLatitude = function(degree){
    if (this.posFormat == Config.DEGREES_POS_FORMAT)
        return degree;

    return this.userDegree( Math.abs(degree) ) + (degree>0? "N":"S");
}

Config.prototype.userLongitude = function(degree){
    if (this.posFormat == Config.DEGREES_POS_FORMAT)
        return degree;

    return this.userDegree( Math.abs(degree) ) + (degree>0? "E":"W");
}

