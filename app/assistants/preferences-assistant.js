
PreferencesAssistant = function(){
    
}

PreferencesAssistant.prototype.setup = function(){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });

    // Define models for each selctor
    this.unitsAttributes = {
        label: $L('prefer.units'),
        choices: [
            {label: $L('prefer.metric'), value: Config.METRIC_UNITS},
            {label: $L('prefer.imperial'), value: Config.IMPERIAL_UNITS}
        ],

        // Store selected value in 'firstValue' instead of the default of 'value'
        //	When a new item is chosen from the selector, the event handler (in this case this.selectorChanged)
        //  gets passed an event with a value property (e.value) that is the new value and a model property that
        //	includes the updated model (new value can be accessed from e.model.firstValue in this case)
        modelProperty:'unitsValue'
    };
    this.unitsModel = {
        unitsValue: Config.METRIC_UNITS
    };
    this.unitsModel.unitsValue = Config.getInstance().getUnits();
    
    // --------------------------------------------------------------------------
    this.posFormatAttributes = {
        label: $L('prefer.degrees'),
        choices: [
            {label: $L('49°08\'06.22"'), value: Config.DEFAULT_POS_FORMAT},
            {label: $L('49°08.104\''), value: Config.GEOCACHING_POS_FORMAT},
            {label: $L('49.135060'), value: Config.DEGREES_POS_FORMAT}
        ],
        modelProperty:'posFormat'
    };
    this.posFormatModel = {
        posFormat : Config.DEFAULT_POS_FORMAT
    };        
    this.posFormatModel.posFormat = Config.getInstance().getPosFormat();
    
    // --------------------------------------------------------------------------
    this.exportFormatAttributes = {
        label: $L('prefer.format'),
        choices: [
            {label: $L('gpx'), value: "gpx"},
            {label: $L('kml'), value: "kml"}
        ],
        modelProperty:'exportFormat'
    };
    this.exportFormatModel = {
        exportFormat : Config.DEFAULT_EXPORT_FORMAT
    };        
    this.exportFormatModel.exportFormat = Config.getInstance().getExportFormat();

    // --------------------------------------------------------------------------
    this.localeAttributes = {
        label: $L('prefer.language'),
        choices: [
            {label: $L('prefer.english'), value: "en_us"},
            {label: $L('prefer.czech'), value: "cs"}
        ],
        modelProperty:'locale'
    };
    this.localeModel = {
        locale : 'en_us'
    };        
    this.localeModel.locale = Config.getInstance().getLocale();

    // --------------------------------------------------------------------------
    this.splitAttributes = {
            property: "value",
            trueValue: true,
            falseValue: false,
            fieldName: 'checkboxstuff'
    };
    this.splitModel = {
            value: true,
            disabled: false
    };
    this.splitModel.value = Config.getInstance().splitExportFiles();

    // --------------------------------------------------------------------------    
    
    //	Instantiate each selector
    this.controller.setupWidget('unitsSelector',  this.unitsAttributes, this.unitsModel);
    this.controller.setupWidget('posFormatSelector',  this.posFormatAttributes, this.posFormatModel);
    this.controller.setupWidget('exportFormatSelector',  this.exportFormatAttributes, this.exportFormatModel);
    this.controller.setupWidget('splitCheckbox', this.splitAttributes, this.splitModel);
    this.controller.setupWidget('localeSelector',  this.localeAttributes, this.localeModel);

    // Events
    //	Use controller.listen() and remember to .stopListening() in .cleanup() until
    //	the framework is updated to do that for itself. Helps with memory management
    this.controller.listen('unitsSelector', Mojo.Event.propertyChange, this.selectorChanged.bind(this));
    this.controller.listen('posFormatSelector', Mojo.Event.propertyChange, this.posFormatChanged.bind(this));    
    this.controller.listen('exportFormatSelector', Mojo.Event.propertyChange, this.exportFormatChanged.bind(this));    
    this.controller.listen('splitCheckbox', Mojo.Event.propertyChange, this.splitFileChanged.bind(this));
    this.controller.listen('localeSelector', Mojo.Event.propertyChange, this.localeChanged.bind(this));    
}

PreferencesAssistant.prototype.selectorChanged = function(event) {
    Config.getInstance().setUnits( this.unitsModel.unitsValue );
}

PreferencesAssistant.prototype.posFormatChanged = function(event) {
    Config.getInstance().setPosFormat( this.posFormatModel.posFormat );
}

PreferencesAssistant.prototype.exportFormatChanged = function(event) {
    Config.getInstance().setExportFormat( this.exportFormatModel.exportFormat );
}

PreferencesAssistant.prototype.localeChanged = function(event) {
    Config.getInstance().setLocale( this.localeModel.locale );
}

PreferencesAssistant.prototype.splitFileChanged = function(event){
    Config.getInstance().setSplitExportFiles( event.value );
}

PreferencesAssistant.prototype.cleanup = function(){
    // We need to manually stop listening to events until the framework is updated to clean these up automatically
    this.controller.stopListening('unitsSelector', Mojo.Event.propertyChange, this.selectorChanged.bind(this));
    this.controller.stopListening('posFormatSelector', Mojo.Event.propertyChange, this.posFormatChanged.bind(this));    
    this.controller.stopListening('splitCheckbox', Mojo.Event.propertyChange, this.splitFileChanged.bind(this));
}


