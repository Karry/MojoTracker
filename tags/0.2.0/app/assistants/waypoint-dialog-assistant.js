

function WaypointDialogAssistant(controller, mojotracker, config, lat, lon, alt, strUTC, errorHandler){

    this.config = config;
    this.mojotracker = mojotracker;
    this.controller= controller;
    this.lat = lat;
    this.lon = lon;
    this.alt = alt;
    this.strUTC = strUTC;
    this.waypoint = {
        title: "",
        description: ""
        };
    this.errorHandler = errorHandler;
}

WaypointDialogAssistant.prototype.setup = function(widget){
    this.widget = widget;

    $('title').innerHTML = $L('wpntDialog.title');
    $('pos').innerHTML = this.config.userLatitude( this.lat ) +" "+ this.config.userLongitude( this.lon );
    $('wpntDialogTitleLabel').innerHTML = $L('wpntDialogTitleLabel');
    $('wpntDialogDesctiptionLabel').innerHTML = $L('wpntDialogDesctiptionLabel');
    $('wpntDialogSave').innerHTML = $L('wpntDialogSave');

    this.controller.setupWidget(
        "waypointTitle",
        this.urlAttributes = {
            modelProperty: "title",
            limitResize: true,
            textReplacement: false,
            enterSubmits: false
        },
		this.waypoint
    );
    
    this.controller.setupWidget(
        "waypointDescription",
        this.urlAttributes = {
            modelProperty: "description",
            limitResize: true,
            textReplacement: false,
            enterSubmits: false
        },
		this.waypoint
    );
    
    this.controller.get('saveButton').addEventListener(Mojo.Event.tap, this.handleSave.bind(this));
}

WaypointDialogAssistant.prototype.reset = function() {
}

WaypointDialogAssistant.prototype.close = function(){
    this.widget.mojo.close();
}

WaypointDialogAssistant.prototype.handleSave = function(){
    try{
        if (this.waypoint.title == "")
            return;
        // SAVE WAYPOINT TO TRACK...
        this.mojotracker.addWaypoint(   this.waypoint.title,
                                        this.waypoint.description,
                                        this.lat,
                                        this.lon,
                                        this.alt,
                                        this.strUTC,
                                        this.errorHandler);
        
        this.widget.mojo.close();
    }catch(e){
        this.errorHandler(null, e);
    }
}
