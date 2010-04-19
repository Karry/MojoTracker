function FirstAssistant()
{
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

FirstAssistant.prototype.setup = function()
{
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	/* add event handlers to listen to events from widgets */
	// set the initial total and display it

	this.config = Config.getInstance();
		
	// TODO: add ability start tracking automaticaly
	this.saveTrack = false;
			    
	//	Setup Toggles
	this.controller.setupWidget('saveTrackToggle', {
			modelProperty: "value"
		},
		{
			value: this.saveTrack,
			disabled: false 
		});
	this.controller.listen('saveTrackToggle', Mojo.Event.propertyChanged, this.handleSaveTrackHandleAction.bind(this));
	if (this.saveTrack)
		this.createNewTrack();
			    
	
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu,
	    {
		omitDefaultItems: true
	    },
	    {
		visible: true,
		items:
		[
		    { label: "Saved tracks", command: "tracks" },
		    { label: "Preferences", command: Mojo.Menu.prefsCmd },
		    { label: "About", command: "about" }
		]
	    }
	);
	
	this.setScreenTimeout(1);
	// Start GPS
	this.trackingHandle = this.controller.serviceRequest('palm://com.palm.location',
							     {
							      method : 'startTracking',
							      parameters: {
									   accuracy: 1, 
									   maximumAge: 1,
									   responseTime: 1,
									   subscribe: true
									  },
							      onSuccess: this.handleGpsResponse.bind(this),
							      onFailure: this.handleGpsResponseError.bind(this)
							     } );
    
    this.rot = 0;
    //setTimeout(this.testCompas.bind(this), 100);
}


/** debug function for compas rotation...
    combine opacity and rotate transform causes strange portraying */
FirstAssistant.prototype.testCompas = function(){
    this.rot +=2;
    if (this.rot >= 360)
        this.rot = 0;
    compass = document.getElementById("compass");
    compass.style.webkitTransform = "rotate(" + (this.rot) + "deg)";
    //compass.style.MozTransform = "rotate(" + this.rot + "deg)";
    compass.style.opacity = 1;
    //compass.style.border = "1px solid red";

    $('statusmsg').innerHTML = this.rot;

    setTimeout(this.testCompas.bind(this), 100);    
}

FirstAssistant.prototype.handleSaveTrackHandleAction = function(event){
	
	this.saveTrack = event.value;
	if (this.saveTrack){
		this.createNewTrack();
	}else{
		this.closeTrack();
	}
}

FirstAssistant.prototype.createNewTrack = function(){
	now = new Date();
	tracename = "G" + this.formatDate(now, 1);
	try{
		mojotracker = Mojotracker.getInstance();
		mojotracker.createTrack( tracename, this.tableErrorHandler.bind(this));
		$('statusmsg').update("Opened OSM DB. Creating table " + tracename);
		this.nullHandleCount = 0;
        
        this.showTrackInformations();	
	}catch (e){
		$('statusmsg').update("DB Error: " + e);
	}	
}

FirstAssistant.prototype.closeTrack = function(){
	mojotracker = Mojotracker.getInstance();

    this.showTrackInformations();
    mojotracker.closeTrack();
}

FirstAssistant.prototype.handleGpsResponse = function(event)
{
	mojotracker = Mojotracker.getInstance();

	// Display GPS data, log to Db
	now = new Date();
	velocity = event.velocity;
	lat = event.latitude.toFixed(6);
	lon = event.longitude.toFixed(6);
	alt = event.altitude;
	strUTC = this.formatDate(now, 2);
	horizAccuracy = event.horizAccuracy.toFixed(0);
	vertAccuracy = event.vertAccuracy.toFixed(0);
	direction = event.heading.toFixed(0);
	
	// fix bad values from gps
	if (alt < -200)
		alt = null;

    // save values to DB	
	if (this.saveTrack)
		mojotracker.addNode( lat, lon, alt, strUTC, velocity, horizAccuracy, vertAccuracy, this.tableErrorHandler.bind(this) );

    // display values
	$('latitude').innerHTML 	= this.config.userLatitude( lat );
	$('longitude').innerHTML 	= this.config.userLongitude( lon );
	$('horizAccuracy').innerHTML= this.config.userSmallDistance(horizAccuracy, false);
	$('speed').innerHTML 		= this.config.userVelocity(velocity);
	$('altitude').innerHTML 	= this.config.userSmallDistance(alt, true);
	$('vertAccuracy').innerHTML = this.config.userSmallDistance(vertAccuracy, false);
	$('lastUpdate').innerHTML 	= this.formatDate(now, 3);

    this.showTrackInformations();	
    
    // display accuracy red, when it is high
    vertAccuracyElement = document.getElementById("vertAccuracy");
    vertAccuracyElement.style.color = vertAccuracy > this.config.getMaxVertAccuracy() ?
            "rgba(200, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)";
            
    horizAccuracyElement = document.getElementById("horizAccuracy");
    horizAccuracyElement.style.color = horizAccuracy > this.config.getMaxHorizAccuracy() ?
            "rgba(200, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)";
	
    // reset update timeout 
    if (this.updateTimeout)
        clearTimeout( this.updateTimeout );
    lastUpdateElement = document.getElementById("lastUpdate");
    lastUpdateElement.style.color = "rgba(0, 0, 0, 0.5)";
    this.updateTimeout = setTimeout( function(){
                lastUpdateElement = document.getElementById("lastUpdate");
                lastUpdateElement.style.color = "rgba(200, 0, 0, 0.7)" ;
            }, this.config.getUpdateTimeout() * 1000);
    
    // display compas
	compass = document.getElementById("compass");
	compass.style.display = "block";
    opacity = 0.3;
	if (event.heading > 0 ){
        /** in case, when GPS is disabled (only if GSM fix is available),
         * event.heading should be -1 and event.errorCode should be 4,
         * but it isn't... So we use this strange condition...
         */
        opacity = 1; // 0.8
		var rot = 360 - direction;
		//compass.style.MozTransform = "rotate(" + rot + "deg)";
		compass.style.webkitTransform = "rotate(" + rot + "deg)";
	}    
	compass.style.opacity = opacity;
	
	if (event.errorCode != 0)
		$('statusmsg').innerHTML = "GPS warning: " + this.getMessageForGpsErrorCode( event.errorCode );
    else
    	$('statusmsg').innerHTML = "";
        
    // for debug...
    //$('statusmsg').innerHTML = event.heading +", " + event.errorCode;

	this.nullHandleCount = 0;	
}

