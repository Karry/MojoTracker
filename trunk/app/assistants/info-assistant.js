

function InfoAssistant(params) {
	this.item = params.item;
}

InfoAssistant.prototype.setup = function(){	
	this.speedData = new Array();
	this.speedXAxis = new Array();
	this.speedYAxis = new Array();
	this.speedDataMin = this.item.maxVelocity;
	this.speedDataMax = this.item.maxVelocity;

	this.altitudeData = new Array();
	this.altXAxis = new Array();
	this.altYAxis = new Array();
	this.altitudeDataMin = this.item.minAltitude;
	this.altitudeDataMax = this.item.maxAltitude;
	this.altitudeDataMaxError = 0;

	this.refreshTrackInfo();    
}

InfoAssistant.prototype.cleanup = function(event){
    if (this.updateTimeout)
        clearTimeout( this.updateTimeout );	
}

InfoAssistant.prototype.refreshTrackInfo = function(){
	
    this.config = Config.getInstance();
	mojotracker = Mojotracker.getInstance();
	
	// if it is current track, refresh data after 5seconds
	//this.showDialog('track', this.item.name +"/"+mojotracker.getCurrentTrack());
	if ( mojotracker.getCurrentTrack() == this.item.name){
		inst = this;
		this.updateTimeout = setTimeout( function(){
				Mojotracker.getInstance().getTrackInfo( inst.item.name,
										 inst.trackInfoHandler.bind(inst),
										 inst.tableErrorHandler.bind(inst));
			}, 5 * 1000);		
	}	
	if (this.item.start)
		this.timeMin = Date.parse( this.item.start.replace("T"," ").replace("Z"," "));
	else
		this.timeMin = (new Date()).getTime();
		
	if (this.item.stop)
		this.timeMax = Date.parse( this.item.stop.replace("T"," ").replace("Z"," "));
	else
		this.timeMax = this.timeMin;    

    $('startTime').innerHTML    = this.config.formatDateTime( new Date(this.timeMin));
    $('endTime').innerHTML      = this.config.formatDateTime( new Date(this.timeMax));
    
    $('minAltitude').innerHTML 	= this.config.userSmallDistance(this.item.minAltitude, true);
    $('maxAltitude').innerHTML 	= this.config.userSmallDistance(this.item.maxAltitude, true);
    
    $('maxSpeed').innerHTML 	= this.config.userVelocity( this.item.maxVelocity );
    $('trackLength').innerHTML 	= this.item.trackLengthFormated;
    $('tracknum').innerHTML 	= this.item.nodes;
    $('currentTrack').innerHTML = this.item.name;

    callback = {
        errorHandler : this.drawErrorHandler.bind(this),
        handleResult : this.handleAltitudeResult.bind(this)
    }
    mojotracker.getAltitudeProfile( this.item , callback );

    callback = {
        errorHandler : this.drawErrorHandler.bind(this),
        handleResult : this.handleSpeedResult.bind(this)
    }
    mojotracker.getVelocityProfile( this.item , callback );
}

InfoAssistant.prototype.trackInfoHandler = function(transaction, results){
    if ((results.rows) && (results.rows.length == 1)){
        this.item = results.rows.item(0);
        this.item.trackLengthFormated =  Config.getInstance().userDistance( this.item.trackLength , false);
		this.refreshTrackInfo();    
    }else{
		this.showDialog("Error", 'DB returned bad result ['+results.rows.length+']');
    }	
}

InfoAssistant.prototype.drawErrorHandler = function(e){
    this.showDialog("Error",e);
}
InfoAssistant.prototype.tableErrorHandler = function(e){
    this.showDialog("SQL Error",e);
}

