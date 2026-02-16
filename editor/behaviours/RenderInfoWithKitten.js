(function () {

    var renderInfoPanel;


    var renderInfoNeedRecalcs = {
        matrixUpdates: 1,
        matrixWorldUpdates: 1,
        matrixScrollUpdates: 1,
        bindTexturesCount: 1,
        calls: 1,
        canBatch: 1,
        vertices: 1,
        nodesRendered: 1,
        textsRendered: 1,
        frames: 1,
        emittersRendered: 1,
        emittersUpdated: 1,
        textsGenerated: 0
    }

    function recalcRenderInfo(d) {
        if (isNumeric(d)) return round(d);

        if (renderInfoNeedRecalcs[d])
            return round(renderInfo[d] / renderInfo.frames);

        return renderInfo[d]
    }

    function fillInfo(nodeName, args) {

        var nod = renderInfoPanel[nodeName];
        if (!nod) nod = renderInfoPanel[nodeName] = renderInfoPanel.__alias(nodeName)
        var txt = '', delim = '';
        for (var i in args) {
            txt += delim + recalcRenderInfo(args[i]);
            delim = '  ';
        }
        nod.__text = txt;

    }


    addEditorBehaviours({

        renderInfo: function (n) {
            renderInfoPanel = n;

            renderInfoPanel.__traverse( 
                c => {
                    // disable panel render calculations
                    c.__render = function(){
                        var tmp = {};
                        for (var i in renderInfoNeedRecalcs) {
                            tmp[i] = renderInfo[i];
                        }
                        NodePrototype.__render.apply(this, arguments);
                        for (var i in renderInfoNeedRecalcs) {
                            renderInfo[i] = tmp[i];
                        }
                    }
                }
            );

            _setInterval(function () {
                if (renderInfoPanel.__deepVisible()) {
                    fillInfo('matrx', ['matrixUpdates', 'matrixWorldUpdates', 'matrixScrollUpdates']),
                        fillInfo('nodes', ['nodesRendered', 'nodes']),
                        fillInfo('texts', ['textsRendered', 'textsTextures', 'texts', 'textsGenerated']),
                        fillInfo('parts', ['emittersRendered', 'emittersUpdated', 'emitters', 'particles']),
                        fillInfo('buffs', ['totalBuffersCount']),
                        fillInfo('txtrs', ['renderTargetsCount', 'totalTexturesCount', 'bindTexturesCount']),
                        fillInfo('calls', ['calls', 'canBatch']),
                        fillInfo('verts', ['vertices']),
                        fillInfo('fps', [currentFPS])

                    for (var i in renderInfoNeedRecalcs) {
                        renderInfo[i] = 0;
                    }
                }
            }, 0.5);

        }

    });

})();
