var currentHistory;

function HistoryWithKitten(layout) {
    var hist = this;
    hist.layout = layout;

    hist.buffer = {
        a: [],
        push(ea) {
            var t = this;
            $each(ea, e => {
                if (e && e.stack) {
                    t.forLast(elast => {
                        if (elast.stack && elast.prop == e.prop && e.node == elast.node) {
                            elast.next = e.next;
                            e.nop = 1;
                        }
                    });
                }
            });
            ea = $filter(ea, e => { return e && !e.nop; });
            if (ea.length) {
                currentHistory.log('push', ea);
                return this.a.push(ea);
            }
        },
        pop() {
            var ea = this.a.pop();
            currentHistory.log('pop', ea);
            return ea;
        },
        forLast(f) {
            var last = this.a[this.a.length - 1];
            if (last) last.forEach(f);
        },
        flushStack() {
            this.forLast(function (e) { e.stack = 0; });
        },
        clear() {
            this.a.length = 0;
        }
    };

}

function enableCurrentHistoryLog() {
    if (currentHistory) {
        currentHistory.log = makeReadableLogging(consoleLog);
        if (!currentHistory.logEnabled) {
            currentHistory.logEnabled = 1;
            currentHistory.buffer.a.forEach(e => currentHistory.log(e));
        }
    }
}

HistoryWithKitten.prototype = {

    constructor: HistoryWithKitten,
    log() { },
    activate() {
        currentHistory = this;
        BUS.__addEventListener([__UNDO, __REDO, __OBJECT_CHANGED, 'HISTORY_EVENT', 'FLUSH_HISTORY_STACK'], this);
    },

    clear() {
        this.buffer.clear();
    },

    deactivate() {
        BUS.__removeEventListener(this);
    },

    __on(t, e) {

        switch (t) {

            case 'FLUSH_HISTORY_STACK':
                this.buffer.flushStack();
                break;

            case 'HISTORY_EVENT':
            case __OBJECT_CHANGED: {

                if (historyEventsEnabled) {
                    this.buffer.push(e);
                }

                break;
            }

            case __UNDO: {
                this.buffer.flushStack();
                var lastEvent = this.buffer.pop();
                var changes = [];
                $each(lastEvent, (change, i) => {
                    if (isFunction(change.undo))
                        change.undo(changes);
                    else
                        switch (change.type) {
                            case 'set':
                                setPropVal(change.node, change.prop, change.prev);
                                changes.push({
                                    type: 'set',
                                    node: change.node,
                                    prop: change.prop,
                                    next: change.prev,
                                    prev: change.next
                                });
                                break;

                            case '-':
                                if (change.node) {
                                    change.node.restore(change);
                                    changes.push({ type: '+', node: change.node });
                                }
                                break;

                            case 'select':
                                if (change.node) {
                                    change.node.__unselect();
                                }
                                break;

                            case 'unselect':
                                if (change.node) {
                                    change.node.__select();
                                }
                                break;

                            case 'paste':
                                $each(change.addedNodes, function (n) {
                                    n.remove();
                                    changes.push({ type: '-', node: n });
                                });
                                break;

                            case '+':
                                if (change.node) {
                                    change.node.remove();
                                    changes.push({ type: '-', node: change.node });
                                }
                                break;

                            case 'emitter_remove':
                                //                             change.emitter.__removeFromParent();
                                //                             if (change.node.__effect.emitters.length == 0) 
                                //                                 change.node.__effect = undefined;
                                break;

                            case 'emitter_add':
                                change.emitter.__removeFromParent();
                                if (change.node.__effect.emitters.length == 0)
                                    change.node.__effect = undefined;
                                if (change.emitter.panel)
                                    PanelsWithKitten.removePanel(change.emitter.panel);
                                break;

                            case 'loadEffect':
                                change.node.__effect = undefined;
                                change.node.__effect = change.prev;
                                break;

                            case 'emchange':
                                var obj = getObjectToEmitterFieldChange(change.emitter, change.data);
                                if (change.data.sub) {
                                    obj[change.data.sub] = change.prev;
                                    consoleLog(change.data.sub, '=', change.prev);
                                }
                                else {
                                    obj[change.data.pname] = change.prev;
                                    consoleLog(change.data.pname, '=', change.prev);
                                }
                                needEffectUpdate = 1;

                                break;


                        }
                });

                if (changes.length) {
                    objectChanged(changes, { withHistory: 0 });
                }
                this.buffer.flushStack();
                break;
            }


            case __REDO: {



                break;
            }


        }
    }
}

NodePrototype.restore = function (change) {
    change.__parent.__insertChild(change.nod, change.index);
    this.__select();
}

NodePrototype.remove = function (change) {
    this.__removeFromParent();
}
