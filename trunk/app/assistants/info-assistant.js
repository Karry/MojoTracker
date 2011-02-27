

function InfoAssistant(params) {
	this.item = params.item;
}

InfoAssistant.prototype.setup = function(){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });
	
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


    // Set up a few models so we can test setting the widget model:
    this.waypointsModel = {listTitle:$L('info.waypoints'), items:[]};
    // Store references to reduce the use of controller.get()
    this.waypointList = this.controller.get('waypointList');

    // Set up the attributes for the list widget:
    this.waypointAtts = {
            itemTemplate:'info/listitem',
            listTemplate:'info/listcontainer',
            showAddItem:false,
            swipeToDelete:false,
            reorderable:false,
            emptyTemplate:'info/emptylist'
    };

    this.controller.setupWidget('waypointList', this.waypointAtts , this.waypointsModel);
	this.controller.listen(this.waypointList, Mojo.Event.listTap, this.handleWaypointTap.bind(this));	
		
	this.refreshTrackInfo();
	this.refreshMap();
	this.refreshWaypointsList();
}

InfoAssistant.prototype.refreshWaypointsList = function(){
		// WAYPOINTS LIST
		mojotracker = Mojotracker.getInstance();
		mojotracker.getWaypoints(  this.item.name, this.waypointsResultHandler.bind(this),
													function(transaction, error){
														if (error.code != 1) // no such table
															this.showDialog("error","code "+error.code+": "+error.message);
													}.bind(this) );		

}

InfoAssistant.prototype.refreshMap = function(){
	try{
		callback = {
			errorHandler : this.drawErrorHandler.bind(this),
			handleResult : this.handleAllPointsResult.bind(this)
		}
		mojotracker.getAllPoints( this.item , callback, 150);		
	}catch(e){
		this.showDialog('error', e);
	}
}

