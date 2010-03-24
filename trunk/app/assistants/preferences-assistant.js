
PreferencesAssistant = function(){
    
}

PreferencesAssistant.prototype.setup = function(){

    // Define models for each selctor
    this.unitsAttributes = {
        label: $L('Units'),
        choices: [
            {label: $L('Metric'), value: Config.METRIC},
            {label: $L('Imperial'), value: Config.IMPERIAL}
        ],

        // Store selected value in 'firstValue' instead of the default of 'value'
        //	When a new item is chosen from the selector, the event handler (in this case this.selectorChanged)
        //  gets passed an event with a value property (e.value) that is the new value and a model property that
        //	includes the updated model (new value can be accessed from e.model.firstValue in this case)
        modelProperty:'unitsValue'
    };
    // Define models for each selctor
    this.posFormatAttributes = {
        label: $L('Degrees'),
        choices: [
            {label: $L('49°8\'6.22"'), value: Config.DEFAULT},
            {label: $L('49.135060'), value: Config.DEGREES}
        ],
        modelProperty:'posFormat'
    };
    this.unitsModel.unitsValue = Config.getInstance().getUnits();
    this.posFormatModel.posFormat = Config.getInstance().getPosFormat();
    
    this.splitAttributes = {
            property: "value",
            trueValue: "ON",
            falseValue: "OFF",
            fieldName: 'checkboxstuff'
    };
    this.splitModel = {
            value: "ON",
            disabled: false
    };
    this.splitModel.value = Config.getInstance().splitExportFiles() ? "ON": "OFF";
    
    
    //	Instantiate each selector
    this.controller.setupWidget('unitsSelector',  this.unitsAttributes, this.unitsModel);
    this.controller.setupWidget('posFormatSelector',  this.posFormatAttributes, this.posFormatModel);
    this.controller.setupWidget('split-checkbox', this.splitAttributes, this.splitModel);


    // Events
    //	Use controller.listen() and remember to .stopListening() in .cleanup() until
    //	the framework is updated to do that for itself. Helps with memory management
    this.controller.listen('unitsSelector', Mojo.Event.propertyChange, this.selectorChanged.bind(this));
    this.controller.listen('posFormatSelector', Mojo.Event.propertyChange, this.posFormatChanged.bind(this));    
    this.controller.listen('split-checkbox', Mojo.Event.propertyChange, this.splitFileChanged);
    
    
}

PreferencesAssistant.prototype.selectorChanged = function(event) {
    Config.getInstance().setUnits( this.unitsModel.unitsValue );
}

PreferencesAssistant.prototype.posFormatChanged = function(event) {
    Config.getInstance().setPosFormat( this.posFormatModel.posFormat );
}

PreferencesAssistant.prototype.splitFileChanged = function(event){
    Config.getInstance().setSplitExportFiles( event.value == "ON" );
}

PreferencesAssistant.prototype.cleanup = function(){
    // We need to manually stop listening to events until the framework is updated to clean these up automatically
    this.controller.stopListening('unitsSelector', Mojo.Event.propertyChange, this.selectorChanged.bind(this));
}

PreferencesAssistant.prototype.unitsModel = {
    unitsValue: Config.METRIC
};

PreferencesAssistant.prototype.posFormatModel = {
    posFormat : Config.DEFAULT
};
