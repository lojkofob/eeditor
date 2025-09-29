
var ph_Engine, ph_Bodies, ph_World, ph_Body, ph_Vertices, ph_Sleeping;
 

var PH_B_RECTANGLE = 0
    , PH_B_CIRCLE = 1;

function initPhysics() {
    if (!ph_Engine) {
        var Engine = Matter.Engine;

        // create an engine
        ph_Engine = Engine.create();

        // run the engine
        // Engine.run(ph_Engine);

        ph_Engine.enableSleeping = 1;
        
        ph_Engine.__update = function(t,dt){
            
            if (!ph_Engine.__disabled) {
                
                Engine.update(ph_Engine, dt);
                
            }
            
        };
        
        ph_Bodies = Matter.Bodies;
        ph_World = Matter.World;
        ph_Body = Matter.Body;
        ph_Vertices = Matter.Vertices;
        ph_Sleeping = Matter.Sleeping;
        
        updatable.push(ph_Engine);
        
    }
}


function nodeRender(){
	var node = this;
	var body = node.__ph_body;
	if (body && !body.isSleeping && !ph_Engine.__disabled){
		
        node.____rotation = -body.angle; 
        node.__offset.x = body.position.x;
        node.__offset.y = body.position.y;
        
        if (!body.isStatic){
            node.__matrixNeedsUpdate = 1;
        }
    
	}
	
	return NodePrototype.__render.apply(this, arguments);
}

function nodeUpdateVertices(){
    
	var node = this;
    
	NodePrototype.__updateVertices.apply(node, arguments);
    
    var body = node.__ph_body;
    if (body) {
        if (!(node.__needUpdate && node.__needUpdateDeep)) {
            node.__ph_updateBody();
            return node;
        }
        
        ph_World.remove(ph_Engine.world, [body]);
    }

    var ofs = node.__offset, sz = node.__size, x = sz.x/2, y = sz.y/2;
    
    var newbody;
    //TODO:
//     switch ( node.__physics.__bodyType ){
//         
//         
//     }
     
    newbody = ph_Bodies.rectangle( ofs.x, ofs.y, sz.x, sz.y, node.__physicsBodyOpts );
    
    newbody.lsx = x;
    newbody.lsy = y;
            
    ph_World.add(ph_Engine.world, [newbody]);
    node.__ph_body = newbody;
    if (body) {
        newbody.isSleeping = body.isSleeping;
    }
    
    node.__ph_updateBody();
    
	return node;
}


ObjectDefineProperties( NodePrototype, {
	__physics: {
	
		set: function(v){
            var t = this;
            t.__dirty = 3;
            if (v) {
                console.log(v);
                
                /*
                 var defaults = {
                    
                    torque: 0,
                    positionImpulse: { x: 0, y: 0 },
                    speed: 0,
                    angularSpeed: 0,
                    velocity: { x: 0, y: 0 },
                    angularVelocity: 0,
                    isStatic: false,
                    
                    motion: 1,
                    sleepThreshold: 60,
                    density: 0.001,
                    restitution: 0,
                    friction: 0.1,
                    frictionAir: 0.01,
                    groupId: 0,
                 }
                */
            
				if (!isObject(v)) v = {};
                       
                v = mergeObjExclude(
                    deepCloneNotNull(v),
                    {
                        __isStatic: false,
                        __friction: 10, 
                        __frictionAir: 1,
                        __frictionStatic: 50,
                        __restitution: 0,
                        __density: 1,
                        __bodyType: PH_B_RECTANGLE
                    }
                );
                
                t.__physicsBodyOpts = {
                    isStatic: v.__isStatic,
                    friction: v.__friction / 100,
                    frictionAir: v.__frictionAir / 100,
                    frictionStatic: v.__frictionStatic / 100,
                    restitution: v.__restitution / 100,
                    density: v.__density / 1000
                };
                
                
				t.__render = nodeRender;
                t.__updateVertices = nodeUpdateVertices;
				t.__onDestruct = overloadMethod( t.__onDestruct , function(){ t.__physics = 0; } );
				
			} else {
			
                if (t.__ph_body){
                    ph_World.remove(ph_Engine.world, [t.__ph_body]);
                    delete t.__ph_body;
                }
                
                delete t.__physicsBodyOpts;
                
				t.__render = NodePrototype.__render;
				t.__updateVertices = NodePrototype.__updateVertices;
			}
			
			t.____physics = v;
		},
		
		get: function(){
			return this.____physics;
		}

	}
})

mergeObj(NodePrototype,{
    
    __ph_sleep: function(tm){
         var t = this; 
         if (t.__sleepTimeout) t.__sleepTimeout = _clearTimeout(t.__sleepTimeout);
         if (t.__ph_body) {
            ph_Sleeping.set(t.__ph_body, 1);
            if (tm){
                t.__ph_awake(tm);
            }
         }
    },
    __ph_awake(delay){
        var t = this;
        if (t.__sleepTimeout) t.__sleepTimeout = _clearTimeout(t.__sleepTimeout);
        if (delay) {
            t.__sleepTimeout = _setTimeout(a => {  t.__sleepTimeout = 0; t.__ph_awake() }, delay);
        } else if (t.__ph_body) {
            ph_Sleeping.set(t.__ph_body, 0);
        }
    },

    __ph_updateBody: function(){
        var t = this; 
        if (t.__ph_body) {
            ph_Body.setPosition( t.__ph_body, t.__offset );
			ph_Body.setAngle( t.__ph_body,  -t.____rotation );
        }
    }
    
});


BUS.__addEventListener({
    __ON_GAME_LOADED: function(){
        initPhysics();
        return 1;
    }
});


//debug

if (typeof EditorEventsWithKitten != undefinedType) {

    BUS.__addEventListener({
        
        EDITOR_PREPARED:function(){
            initPhysics();
            ph_Engine.__disabled = 1;
            return 1;
        },
        
        PROJECT_OPENED: function(){
            initPhysics();
            ph_Engine.__disabled = 1;
            return 1;
        },
        
        __ANIMATION_STARTED: function(){
            
            ph_Engine.__disabled = 0;
            
            $each( ph_Engine.world.bodies, function(b){ ph_Sleeping.set(b, 0); } );
            
        },
        
        __ANIMATION_STOPPED: function(){
            
            ph_Engine.__disabled = 1;
            
        },
        
        __OBJECT_CHANGED_set: function(t, change){
            var node = change.node;
            if (node instanceof Node) {
                node.__ph_updateBody();
                $each( ph_Engine.world.bodies, function(b){ ph_Sleeping.set(b, 0); } );
                if (!ph_Engine.__disabled){
                    node.__ph_sleep(2);
                }
            }
            
        }
        
    });


    //addEditorEvents({ });
    

}
    
//undebug
