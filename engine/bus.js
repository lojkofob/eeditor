// busEvents

var __ON_GAME_LOADED = '__ON_GAME_LOADED'
    , __ON_GAME_END = '__ON_GAME_END'
    , __ON_GAME_START = '__ON_GAME_START'
    , __ON_GAME_CLOSE = '__ON_GAME_CLOSE'
    , __ON_RESIZE = '__ON_RESIZE'
    , __ON_RESTART = '__ON_RESTART'
    , __ON_TAP = '__ON_TAP'
    , __ON_WINDOW_SHOW = '__ON_WINDOW_SHOW'
    , __ON_WINDOW_CLOSE = '__ON_WINDOW_CLOSE'
    , __ON_CLOSE_ALL_WINDOWS = '__ON_CLOSE_ALL_WINDOWS'
    , __ON_COUNTER_CHANGED = '__ON_COUNTER_CHANGED'
    , __ON_VISIBILITY_CHANGED = '__ON_VISIBILITY_CHANGED'
    , __ON_FOCUSED = '__ON_FOCUSED'
    , __ON_BLURED = '__ON_BLURED'
    , __ON_OFFER_STATE_CHANGED = '__ON_OFFER_STATE_CHANGED'
    , __ON_INTERSTITIAL_ADS_STATE_CHANGED = '__ON_INTERSTITIAL_ADS_STATE_CHANGED'
    , __ON_PLAYER_SAVE = '__ON_PLAYER_SAVE'
    , __ON_PLAYER_SAVED_SUCCESS = '__ON_PLAYER_SAVED_SUCCESS'
    , __ON_CONTEXT_CHANGED = '__ON_CONTEXT_CHANGED'
    , __ON_KEY_DOWN = '__ON_KEY_DOWN'
    , __ON_KEY_UP = '__ON_KEY_UP'
    , __ON_NODE_SELECTED = '__ON_NODE_SELECTED'
    , __ON_NODE_UNSELECTED = '__ON_NODE_UNSELECTED'
    //debug
    , __OBJECT_CHANGED = '__OBJECT_CHANGED'
    , __UNDO = 'UNDO'
    , __REDO = 'REDO'
    //undebug
    ;

var busEventsListeners = {};

var BUS = {

    ____addEventListener: function (type, listener) {
        if (!listener) return;
        if (isFunction(listener)) { listener = { __on: listener } }
        if (!busEventsListeners[type]) busEventsListeners[type] = [];
        if (busEventsListeners[type].indexOf(listener) < 0) busEventsListeners[type].push(listener);
        return listener;
    },

    __addEventListeners() {
        for (var i = 0; i < arguments.length; i += 2) {
            this.__addEventListener(arguments[i], arguments[i + 1]);
        }
    },

    __addEventListener: function (type, listener) {
        if (isArray(type)) {
            for (var i in type)
                this.____addEventListener(type[i], listener);
        } else
            if (isObject(type)) {
                for (var i in type) {
                    this.____addEventListener(i, type[i]);
                }
            } else {
                this.____addEventListener(type, listener);
            }
    },

    __hasEventListener: function (type, listener) {

        return busEventsListeners[type] && (busEventsListeners[type].indexOf(listener) >= 0);
    },

    __removeEventListenerByType: function (type, listener) {

        if (busEventsListeners[type]) removeFromArray(listener, busEventsListeners[type]);

    },

    __removeEventListener: function (listener) {
        for (var i in busEventsListeners)
            this.__removeEventListenerByType(i, listener);
    },


    __post: function () {

        var type = arguments[0];
        if (busEventsListeners[type]) {
            var args = arguments;
            busEventsListeners[type] = $filter(
                busEventsListeners[type],
                v => !v.__on.apply(v, args)
            )
        }
    },


    __unwrapObjectMethod: function (object, method) {
        if (!object) return consoleError('noargs');
        if (!object.__busWrappers) return;
        function unwrap(method) {
            var oldMethod = object.__busWrappers[method];
            if (oldMethod) object[method] = oldMethod;
        }
        if (method) {
            unwrap(method);
            delete object.__busWrappers[method];
        } else {
            for (var method in object.__busWrappers)
                unwrap(method);
            delete object.__busWrappers;
        }
    },

    __wrapObjectMethodByEvent: function (object, method, eventType) {
        if (!(object && method && eventType)) return consoleError('noargs');
        if (!object.__busWrappers) object.__busWrappers = {};
        if (!object.__busWrappers[method]) {
            var oldMethod = object.__busWrappers[method] = object[method];
            object[method] = function () {
                var r = oldMethod ? oldMethod.apply(this, arguments) : undefined;
                var listenerArray = busEventsListeners[eventType];
                if (listenerArray) {
                    //TODO: $filter
                    var array = listenerArray.slice(), i = 0, length = listenerArray.length;
                    for (i = 0; i < length; i++)
                        if (array[i].__on.apply(this, arguments))
                            BUS.__removeEventListenerByType(eventType, array[i]);
                }
                return r;
            }
        }
    }

}
