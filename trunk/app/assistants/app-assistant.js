
function AppAssistant ()
{
    // Empty
}


AppAssistant.prototype.setup = function()
{
     // Empty
};


/**
 * Handles commands send from the app menu.
 */
AppAssistant.prototype.handleCommand = function(event)
{

    if (event.type == Mojo.Event.command)
    {
        switch (event.command)
        {
            case "about":
                Mojo.Controller.stageController.pushScene("about");
                break;
            case "tracks":
                Mojo.Controller.stageController.pushScene("tracks");
                break;
            case Mojo.Menu.prefsCmd:
                Mojo.Controller.stageController.pushScene("preferences");
                break;
        }
    }
};
