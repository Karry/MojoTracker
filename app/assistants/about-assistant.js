/**
 * ...constructor
*/
function AboutAssistant()
{
    
}


AboutAssistant.prototype.setup = function(){
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu,
	    {
		omitDefaultItems: false
	    },
	    {
		visible: true,
		items:
		[
		    { label: "Saved tracks", command: "tracks" },
		    { label: "Preferences", command: "preferences" },
		    { label: "About", command: "about" }
		]
	    }
	);
    
}