InfoAssistant.prototype.handleAllPointsResult = function(result, waypoints){
	 if (result.rows){
		minLat = minLon = maxLat = maxLon = undefined;
		for (i = 0; i< result.rows.length; i++){
			// fu***q JavaScript and its string > number conversions...
			point = {lat: result.rows.item(i).lat / 1, lon: result.rows.item(i).lon / 1 };
			if (minLat == undefined || minLat > point.lat)
				minLat = point.lat;
			if (maxLat == undefined || maxLat < point.lat)
				maxLat = point.lat;
			if (minLon == undefined || minLon > point.lon)
				minLon = point.lon;
			if (maxLon == undefined || maxLon < point.lon)
				maxLon = point.lon;
		}
		
		tracker = Mojotracker.getInstance();
        //        X            Y       :)
        p1 = { lon: minLon, lat: maxLat };
        p2 = { lon: maxLon, lat: minLat }
        realHeight = tracker.approximateDistance( p1.lat, p1.lon, p2.lat, p1.lon );
        realWidth = tracker.approximateDistance( p1.lat, p1.lon, p1.lat, p2.lon );		
        larger = realWidth > realHeight? realWidth : realHeight;
		
		if (larger < 200)
			larger = 200;
		
		// add some borders
		p1 = tracker.movePoint(p1, larger * -0.1, larger * -0.1);
		p2 = tracker.movePoint(p2, larger * +0.1, larger * +0.1);
        realHeight = tracker.approximateDistance( p1.lat, p1.lon, p2.lat, p1.lon );
        realWidth = tracker.approximateDistance( p1.lat, p1.lon, p1.lat, p2.lon );		
        larger = realWidth > realHeight? realWidth : realHeight;
		
		//Mojo.Log.error("before "+Math.round(realWidth)+"x"+Math.round(realHeight)+"   {"+p1.lat+", "+p1.lon+"}, {"+p2.lat+", "+p2.lon+"}");
		
		// make map width always larger
		if (realWidth < realHeight){
			//Mojo.Log.error("add 2x "+Math.round((realHeight - realWidth) / -2));
			
			p1 = tracker.movePoint(p1, (realHeight - realWidth) / -2, 0);
			p2 = tracker.movePoint(p2, (realHeight - realWidth) / +2, 0);
			realHeight = tracker.approximateDistance( p1.lat, p1.lon, p2.lat, p1.lon );
			realWidth = tracker.approximateDistance( p1.lat, p1.lon, p1.lat, p2.lon );		
			larger = realWidth > realHeight? realWidth : realHeight;			
		}
		//Mojo.Log.error("after  "+Math.round(realWidth)+"x"+Math.round(realHeight)+"   {"+p1.lat+", "+p1.lon+"}, {"+p2.lat+", "+p2.lon+"}");
		
        if (larger == 0) 
            return;

        maxImageDim = Mojo.Environment.DeviceInfo.screenWidth;
        //magic = 0.00028;
        magic = 0.00017820;
        scale = Math.round( larger / (magic * maxImageDim) );
        
        //417 x -503
        premissWidth = Math.round((realWidth / scale) / magic);
        premissHeight = Math.round((realHeight / scale) / magic);

		Mojo.Log.error("final "+premissWidth+"x"+premissHeight);
        
		/* Osmarender needs diferent parameters for export... Long and lat is center of viewed area and we have to specify
		  Z, image width and height directly
		  "http://tah.openstreetmap.org/MapOf/index.php?long=14.4357&lat=50.0448&z=12&w=948&h=719&format=jpeg"
		  
		*/
		
        loc = "http://tile.openstreetmap.org/cgi-bin/export?bbox="+p1.lon+","+p2.lat+","+p2.lon+","+p1.lat+"&scale="+scale+"&format=jpeg"
		// for debug...
		//Mojo.Controller.stageController.setClipboard(loc);	
        
        // Get the canvas element.
        var elem = document.getElementById('mapCanvas');
        if (!elem || !elem.getContext) {
            return;
        }
        
        // Get the canvas 2d context.
        var context = elem.getContext('2d');
        if (!context || !context.drawImage) {
            return;
        }
        elem.width = premissWidth;
        elem.height = premissHeight;
				
		var img = new Image();
		inst = this;
		call = 1;
        
		strokeFcn = function () {
			call ++;
			myCall = call;
			config = Config.getInstance();
			//inst.showDialog("Error", Math.abs(premissWidth) +" x "+ Math.abs(premissHeight)+" "+img.width+" "+img.height);
			if (img.complete && img.width != 0 && img.height != 0){
				context.drawImage(img, 0, 0, Math.abs(premissWidth), Math.abs(premissHeight));
				$('mapStatus').innerHTML = "";
			}
        
            context.strokeStyle = "rgba(255,0,0,1)";
            context.lineWidth   = 2;
    
            context.beginPath();
			lastX = lastY = 0;
            for (i = 0; i< result.rows.length; i++){
				if (myCall != call )
					return;
				point = result.rows.item(i);
				lastTime = time;
				time = Date.parse( point.time.replace("T"," ").replace("Z"," ") );
				leftPos = tracker.approximateDistance( p1.lat, p1.lon, p1.lat, point.lon );
				topPos  = tracker.approximateDistance( p1.lat, p1.lon, point.lat, p1.lon );			
				
				x = Math.round((leftPos / scale) / magic);
				y = Math.round((topPos / scale) / magic);
				if (lastX == x && lastY == y)
					continue;
				lastX = x; lastY = y;
				
				/*
				 // stroke path with more error more transparency
				alpha = 1 - (horizAccuracy *0.005);
				alpha = alpha < 0.5? 0.5: alpha;
				*/
				alpha = 1;
				context.strokeStyle = "rgba(255,0,0,"+alpha+")";
				if (i == 0){
					context.moveTo(x, y);
					//inst.showDialog("Error", point.lat+" x "+point.lat+ " >>> "+x+"x"+y+" "+leftPos+"x"+topPos +", "+scale);
				}else{
					if (lastTime < (time - ( config.getMaxGraphSpace() *1000) )){
						context.stroke();
						context.closePath();
						context.beginPath();
						context.moveTo(x, y);
					}else{
						context.lineTo(x, y);
					}
				}
			}
            context.stroke();
            context.closePath();
			
			if (waypoints && waypoints.rows && waypoints.rows.length > 0){
				context.strokeStyle = "rgba(0,0,255,1)";
				context.fillStyle = "rgba(0,0,255,1)";
				context.lineWidth   = 1;
				for ( i=0; i < waypoints.rows.length; i++){
					point = waypoints.rows.item(i);
					leftPos = tracker.approximateDistance( p1.lat, p1.lon, p1.lat, point.lon );
					topPos  = tracker.approximateDistance( p1.lat, p1.lon, point.lat, p1.lon );			
					
					x = Math.round((leftPos / scale) / magic);
					y = Math.round((topPos / scale) / magic);
					context.strokeText(point.title, x+5, y+3);
							   
					context.beginPath();
					context.arc(x,y,4,0,Math.PI*2,true);
					context.closePath();
					context.stroke();
					context.fill();
				}
			}
        }.bind(this);
		
		$('mapStatus').innerHTML = $L("loading map from OpenStreetMap.org...");
        img.src = loc;
		this.mapUrl = loc;
		this.controller.listen('mapCanvas', Mojo.Event.tap,
                           this.handleMapTap.bind(this));
		

        img.addEventListener('load', strokeFcn, false);
		img.addEventListener("error", function(e){
				$('mapStatus').innerHTML = $L("loading map from OpenStreetMap.org failed (server is probably busy)");
			}, false); 
		img.addEventListener("abort", function(e){
				$('mapStatus').innerHTML = $L("loading map from OpenStreetMap.org aborted");
			}, false); 
		strokeFcn();
	 }
}

