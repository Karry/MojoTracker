/**
 * ...constructor
*/
function AboutAssistant(){
    
}

AboutAssistant.prototype.setup = function(){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });
    
    try{
        new Ajax.Request('http://www.ohloh.net/p/MojoTracker/widgets/project_users.html', {
            method: "GET",
            onSuccess: function(response){
                $('widget').innerHTML = response.responseText;
                Mojo.log("we get '"+response.responseText+"'");
            },
            onFailure: function(e){
                Mojo.Log.error("it fails "+JSON.stringify(e));
            }
        });
    }catch(e){
        Mojo.Log.error("Ajax fails "+JSON.stringify(e));
    }
}

