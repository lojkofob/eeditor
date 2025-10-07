    
function fallbackCopyTextToClipboard(text) {

    var sp = __document.createElement('span');
    try {
        __document.body.appendChild(sp);
        sp.innerText = inputText;
        var r = __document.createRange();
        r.selectNode(sp);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        successful = __document.execCommand("copy");
    } catch (e) { }
    __document.body.removeChild(sp);

    if (successful) {
        return true;
    }

    var textArea = __document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    try {
        __document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        successful = __document.execCommand('copy');
    } catch (e) { }
    __document.body.removeChild(textArea);
    return successful;
}

function getClipboardPermission(onSuccess, onFail) {
    try { 
        navigator.permissions.query( { name: "clipboard-read" } ).then(result => {
            if( result.state != 'denied' ) {
                try { 
                    onSuccess && onSuccess()
                } catch(ex) {
                    onFail && onFail(ex);
                }
            } else {
                onFail && onFail('denied');
            }
        }, onFail);
    } catch(ex) {
        onFail && onFail(ex);
    }
}

function readTextFromClipboard(onSuccess, onFail) {
    getClipboardPermission(a => {
        navigator.clipboard.readText().then(onSuccess, onFail);
    }, onFail)
}

function readDataFromClipboard(onSuccess, onFail) {
    var onFail2 = ex => { 
        if (ex == 'denied') {
            onFail && onFail(ex); 
        }
        else {
            if (ex) consoleError(ex); 
            try { 
                navigator.clipboard.readText().then(onSuccess, onFail);
            } catch(ex) {
                onFail && onFail(ex);
            }
        }
    };

    getClipboardPermission(a => {

        navigator.clipboard.read().then(item_list => {
            try {
                console.log( item_list );
                function findByType(t) {
                    var item_type;
                    var item = item_list.find( item => 
                        item.types.some( type => {
                            if (type.startsWith(t)) {
                                item_type = type; 
                                return true;
                            }
                        })
                    );
                    if (item) {
                        return { item: item, type: item_type }
                    }
                }

                function processType(t, func) {
                    var item = findByType(t)
                    if (item) {
                        var r = 1;
                        var type = item.type;
                        item.item.getType( item.type ).then( blob => {
                            try { r = blob && func(type, blob); } catch(ex) { onFail2(ex); }
                        }, onFail2);
                        return r;
                    }
                }
                 
                processType('image/', (type, blob) => {
                    var url = URL.createObjectURL(blob);
                    var image_name = url.split('/');
                    var isJPEG = type.search(/(jpg|jpeg)/) > 0;
                    image_name = image_name[image_name.length - 1];
                    image_full_name = 'blob/' + image_name + '.' + ( isJPEG ? 'jpg' : 'png' );
                    globalConfigsData.__images[image_name] = url;
                    globalConfigsData.__images[image_full_name] = url;

                    onSuccess({ 
                        type: "image",
                        url: url, 
                        name: image_name,
                        full_name: image_full_name
                    });
                }) || 
                processType('text/', (type, blob) => {
                    blob.text().then(onSuccess, onFail2);
                });
                
            } catch(ex){
                onFail2(ex);
            }

        }, onFail2);

    }, onFail2)
    
}


function copyTextToClipboard(inputText, onSuccess, onFail) {
    try { navigator.clipboard.writeText(inputText).then(onSuccess, onFail); } catch (ex) {
        try { fallbackCopyTextToClipboard(inputText) ? onSuccess && onSuccess() : onFail && onFail(); } catch (ex) { 
            onFail && onFail(ex);
        }
    }
}
