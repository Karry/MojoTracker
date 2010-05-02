

function InfoAssistant(params) {
	this.item = params.item;
}

InfoAssistant.prototype.setup = function(){

    this.config = Config.getInstance();
    
    $('startTime').innerHTML    = this.item.start;
    $('endTime').innerHTML     = this.item.stop;
    
    $('minAltitude').innerHTML 	= this.config.userSmallDistance(this.item.minAltitude, true);
    $('maxAltitude').innerHTML 	= this.config.userSmallDistance(this.item.maxAltitude, true);
    
    $('maxSpeed').innerHTML 	= this.config.userVelocity( this.item.maxVelocity );
    $('trackLength').innerHTML 	= this.item.trackLengthFormated;
    $('tracknum').innerHTML 	= this.item.nodes;
    $('currentTrack').innerHTML = this.item.name;

    callback = {
        errorHandler : this.drawErrorHandler.bind(this),
        successHandler : this.drawSuccessHandler.bind(this)
    }

    var canvas = document.getElementById('altitudeCanvas').getContext('2d');
    Mojotracker.getInstance().drawAltitudeProfile( canvas, this.item , callback );
    
}

InfoAssistant.prototype.drawErrorHandler = function(e){
    this.showDialog("Error",e);
}
InfoAssistant.prototype.drawSuccessHandler = function(canvas){
    // TODO
}

InfoAssistant.prototype.showDialog = function(title, message){    
    if (this.progressDialog){
        this.progressDialog.close();
        this.progressDialog = null;
    }

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