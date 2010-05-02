

function InfoAssistant(params) {
	this.item = params.item;
}

InfoAssistant.prototype.setup = function(){

    this.config = Config.getInstance();

    this.timeMin = Date.parse( this.item.start.replace("T"," ").replace("Z"," "));
    this.timeMax = Date.parse( this.item.stop.replace("T"," ").replace("Z"," "));
    
    $('startTime').innerHTML    = this.config.formatDateTime( new Date(this.timeMin));
    $('endTime').innerHTML      = this.config.formatDateTime( new Date(this.timeMax));
    
    $('minAltitude').innerHTML 	= this.config.userSmallDistance(this.item.minAltitude, true);
    $('maxAltitude').innerHTML 	= this.config.userSmallDistance(this.item.maxAltitude, true);
    
    $('maxSpeed').innerHTML 	= this.config.userVelocity( this.item.maxVelocity );
    $('trackLength').innerHTML 	= this.item.trackLengthFormated;
    $('tracknum').innerHTML 	= this.item.nodes;
    $('currentTrack').innerHTML = this.item.name;

    this.speedData = new Array();
    this.speedDataMin = this.item.maxVelocity;
    this.speedDataMax = this.item.maxVelocity;

    this.altitudeData = new Array();
    this.altitudeDataMin = this.item.minAltitude;
    this.altitudeDataMax = this.item.maxAltitude;
    this.altitudeDataMaxError = 0;

    callback = {
        errorHandler : this.drawErrorHandler.bind(this),
        handleResult : this.handleAltitudeResult.bind(this)
    }
    Mojotracker.getInstance().getAltitudeProfile( this.item , callback );

    callback = {
        errorHandler : this.drawErrorHandler.bind(this),
        handleResult : this.handleSpeedResult.bind(this)
    }
    Mojotracker.getInstance().getVelocityProfile( this.item , callback );
    
}

InfoAssistant.prototype.drawErrorHandler = function(e){
    this.showDialog("Error",e);
}

InfoAssistant.prototype.handleAltitudeResult = function(result){

    var canvas = document.getElementById('altitudeCanvas').getContext('2d');
    
    for (var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);
        data = {
            time : Date.parse( item.time.replace("T"," ").replace("Z"," ") ),
            value : parseInt( item.altitude ),
            error : parseInt( item.vertAccuracy )
        }
        this.altitudeData[i] = data;
        if ((data.value - data.error) < this.altitudeDataMin)
            this.altitudeDataMin = data.value - data.error;
        if (( data.value + data.error) > this.altitudeDataMax)
            this.altitudeDataMax = data.value + data.error;
        if (this.altitudeDataMaxError < data.error)
            this.altitudeDataMaxError = data.error;
    }
    this.drawGraph(canvas, this.altitudeData, this.timeMin, this.timeMax, this.altitudeDataMin, this.altitudeDataMax, this.altitudeDataMaxError);
}

InfoAssistant.prototype.handleSpeedResult = function(result){

    var canvas = document.getElementById('speedCanvas').getContext('2d');
        
    for (var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);
        data = {
            time : Date.parse( item.time.replace("T"," ").replace("Z"," ") ),
            value : parseInt( item.velocity ),
            error : 0
        }
        if (data.value < this.speedDataMin)
            this.speedDataMin = data.value;
        if (data.value > this.speedDataMax)
            this.speedDataMax = data.value;
        this.speedData[i] = data;
    }
    this.drawGraph(canvas, this.speedData, this.timeMin, this.timeMax, this.speedDataMin, this.speedDataMax, 0);
}

InfoAssistant.prototype.drawGraph = function(canvas, data, timeMin, timeMax, valueMin, valueMax, maxError){
        
    length = timeMax - timeMin;
    
    range = valueMax - valueMin;
    if (range == 0)
        range = 1;
    
    startX = 0; startY= 0; width = 320; height = 200;

    // draw graph area
    canvas.strokeStyle = "rgb(128,128,128)";
    canvas.lineWidth   = 1;
    canvas.beginPath();

    canvas.moveTo(startX, startY);
    canvas.lineTo(startX + width, startY);
    canvas.lineTo(startX + width, startY+height);
    canvas.lineTo(startX , startY+height);
    canvas.lineTo(startX , startY);

    canvas.stroke();
    canvas.closePath();
    
    if (length == 0)
        return;    

    // draw error area    
    if (this.altitudeDataMaxError>0){
        canvas.strokeStyle = "rgb(128,90,90)";
        canvas.lineWidth   = 1;
        canvas.fillStyle   = "rgb(200,150,150)";
        canvas.beginPath();
    
    
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
            if (i == 0)
                canvas.moveTo(x, y);
            else
                canvas.lineTo(x, y);
        }
    
        canvas.fill();
        canvas.stroke();
        canvas.closePath();
    }
    
    canvas.strokeStyle = "rgb(0,128,0)";
    canvas.lineWidth = 3;    
    canvas.beginPath();
    var msg = "";
    // draw main graph
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        //callback.errorHandler( row.time );
        time = item.time
        value = item.value;
        x = (width * ( (time - timeMin) / length)) + startX;
        y = (startY + height) - (height * ((value - valueMin) / range));
        msg = msg+value+" ("+item.error+"), ";
        
        if (x < startX || y<startY || x > (startX + width) || y > (startY+height)){
            this.showDialog("Error","draw failed (3) at " +x+"x"+y+" ("+value+", "+i+")");
            break;
        }
        if (i == 0)
            canvas.moveTo(x, y);
        else
            canvas.lineTo(x, y);
    }
    
    //this.showDialog("data", msg+" ["+valueMin+", "+valueMax+"]");
    
    canvas.stroke();
    canvas.closePath();
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