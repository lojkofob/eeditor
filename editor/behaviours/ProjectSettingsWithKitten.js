
var ProjectSettingsWithKitten = {

    panelOptions: {
        name: 'project_settings',
        title: 'Project settings',
        unique: 1,

        headerButtons: [
            {
                t: 'Save', 
                
                f(existingPanel){

                    invokeEventWithKitten("Files.save_json", {
                        path: 'project.json',
                        absolute: 1,
                        data: $filterObject(existingPanel.__objectToChange, v => v != null && v != undefined)
                    });

                } 
            }
        ],
    
        properties: {
            
        },

        panelWidth: 500
    },


    show(){

        if (!Editor.currentProject) return;
        if (!Editor.currentProject.original_settings.editor_properties) {
            AskerWithKitten.ask({ caption: "no editor_properties key in project.json", noinput: 1 });
            return;
        }

        var panel = this.panelOptions;
        panel.object = Editor.currentProject.original_settings;
        panel.properties = Editor.currentProject.original_settings.editor_properties;
        panel.acceptor = 'middle';
    
        var existingPanel = invokeEventWithKitten('Editor.showCustomPanel', panel, {}, 1);
        
        var panelNode = PanelsWithKitten.$(panel.name);
        if (panelNode) {
            var my = __screenSize.y - 100;
            panelNode.__maxsize = { x: panel.panelWidth, y: my - 30 };            
        }

        return panelNode;
    }
    
};


addEditorEvents('ProjectSettings', {

    show(d) { return ProjectSettingsWithKitten.show(d) }
         
}) 



//undebug