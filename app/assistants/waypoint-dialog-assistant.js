

function WaypointDialogAssistant(controller, mojotracker, lat, lon, strUTC, errorHandler){

    this.mojotracker = mojotracker;
    this.controller= controller;
    this.lat = lat;
    this.lon = lon;
    this.strUTC = strUTC;
    this.waypoint = {};
    this.errorHandler = errorHandler;
}

WaypointDialogAssistant.prototype.setup = function(widget){
    this.widget = widget;

    $('title').innerHTML = $L('wpntDialog.title');
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
    // SAVE WAYPOINT TO TRACK...
    this.mojotracker.addWaypoint(this.waypoint.title,
                                          this.waypoint.description,
                                          this.lat,
                                          this.lon,
                                          this.strUTC,
                                          this.errorHandler);
    
    this.widget.mojo.close();
}
