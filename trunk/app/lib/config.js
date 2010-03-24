
function Config(){
    /* FIXME: load this config from cookies */ 
    this.units = Config.METRIC;
    
    this.splitExportFile = true;
    
    this.maxHorizAccuracy = 100;
    this.maxVertAccuracy = 100;
    
    this.posFormat = Config.DEFAULT;
}

Config.instance = null;

Config.getInstance = function(){
    if (!this.instance)
        this.instance = new Config();
    return this.instance;
};

Config.METRIC = 0;
Config.IMPERIAL = 1;

Config.DEFAULT = 0;
Config.DEGREES = 1;

Config.prototype.splitExportFiles = function(){
    return this.splitExportFile;
}

Config.prototype.setSplitExportFiles = function( b ){
    // FIXME: save this value to cookie
    this.splitExportFile = b;
}

Config.prototype.setPosFormat = function(format){
    this.posFormat = format;
}

Config.prototype.getPosFormat = function(){
    return this.posFormat;
}

Config.prototype.setUnits = function( units ){
    // FIXME: save this values to cookie
    this.units = units;
    Mojo.Log.info("units: "+this.units);
}

Config.prototype.getUnits = function(){
    return this.units;
}

Config.prototype.userVelocity = function(velocityMPS){
    if (velocityMPS == null || velocityMPS<0)
        return "?";
    
    if (this.units == Config.IMPERIAL){
        /* FIXME: I'am not sure that it is right */
        return (velocityMPS * 2.237).toFixed(0)+" MPH";
    }
    if (this.units == Config.METRIC){
        return (velocityMPS * 3.6).toFixed(0)+" km/h";
    }
    return velocityMPS+ " m/s";
}


Config.prototype.userSmallDistance = function(distanceM, canNegative){
    if ((distanceM == null) || ((distanceM < 0) && (!canNegative)))
        return "?";
    
    if (this.units == Config.IMPERIAL){
        /* FIXME: I'am not sure that it is right */
        return (distanceM * 3.2808).toFixed(0)+" ft";
    }
    if (this.units == Config.METRIC){
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
    
    if (this.units == Config.METRIC){        
            tmp = (distanceM / 1000);
            return (tmp >= 10? tmp.toFixed(0): tmp.toFixed(1))+" km";
    }
    if (this.units == Config.IMPERIAL){
            /* FIXME: I'am not sure that it is right */
            tmp = (distanceM / 1609.344);
            return (tmp >= 10? tmp.toFixed(0): tmp.toFixed(1))+" miles";
    }
    
    return distanceM+" m";    
}

Config.prototype.userDegree = function(degree){
    if (this.posFormat == Config.DEGREES)
        return degree;
    
    minutes = (degree - Math.floor(degree)) * 60;
    seconds = (minutes - Math.floor(minutes )) * 60;
    return Math.floor(degree) + "°"
        + (minutes<10?"0":"") + Math.floor(minutes) + "'"
        + (seconds<10?"0":"") + seconds.toFixed(2) + "\"";
}

Config.prototype.userLatitude = function(degree){
    return this.userDegree( Math.abs(degree) ) + (degree>0? "N":"S");
}

Config.prototype.userLongitude = function(degree){
    return this.userDegree( Math.abs(degree) ) + (degree>0? "E":"W");
}

