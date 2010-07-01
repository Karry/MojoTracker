/**
 * ...constructor
*/
function AboutAssistant()
{
    
}


AboutAssistant.prototype.setup = function(){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });
}

