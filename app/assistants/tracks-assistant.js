/**
 * ...constructor
*/
function TracksAssistant(){

}

TracksAssistant.getInstance = function(){
    return TracksAssistant.instance;
}

TracksAssistant.prototype.setup = function(){

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

    // load tracks
    try{
        $('trackHeadermsg').update('loading...');
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
        newItem = results.rows.item(0);
        newItem.trackLengthFormated =  Config.getInstance().userDistance( newItem.trackLength , false);
        this.currentModel.items.push(newItem);
        this.trackList.mojo.noticeAddedItems(this.currentModel.items.length, [newItem]);
        //$('trackHeadermsg').update('result: ' + results +"["+results.rows.length+"]");
    }else{
        $('trackHeadermsg').update('DB returned bad result ['+results.rows.length+']');
    }
}

TracksAssistant.prototype.storeGpx = function(name){
    callback = {
        errorHandler : this.createStoreErrorHandler.bind(this),
        successHandler : this.createStoreSuccessHandler.bind(this),
        progress : this.showProgress.bind(this)
    }
    
    Mojotracker.getInstance().storeGpx(this.controller, name, callback);
}

TracksAssistant.prototype.createStoreErrorHandler = function(e){
    this.showDialog("Error",e);
}

TracksAssistant.prototype.createStoreSuccessHandler = function(name){
    this.showDialog("Info","Track stored to "+name);
}

TracksAssistant.prototype.showDialog = function(title, message){    
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

TracksAssistant.prototype.showProgress = function(value, max, message){
    if (this.progressDialog){
        this.progressDialog.setProgress(value, max, message);
        return;
    }
    
    this.progressDialog = new ProgressDialogAssistant(this.controller, value, max, message);
        
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
            item = results.rows.item(i);
            mojotracker.getTrackInfo( item.name, this.createTrackInfoHandler.bind(this), this.tableErrorHandler.bind(this) );
        }
        this.trackCount = results.rows.length;
        this.updateHeader()
    }else{
        $('trackHeadermsg').update('bad DB result...');
    }
}

TracksAssistant.prototype.updateHeader = function(){
        if (this.trackCount == 0)
            $('trackHeadermsg').update('base is empty');
        else
            $('trackHeadermsg').update('loaded '+this.trackCount+' item'+((this.trackCount>1)?'s':''));

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
TracksAssistant.prototype.listDeleteHandler= function(event) {
    Mojo.log("EditablelistAssistant deleting '"+event.item.data+"'.");
    this.currentModel.items.splice(this.currentModel.items.indexOf(event.item), 1);
    Mojotracker.getInstance().removeTrack(event.item.name, this.tableErrorHandler.bind(this));
    
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


