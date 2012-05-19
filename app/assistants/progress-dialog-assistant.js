

function ProgressDialogAssistant(controller, value, max, message, title){
    // Translate view
    $$(".i18n").each(function(e) { e.update($L(e.innerHTML)); });
        
    this.max = max;
    this.value = value;
    this.message = message;
    this.controller= controller;
    this.title = title;
}

ProgressDialogAssistant.prototype.setup = function(widget){
    this.widget = widget;
    
    $('message').innerHTML = this.message;
    $('title').innerHTML = this.title;
    
    this.attr = {
            modelProperty: 'progress'
    };
    this.model = {
            progress: 0
    };
    this.model.progress = this.value / this.max;

    this.controller.listen('progressBar', Mojo.Event.progressComplete, this.complete);
    this.controller.setupWidget('progressBar', this.attr, this.model);
    
}

ProgressDialogAssistant.prototype.reset = function() {
}

ProgressDialogAssistant.prototype.close = function(){
    this.widget.mojo.close();
}

ProgressDialogAssistant.prototype.setProgress = function(value, max, message, title){
    $('title').innerHTML = title;
    $('message').innerHTML = message;
    this.progress = value / max;
    this.model.progress = this.progress;
    this.controller.modelChanged(this.model);
}

ProgressDialogAssistant.prototype.complete = function() {
    Mojo.Log.info('The progress is done.');
}