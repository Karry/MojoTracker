/**
 * singleton helper library for mojotracker app
*/

/**
 * constructor
 */
function Mojotracker(){
    Mojo.log("Mojotracker constructor...");
    this.dbConnect();
}

Mojotracker.instance = null;

Mojotracker.getInstance = function(){
    if (!this.instance)
        this.instance = new Mojotracker();
    return this.instance;
};

Mojotracker.prototype.db = null;

Mojotracker.prototype.tracename = null;

Mojotracker.prototype.dbConnect = function(){
    // Open DB to store tracks
    this.db = openDatabase('ext:OsmDb', '', 'Sample Data Store', 65536);
}

Mojotracker.prototype.createTrack = function(name, errorHandler){
    if (!this.db){
        Mojo.log("no db!");
        return;
    }

    if (this.tracename)
        closeTrack();
        
    // create table
    this.tracename = name;
    var strSQL = 'CREATE TABLE ' + this.tracename + ' (lat TEXT NOT NULL DEFAULT "nothing", lon TEXT NOT NULL DEFAULT "nothing", altitude TEXT NOT NULL DEFAULT "nothing", time TEXT NOT NULL DEFAULT "nothing"); GO;';
    this.db.transaction
    ( 
            (function (transaction)
            {
                    transaction.executeSql('DROP TABLE IF EXISTS ' + this.tracename + '; GO;', []);
                    transaction.executeSql(strSQL, [], this.createTableDataHandler.bind(this), errorHandler);
            } ).bind(this) 
    );
    this.total = 0;
}

Mojotracker.prototype.isActive = function( name){
    return this.tracename == name;
}

Mojotracker.prototype.addNode = function( lat, lon, alt, strUTC, errorHandler ){
    if ((!this.tracename) || (!this.db)){
        Mojo.log("no track is opened");
        return;
    }
    
    var strSQL = 'INSERT INTO ' + this.tracename + ' (lat, lon, altitude, time) VALUES ("' + lat + '","' + lon + '","' + alt + '","' + strUTC + '"); GO;';
    this.executeSQL(strSQL, this.createRecordDataHandler.bind(this), errorHandler); 
    this.total ++;
}

Mojotracker.prototype.getTrackNames = function(resultHandler, errorHandler){
    var strSQL = "SELECT `name` FROM sqlite_master WHERE type='table' AND `name` LIKE 'G%' ORDER BY `name`; GO;";
    this.executeSQL(strSQL, resultHandler, errorHandler); 
}

Mojotracker.prototype.executeSQL = function(strSQL, resultHandler, errorHandler){
    this.db.transaction(
        (
            function (transaction){
                transaction.executeSql(strSQL, [], resultHandler, errorHandler);
            }
        ).bind(this) 
    );    
}

Mojotracker.prototype.removeTrack = function(name, errorHandler){
    if (this.isActive(name))
        return;
    
    var strSQL = "DROP TABLE `"+name+"`; GO;";
    this.executeSQL(strSQL, this.createRecordDataHandler.bind(this), errorHandler);
}


Mojotracker.prototype.getTrackInfo = function( name, infoHandler, errorHandler ){
    var strSQL = "SELECT '"+name+"' AS name, COUNT(*) AS nodes, MIN(`time`) AS start, MAX(`time`) AS stop FROM `"+name+"` ; GO;";
    this.executeSQL(strSQL, infoHandler, errorHandler);
}

Mojotracker.prototype.getNodes = function(){
    return this.total;
}

Mojotracker.prototype.closeTrack = function(){
    this.tracename = null;
}

Mojotracker.prototype.createTableDataHandler = function(transaction, results) {
    // nothing to do 
} 

Mojotracker.prototype.createRecordDataHandler = function(transaction, results) {	
    // nothing to do 
}

Mojotracker.prototype.storeGpx = function(name, errorHandler, successHandler) {
    try {
        /*
        this.controller.serviceRequest('palm://ca.canucksoftware.filemgr', {
                method: 'createFile',
                parameters: {
                        path: "/media/internal/MapTool",
                        newFile: name + ".loc",
                        offset: 0
                },
                onSuccess: function() {this.createLocFile(tx, result, name);}.bind(this),
                onFailure: errorHandler
        });
        */
        errorHandler("Not implemented yet.");
    } catch (e) {
        Mojo.Log.error("Catch in storeGpx");
        errorHandler(e);
    }
}

