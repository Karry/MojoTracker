

function InputDialogAssistant(controller, title, value, handler, errorHandler){

    this.controller= controller;
    this.model = {
        value: value
        };
	this.title = title;
    this.handler = handler;
	this.errorHandler = errorHandler;
}

InputDialogAssistant.prototype.setup = function(widget){
    this.widget = widget;

    $('title').innerHTML = $L(this.title);

    this.controller.setupWidget(
        "input",
        this.attributes = {
            modelProperty: "value",
            limitResize: true,
            textReplacement: false,
            enterSubmits: false
        },
		this.model
    );
    
	$('okBtn').innerHTML = $L('OK');
    this.controller.get('saveButton').addEventListener(Mojo.Event.tap, this.handleSave.bind(this));
}

InputDialogAssistant.prototype.reset = function() {
}

InputDialogAssistant.prototype.close = function(){
    this.widget.mojo.close();
}

InputDialogAssistant.prototype.handleSave = function(){
    try{
        if (this.model.value == "")
            return;
        // call handler
		this.handler(this.model.value);
        
        this.widget.mojo.close();
    }catch(e){
        this.errorHandler( e);
    }
}
