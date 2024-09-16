function TreeEntry(data) {

    mergeObj(this, data);

}

TreeEntry.prototype = {

    constructor: TreeEntry,

    getText() {
        return isFunction(this.text) ? this.text() : this.text
    },

    init: function (data) {
        mergeObj(this, data);
        return this.updateItem();
    },

    isEquals: function (entry) {
        return entry && (this.icon == entry.icon) &&
            (this.getText() == entry.getText()) &&
            (this.path == entry.path);

    },

    add: function (newentry, noselect) {
        var entry = this;

        if (!entry.data)
            entry.data = [];

        var data = entry.data;

        data.push(newentry);

        entry.updateItem(1);

        if (entry.treeItem) {

            if (!entry.treeItem.content.__visible) {
                entry.treeItem.content.__visible = 1;
            }

            newentry.__parentNode = entry.treeItem.content;

        }

        newentry.__parentEntry = entry;

        newentry.updateItem(1);

        if (!noselect) {
            newentry.focus();
        }

        this.root().recalcContentHY();
        return newentry;
    },

    remove: function () {
        var entry = this;

        if (entry.treeItem) {
            if (entry.treeItem.__removeFromParent) {
                entry.treeItem.__removeFromParent();
            } else
                if (entry.treeItem.content) {
                    entry.treeItem.content.__removeFromParent();
                }
        }

        if (entry.node) {
            entry.node.__traverse(function (n) { delete n.treeEntry });
        }

        if (entry.__parentEntry) {
            removeFromArray(this, entry.__parentEntry.data);
            entry.root().updateItem();
        }

    },

    unfocus: function () {
        if (this.treeItem && this.treeItem.plate) {
            this.treeItem.plate.__drag = undefined;
            this.treeItem.plate.__alpha = 0.1;
        }
        this.focused = 0;
        if (this.onFocusChanged) this.onFocusChanged(this.focused);
    },

    onDrag: function (x, y, dx, dy) {

        var pl = this.treeItem ? this.treeItem.plate : 0;
        if (pl) {

            pl.__x += dx;
            pl.__y += dy;
            pl.__updateMatrixWorld(1, 1);

            var wp = pl.__worldPosition.__clone();
            wp.z = -1000;

            if (pl.p0 && pl.p0.__beginalpha) {
                pl.p0.__alpha = pl.p0.__beginalpha;
                delete pl.p0.__beginalpha;
            }

            var p1, p2, p0, mp1 = -Infinity, mp2 = +Infinity, dp1, dp2;
            for (var i in pl.plates) {
                var anotherplate = pl.plates[i];
                if (anotherplate != pl) {
                    var y = anotherplate.__worldPosition.y;
                    if (abs(wp.y - y) < 8) {
                        p0 = anotherplate;
                        break;
                    }

                    if (y < wp.y && y > mp1) {
                        p1 = anotherplate;
                        mp1 = y;
                        dp1 = wp.y - y;
                    } else
                        if (y < mp2) {
                            p2 = anotherplate;
                            mp2 = y;
                            dp2 = y - wp.y;
                        }
                }
            };
            if (p0) {
                pl.linePlate.__visible = 0;
                if (!p0.__beginalpha) {
                    p0.__beginalpha = p0.__alpha;
                }
                p0.__alpha = 0.6;
                //consoleLog( p0.__worldPosition.y );
            } else
                if (p1 && p2) {
                    wp.y = (mp1 + mp2) / 2;
                    wp.x = (p1.__worldPosition.x + p2.__worldPosition.x) / 2 + 20;
                    pl.linePlate.__ofs = wp;
                    pl.linePlate.__visible = 1;
                } else
                    if (p1) {
                        wp.y = mp1 + 15;
                        wp.x = p1.__worldPosition.x + 20;
                        pl.linePlate.__ofs = wp;
                        pl.linePlate.__visible = 1;
                    } else
                        if (p2) {
                            wp.y = mp2 - 15;
                            wp.x = p2.__worldPosition.x + 20;
                            pl.linePlate.__ofs = wp;
                            pl.linePlate.__visible = 1;
                        }
                        else {
                            pl.linePlate.__visible = 0;
                        }

            pl.p0 = p0;
            pl.p1 = p1;
            pl.p2 = p2;
            pl.mp1 = mp1;
            pl.mp2 = mp2;
            pl.dp1 = dp1;
            pl.dp2 = dp2;

        }


    },

    onDragStart: function (x, y, dx, dy) {

        var pl = this.treeItem ? this.treeItem.plate : 0;
        if (pl) {
            pl.__sragStartOfs = pl.__ofs.__clone();
            pl.__z -= 30;

            pl.linePlate = new Node({ __size: { x: 300, y: 2 }, __color: 0x888888, __alpha: 0.5, sha: 1, sva: 1 });
            pl.__root.add(pl.linePlate);

            pl.plates = this.root().treeItem.content.$({ __plate: 1 }).filter(function (a) {
                return a.__deepVisible();
            });

        }
    },

    onDragEnd: function () {

        var pl = this.treeItem ? this.treeItem.plate : 0;
        if (pl) {

            pl.__ofs = pl.__sragStartOfs;
            pl.linePlate.__removeFromParent();


            if (pl.p0) {
                if (pl.p0.__beginalpha) {
                    pl.p0.__alpha = pl.p0.__beginalpha;
                    delete pl.p0.__beginalpha;
                }
            }


            var root = this.root();


            if (root && root.onEntryPlateDragEnd)
                root.onEntryPlateDragEnd(pl);

        }
    },

    focus: function (params) {
        this.focused = 1;
        params = params || {};
        if (this.treeItem) {
            var pl = this.treeItem.plate;
            if (pl) {
                pl.__init({
                    __alpha: 0.4,
                    __drag: this.onDrag.bind(this),
                    __dragStart: this.onDragStart.bind(this),
                    __dragEnd: this.onDragEnd.bind(this)
                });
            }

            if (params.withAutoExpand) {
                if (this.treeItem.__traverseParents)
                    this.treeItem.__traverseParents(function (n) { if (n.entry && n.content) n.content.__visible = 1; })
                this.root().recalcContentHY();

            }

            if (params.withAutoScroll && pl) {
                if (pl.__scrollIntoView) {
                    if (this.__parentNode && this.__parentNode.__root) this.__parentNode.__root.update(1);
                    pl.__scrollIntoView(0.2, undefined, 0, 150);
                }
            }

        } else {

            function showc(e) {
                if (e && e.__parentEntry) {
                    showc(e.__parentEntry);
                    e.showContent(1);
                }
            }
            showc(this.__parentEntry);
            if (this.treeItem) {
                this.focus(params);
                return;
            }

        }

        if (this.onFocusChanged)
            this.onFocusChanged(this.focused);
    },

    updateSelfIndex: function (newindex, insertVariant) {
        if (!this.treeItem)
            return;

        if (!this.treeItem.__parent)
            return;

        if (this.treeItem.__parent.border)
            newindex++;

        if (insertVariant) {

            removeFromArray(this.treeItem, this.treeItem.__parent.__childs);

            this.treeItem.__parent.__childs.splice(newindex, 0, this.treeItem);

        } else {

            this.treeItem.__realIndex = newindex;

        }

        this.updateItem()
    },

    updateItem: function (parentDeep, childDeep) {

        var entry = this, item = entry.treeItem;
        if (!entry.__isRoot) {
            if (!item && entry.__parentNode) {

                item = entry.treeItem =
                    entry.__parentNode.__addChildBox(TreeWithKitten.options.itemTemplate);

                entry.treeItem.plate.treeItem = entry.treeItem;
                entry.treeItem.plate.entry = entry;

                item.entry = entry;
                item.__onTap = function () {
                    if (entry.onTap) {
                        entry.onTap(this);
                    }
                    return 1;
                }

                if (entry.contextMenu) {
                    item.__contextMenu = entry.contextMenu;
                }


                onTapHighlight(item);


                item.init(entry.itemTemplate)
            }

            if (!item)
                return entry;

            var x = 2;


            if (entry.toggleSelectable) {
                if (!item.plate.toggleSelectable) {
                    if (entry.node) {
                        item.plate.__addChildBox({
                            __size: { x: 25, y: 25 },
                            __img: 0,
                            __color: undefined,
                            __class: 'e-lock',
                            sva: 1,
                            __z: -1,
                            __onTap: function () {
                                entry.node.__selectable = !entry.node.__selectable;
                                if (entry.node.selected) {
                                    entry.node.__unselect();
                                }
                                this.update();
                                return 1;
                            },
                            update: overloadMethod(NodePrototype.update, function () {
                                var v = entry.node.__selectable;
                                if (v != this.__vvv) {
                                    this.__vvv = v;
                                    this.__killAllAnimations().__classModificator = v ? null : 'checked';
                                }
                                return this;
                            })

                        }, 'toggleSelectable');


                    }
                }

                item.plate.toggleSelectable.__x = x - 3;
                x += 20;
            } else {
                if (item.plate.toggleSelectable) {
                    item.plate.toggleSelectable.__removeFromParent();
                    item.plate.toggleSelectable = 0;
                }
            }


            if (entry.toggleVis) {
                if (!item.plate.toggleVis) {
                    if (entry.node) {
                        item.plate.__addChildBox({
                            __size: { x: 18, y: 18 },
                            __class: 'e-checkbox',
                            sva: 1,
                            __z: -1,
                            __onTap: function () {
                                entry.node.__visible = !entry.node.__visible;
                                return 1;
                            }
                        }, 'toggleVis');

                        ObjectDefineProperty(item.plate.toggleVis, '__alpha', {
                            get: function () {
                                var v = entry.node.__visible;
                                if (v != this.__vvv) {
                                    this.__vvv = v;
                                    this.__killAllAnimations().__classModificator = v ? 'checked' : null;
                                }
                                return 1;
                            }
                        });
                    }
                }

                item.plate.toggleVis.__x = x;
                x += 20;
            } else {
                if (item.plate.toggleVis) {
                    item.plate.toggleVis.__removeFromParent();
                    item.plate.toggleVis = 0;
                }
            }


            if (entry.icon) {
                if (!item.plate.icon) {
                    item.plate.__addChildBox({ __size: { x: 20, y: 25 }, __fitImg: 1 }, 'icon');
                }
                item.plate.icon.__x = x;
                item.plate.icon.__img = isString(entry.icon) ? entry.icon : entry.icon.__realFilename;
                x += 30;
            } else {
                if (item.plate.icon) {
                    item.plate.icon.__removeFromParent();
                    delete item.plate.icon;
                }
            }

            var text = entry.getText();
            if (text) {
                if (!item.plate.txt) {
                    item.plate.__addChildBox(TreeWithKitten.options.textTemplate, 'txt');
                }
                item.plate.txt.__text = text;
                item.plate.txt.__x = x;
                item.name = 'i_' + text;
            } else {
                if (item.plate.txt) {
                    item.plate.txt.__removeFromParent();
                    delete item.plate.txt;
                }
            }


        }

        entry.updateItemContent();

        if (!entry.__isRoot) {
            if (item.content) {
                item.__x = 20;

                if (!item.plate.__plus) {
                    item.plate.__addChildBox({
                        __class: 'e-plus',
                        __x: -20,
                        __z: -2,
                        __text: '+',
                        sva: 1,
                        __onTap: function () {
                            entry.toggleContent();
                            return 1;
                        }
                    }, '__plus');

                    onTapHighlight(item.plate.__plus);

                } else {
                    item.plate.__plus.__text = item.content && item.content.__visible ? '-' : '+';
                }
            } else {
                item.__x = 0;
                if (item.plate.__plus)
                    item.plate.__plus = item.plate.__plus.__removeFromParent();
            }
        }

        if (parentDeep) {
            if (entry.__parentEntry)
                entry.__parentEntry.updateItem(1);
        }

        if (childDeep) {
            if (this.content) {
                for (var i in this.content) {
                    var it = this.content[i];
                    if (it.entry)
                        it.entry.updateItem(0, 1);
                }
            }
        }
        return entry;
    },

    showContent: function (withoutUpdate) {
        var entry = this, item = entry.treeItem;
        if (item.content && !item.content.__visible) {
            entry.toggleContent(withoutUpdate);
        }
        return entry;
    },

    hideContent: function (withoutUpdate) {
        var entry = this, item = entry.treeItem;
        if (item.content && item.content.__visible) {
            entry.toggleContent(withoutUpdate);
        }
        return entry;
    },

    toggleContent: function (withoutUpdate) {
        var entry = this, item = entry.treeItem;
        if (item.content) {
            item.content.__visible = !item.content.__visible;

            if (item.content.__visible)
                entry.updateItemContent();

            if (item.plate.__plus) {
                item.plate.__plus.__text = item.content.__visible ? '-' : '+';
            }

            if (!withoutUpdate) {
                entry.root().recalcContentHY();
                _setTimeout(function () {
                    item.plate.__scrollIntoView(0.2, undefined, 0, 10);
                }, 0.1);

                resortEventsObjects();
            }
        }
        return entry;
    },

    recalcContentHY: function () {

        var entry = this, item = entry.treeItem;

        if (item) {
            var content = item.content;
            if (item.plate && item.plate.__plus) item.plate.__plus.__text = content && content.__visible ? '-' : '+';
            if (content && content.__visible) {

                var y = 1;
                for (var i in content.__childs) {
                    var listItem = content.__childs[i];
                    if (listItem.entry) {
                        y += listItem.entry.recalcContentHY();
                    }
                }
                content.__height = y + 5;
                item.__height = y + 5 + TreeWithKitten.options.itemHeight;
            }
            else {
                item.__height = TreeWithKitten.options.itemHeight;
            }

            return item.__height;
        }

        return 0;
    },

    root: function () {

        if (this.__parentEntry)
            return this.__parentEntry.root();

        return this;
    },

    updateItemContent: function (onlyHierarchy) {

        var entry = this, item = entry.treeItem;

        if (entry.data && entry.data.length) {

            if (onlyHierarchy) {
                for (var i in entry.data) {
                    var e = entry.data[i];
                    if (e) {
                        e.__parentNode = content;
                        e.__parentEntry = entry;
                        e.updateItemContent(1);
                    } else {
                        debugger;
                    }
                }
                return;
            }

            if (!item.content) {
                item.content = item.__addChildBox(TreeWithKitten.options.contentTemplate);
                item.content.__height = entry.data.length * TreeWithKitten.options.itemHeight;
                item.content.contentEntry = entry;
            }

            var content = item.content;

            if (!content.__visible) {
                this.updateItemContent(1);
                return;
            }

            content.__eachChild(function (c) {
                if (c.__isTreeItem && c.entry) {
                    c.__forRemove = 1;
                }
            });

            for (var i in entry.data) {
                var e = entry.data[i];
                e.__parentNode = content;
                e.__parentEntry = entry;
                e.updateItem();
                e.treeItem.__forRemove = 0;
            }

            $each($filter(content.__childs, function (c) { return c.__forRemove; }), function (c) {
                c.__removeFromParent();
            });

            var r = this.root();
            if (!r.__needRecalc) {
                r.__needRecalc = 1;
                looperPost(function () { r.recalcContentHY() });
            }

            content.update(1);

        } else {
            if (!entry.__isRoot) {
                if (item && item.content) {
                    item.content.__removeFromParent();
                    delete item.content;
                }
            }
        }


    }

}


