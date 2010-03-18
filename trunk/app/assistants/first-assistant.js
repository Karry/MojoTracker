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

	$('messagearea').innerHTML = "Latitude: 0, Longitude: 0";
	
	// a local object for button attributes    
	this.buttonAttributes = {};
	
	// Start button model    
	this.StartbuttonModel = {
	                    buttonLabel : 'Start GPS',
	                    buttonClass : 'affirmative',
	                    disabled : false };
	// set up the button, bind the button to its handler
	this.controller.setupWidget("btnStart", this.buttonAttributes, this.StartbuttonModel);
	this.controller.listen(this.controller.get('btnStart'),
	                  Mojo.Event.tap,
					  this.handleStartButtonPress.bind(this));
	
	// Stop button model    
	this.StopbuttonModel = {
	                    buttonLabel : 'Stop GPS',
	                    buttonClass : 'affirmative',
	                    disabled : true };
	// set up the button, bind the button to its handler
	this.controller.setupWidget("btnStop", this.buttonAttributes, this.StopbuttonModel);
	this.controller.listen(this.controller.get('btnStop'),
	                  Mojo.Event.tap,
					  this.handleStopButtonPress.bind(this));
	
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu,
	    {
		omitDefaultItems: false
	    },
	    {
		visible: true,
		items:
		[
		    { label: "Saved tracks", command: "tracks" },
		    { label: "About", command: "about" }
		]
	    }
	);
	

}

FirstAssistant.prototype.handleStartButtonPress = function(event)
{
	// increment the total and update the display
	now = new Date();
	$('messagearea').innerHTML = "Activating GPS...";
	this.StartbuttonModel.disabled = true;
	this.controller.modelChanged(this.StartbuttonModel);
	this.StopbuttonModel.disabled = false;
	this.controller.modelChanged(this.StopbuttonModel);	

	tracename = "G" + this.formatDate(now, 1);
	try{
		mojotracker = Mojotracker.getInstance();
		mojotracker.createTrack( tracename, this.tableErrorHandler.bind(this));
		$('headermsg').update("Opened OSM DB. Creating table " + tracename);
		this.nullHandleCount = 0;
	}catch (e){
		$('headermsg').update("DB Error: " + e);
	}    
	
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
}

FirstAssistant.prototype.handleStopButtonPress = function(event)
{
	mojotracker = Mojotracker.getInstance();
	nodes = mojotracker.getNodes();
	mojotracker.closeTrack();

	// increment the total and update the display
	$('messagearea').innerHTML = "Deactivated GPS";
	this.controller.get("headermsg").update("Num of nodes: " + nodes);
	this.trackingHandle.cancel();
	this.StartbuttonModel.disabled = false;
	this.controller.modelChanged(this.StartbuttonModel);
	this.StopbuttonModel.disabled = true;
	this.controller.modelChanged(this.StopbuttonModel);		
}

FirstAssistant.prototype.handleGpsResponse = function(event)
{
	mojotracker = Mojotracker.getInstance();
	// obj = new GPShelper(event.latitude,event.longitude,event.altitude,event.errorCode,event.heading,event.horizAccuracy,event.vertAccuracy,event.velocity,event.timestamp);
	// Display GPS data, log to Db
	now = new Date();
	velocity = event.velocity;
	lat = event.latitude.toFixed(6);
	lon = event.longitude.toFixed(6);
	alt = event.altitude.toFixed(0);
	strUTC = this.formatDate(now, 2);
	horizAccuracy = event.horizAccuracy.toFixed(0);
	vertAccuracy = event.vertAccuracy.toFixed(0);
	
	$('messagearea').innerHTML 	= "GPS Operating...";

	$('latitude').innerHTML 	= "Latitude: " 			+ this.config.userLatitude( lat );
	$('longitude').innerHTML 	= "Longitude: " 		+ this.config.userLongitude( lon );
	$('horizAccuracy').innerHTML 	= "Horizontal accuracy: " 	+ this.config.userSmallDistance(horizAccuracy, false);
	$('speed').innerHTML 		= "Speed: " 			+ this.config.userVelocity(velocity);

	$('altitude').innerHTML 	= "Altitude: " 			+ this.config.userSmallDistance(alt, true);
	$('vertAccuracy').innerHTML 	= "Vertical accuracy: " 	+ this.config.userSmallDistance(vertAccuracy, false);
	
	$('tracknum').innerHTML 	= "No. of nodes: " 		+ mojotracker.getNodes();
	$('headermsg').innerHTML 	= "Last update: "		+ this.formatDate(now, 3);
	
	direction = event.heading.toFixed(0);
	compass = document.getElementById("compass");
	compass.style.display = "block";
	compass.style.MozTransform = "rotate(" + direction + "deg)";
	compass.style.webkitTransform = "rotate(" + direction + "deg)";	    
		
	if (event.errorCode != 0)
		$('headermsg').innerHTML = "GPS warning: " + event.errorCode;
	this.nullHandleCount = 0;
	
	mojotracker.addNode( lat, lon, alt, strUTC, velocity, horizAccuracy, vertAccuracy, this.tableErrorHandler.bind(this) );
	
}

FirstAssistant.prototype.handleGpsResponseError = function(event)
{
	$('headermsg').innerHTML = "A GPS Error occurred:" + Object.toJSON(event);
}

FirstAssistant.prototype.tableErrorHandler = function(transaction, error) 
{
	$('headermsg').update('table Error was ' + error.message + ' (Code ' + error.code + ')'); 
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
	$('headermsg').update('Screen Power Error'); 
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
		strRes = strYr + strMnth + strDays + strHrs + strMins + strSecs;
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
