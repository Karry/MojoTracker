/**
 * ...constructor
*/
function TracksAssistant(){

}

TracksAssistant.getInstance = function(){
    return TracksAssistant.instance;
}

TracksAssistant.prototype.setup = function(){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });

    TracksAssistant.instance = this;

    // Set up a few models so we can test setting the widget model:
    this.currentModel = {listTitle:$L('Saved tracks'), items:[]};

    // Store references to reduce the use of controller.get()
    this.trackList = this.controller.get('trackList');

    // Bind event handlers ahead of time so we have references we can use in cleanup
    this.listChangeHandler = this.listChangeHandler.bind(this);
    this.listAddHandler = this.listAddHandler.bind(this);
    this.listDeleteHandler = this.listDeleteHandler.bind(this);
    this.listReorderHandler = this.listReorderHandler.bind(this);
    this.handleTrackTap = this.handleTrackTap.bind(this);

    // Set up the attributes for the list widget:
    this.trackAtts = {
            itemTemplate:'tracks/listitem',
            listTemplate:'tracks/listcontainer',
            showAddItem:false,
            swipeToDelete:true,
            reorderable:false,
            emptyTemplate:'tracks/emptylist'
    };

    this.controller.setupWidget('trackList', this.trackAtts , this.currentModel);


    // Events
    //	Use controller.listen() and remember to .stopListening() in .cleanup() until
    //	the framework is updated to do that for itself. Helps with memory management
    this.controller.listen(this.trackList, Mojo.Event.listChange, this.listChangeHandler);
    this.controller.listen(this.trackList, Mojo.Event.listAdd, this.listAddHandler);
    this.controller.listen(this.trackList, Mojo.Event.listDelete, this.listDeleteHandler);
    this.controller.listen(this.trackList, Mojo.Event.listReorder, this.listReorderHandler);
    this.controller.listen(this.trackList, Mojo.Event.listTap, this.handleTrackTap);

	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu,
	    {
		omitDefaultItems: true
	    },
	    {
		visible: true,
		items:
		[
		    { label: $L("Export All as GPX"), command: "exportAllGpx" },
		    { label: $L("Export All as KML"), command: "exportAllKml" },
		    { label: $L("Export All Waypoints"), command: "exportAllWaypoints" },
		]
	    }
	);

    // load tracks
    try{
        $('trackHeadermsg').update( $L('Loading...'));
        mojotracker = Mojotracker.getInstance();
        mojotracker.getTrackNames( this.createTrackNamesHandler.bind(this), this.tableErrorHandler.bind(this) );
    }catch (e){
        $('trackHeadermsg').update("DB Error: " + e);
    }

}

TracksAssistant.prototype.reveal = function(){
    this.trackList.mojo.revealItem(350, true);
}

TracksAssistant.prototype.tableErrorHandler = function(transaction, error){
    $('trackHeadermsg').update('table Error was ' + error.message + ' (Code ' + error.code + ')');
    return true;
}

TracksAssistant.prototype.createTrackInfoHandler = function(transaction, results){
    if ((results.rows) && (results.rows.length == 1)){
        newItem = Object.clone( results.rows.item(0) );
		if (newItem.start)
			newItem.startDateShort = Config.getInstance().formatUTCShortDateAndTime(
									new Date( Date.parse( newItem.start.replace("T"," ").replace("Z"," ")) ) );
        newItem.trackLengthFormated =  Config.getInstance().userDistance( newItem.trackLength , false);
		newItem.lengthLabel = $L('length');
		newItem.nodesLabel = $L('nodes');
        this.currentModel.items.push(newItem);
        this.trackList.mojo.noticeAddedItems(this.currentModel.items.length, [newItem]);
        //$('trackHeadermsg').update('result: ' + results +"["+results.rows.length+"]");
    }else{
        $('trackHeadermsg').update('DB returned bad result ['+results.rows.length+']');
    }
}

TracksAssistant.prototype.exportData = function(track, type){
    callback = {
        errorHandler : this.createStoreErrorHandler.bind(this),
        successHandler : this.createStoreSuccessHandler.bind(this),
        progress : this.showProgress.bind(this)
    }
    
    Mojotracker.getInstance().exportData(this.controller, track, callback, type);
}

