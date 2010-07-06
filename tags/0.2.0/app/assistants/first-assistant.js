function FirstAssistant(){
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

FirstAssistant.prototype.setup = function(){
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	/* add event handlers to listen to events from widgets */
	// set the initial total and display it

    // Translate view
	this.config = Config.getInstance();
	
	$$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });	
		
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
	this.controller.listen('saveTrackToggle', Mojo.Event.propertyChanged,
                           this.handleSaveTrackHandleAction.bind(this));
	if (this.saveTrack)
		this.createNewTrack();
			    
    this.controller.listen('showMoreInfoButton', Mojo.Event.tap,
                           this.handleShowMoreButtonTap.bind(this));
	
    this.controller.listen('addWaypointButton', Mojo.Event.tap,
                            function(){
								if (this.lat && this.lon){
									this.waypointDialog = new WaypointDialogAssistant(this.controller,
																					  Mojotracker.getInstance(),
																					  Config.getInstance(),
																					  this.lat,
																					  this.lon,
																					  this.alt,
																					  this.formatDate(new Date(), 2),
																					  this.tableErrorHandler.bind(this));
										
									this.controller.showDialog({
											template: 'dialogs/waypoint-dialog',
											assistant: this.waypointDialog,
											preventCancel:false
									 });
								}
							}.bind(this));
	
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu,
	    {
		omitDefaultItems: true
	    },
	    {
		visible: true,
		items:
		[
		    { label: $L("Saved tracks"), command: "tracks" },
		    { label: $L("Preferences"), command: Mojo.Menu.prefsCmd },
		    { label: $L("About"), command: "about" }
		]
	    }
	);
	
	// listen on location tap
	this.controller.listen('location', Mojo.Event.tap, this.handleLocTap.bind(this));
	
	// Start GPS
	this.startTracking();
    
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
	this.setScreenTimeout(1);
	now = new Date();
	tracename = "G" + this.formatDate(now, 1);
	try{
		mojotracker = Mojotracker.getInstance();
		mojotracker.createTrack( tracename, this.tableErrorHandler.bind(this));
		$('statusmsg').update("Opened OSM DB. Creating table " + tracename);
		this.nullHandleCount = 0;
        
        this.showTrackInformations();	
	}catch (e){
		$('errormsg').update("DB Error: " + e);
	}
}

FirstAssistant.prototype.handleShowMoreButtonTap = function(event){
	mojotracker = Mojotracker.getInstance();
    trackName = mojotracker.getCurrentTrack();
    if (trackName){
        mojotracker.getTrackInfo( trackName,
                                this.trackInfoHandler.bind(this),
                                this.tableErrorHandler.bind(this)
                                );
    }
}

FirstAssistant.prototype.trackInfoHandler = function(transaction, results){
    if ((results.rows) && (results.rows.length == 1)){
        myItem = results.rows.item(0);
        myItem.trackLengthFormated =  Config.getInstance().userDistance( myItem.trackLength , false);
        Mojo.Controller.stageController.pushScene("info",{item: myItem});
    }else{
		this.showDialog("Error", 'DB returned bad result ['+results.rows.length+']');
    }	
}

FirstAssistant.prototype.handleLocTap = function(event){
	try{
		var locPopupModel;
		locPopupModel = [
			{label: $L('Copy to clipboard'), command: 'clipboard'},
			{label: $L('Share via SMS'), command: 'sms'},
			{label: $L('Share via email'), command: 'email'}
		];
		
		sendPosition = this.sendPosition.bind(this);
		this.controller.popupSubmenu({
			onChoose: sendPosition,
			placeNear: event.target,
			items: locPopupModel
		});
	}catch(e){
		this.showDialog("Error", Object.toJSON(e));
	}
}

FirstAssistant.prototype.closeTrack = function(){
	mojotracker = Mojotracker.getInstance();

    this.showTrackInformations();
    mojotracker.closeTrack();
	this.setScreenTimeout(2);
}