FirstAssistant.prototype.showTrackInformations = function(){
	if (this.saveTrack){
        info = document.getElementById("trackInformations");
        info.style.display = "block";
        
        mojotracker = Mojotracker.getInstance();
		$('minAltitude').innerHTML 	= this.config.userSmallDistance(mojotracker.getMinAltitude(), true);
		$('maxAltitude').innerHTML 	= this.config.userSmallDistance(mojotracker.getMaxAltitude(), true);
		
		$('maxSpeed').innerHTML 	= this.config.userVelocity(mojotracker.getMaxVelocity());
		$('trackLength').innerHTML 	= this.config.userDistance( mojotracker.getTrackLength(), false);
		$('tracknum').innerHTML 	= mojotracker.getNodes();
		$('currentTrack').innerHTML = mojotracker.getCurrentTrack();
	}    
}

FirstAssistant.prototype.getMessageForGpsErrorCode = function(code){
	switch(code){
		case 0:
			return "Success";
		case 1:
			return "Timeout"; 
		case 2:
			return "Position unavailable"; 
		case 4:
			return "Only cell and wifi fixes"; // GPS_Permanent_Error (no more GPS fix in this case, but can still get the Cell and wifi fixes)
		case 5:
			return "Location service is OFF"; 
		case 6:
			return "Permission Denied"; //  - The user has not accepted the terms of use for the GPS Services.
		case 7:
			return "The application already has a pending message"; 
		case 8:
			return "The application has been temporarily blacklisted.";		
		case 3: 
		default:
			return "Unknown ("+code+")";
	}
}

FirstAssistant.prototype.handleGpsResponseError = function(event)
{
	$('statusmsg').innerHTML = "A GPS Error occurred: " + this.getMessageForGpsErrorCode(event.errorCode);
}

FirstAssistant.prototype.tableErrorHandler = function(transaction, error) 
{
	$('statusmsg').update('table Error was ' + error.message + ' (Code ' + error.code + ')'); 
	return true;
}

FirstAssistant.prototype.setScreenTimeout = function(stop)
{
	appID = 'com.osm.mojotracker-1';
	if (stop == 1)
	{
		this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
		                               {
		                                  method: 'activityStart',	
		                                  parameters:
									      {
			                                 id: appID, 
		                                     duration_ms: '900000' //8 hours
		                                  },
		                                  onSuccess: this.activitySuccess.bind(this),
		                                  onFailure: this.activityFailed.bind(this)
	                                   }  );
	}
	if (stop == 2)
	{
		this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
		                               {
		                                  method: 'activityEnd',	
		                                  parameters:
										  {
		                                      id: appID
		                                  },
		                                  onSuccess: this.activitySuccess.bind(this),
		                                  onFailure: this.activityFailed.bind(this)
	                                   }   );
	}
}

FirstAssistant.prototype.activitySuccess = function()
{
}

FirstAssistant.prototype.activityFailed = function()
{
	$('statusmsg').update('Screen Power Error'); 
}

FirstAssistant.prototype.activate = function(event)
{
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}

FirstAssistant.prototype.deactivate = function(event)
{
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FirstAssistant.prototype.cleanup = function(event)
{
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.trackingHandle.cancel();
	this.closeTrack();
	this.setScreenTimeout(2);
}

FirstAssistant.prototype.formatDate = function(dateobj, formattype)
{
	strRes = "NA";
	secs = dateobj.getSeconds(); if (secs > 9) strSecs = String(secs); else strSecs = "0" + String(secs);
	mins = dateobj.getMinutes(); if (mins > 9) strMins = String(mins); else strMins = "0" + String(mins);
	hrs  = dateobj.getHours(); if (hrs > 9) strHrs = String(hrs); else strHrs = "0" + String(hrs);
	day  = dateobj.getDate(); if (day > 9) strDays = String(day); else strDays = "0" + String(day);
	mnth = dateobj.getMonth() + 1; if (mnth > 9) strMnth = String(mnth); else strMnth = "0" + String(mnth);
	yr   = dateobj.getFullYear(); strYr = String(yr);
	
	if (formattype == 1) // filename
	{
		strRes = strYr + strMnth + strDays + "-" + strHrs + strMins + strSecs;
	}
	if (formattype == 2) // GPX
	{
		strRes = strYr + "-" + strMnth + "-" + strDays + "T" + strHrs + ":" + strMins + ":" + strSecs + "Z";
	}
	if (formattype == 3) // Display Time
	{
		strRes = strDays + "/" + strMnth + "/" + strYr + " " + strHrs + ":" + strMins + ":" + strSecs;
	}
	return strRes
}