TracksAssistant.prototype.exportAll = function(type){

	var activity = new MojoActivity(this.controller, {
			activityReset : function(){},
			activityFailed : function(){}
		});

	var index = -1;
    var callback = {
        errorHandler : function(){
			activity.destroy();
			this.createStoreErrorHandler();
		}.bind(this),
        successHandler : null,
        progress : this.showProgress.bind(this)
    }
	
	callback.successHandler = function(){
				index ++;
				if (this.currentModel.items.length == index){
					activity.destroy();
					this.showDialog( $L("Exported #{count} tracks.").interpolate(
												{count:this.currentModel.items.length}));
				}else{
					Mojotracker.getInstance().exportData(
							this.controller,
							this.currentModel.items[index],
							callback, type);
				}
			}.bind(this),
	// start export all tracks...
	callback.successHandler();
}

TracksAssistant.prototype.handleTrackTap = function(event){

	var trackPopupModel;
    trackPopupModel = [
        {label: $L('Info'), command: 'info'},
        {label: $L('Rename'), command: 'rename'},
        {label: $L('Export as GPX'), command: 'gpx-export'},
        {label: $L('Export as KML'), command: 'kml-export'},
        {label: $L('Export Waypoints'), command: 'loc-export'},
        {label: $L('Delete'), command: 'delete'}
    ];
    this.controller.popupSubmenu({
        onChoose: function(response){
            if (response == 'info') {
                this.showInfo( event.item );
            } else if (response == 'rename') {
					this.dialog = new InputDialogAssistant(this.controller,
								"Enter new name",
								event.item.display_name,
								function(value){
									Mojotracker.getInstance().rename(event.item, value,
												this.itemModified.bind(this),
												function(tx, e){this.showDialog($L("Error"),e+" "+JSON.stringify(e));}.bind(this));
								}.bind(this),
								function(e){
									this.showDialog($L("Error"),e);
								}.bind(this));
						
					this.controller.showDialog({
							template: 'dialogs/simple-input-dialog',
							assistant: this.dialog,
							preventCancel:false
					 });
            } else if (response == 'gpx-export') {
                this.exportData( event.item, 'gpx' );
            } else if (response == 'kml-export') {
                this.exportData( event.item, 'kml' );
            } else if (response == 'loc-export') {
                this.exportData( event.item, 'loc' );
            } else if (response == 'delete') {
                this.controller.showAlertDialog({
                    onChoose: function(value) {
                        if (value == 'yes') {
                            this.listDeleteHandler(event);
                        }
                    }.bind(this),
                    title: $L("Delete?"),
                    message: $L("Are you sure you want to delete the track #{trackname}?")
                            .interpolate({trackname:"\"" + event.item.display_name +"\""}),
                    choices:[
                        {label:$L('Yes'), value:"yes", type:'affirmative'},
                        {label:$L('No'), value:"no", type:'negative'}
                    ]
                });
            }else{
				Mojo.Log.error("undefined command ("+response+")");
			}
        },
        placeNear: event.originalEvent.target,
        items: trackPopupModel
    });
};

TracksAssistant.prototype.itemModified = function(item){
	//Mojo.Log.error("item modified "+item.name+" > "+item.display_name);
	for (i = 0; i< this.currentModel.items.length; i++){
		if (this.currentModel.items[i].name == item.name){
			this.currentModel.items[i] = item;
			break;
		}
	}
	this.controller.modelChanged(this.currentModel, this);
}

TracksAssistant.prototype.showInfo = function( myItem ){
    Mojo.Controller.stageController.pushScene("info",{item: myItem});
}

TracksAssistant.prototype.createStoreErrorHandler = function(e){
    this.showDialog($L("Error"),e);
}

TracksAssistant.prototype.createStoreSuccessHandler = function(name){
    this.showDialog($L("dialog.exportInfoTitle"),$L("Track stored to #{trackname}.").interpolate({trackname:"\"" + name +"\""}));
}