FirstAssistant.prototype.handleGpsResponse = function(event){
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
	
	this.lat = lat;
	this.lon = lon;
	this.alt = alt;
	this.horizAccuracy = horizAccuracy;
	
	// fix bad values from gps
	if (alt < -200 || (alt == 0 && vertAccuracy == 0))
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
				mojotracker.timeoutOccured( strUTC );
            }.bind(this), this.config.getUpdateTimeout() * 1000);
    
    // display compas
	compass = document.getElementById("compass");
	compass.style.display = "block";
    opacity = 0.3;
	if (event.heading > 0 ){
        /** in case, when GPS is disabled (only if GSM fix is available),
         * event.heading should be -1 and event.errorCode should be 4,
         * but it isn't... So we use this strange condition that don't
         * work if we go _directly_ to north...
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

FirstAssistant.prototype.startTracking = function(){
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
	
}

FirstAssistant.prototype.stopTracking = function(){
	this.trackingHandle.cancel();
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
	}else{
        info = document.getElementById("trackInformations");
        info.style.display = "none";        
    }
}

FirstAssistant.prototype.getMessageForGpsErrorCode = function(code){
	switch(code){
		case 0:
			return $L("Success");
		case 1:
			return $L("Timeout"); 
		case 2:
			return $L("Position unavailable"); 
		case 4:
			return $L("Only cell and wifi fixes"); // GPS_Permanent_Error (no more GPS fix in this case, but can still get the Cell and wifi fixes)
		case 5:
			return $L("Location service is OFF"); 
		case 6:
			return $L("Permission Denied"); //  - The user has not accepted the terms of use for the GPS Services.
		case 7:
			return $L("The application already has a pending message"); 
		case 8:
			return $L("The application has been temporarily blacklisted.");		
		case 3: 
		default:
			return $L("Unknown (#{code})").interpolate({code:code});
	}
}

FirstAssistant.prototype.handleGpsResponseError = function(event)
{
	$('statusmsg').innerHTML = "A GPS Error occurred: " + this.getMessageForGpsErrorCode(event.errorCode);
}

FirstAssistant.prototype.tableErrorHandler = function(transaction, error) 
{
	$('errormsg').update('table Error was ' + error.message + ' (Code ' + error.code + ')'); 
	return true;
}

/**
 * The activity’s expected duration is provided in milliseconds
 * and cannot exceed 900,000 milliseconds (15 minutes).
 * The power management service automatically terminates your activity
 * request at the end of its duration or 15 minutes, whichever is shorter.
 */
FirstAssistant.prototype.setScreenTimeout = function(stop){
	appID = 'com.osm.mojotracker-1';
	if (stop == 1){
		this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
		                               {
		                                  method: 'activityStart',	
		                                  parameters:
									      {
			                                 id: appID, 
		                                     duration_ms: '900000' // MAX DURATION IS 15 MINUTES
		                                  },
		                                  onSuccess: this.activitySuccess.bind(this),
		                                  onFailure: this.activityFailed.bind(this)
	                                   }  );
		
		// reset activity each 10 minutes
		this.activityTimeout = setTimeout( function(){
				// reset tracking, it sometimes stops work
				this.stopTracking();
				this.startTracking();
                this.setScreenTimeout(2);
                this.setScreenTimeout(1);
            }.bind(this), 10 * 60 * 1000);
		
	}
	if (stop == 2){
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
    if (this.activityTimeout)
        clearTimeout( this.activityTimeout );
		
	}
}

FirstAssistant.prototype.activitySuccess = function(){
}

FirstAssistant.prototype.activityFailed = function(){
	this.showDialog("Error", 'Screen Power Error');
	$('statusmsg').update('Screen Power Error'); 
}

FirstAssistant.prototype.activate = function(event){
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}

FirstAssistant.prototype.deactivate = function(event){
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FirstAssistant.prototype.cleanup = function(event){
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.stopTracking();
	this.closeTrack();
}

FirstAssistant.prototype.sendPosition = function(method){
	
	msg = this.config.userLatitude( this.lat ) + " "
		+ this.config.userLongitude( this.lon ) +" (+-"
		+ this.config.userSmallDistance(this.horizAccuracy, false) +")";
		
	if (method == "sms"){
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method:'open',
			parameters: {
				id: 'com.palm.app.messaging',
				params: {
					messageText: msg
				}
			}
		});
	}
	if (method == "email"){
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
                method: 'launch',
                parameters:  {
                    id: 'com.palm.app.email',
                    params: {
                        summary: 'My current possition',
                        text: msg
                    }
                }
            });
	}
	if (method == "clipboard"){
		Mojo.Controller.stageController.setClipboard(msg);	
	}
}

FirstAssistant.prototype.formatDate = function(dateobj, formattype)
{
    this.config = Config.getInstance();
        
	strRes = "NA";
	secs = dateobj.getSeconds(); if (secs > 9) strSecs = String(secs); else strSecs = "0" + String(secs);
	mins = dateobj.getMinutes(); if (mins > 9) strMins = String(mins); else strMins = "0" + String(mins);
	hrs  = dateobj.getHours(); if (hrs > 9) strHrs = String(hrs); else strHrs = "0" + String(hrs);
	day  = dateobj.getDate(); if (day > 9) strDays = String(day); else strDays = "0" + String(day);
	mnth = dateobj.getMonth() + 1; if (mnth > 9) strMnth = String(mnth); else strMnth = "0" + String(mnth);
	yr   = dateobj.getFullYear(); strYr = String(yr);
    //strRes = strDays + "/" + strMnth + "/" + strYr + " " + strHrs + ":" + strMins + ":" + strSecs;
	
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
        strRes = this.config.formatDateTime(dateobj);
	}
	return strRes
}

FirstAssistant.prototype.showDialog = function(title, message){

    uncancellableAlertAttributes = {
        //	preventCancel
        // requires the user to push a button to close the dialog, instead of being about to cancel out
        preventCancel:false,
        onChoose: function(value) {
                    //this.outputDisplay.innerHTML = $L("Alert result = ") + value;
            },
        title: title,
        message: message,
        choices:[
            {label: $L('Ok'), value:'dismissed', type:'color'}
        ]
    };

    this.controller.showAlertDialog(uncancellableAlertAttributes);
}