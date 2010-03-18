
function Config(){
    /* FIXME: load this config from cookies */ 
    this.velocityUnits = Config.METRIC;
    this.distanceUnits = Config.METRIC;
}

Config.instance = null;

Config.getInstance = function(){
    if (!this.instance)
        this.instance = new Config();
    return this.instance;
};

Config.METRIC = 0;
Config.IMPERIAL = 1;

Config.prototype.userVelocity = function(velocityMPS){
    if (velocityMPS<0)
        return "?";
    
    switch(this.velocityUnits){
        case Config.IMPERIAL:
            /* FIXME: I'am not sure that it is right */
            return (velocityMPS * 2.237).toFixed(0)+" MPH";
        case Config.METRIC:
        default:
            return (velocityMPS * 3.6).toFixed(0)+" km/h";
    }
}


Config.prototype.userSmallDistance = function(distanceM, canNegative){
    if ((distanceM < 0) && (!canNegative))
        return "?";
    
    switch(this.distanceUnits){
        case Config.IMPERIAL:
            /* FIXME: I'am not sure that it is right */
            return (distanceM * 3.2808).toFixed(0)+" ft";
        case Config.METRIC:
        default:
            return (distanceM * 1.0).toFixed(0)+" m";
    }
}

Config.prototype.userDegree = function(degree){
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