InfoAssistant.prototype.handleAltitudeResult = function(result){

    this.config = Config.getInstance();
    var canvas = document.getElementById('altitudeCanvas').getContext('2d');
    
	var part = -1;
	var lastTime = -1;
	var k = 0;
    for (var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);
        data = {
            time : Date.parse( item.time.replace("T"," ").replace("Z"," ") ),
            value : parseInt( item.altitude ),
            error : parseInt( item.vertAccuracy )
        }
		if (lastTime < (data.time - (this.config.getMaxGraphSpace()*1000) )){
			part ++;
			this.altitudeData[part] = new Array();
			k= 0;
		}
		lastTime = data.time;
		
        this.altitudeData[part][k++] = data;
        if ((data.value - data.error) < this.altitudeDataMin)
            this.altitudeDataMin = data.value - data.error;
        if (( data.value + data.error) > this.altitudeDataMax)
            this.altitudeDataMax = data.value + data.error;
        if (this.altitudeDataMaxError < data.error)
            this.altitudeDataMaxError = data.error;
		if (this.timeMin > data.time)
			this.timeMin = data.time;
		if (this.timeMax < data.time)
			this.timeMax = data.time;
    }
	this.altXAxis = this.config.generageXAxis( this.timeMin, this.timeMax );
	this.altYAxis = this.config.generageAltitudeAxis( this.altitudeDataMin - this.altitudeDataMaxError
													, this.altitudeDataMax + this.altitudeDataMaxError);

    this.drawGraph(canvas,
				   this.altitudeData,
				   this.timeMin,
				   this.timeMax,
				   this.altitudeDataMin,
				   this.altitudeDataMax,
				   this.altitudeDataMaxError,
				   this.altXAxis,
				   this.altYAxis
				   );
}

InfoAssistant.prototype.handleSpeedResult = function(result){

    this.config = Config.getInstance();
    var canvas = document.getElementById('speedCanvas').getContext('2d');
        
	var part = -1;
	var lastTime = -1;
	var k = 0;
    for (var i = 0; i < result.rows.length; i++) {		
        var item = result.rows.item(i);
        data = {
            time : Date.parse( item.time.replace("T"," ").replace("Z"," ") ),
            value : parseInt( item.velocity ),
            error : 0
        }
		if (lastTime < (data.time - ( this.config.getMaxGraphSpace() *1000) )){
			part ++;
			this.speedData[part] = new Array();
			k = 0;
		}
		lastTime = data.time;

        this.speedData[part][k++] = data;
        if (data.value < this.speedDataMin)
            this.speedDataMin = data.value;
        if (data.value > this.speedDataMax)
            this.speedDataMax = data.value;
		if (this.timeMin > data.time)
			this.timeMin = data.time;
		if (this.timeMax < data.time)
			this.timeMax = data.time;		
    }

	this.speedXAxis = this.config.generageXAxis( this.timeMin, this.timeMax );
	this.speedYAxis = this.config.generageSpeedAxis( this.speedDataMin, this.speedDataMax);
	
    this.drawGraph(canvas,
				   this.speedData,
				   this.timeMin,
				   this.timeMax,
				   this.speedDataMin,
				   this.speedDataMax,
				   0,
				   this.speedXAxis,
				   this.speedYAxis 
				   );
}