var TreeWithKitten = {

    options: {

        itemHeight: 28,

        contentTemplate: {
            __simpleBounding: 1,
            __ofs: { x: 0, y: 28, z: -1 },
            __canBeFrustummed: 1,
            __visible: 0,
            __size: { x: 1, px: 1 },
            ha: 0,
            va: ALIGN_FROM_START_TO_END,
            __childs: {
                border: {
                    __size: { x: 1, px: 0, y: 1, py: 1 }, __color: 0xfffff1, __alpha: 0.4, __x: -10, sva: 0, sha: 0
                }
            }
        },

        textTemplate: {
            __size: { px: 1, x: 1, y: 25 }, ha: 0,
            __x: 5,
            __text: { __fontsize: 16 }
        },

        itemTemplate: {
            __z: -1, ha: 0, va: 0,
            __simpleBounding: 1,
            __canBeFrustummed: 1,
            __isTreeItem: 1,
            __size: { x: 1, px: 1, y: 25 },
            __childs: {
                plate: {
                    __size: { x: 1, px: 1, y: 25 },
                    __z: -2,
                    __color: 0xaaaaaa,
                    __alpha: 0.1,
                    __plate: 1,
                    ha: 0,
                    va: 0
                }
            }
        }

    },


    refill: function (node, data, parentEntry, params) {
        if (!node || !data) return;

        if (node.__contentNode) {

            function mergeTreeData(data1, data2) {
                if (!data2) return;

                $each(data1, function (sube) {

                    var finded = 0;

                    $each(data2, function (sube2, i) {
                        if (!finded) {
                            if (sube.isEquals(sube2)) {
                                var subdata = (data2[i] || 0).data;
                                mergeTreeData(sube.data, subdata);
                                data2[i] = sube;
                                finded = 1;
                            }
                        }
                    });

                    if (!finded) {
                        sube.__forRemove = 1;
                    }

                });

                for (var i = 0; i < data1.length;) {
                    if (data1[i].__forRemove) data1.splice(i, 1); else i++;
                }

                $each(data2, function (sube2, i) {

                    var finded = $find(data1, function (sube) {
                        return sube2.isEquals(sube);
                    });

                    if (!finded) {
                        data1.push(sube2);
                    }

                });


                return data2;
            }

            var entry = node.__contentNode.__pentry;

            entry.data = mergeTreeData(entry.data, data);

            entry.updateItem();

            entry.recalcContentHY();

        } else {
            node.__clearChildNodes();
            this.fill(node, data, parentEntry, params);
        }
    },

    fill: function (node, data, parentEntry, params) {

        if (!node || !data) return;

        if (!parentEntry) {
            node.__scroll = {};
            node.va = ALIGN_FROM_START_TO_END;
        }


        var contentNode;
        if (isArray(data)) {

            if (!parentEntry) {

                contentNode = new Node({ __size: { x: 1, y: 1 }, va: ALIGN_FROM_START_TO_END, __canBeFrustummed: 1 });

                parentEntry = new TreeEntry(
                    mergeObj({
                        data: data,
                        __isRoot: 1,
                        treeItem: { content: contentNode }
                    }, params));

                node.__addChildBox(contentNode);

                node.__contentNode = contentNode;

                contentNode.__pentry = parentEntry;
            }

        }
        else {
            if (isObject(data) && !parentEntry) {
                parentEntry = data;
                contentNode = new Node({ __size: { x: 1, y: 1 }, va: ALIGN_FROM_START_TO_END, __canBeFrustummed: 1 });
                node.__addChildBox(contentNode);
                node.__contentNode = contentNode;
                contentNode.__pentry = parentEntry;
            }

            parentEntry.__isRoot = 1
            parentEntry.treeItem = { content: contentNode || node };

            mergeObj(parentEntry, params);

        }


        parentEntry.updateItem();
        return contentNode;
    }

}
