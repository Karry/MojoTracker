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
	this.total = 0;
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

}

FirstAssistant.prototype.handleStartButtonPress = function(event)
{
	// increment the total and update the display
	now = new Date();
	this.tracename = "G" + this.formatDate(now, 1);
	this.total = 0;
	$('messagearea').innerHTML = "Activating GPS...";
	this.StartbuttonModel.disabled = true;
	this.controller.modelChanged(this.StartbuttonModel);
	this.StopbuttonModel.disabled = false;
	this.controller.modelChanged(this.StopbuttonModel);
	
	// Open DB to store tracks
	try
	{
		this.db = openDatabase('ext:OsmDb', '', 'Sample Data Store', 65536);
		$('headermsg').update("Opened OSM DB. Creating table " + this.tracename);
		this.nullHandleCount = 0;
		// create table
		var strSQL = 'CREATE TABLE ' + this.tracename + ' (lat TEXT NOT NULL DEFAULT "nothing", lon TEXT NOT NULL DEFAULT "nothing", altitude TEXT NOT NULL DEFAULT "nothing", time TEXT NOT NULL DEFAULT "nothing"); GO;';
		this.db.transaction
		( 
			(function (transaction)
			{
				transaction.executeSql('DROP TABLE IF EXISTS ' + this.tracename + '; GO;', []);
				transaction.executeSql(strSQL, [], this.createTableDataHandler.bind(this), this.tableErrorHandler.bind(this));
			} ).bind(this) 
		);
		//$('headermsg').update("Created Tables.");		
	}
	catch (e)
	{
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
	// increment the total and update the display
	$('messagearea').innerHTML = "Deactivated GPS";
	this.controller.get("headermsg").update("Num Tracks: " + this.total);
	this.trackingHandle.cancel();
	this.StartbuttonModel.disabled = false;
	this.controller.modelChanged(this.StartbuttonModel);
	this.StopbuttonModel.disabled = true;
	this.controller.modelChanged(this.StopbuttonModel);		
	this.setScreenTimeout(2);
}

FirstAssistant.prototype.handleGpsResponse = function(event)
{
	this.total++;
	now = new Date();
	$('messagearea').innerHTML = "GPS Operating...";
	//This records all data from GPS
	$('latitude').innerHTML = "Latitude: " + event.latitude;
	$('longitude').innerHTML = "Longitude: " + event.longitude;
	$('tracknum').innerHTML = "No. of Tracks: " + this.total;
	$('speed').innerHTML = "Speed: " + event.velocity * 2.237;
	strUTC = this.formatDate(now, 2);
	$('headermsg').innerHTML = this.formatDate(now, 3);
	//obj = new GPShelper(event.latitude,event.longitude,event.altitude,event.errorCode,event.heading,event.horizAccuracy,event.vertAccuracy,event.velocity,event.timestamp);	
	if (event.errorCode != 0)
		$('headermsg').innerHTML = "GPS warning: " + event.errorCode;
	this.nullHandleCount = 0;
	var strSQL = 'INSERT INTO ' + this.tracename + ' (lat, lon, altitude, time) VALUES ("' + event.latitude + '","' + event.longitude + '","' + event.altitude + '","' + strUTC + '"); GO;';
	//$('messagearea').innerHTML = "DEBUG:" + strSQL;
	this.db.transaction
	(
        (function (transaction)
		{
            transaction.executeSql(strSQL, [], this.createRecordDataHandler.bind(this), this.tableErrorHandler.bind(this));
        }).bind(this) 
    );
}

FirstAssistant.prototype.handleGpsResponseError = function(event)
{
	$('headermsg').innerHTML = "A GPS Error occurred:" + Object.toJSON(event);
}

FirstAssistant.prototype.createTableDataHandler = function(transaction, results) 
{
	//$('headermsg').update("Created TABLE1.");
} 

FirstAssistant.prototype.createRecordDataHandler = function(transaction, results) 
{	
	//$('headermsg').update("Inserted 1 record.");
} 

FirstAssistant.prototype.tableErrorHandler = function(transaction, error) 
{
	$('headermsg').update('table Error was ' + error.message + ' (Code ' + error.code + ')'); 
	return true;
}

FirstAssistant.prototype.setScreenTimeout = function(stop)
{
	if (stop == 1)
	{
		appID = 'com.osm.mojotracker';
		this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
		                               {
		                                  method: 'activityStart',	
		                                  parameters:
									      {
			                                 id: appID, 
		                                     duration_ms: '120000' //8 hours
		                                  },
		/*
		onSuccess: $('error_area-to-update').update('screen timeout success'),
		onFailure: $('error_area-to-update').update('screen timeout failed')
		*/
		                                  onSuccess: this.activitySuccess.bind(this),
		                                  onFailure: this.activityFailed.bind(this)
	                                   }  );
	}
	if (stop == 2)
	{
		appID = 'com.osm.mojotracker';
		this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
		                               {
		                                  method: 'activityEnd',	
		                                  parameters:
										  {
		                                      id: 'com.tracker.start'
		                                  },
		/*
		onSuccess: $('error_area-to-update').update('screen timeout success'),
		onFailure: $('error_area-to-update').update('screen timeout failed')
		*/
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