InfoAssistant.prototype.drawGraph = function(
		canvas,
		parts,
		timeMin,
		timeMax,
		valueMin,
		valueMax,
		maxError,
		xAxis,
		yAxis
		){
        
    length = timeMax - timeMin;
    
    range = valueMax - valueMin;
    if (range == 0)
        range = 1;
    
	fullWidth = 320;  fullHeight = 200;
    startX = 26; startY= 0; width = 300; height = 185;

	// clear canvas
	canvas.clearRect (0, 0, fullWidth, fullHeight);

    // draw graph area
    canvas.strokeStyle = "rgb(128,128,128)";
    canvas.lineWidth   = 1;
    canvas.beginPath();
	canvas.strokeRect(startX, startY, startX + width, startY+height);
    canvas.stroke();
    canvas.closePath();
    
    if (length == 0)
        return;    
	
    // draw error area    
    if (maxError>0){
        canvas.strokeStyle = "rgb(128,90,90)";
        canvas.lineWidth   = 1;
        canvas.fillStyle   = "rgb(200,150,150)";
        canvas.beginPath();
		
    
		for (var part = 0; part< parts.length; part++ ){
			data = parts[part];
			//this.showDialog("counts", parts.length+", "+part+"/"+data.length);
			for (var i = 0; i < data.length; i++) {
				time = data[i].time
				value = data[i].value + data[i].error;
				x = (width * ( (time - timeMin) / length)) + startX;
				y = (startY + height) - (height * ((value - valueMin) / range));            
				
				if (x < startX || y<startY || x > (startX + width) || y > (startY+height)){
					this.showDialog("Error","draw failed (1) at " +x+"x"+y+" ("+i+")");
					break;
				}
				if (i == 0)
					canvas.moveTo(x, y);
				else
					canvas.lineTo(x, y);
			}
	
			for (var i = data.length -1; i >= 0; i--) {
				time = data[i].time
				value = data[i].value - data[i].error;
				x = (width * ( (time - timeMin) / length)) + startX;
				y = (startY + height) - (height * ((value - valueMin) / range));
				
				if (x < startX || y<startY || x > (startX + width) || y > (startY+height)){
					this.showDialog("Error","draw failed (2) at " +x+"x"+y+" ("+i+")");
					break;
				}
				if (i == 0){
					canvas.lineTo(x, y);
					value = data[i].value + data[i].error;
					y = (startY + height) - (height * ((value - valueMin) / range));					
					canvas.lineTo(x, y);
				}else
					canvas.lineTo(x, y);
			}
		
			canvas.fill();
			canvas.stroke();
			canvas.closePath();
		}
    }
    
    canvas.strokeStyle = "rgb(0,128,0)";
    canvas.lineWidth = 3;    
    canvas.beginPath();
    var msg = "";
    // draw main graph
	for (var part = 0; part< parts.length; part++ ){
		data = parts[part];
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			//callback.errorHandler( row.time );
			time = item.time
			value = item.value;
			x = (width * ( (time - timeMin) / length)) + startX;
			y = (startY + height) - (height * ((value - valueMin) / range));
			msg = msg+value+" ("+item.error+"), ";
			
			if (x < (startX-1) || y<(startY-1) || x > (startX + width+1) || y > (startY+height+1)){
				this.showDialog("Error","draw failed (3) at " +x+"x"+y+" ("+value+", "+i+")");
				break;
			}
			if (i == 0)
				canvas.moveTo(x, y);
			else
				canvas.lineTo(x, y);
		}
	}
    canvas.stroke();
    canvas.closePath();	
	
	// draw X axis
    canvas.strokeStyle  = "rgba(150,150,150, 0.5)";
	canvas.fillStyle    = "rgb(10,10,10)";
	canvas.font         = '11px sans-serif';
	canvas.textBaseline = 'top';
    canvas.lineWidth    = 1;
    canvas.beginPath();
	for (var i=0; i< xAxis.length; i++){
		item = xAxis[i];
		time = item.time;
		x = (width * ( (time - timeMin) / length)) + startX;
		canvas.moveTo(x,startY);
		canvas.lineTo(x, startY + height);
		if (item.label){
			canvas.fillText( item.label, x - 10, startY + height);			
		}
	}
	// draw Y axis
	for (var i=0; i< yAxis.length; i++){
		item = yAxis[i];
		y = (startY + height) - (height * ((item.value - valueMin) / range));
		canvas.moveTo(startX , y);
		canvas.lineTo(startX +width, y);
		if (item.label){
			canvas.fillText( item.label , 2, y-7);			
		}
	}
	
    canvas.stroke();
    canvas.closePath();	
    
    //this.showDialog("data", msg+" ["+valueMin+", "+valueMax+"]");
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