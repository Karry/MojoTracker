
/**
 * constructor
 */
function MojoActivity(controller, callback){
    this.controller = controller;
    this.callback = callback;
    this.id = 'com.osm.mojotracker-'+Math.random();
    this.start();
}

/**
 * The activity’s expected duration is provided in milliseconds
 * and cannot exceed 900,000 milliseconds (15 minutes).
 * The power management service automatically terminates your activity
 * request at the end of its duration or 15 minutes, whichever is shorter.
 *
 * NOTE: if we repeatedly stop activity and start it again (for example each 10 minutes),
 * power management keeps device up permanently. It is fine for us, when we want
 * continuously tracking, but keep in your mind - it drastically drain phone's battery.
 */
MojoActivity.prototype.start = function(){
    this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
                                   {
                                      method: 'activityStart',	
                                      parameters:
                                      {
                                         id: this.id, 
                                         duration_ms: '900000' // MAX DURATION IS 15 MINUTES
                                      },
                                      onSuccess: this.activitySuccess.bind(this),
                                      onFailure: this.activityFailed.bind(this)
                                   }  );
    
    // reset activity each 10 minutes
    this.activityTimeout = setTimeout( function(){
            // reset tracking - it sometimes stops work
            this.stop();
            this.start();
            this.callback.activityReset();
        }.bind(this), 10 * 60 * 1000);

    Mojo.Log.error("start activity "+this.id);
}

MojoActivity.prototype.stop = function(){
    this.controller.serviceRequest('palm://com.palm.power/com/palm/power',
                                   {
                                      method: 'activityEnd',	
                                      parameters:
                                      {
                                          id: this.id
                                      },
                                      onSuccess: this.activitySuccess.bind(this),
                                      onFailure: this.activityFailed.bind(this)
                                   }   );
    
    Mojo.Log.error("stop activity "+this.id);    
}


MojoActivity.prototype.activitySuccess = function(){
}

MojoActivity.prototype.activityFailed = function(){
    Mojo.Log.error("Screen Power Error "+this.id);
    this.callback.activityFailed();
	//this.showDialog("Error", 'Screen Power Error');
	//$('statusmsg').update('Screen Power Error'); 
}


MojoActivity.prototype.destroy = function(){
    this.stop();
    if (this.activityTimeout){
        clearTimeout( this.activityTimeout );
	}
    Mojo.Log.error("destroy activity "+this.id);
}