InfoAssistant.prototype.cleanup = function(event){
    if (this.updateTimeout)
        clearTimeout( this.updateTimeout );	
}

InfoAssistant.prototype.refreshTrackInfo = function(){
	try{
		this.config = Config.getInstance();
		mojotracker = Mojotracker.getInstance();
		
		now = new Date();
		nowUTC = new Date(now.getTime() + (now.getTimezoneOffset()*60*1000));
		if (this.item.start)
			this.timeMin = Date.parse( this.item.start.replace("T"," ").replace("Z"," "));
		else
			this.timeMin = nowUTC;
			
		if (this.item.stop)
			this.timeMax = Date.parse( this.item.stop.replace("T"," ").replace("Z"," "));
		else
			this.timeMax = this.timeMin;
			
		// is current track is active, set maxTime to current time
		if (mojotracker.isActive(this.item.name) && (this.timeMax < nowUTC))
			this.timeMax = nowUTC;
	
		$('startTime').innerHTML    = this.config.formatUTCDateTime( new Date(this.timeMin));
		$('endTime').innerHTML      = this.config.formatUTCDateTime( new Date(this.timeMax));
		
		$('minAltitude').innerHTML 	= this.config.userSmallDistance(this.item.minAltitude, true);
		$('maxAltitude').innerHTML 	= this.config.userSmallDistance(this.item.maxAltitude, true);
		
		$('maxSpeed').innerHTML 	= this.config.userVelocity( this.item.maxVelocity );
		$('trackLength').innerHTML 	= this.item.trackLengthFormated;
		$('tracknum').innerHTML 	= this.item.nodes;
		$('currentTrack').innerHTML = "\""+this.item.display_name+"\"";
	
		// ALTITUDE GRAPH
		callback = {
			errorHandler : this.drawErrorHandler.bind(this),
			handleResult : this.handleAltitudeResult.bind(this)
		}
		mojotracker.getAltitudeProfile( this.item , callback );
	
		// VELOCITY PROFILE
		callback = {
			errorHandler : this.drawErrorHandler.bind(this),
			handleResult : this.handleSpeedResult.bind(this)
		}
		mojotracker.getVelocityProfile( this.item , callback );
				
		// if it is current track, refresh data after 5seconds
		if ( mojotracker.getCurrentTrack() == this.item.name){
			inst = this;
			this.updateTimeout = setTimeout( function(){
					Mojotracker.getInstance().getTrackInfo( inst.item,
											 inst.trackInfoHandler.bind(inst),
											 inst.tableErrorHandler.bind(inst));
				}, 5 * 1000);		
		}			
	}catch(e){
		this.showDialog('error', e);
	}
}

InfoAssistant.prototype.waypointsResultHandler = function(transaction, result){
	config = Config.getInstance();
    if (result.rows){
		try{
			for (i = 0; i< result.rows.length; i++){
				newItem = Object.clone( result.rows.item(i) );
				
				newItem.posFormated = config.userLatitude( newItem.lat)+" "+config.userLongitude( newItem.lon);
				this.waypointsModel.items.push(newItem);
				this.waypointList.mojo.noticeAddedItems(this.waypointsModel.items.length, [newItem]);            
			}
		}catch(e){
			this.showDialog('Error', e);
		}
    }else{
		this.showDialog('Error', $L('bad DB result (waypoints handler)...'));
    }
}

InfoAssistant.prototype.activate = function(event){
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */	
	
	//this.showDialog('track', this.item.name +"/"+mojotracker.getCurrentTrack());

}

InfoAssistant.prototype.deactivate = function(event){
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */

}


InfoAssistant.prototype.trackInfoHandler = function(transaction, result){
    if ((result.rows) && (result.rows.length == 1)){
        this.item = Object.clone( result.rows.item(0) );
        this.item.trackLengthFormated =  Config.getInstance().userDistance( this.item.trackLength , false);
		this.refreshTrackInfo();    
    }else{
		this.showDialog("Error", 'DB returned bad result ['+result.rows.length+']');
    }	
}

