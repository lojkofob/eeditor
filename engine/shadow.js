
function Shadow(nodeToUpdate, parentNode) {
    var t = this;
    t.__p = {};

    if (nodeToUpdate) {
        t.__nodeToUpdate = nodeToUpdate;
    } else {
        t.__nodeToUpdate = new Node({
            __isShadow: 1,
            ____validToSave: 0,
            __notNormalNode: 1
        });
        t.__node = 1;
        parentNode.__addChildBox(t.__nodeToUpdate);
    }

}

var forceAllShadowsUpdate = 0;
var ShadowPrototype = Shadow.prototype = {
    constructor: Shadow,

    __destruct: function () {
        var t = this;
        var shadowNode = t.__nodeToUpdate;
        if (shadowNode && shadowNode.__isShadow) {
            t.__nodeToUpdate = shadowNode.__removeFromParent();
        }
    },

    __init: function (v) {
        if (isArray(v)) {
            var nv = {};
            if (v[0] != undefined) nv.x = v[0];
            if (v[1] != undefined) nv.y = v[1];
            if (v[2] != undefined) nv.__blur = v[2];
            if (v[3] != undefined) nv.__color = v[3];
            v = nv;
        }
        mergeObj(this, v);
    },

    __update: function () {
        /*
        if (!this.__realEnableShadow)
            return;
        
        var t = this;
        if (!t.__node) return;
        
        if (!t.__needUpdate && !forceAllShadowsUpdate) return;
        
        t.__needUpdate = 0;
        
        var shadowNode = t.__nodeToUpdate,
            parentNode = shadowNode.__parent;
        
        if (!parentNode) return;
        
        parentNode.update(1);
        
        var pn_scale = parentNode.__scale
            , pn_rotate = parentNode.__rotate;
            
        parentNode.__scaleF = 1;
        parentNode.__rotate = 0;
        
        shadowNode.__visible = false;
        
//          consoleLog('update s', this);
        
        var box = parentNode.__getBoundingBox(),
            sz = box.max.__clone().sub(box.min);
        
        if (!parentNode.__simpleBounding) {
            var wp = parentNode.__worldPosition
                , p2 = new Vector2(box.min.x + box.max.x, box.min.y + box.max.y).__divideScalar(2);
            
            shadowNode.__ofs.set( t.x - wp.x + p2.x, t.y + wp.y - p2.y, 0.01 );
        }
        else {
            shadowNode.__ofs.set( t.x, t.y, 0.01 );    
        }
        
        shadowNode.__color = t.__color;

        var blur = t.__blur;
        shadowNode.__lastBlur = blur;

        var sqrtBlur = sqrt(blur) * 10;
        
        var bufferTexture = renderNodeToTexture(parentNode, { __size:new Vector2( (sz.x + sqrtBlur * 2)/2,(sz.y + sqrtBlur * 2)/2 ) });
        
        showImage(bufferTexture);
            
//         consoleLog('update s', this, parentNode);
        var opts = {
            __shader:'blur',
            
            c: shadowNode.__selfColor,
            m: bufferTexture.__texture,
            a: t.__alpha,
            r: sz,
            b: t.__blur
            
        };
        
        sz.x += blur * 2;
        sz.y += blur * 2;
        
        function blurit( x, y, scale ){
            opts.m = bufferTexture.__texture;
            opts.d = new Vector2(x, y);
            var newBufferTexture = renderOverTexture( sz.x, sz.y, opts, scale );
            bufferTexture.__destruct();
            bufferTexture = newBufferTexture;
        }
        
        function blurita(a, b, scale){
            var s = b*sin(a), c = b*cos(a);
            blurit( s, c, scale );
        }
        
        if (blur) {
            blurita(1, sqrt(blur), 0.9);
            blurita(1+PI2, sqrt(blur), 0.9);
            for (var i = 1; i < sqrt(blur); i++){
                if (i%2){
                    blurita(0 + i, sqrt(blur-3 - random()), 0, 0.86);
                } else {
                    blurita(PI + i, sqrt(blur-3- random()), 0.91);
                }
            }
        } else {
            blurit(0,0);
        }

        if (shadowNode.map) shadowNode.map.__destruct();
        if (shadowNode.__bufferTexture) shadowNode.__bufferTexture.__destruct();
        
        
        var scale = 1 + blur * 10;
        sz.x += scale;
        sz.y += scale;
        
        parentNode.__scale = pn_scale;
        parentNode.__rotate = pn_rotate;
        
        shadowNode.__init({
            __size: sz,
            __visible: 1,
            map : bufferTexture.__texture,
            __shader : 'color',
            __bufferTexture : bufferTexture
        });
        
        shadowNode.update();*/
    }
};

ObjectDefineProperties(ShadowPrototype, addProps({
    __color: 0
    , __blur: 0
    , x: 0
    , y: 0
    , __alpha: 1
    , __blending: 0
}));