TracksAssistant.prototype.showDialog = function(title, message){    
    if (this.progressDialog){
        this.progressDialog.close();
        this.progressDialog = null;
    }
	if (message==null)
		Mojo.Log.error("message for dialog is null "+message);

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

TracksAssistant.prototype.showProgress = function(value, max, message, trackname){
	var title = $L('dialog.exportTitle #{trackname}').interpolate(
												{trackname:"\"" + trackname +"\""});
    if (this.progressDialog){
        this.progressDialog.setProgress(value, max, message, title);
        return;
    }
    
    this.progressDialog = new ProgressDialogAssistant(this.controller, value, max, message, title);
        
    this.controller.showDialog({
           template: 'dialogs/progress-dialog',
           assistant: this.progressDialog,
           preventCancel:true
     });
}

TracksAssistant.prototype.createTrackNamesHandler = function(transaction, results) {
    //$('trackHeadermsg').update('result: ' + results +"["+results.rows.length+"]");
    mojotracker = Mojotracker.getInstance();

    if (results.rows){
        for (i = 0; i< results.rows.length; i++){
            item = Object.clone( results.rows.item(i) );
            mojotracker.getTrackInfo( item, this.createTrackInfoHandler.bind(this), this.tableErrorHandler.bind(this) );
        }
        this.trackCount = results.rows.length;
        this.updateHeader()
    }else{
        $('trackHeadermsg').update($L('bad DB result...'));
    }
}

TracksAssistant.prototype.updateHeader = function(){
	if (this.trackCount < 5)
		$('trackHeadermsg').update( $L('trck.savedTracks_' + this.trackCount) );
	else
		$('trackHeadermsg').update(''+this.trackCount+' '+ $L('trck.savedTracks_many') );
}

// Called for Mojo.Event.listAdd events.
// Adds a new item to the list.
TracksAssistant.prototype.listAddHandler = function(event ) {
    /*
    // This works, but refreshes the whole list:
    this.currentModel.items.push({data:"New item"});
    this.controller.modelChanged(this.currentModel, this);
    */

    // The 'noticeAddedItems' API will inserts the item where indicated,
    // and then the list can potentially update only the added item.
    var newItem = {data:$L("New item")};
    this.currentModel.items.push(newItem);
    this.trackList.mojo.noticeAddedItems(this.currentModel.items.length, [newItem]);
}



// Called for Mojo.Event.listDelete events.
// Removes the deleted item from the model (and would persist the changes to disk if appropriate).
// The list's DOM elements will be updated automatically, unless event.preventDefault() is called.
TracksAssistant.prototype.listDeleteHandler = function(event) {
    if (event.item.name == Mojotracker.getInstance().getCurrentTrack()){
        this.showDialog($L("Error"),$L("It is open track! Nothing will be done."));
        return false;
    }
    //this.showDialog("event", event.type+"/"+(typeof event.type));
    this.currentModel.items.splice(this.currentModel.items.indexOf(event.item), 1);
    Mojo.log("EditablelistAssistant deleting '"+event.item.data+"'.");
    Mojotracker.getInstance().removeTrack(event.item.name, this.tableErrorHandler.bind(this));
    if (event.type == "mojo-list-tap") // event from context menu, not from "slide" delete
        this.controller.modelChanged(this.currentModel);
    
    this.trackCount --;
    this.updateHeader();
}

// Called for Mojo.Event.listReorder events.
// Modifies the list item model to reflect the changes.
TracksAssistant.prototype.listReorderHandler= function(event) {
    this.currentModel.items.splice(this.currentModel.items.indexOf(event.item), 1);
    this.currentModel.items.splice(event.toIndex, 0, event.item);
}

// Called for Mojo.Event.listChange events, which are sent when a 'change' event comes from a list item.
// Saves the new value into the model.
TracksAssistant.prototype.listChangeHandler= function(event) {
    if(event.originalEvent.target.tagName == "INPUT") {
        event.item.data = event.originalEvent.target.value;
        Mojo.Log.info("Change called.  Word is now: "+event.item.data);
    }
}