InfoAssistant.prototype.drawErrorHandler = function(e){
    this.showDialog("Error",JSON.stringify(e));
}
InfoAssistant.prototype.tableErrorHandler = function(e){
    this.showDialog("SQL Error",JSON.stringify(e));
}

InfoAssistant.prototype.handleAltitudeResult = function(result){

	var startTime = (new Date()).getTime();
	
    this.config = Config.getInstance();
    var canvas = document.getElementById('altitudeCanvas').getContext('2d');
	
	var pixelPerSecond = 293 / (this.timeMax - this.timeMin);
	var lastPixel = 0;
	var part = -1;
	var lastTime = -1;
	var k = 0;
	var nodes = 0;
    for (var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);
		time = Date.parse( item.time.replace("T"," ").replace("Z"," ") );
		
		// reduce data count for faster drawing
		p = (pixelPerSecond * time).toFixed(0);
		if (lastPixel == p)
			continue;
		lastPixel = p;
		nodes ++;
		
        data = {
            time : time,
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
	var prepareTime = (new Date()).getTime();

	this.altXAxis = this.config.generageXAxis( this.timeMin, this.timeMax );
	this.altYAxis = this.config.generageAltitudeAxis( this.altitudeDataMin - this.altitudeDataMaxError
													, this.altitudeDataMax + this.altitudeDataMaxError);
	var axisTime = (new Date()).getTime();	
	
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

	var endTime = (new Date()).getTime();
	// print times for debug
	//this.showDialog("Debug", "prepare: "+(prepareTime - startTime)+", axis: "+(axisTime - prepareTime)+" draw: "+(endTime - axisTime)+", nodes: "+nodes+"/"+result.rows.length);	
}

InfoAssistant.prototype.handleSpeedResult = function(result){

    this.config = Config.getInstance();
    var canvas = document.getElementById('speedCanvas').getContext('2d');
        
	var pixelPerSecond = 293 / (this.timeMax - this.timeMin);
	var lastPixel = 0;
	var part = -1;
	var lastTime = -1;
	var k = 0;
    for (var i = 0; i < result.rows.length; i++) {		
        var item = result.rows.item(i);
		time = Date.parse( item.time.replace("T"," ").replace("Z"," ") );
		
		// reduce data count for faster drawing
		p = (pixelPerSecond * time).toFixed(0);
		if (lastPixel == p)
			continue;
		lastPixel = p;

        data = {
            time : time,
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
    
	fullWidth = 319;  fullHeight = 200;
    startX = 26; startY= 0; width = fullWidth - startX; height = fullHeight - 15;

	// clear canvas
	canvas.clearRect (0, 0, fullWidth, fullHeight);
    
    // draw graph area
    canvas.strokeStyle = "rgb(200,200,200)";
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

InfoAssistant.prototype.handleWaypointTap = function(event){
	try{
		item = event.item;
		elem = event.originalEvent.target;
		var locPopupModel;
		locPopupModel = [
			{label: $L('Copy to clipboard'), command: 'clipboard'},
			{label: $L('Share via SMS'), command: 'sms'},
			{label: $L('Share via email'), command: 'email'}
		];
		
		this.controller.popupSubmenu({
			onChoose: function(method){
					this.sendPosition(method, item);
				}.bind(this),
			placeNear: elem,
			items: locPopupModel
		});
	}catch(e){
		this.showDialog("Error", Object.toJSON(e));
	}		
}

InfoAssistant.prototype.handleMapTap = function(event){
	try{
		//item = event.item;
		elem = event.target;
		var locPopupModel;
		locPopupModel = [
			{label: $L('Copy url to clipboard'), command: 'clipboard'},
			{label: $L('Reload'), command: 'reload'}
		];
		
		this.controller.popupSubmenu({
			onChoose: function(method){
					if (method == "clipboard")
						Mojo.Controller.stageController.setClipboard(this.mapUrl);
					else if (method == "reload")
						this.refreshMap();
				}.bind(this),
			placeNear: elem,
			items: locPopupModel
		});
	}catch(e){
		this.showDialog("Error", Object.toJSON(e));
	}		
}


InfoAssistant.prototype.sendPosition = function(method, item){
	
	msg = item.title + " - " + item.description + ": "
		+ this.config.userLatitude( item.lat ) + " "
		+ this.config.userLongitude( item.lon ) +"";
		
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
                        summary: 'Interesting place',
                        text: msg
                    }
                }
            });
	}
	if (method == "clipboard"){
		Mojo.Controller.stageController.setClipboard(msg);	
	}
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