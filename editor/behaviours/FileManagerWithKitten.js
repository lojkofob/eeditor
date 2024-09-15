function getVertexShaderData(v) {
    var bsf = ((Editor.currentProject || 0).options || 0).__baseShadersFolder;
    if (bsf) {
        if (globalConfigsData[bsf + v]) return globalConfigsData[bsf + v];
        if (globalConfigsData[bsf + v + '.v']) return globalConfigsData[bsf + v + '.v'];
        if (globalConfigsData[bsf + v + '.vsh']) return globalConfigsData[bsf + v + '.vsh'];
    }
    return globalConfigsData[options.__baseShadersFolder + v + '.v'];
}

function isImageType(type) {
    return type && type.split && (type.split('/')[0] == 'image' || type.split('/')[0] == 'video');
}

function getFragmentShaderData(v) {
    var bsf = ((Editor.currentProject || 0).options || 0).__baseShadersFolder;
    if (bsf) {
        if (globalConfigsData[bsf + v]) return globalConfigsData[bsf + v];
        if (globalConfigsData[bsf + v + '.f']) return globalConfigsData[bsf + v + '.f'];
        if (globalConfigsData[bsf + v + '.psh']) return globalConfigsData[bsf + v + '.psh'];
    }
    return globalConfigsData[options.__baseShadersFolder + v + '.f'];
}

var uc_v4 = new Vector4();

NodePrototype.filter = 0;


function len(list) {
    return $count(list, v => 1);
}

function planarize(a, path, count) {
    var cc = [];
    path = path || '';
    if (!count) return cc;
    count--;
    $each(a, (v, k) => isArrayOrObject(v) ? cc = cc.concat(planarize(v, k + '/', count)) : cc.push(path + v));
    return cc;
}


function checkMatchAll(list, re) {
    list = planarize(list, '', 1);
    var nc = $count(list, v => 1);
    if (nc == 3 || nc == 4) {
        list = $filter(list, v => v && v.match);
        return nc == $count(list, v => $find(re, r => {
            if (v.match(r)) { removeFromArray(r, re); return 1; }
        }));
    }
}

function isDB1(list) {
    var l = len(list);
    if (l == 4 || l == 3) {
        return checkMatchAll(list, [/_ske\.json$/, /_tex\.json$/, /_tex\.png$/]);
    }
}

function isDB2(list) {
    var l = len(list);
    if (l == 4 || l == 3) {
        return checkMatchAll(list, [/skeleton\.json$/, /texture\.json$/, /texture\.png$/])
    }
}

function isSpine(list) {
    var l = len(list);
    if (l == 4 || l == 3) {
        if (checkMatchAll(list, [/\.json$/, /\.atlas(\.txt)?$/, /\.png$/])) {
            return 1;
        }
        if (checkMatchAll(list, [/\.skel$/, /\.atlas(\.txt)?$/, /\.png$/])) {
            return { isBinary: 1 };
        }
    }
}


$each({
    u_color: {
        get: function () {
            uc_v4.set(this.__selfColor.r, this.__selfColor.g, this.__selfColor.b, this.__alpha);
            return uc_v4;
        }
    },

    map: { get: function () { return this._u_map; }, set: function (v) { this._u_map = v; } },

    u_texture: { get: function () { return this._u_map; }, set: function (v) { this._u_map = v; } },

    a_texcoord: { get: function () { return this.__uvsBuffer0 || this.__uvsBuffer; } },
    a_position: { get: function () { return this.__verticesBuffer; } },

    mouse: { get: function () { return toNodeCoords(mouse.__clone()).__divide(__screenSize) } },

    u_texture1: { get: function () { return this.__getTextureProperty('u_texture1'); }, set: function (v) { this.__setTextureProperty('u_texture1', v); } },
    u_texture2: { get: function () { return this.__getTextureProperty('u_texture2'); }, set: function (v) { this.__setTextureProperty('u_texture2', v); } },
    u_texture3: { get: function () { return this.__getTextureProperty('u_texture3'); }, set: function (v) { this.__setTextureProperty('u_texture3', v); } },
    u_texture4: { get: function () { return this.__getTextureProperty('u_texture4'); }, set: function (v) { this.__setTextureProperty('u_texture4', v); } },
    u_texture5: { get: function () { return this.__getTextureProperty('u_texture5'); }, set: function (v) { this.__setTextureProperty('u_texture5', v); } },
    u_texture6: { get: function () { return this.__getTextureProperty('u_texture6'); }, set: function (v) { this.__setTextureProperty('u_texture6', v); } },
    u_texture7: { get: function () { return this.__getTextureProperty('u_texture7'); }, set: function (v) { this.__setTextureProperty('u_texture7', v); } },
    u_texture8: {
        get: function () { return this.__getTextureProperty('u_texture8'); }, set: function (v) {
            activateProjectOptions();
            this.__setTextureProperty('u_texture8', v);
            deactivateProjectOptions();
        }
    },

    u_time: { get: function () { return fract(__lastOnFrameTime / 1000); } },

    u_transform: {
        get: function () {
            if (this.__projectionMatrix)
                return this.__projectionMatrix.__clone().__multiply(this.mw).e
            return this.mw.e;
        }
    },

    __colorsBuffer: {
        get: function () {
            if (this.__useColorLikeVColor) {
                if (!this.______colorsBuffer) {
                    this.______colorsBuffer = new MyBufferAttribute('a_color', Float32Array, 4, GL_ARRAY_BUFFER);
                }
                var a = this.______colorsBuffer.__getArrayOfSize(256), vcm = this.__vertexColorsRandomMap, vcr = this.__vertexColorsRandom;
                if (vcr != this.__lvertexColorsRandom) {
                    this.__lvertexColorsRandom = vcr;
                    vcm = this.__vertexColorsRandomMap = [];
                    for (var i = 0; i < 256; i++) {
                        vcm[i] = randomize(-vcr, vcr);
                    }
                }

                for (var i = 0; i < 256; i += 4) {
                    a[i] = this.__selfColor.r + (vcm ? vcm[i] || 0 : 0);
                    a[i + 1] = this.__selfColor.g + (vcm ? vcm[i + 1] || 0 : 0);
                    a[i + 2] = this.__selfColor.b + (vcm ? vcm[i + 2] || 0 : 0);
                    a[i + 3] = this.__alpha + (vcm ? vcm[i + 3] || 0 : 0);
                }
            }
            if (this.______colorsBuffer)
                return this.______colorsBuffer;
        },
        set: function (v) {
            this.______colorsBuffer = v;
        }
    }

}, (p, k) => {
    try { ObjectDefineProperty(NodePrototype, k, p); } catch (e) { }
});


var __onpst = NodePrototype.__setTextureProperty;
NodePrototype.__setTextureProperty = function () {
    activateProjectOptions();
    __onpst.apply(this, arguments);
    deactivateProjectOptions();
};


function rawViewFile(path) {
    path = path.replace(/.spnb?$/, '').replace(/.dbn?$/, '');
    activateProjectOptions();
    followLink(
        modUrlCache(Editor.currentProject.options.__allServerPath + Editor.currentProject.options.__projectServerPath + path)
    );
    deactivateProjectOptions();
}

function renameFile(fullpath, name, entry, canMove) {

    AskerWithKitten.ask({
        caption: (canMove ? 'Moving' : 'Renaming') + ' file\n\\#aaf;' + fullpath,
        value: name,
        ok: function (r) {

            var cb = function () {
                invokeEventWithKitten('Files.rename', { path: fullpath, name: r, entry: entry, canMove: canMove });
            };

            if (r && fileext(r) != fileext(fullpath)) {
                looperPost(function () {
                    AskerWithKitten.ask({
                        caption: 'Confirm change extention\n from \\#aaf;' + fileext(fullpath) + '\\#; to \\#aaf;' + fileext(r),
                        noinput: 1,
                        ok: cb
                    });
                });
            } else {
                cb();
            }

        }
    });
}

function onFileContextMenu() {

    if (showContextMenu) {

        var entry = this.entry;
        var fullpath = entry ? entry.path : '/';

        var fw = FileManagerWithKitten.getFileWorker(entry);
        var params = {

            "create dir": function () {
                var dir = dirname(fullpath) || '/';
                AskerWithKitten.ask({
                    caption: 'Create directory in\n\\#aaf;' + dir,
                    ok: function (r) {
                        invokeEventWithKitten('Files.mkdir', { path: dir, name: r });
                    }
                })

            },

            "raw view": function () {
                rawViewFile(fullpath);
            }
        };

        if (entry) {
            params = mergeObj(params, {

                remove: function () {
                    AskerWithKitten.ask({
                        caption: 'Confirm removing\n\\#aaf;' + fullpath,
                        noinput: 1,
                        ok: function () {
                            invokeEventWithKitten('Files.remove', { path: fullpath, entry: entry });
                        }
                    })
                },

                rename: function () {
                    var name = entry.directory ? entry.text : basename(fullpath);
                    renameFile(fullpath, name, entry);
                }

            });
        }

        params = mergeObj(params, fw.contextMenu);

        showContextMenu(params);
        return 1;
    }

}

function downloadString(text, fileType, fileName) {
    var blob = new Blob([text], { type: fileType });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}



var ImagePreviewerWithKitten = {

    onTap: function (node) {

        var m = this.match;
        var image = m[0];

        var imagePreview = EditorUIBehavioursWithKitten.imagePreview;
        if (imagePreview) {

            invokeEventWithKitten('Editor.showPanel', { panel: imagePreview.__parent });

            var imgNode = imagePreview.image;

            imgNode.__onImageLoaded = function () {
                var sz = { x: imgNode.__imgSize.x, y: imgNode.__imgSize.y };
                imagePreview.info.__text = sz.x + ' x ' + sz.y;
                var psz = imagePreview.__size;
                if (sz.x > sz.y) {
                    var tmp = sz.x;
                    sz.x = clamp(sz.x, 200, psz.x - 10);
                    sz.y = sz.x * sz.y / tmp;
                } else {
                    var tmp = sz.y;
                    sz.y = clamp(sz.y, 200, psz.y - 10);
                    sz.x = sz.x * sz.y / tmp;
                }

                imgNode.__size = sz;
                imgNode.update(1);
            };

            imgNode.__fitImg = 1;
            activateProjectOptions();

            if (image.indexOf(options.__baseImgFolder) == 0) {
                image = image.replace(options.__baseImgFolder, '');
            } else {
                if (image.indexOf('?') < 0) {
                    var loadOpts = {
                        __disableCache: 0,
                        __disableCacheByVer: 0,
                        __allServerPath: ""
                    };
                    activateOptions(loadOpts);
                    image = modUrl(image);
                    deactivateOptions(loadOpts);
                }
            }



            imgNode.__img = image;
            imgNode.__shader = undefined;

            deactivateProjectOptions();

            imagePreview.set.__onTap = function () {
                invokeEventWithKitten('set', { __img: imgNode.__img });
                invokeEventWithKitten('Editor.closePanel', { caller: this });
                return 1;
            }
            onTapHighlight(imagePreview.set);

        }

    }
},

    ShaderPreviewerWorker = {

        onTap: function (node) {

            var m = this.match;
            var fullpath = m[0], shaderName = m[2], path = m[1];
            if (shaderName.endsWith('f')) {

                var imagePreview = EditorUIBehavioursWithKitten.imagePreview;
                if (imagePreview) {

                    invokeEventWithKitten('Editor.showPanel', { panel: imagePreview.__parent });

                    var imgNode = imagePreview.image;

                    imgNode.__fitImg = 1;
                    imgNode.__img = '/shaderTest.png?';
                    imgNode.__size = [1, 1];

                    imgNode.__shader = shaderName;

                    imagePreview.set.__onTap = function () {
                        invokeEventWithKitten('set', { __shader: shader });
                        invokeEventWithKitten('Editor.closePanel', { caller: this });
                        return 1;
                    }

                    onTapHighlight(imagePreview.set);

                }

            }
        }
    },

    LayoutFileWorker = {

        getLayoutContent: function (l) {

            var content;
            activateProjectOptions(l);

            if (Editor.layoutConverter && Editor.layoutConverter.saveLayout) {
                content = Editor.layoutConverter.saveLayout(l);
            }

            if (content == undefined) {
                content = [];
                l.layoutView.__eachChild(function (c) {
                    content.push(c.__toJson());
                });
            }

            deactivateProjectOptions(l);

            return content;

        },

        onTap: function (node) {
            var m = this.match;
            var path = m[0];
            var layoutName = m[1];
            invokeEventWithKitten('Layout.open', { path: path, name: layoutName });
        },

        open: function (opts, unpacker) {
            opts = opts || 0;
            var cb = isFunction(opts) ? opts : notNullFunc(opts.callback);
            var m = this.match;
            var path = m[0];
            var layoutName = m[1];
            serverCommand({
                command: 'fileOpen',
                file: path,
                isBackup: opts.isBackup || 0
            }, function (content) {
                //                 consoleLog(content);
                try {
                    content = JSON.parse(content);
                    if (content.packed) {
                        if (unpacker) {
                            unpacker(content.packed, cb);
                            return;
                        }
                        else {
                            cb(repackJson(content.packed, JsonRepackMap));
                        }
                    } else
                        if (content.pkd) {
                            if (unpacker) {
                                unpacker(content.pkd, cb);
                                return;
                            }
                            else {
                                cb(unpackJson(content.pkd));
                            }
                        } else {
                            cb(content);
                        }

                } catch (e) {
                    onError(e);
                }
            });
        },

        download: function (layout, packer) {

            var m = this.match;
            var path = m[0];
            var layoutName = m[1];
            var content = this.getLayoutContent(layout);


            var cb = function (data) {
                var str = JSON.stringify(data, null, (Editor.currentProject || 0).jsonTabSpaces || 2);
                downloadString(str, 'text/json', layoutName + '.json');
            }

            if (packer) {
                packer(content, cb);
            }
            else {
                cb(((Editor.currentProject || 0).options || 0).__disablePacking ? content : { pkd: packJson(content) });
            }


        },

        publish: function () {
            LayoutFileWorker.publishFlag = 1;
            this.save.apply(this, arguments);
        },

        save: function (layout, packer) {

            var path, layoutName;
            if (isArray(this.match)) {
                path = this.match[0];
                layoutName = this.match[1];
            } else if (isString(this.match)) {
                layoutName = this.match;
                path = options.__baseLayoutsFolder + this.match;
            }

            if (!layoutName.length) {
                debugger;
                return;
            }

            var content = this.getLayoutContent(layout);

            var cb = function (data) {
                serverCommand({
                    command: 'fileWrite',
                    file: path,
                    content: FileManagerWithKitten.stringify(data, null, (Editor.currentProject || 0).jsonTabSpaces || 2)
                }, function (r) {
                    if (r == 1) {
                        layout.opts.name = layoutName;
                        BUS.__post('FILES_CHANGED');
                        BUS.__post('LAYOUT_SAVED', layout);
                        consoleLog('LAYOUT SAVED', layout.opts.path);
                        if (LayoutFileWorker.publishFlag) {
                            consoleLog('PUBLISH');
                            serverCommand({
                                command: 'publish',
                                files: [path]
                            }, function (r) {
                                consoleLog(r);
                            });
                        }
                    }
                    LayoutFileWorker.publishFlag = 0;
                });
            };

            if (packer) {
                packer(content, cb);
            }
            else {
                cb(((Editor.currentProject || 0).options || 0).__disablePacking ? content : { pkd: packJson(content) });
            }


        }

    },

    ParticlesFileWorker = {

        onTap: function (node) {

            var m = this.match;
            var path = m[0];
            var effectName = m[2];
            var effectPreview = EditorUIBehavioursWithKitten.effectPreview;
            if (effectPreview) {
                invokeEventWithKitten('Editor.showPanel', { panel: effectPreview.__parent });
                effectPreview.__effectName = effectName.split('.')[0];
                this.open(function () {
                    activateProjectOptions();
                    effectPreview.__effect = effectPreview.__effectName;
                    deactivateProjectOptions();
                    effectPreview.__effect.loop = 1;

                });
            }

        },

        open: function (cb) {
            var m = this.match;
            var path = m[0];
            var effectName = m[2];
            activateProjectOptions();
            loadResources([["effect", effectName]], cb);
            deactivateProjectOptions();
        },

        save: function (data) {
            var m = this.match;
            var path = m[0];
            serverCommand({
                command: 'fileWrite',
                file: path,
                content: JSON.stringify(data, null, 2)
            }, function (r) {
                if (r == 1) {
                    BUS.__post('FILES_CHANGED');
                }
            });

        }


    },

    RAWPreviewerWorker = {

        onTap: function (cb) {
            rawViewFile(this.match[0]);
        }
    },

    FontFileWorker = {

        onTap: function () {

            var m = this.match;
            var file = m[1];
            var face = getFontFaceFromFontFile(file);

            var textPreview = EditorUIBehavioursWithKitten.textPreview;
            if (textPreview) {

                invokeEventWithKitten('Editor.showPanel', { panel: textPreview.__parent });

                activateProjectOptions();

                TASKS_RUN([

                    [TASKS_FONT, [file]]

                ], function () {

                    textPreview.txt.__text = {
                        __text: 'В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!\n\nRealigned equestrian fez bewilders picky monarch\n\nABCDEFGHIJKLMNOPQRSTUVWXYZ\n\nVictor jagt zwölf Boxkämpfer quer über den großen Sylter Deich\n\nThe quick brown fox jumps over the lazy dog\n\n0123456789 ¿ ? ¡ ! & @ ‘ ’ “ ” « » % * ^ # $ £ € ¢ / ( ) [ ] { } . , ® ©',
                        __fontface: face
                    }
                });

                deactivateProjectOptions();
            }
        }

    },

    SpineFileWorker = {

        onTap: function (node) {

            var m = this.match;
            var file = m[0];
            var isBinary = file.endsWith('b');
            var path = m[1];
            var spName = m[2];

            var hasHD = getDeepFieldFromObject(node, 'entry', 'hasHD');

            var preview = EditorUIBehavioursWithKitten.dragonBonesPreview;
            if (preview) {

                invokeEventWithKitten('Editor.showPanel', { panel: preview.__parent });
                preview.__parent.header.__textString = "Spine preview";

                var previewNode = preview.dbnod;

                preview.txt.__text = file;

                previewNode.__text = 'loading..';
                previewNode.__spine = 0;
                previewNode.__dragonBones = 0;

                function checkSpineData(data) {
                    data = (data || 0).__data || 0;
                    if (data.slots || (data instanceof Uint8Array)) {
                        return 1;
                    } else {
                        previewNode.__text = 'Error: bad spine data\nsee console';
                        consoleError(data);
                    }

                }

                activateProjectOptions();
                if (options.__baseSpineFolder != path) {
                    path = path + spName + "?";
                } else {
                    path = spName;
                }

                loadSpine(path, function () {

                    var data = spineFactory.__spineDataMap[spName];

                    if (checkSpineData(data)) {
                        var o = {
                            __hd: hasHD,
                            __name: path,
                            __binary: isBinary
                        };

                        previewNode.__spine = o;

                        previewNode.__text = '';

                        previewNode.__killAllAnimations();
                        previewNode.__x = previewNode.__y = 0;
                        previewNode.__scaleF = 1;
                        previewNode.update(1);

                        _setTimeout(function () {

                            var pos = new Vector2(0, 0), c = 0;

                            var dbs = previewNode.__spineObject;

                            if (dbs && dbs.__bounds) {

                                var sz = dbs.__bounds.size;
                                var ofs = dbs.__bounds.offset;
                                // consoleLog(file, sz, ofs);
                                // return;

                                var left = ofs.x - sz.x / 2
                                    , right = ofs.x + sz.x / 2
                                    , top = ofs.y - sz.y / 2
                                    , bottom = ofs.y + sz.y / 2
                                    , wp = previewNode.__worldPosition;

                                consoleLog(wp, left, right, top, bottom);
                                var sz = previewNode.__size;
                                var scale = 1 / mmax((right - left) / sz.x, (bottom - top) / sz.y);
                                previewNode.__anim({
                                    __x: - scale * (left + right) / 2,
                                    __y: - scale * (top + bottom) / 2,
                                    __scaleF: scale
                                }, 0.1);

                            }

                        }, 0.1);


                    }

                }, function (data) {

                    previewNode.__text = 'loading error';
                    checkSpineData(data);

                }, isBinary, hasHD);

                deactivateProjectOptions();
            }
        }

    },

    DragonBonesFileWorker = {

        onTap: function (node, isHd, old) {

            var m = this.match;
            var file = m[0];
            var path = m[1];
            var dbName = m[2];

            var preview = EditorUIBehavioursWithKitten.dragonBonesPreview;
            if (preview) {

                invokeEventWithKitten('Editor.showPanel', { panel: preview.__parent });
                preview.__parent.header.__textString = "DragonBones preview";

                var previewNode = preview.dbnod;

                preview.txt.__text = file;

                previewNode.__text = 'loading..';
                previewNode.__spine = 0;
                previewNode.__dragonBones = 0;

                function checkDBData(data) {
                    if (data && data.version) {
                        if (data.version != "5.5") {
                            previewNode.__text = 'unsupported Dragon Bones file version ' + data.version + '\nplease convert it to 5.5 using\n\\#aaf;https://github.com/DragonBones/Tools/\\#;';
                        }
                        else {
                            if (data.name) {
                                return 1;
                            } else {
                                previewNode.__text = 'Error: bad dragon bones data\nsee console';
                                consoleError(data);
                            }
                        }

                    } else {
                        previewNode.__text = 'Error: bad dragon bones data\nsee console';
                        consoleError(data);
                    }
                }

                activateProjectOptions();

                //                 if (!options.__baseDragonBonesFolder)
                options.__baseDragonBonesFolder = path;

                loadDragonBones(dbName, function () {

                    var data = dragonbonesFactory._dragonBonesDataMap[dbName];

                    if (checkDBData(data)) {
                        previewNode.__dragonBones = dbName;
                        previewNode.__text = '';

                        previewNode.__killAllAnimations();
                        previewNode.__x = previewNode.__y = 0;
                        previewNode.__scaleF = 1;
                        previewNode.update(1);
                        _setTimeout(function () {

                            var pos = new Vector2(0, 0), c = 0;

                            var dbs = previewNode.$({ __isDBDisplay: 1 });

                            if (dbs) {
                                $each(dbs, function (d) {
                                    var sz = d.__size.__clone().__multiplyScalar(0.5).__multiply(d.____scale)
                                        , wp = d.__worldPosition
                                    d.left = wp.x - sz.x;
                                    d.right = wp.x + sz.x;
                                    d.top = wp.y - sz.y;
                                    d.bottom = wp.y + sz.y;

                                    //                                     d.__img = undefined;
                                    //                                     d.__color = randomInt(0,0xffffff);
                                });

                                var left = selectMinSomethingBy(dbs, function (d) { return d.left }, 1)
                                    , right = selectMaxSomethingBy(dbs, function (d) { return d.right }, 1)
                                    , top = selectMinSomethingBy(dbs, function (d) { return d.top }, 1)
                                    , bottom = selectMaxSomethingBy(dbs, function (d) { return d.bottom }, 1)
                                    , wp = previewNode.__worldPosition;


                                consoleLog(wp, left, right, top, bottom);
                                var sz = previewNode.__size;

                                var scale = 1 / mmax((right - left) / sz.x, (bottom - top) / sz.y);
                                previewNode.__anim({
                                    __x: scale * wp.x - scale * (left + right) / 2,
                                    __y: scale * wp.y - scale * (top + bottom) / 2,
                                    __scaleF: scale
                                }, 0.1);

                            }

                        }, 0.1);


                    }

                }, function (data) {

                    previewNode.__text = 'loading error';
                    checkDBData(data);

                }, isHd, old);

                deactivateProjectOptions();
            }
        }

    },

    FileWorkersWithKitten = {

        '\\.\\./backups/\\w*/layouts/(.*)\\.json$': LayoutFileWorker,
        'layouts/(.*)\\.json$': LayoutFileWorker,
        'res/windows.*/(.*)\\.json$': LayoutFileWorker,
        'res/ui.*/(.*)\\.json$': LayoutFileWorker,
        'res/interface.*/(.*)\\.json$': LayoutFileWorker,
        'res_sources/ui/(.*)\\.json$': LayoutFileWorker,
        'ui.*/(.*)\\.json$': LayoutFileWorker,

        //'(^[^/]*)\.json$': LayoutFileWorker,

        '(.*/)(.*\\.effect\\.json)$': ParticlesFileWorker,

        '(.*\\.(png|jpg|webp|mp4|webm))$': ImagePreviewerWithKitten,

        '^(.*\\.[htx]*ml)$': RAWPreviewerWorker,
        '^(.*\\.[vf])$': RAWPreviewerWorker,
        '^(.*\\.js)$': RAWPreviewerWorker,

        '(.*/)([^/]*\\.[vp]sh)$': ShaderPreviewerWorker,

        '(.*\\.[to]tf)': FontFileWorker,

        '(.*/)([^/]*)\\.dbn': DragonBonesFileWorker,
        '(.*/)([^/]*)\\.spnb?': SpineFileWorker

    },

    DumpFileWorker = {
        err() { console.error('unknown file worker for', this.match); },
        onTap() { this.err(); },
        save() { this.err(); },
        open() { this.err(); },
        publish() { this.err(); },
        download() { this.err(); }
    },

    FileManagerWithKitten = {

        fileWorkers: FileWorkersWithKitten,

        stringify() {
            Editor.saveDataMode = 1;
            var r = JSON.stringify.apply(JSON, arguments);
            Editor.saveDataMode = 0;
            return r;
        },

        getFileWorker(path, method, args, defaultFW) {

            var fw;
            defaultFW = defaultFW || DumpFileWorker;
            if (path) {
                if (path.path != undefined) {
                    path = path.path;
                }

                defaultFW.match = path;

                fw = $find(FileWorkersWithKitten, function (f, i) {
                    var m = path.match(new RegExp(i, 'i'));
                    if (m) {
                        f.match = m;
                        return 1;
                    }
                }) || defaultFW;

                if (method) {
                    if (isFunction(fw[method])) {
                        fw[method].apply(fw, args);
                    } else {
                        consoleError('no method ', method, 'for file worker for', path);
                    }
                }

                return fw;
            }

            return defaultFW;
        },

        filter: function (data) {
            return data;
        },

        getIconByFilename: function (fullpath) {

            fullpath = basename(fullpath);
            var ext = fileext(fullpath).toLowerCase();

            if (ext) {
                switch (ext) {
                    case 'jpeg': case 'jpg':
                    case 'png': case 'webp':
                        function chpreview(p) {
                            return globalConfigsData.__frames[p]
                        }
                        var pr = fullpath.split('.')[0];
                        var a = chpreview(pr + '_preview') || chpreview(pr + '_preview.png') || chpreview(pr);
                        if (a) {
                            return a;
                        }
                        break;
                }

                if (globalConfigsData.__frames[ext]) {
                    return ext;
                }
            }

            return '_blank';
        },

        downloadFile: function (fn, data) {
            this.getFileWorker(fn, 'download', [data]);
        },

        publishFile: function (fn, data) {
            this.getFileWorker(fn, 'publish', [data]);
        },

        saveFile: function (fn, data, defaultFileWorker) {
            this.getFileWorker(fn, 'save', [data], defaultFileWorker);
        },

        openFile: function (fn, data) {
            this.getFileWorker(fn, 'open', [data]);
        },

        fileListToTree: function (list, fullpath, txt) {

            var a = 0;
            fullpath = fullpath || '';
            //             consoleLog(list, fullpath, txt);
            if (isArray(list) || isObject(list)) {

                //                 if (fullpath =='spine/') debugger;

                var isobj = isObject(list);
                if (isDB1(list)) {
                    // it's a DragonBones!
                    //                         consoleLog("---- db1", fullpath);
                    fullpath = fullpath.replace(/\/$/, '.dbn');
                    return new TreeEntry({
                        text: txt + '.dbn',
                        icon: 'dbn',
                        path: fullpath,
                        hd: list.hd && list.hd[0],
                        onTap: function (node) {
                            focusFileEntry(this);
                            if (isCtrlPressed) {
                                node.__contextMenu();
                            } else {
                                FileManagerWithKitten.getFileWorker(node.entry).onTap(node, this.hd);
                            }
                        },
                        contextMenu: onFileContextMenu
                    });
                }
                else
                    if (isDB2(list)) {
                        // it's a DragonBones with old format!
                        //                     consoleLog("---- db2", fullpath);
                        var fp = fullpath;
                        fullpath = fullpath.replace(/\/$/, '.dbn');
                        return new TreeEntry({
                            text: txt + '.dbn',
                            icon: 'dbn',
                            fullpath: fp,
                            path: fullpath,
                            hd: list.hd && list.hd[0] == 'texture.png',
                            onTap: function (node) {
                                focusFileEntry(this);
                                if (isCtrlPressed) {
                                    node.__contextMenu();
                                } else {
                                    FileManagerWithKitten.getFileWorker(node.entry).onTap(node, this.hd, 1);
                                }
                            },
                            contextMenu: onFileContextMenu
                        });

                    }
                    else
                        if (a = isSpine(list)) {
                            //                     consoleLog("---- spn", fullpath);
                            var isBinary = a.isBinary;
                            var fp = fullpath;
                            fullpath = fullpath.replace(/\/$/, '.spn' + (isBinary ? 'b' : ''));
                            txt = txt + '.spn' + (isBinary ? 'b' : '');

                            var hasHD = isArray(list.hd);

                            return new TreeEntry({
                                text: txt,
                                icon: 'spn',
                                fullpath: fp,
                                path: fullpath,
                                hasHD: hasHD,
                                onTap: function (node) {
                                    focusFileEntry(this);
                                    if (isCtrlPressed) {
                                        node.__contextMenu();
                                    } else {
                                        FileManagerWithKitten.getFileWorker(node.entry).onTap(node);
                                    }
                                },
                                contextMenu: onFileContextMenu
                            });

                        }

                var dir = new TreeEntry({
                    text: txt || fullpath,
                    icon: 'folder',
                    directory: 1,
                    path: fullpath || (txt ? txt + '/' : ''),
                    data: [],
                    onTap: function (node) { focusFileEntry(this); },
                    contextMenu: onFileContextMenu
                });

                if (isobj) {
                    var keys = objectKeys(list);
                    keys = keys.sort(function (a, b) {
                        if (isNumeric(a)) {
                            if (isNumeric(b)) {
                                return list[a] > list[b] ? 1 : -1;
                            }
                            return 1;
                        }
                        if (isNumeric(b))
                            return -1;
                        return a > b ? 1 : -1;
                    });

                    $each(keys, function (k) {
                        dir.data.push(
                            FileManagerWithKitten.fileListToTree(list[k], fullpath + (isNumeric(k) ? "" : (k + '/')), k)
                        );
                    });

                } else {
                    //                     list = list.sort();
                    for (var i in list) {
                        dir.data.push(
                            FileManagerWithKitten.fileListToTree(list[i], fullpath + (isobj ? (isNumeric(i) ? "" : (i + '/')) : ''), isobj ? i : null)
                        );
                    }

                }

                //                 for (var i in list) {
                //                     dir.data.push( 
                //                         FileManagerWithKitten.fileListToTree( list[i], fullpath + ( isobj ? (isNumeric(i) ? "" :(  i + '/' )) : '' ), isobj ? i : null ) 
                //                     );
                //                 }
                //                 
                return dir;

            } else {
                //                 consoleLog(fullpath + list);
                return new TreeEntry({
                    text: list,
                    icon: FileManagerWithKitten.getIconByFilename(list),
                    path: fullpath + list,
                    onTap: function (node) {
                        focusFileEntry(this);
                        if (isCtrlPressed) {
                            node.__contextMenu();
                        } else {
                            FileManagerWithKitten.getFileWorker(node.entry).onTap(node);
                        }
                    },
                    contextMenu: onFileContextMenu
                });
            }

        },

        listing: e => {

            if (isString(e)) {
                if (e == 'layouts') {
                    activateProjectOptions();
                    var folder = options.__baseLayoutsFolder || '';
                    deactivateProjectOptions();
                    e = { path: '^' + escapeRegExpWithKitten(folder) + '.*\.json$' };
                } else {
                    e = { path: escapeRegExpWithKitten(e) };
                }
            } else
                if (e instanceof RegExp) {
                    e = { path: e };
                }


            var files = FileManagerWithKitten.currentFiles;


            if (isObject(e)) {

                if (e.hasOwnProperty('path')) {
                    var f = [];
                    function trav(_ff) {
                        $each(_ff, function (v) {
                            if (v.path && v.path.match(e.path)) {
                                f.push(v);
                            }
                            if (v.data) {
                                trav(v.data);
                            }
                        });
                    }
                    trav(files);
                    files = f;
                }

                if (e.filter) {
                    files = $filter(files, e.filter);
                }
            }

            return files;

        }


    };

var updateFiles = function () { };

function focusFileEntry() { };

var fileManagerPanel;

EditorUIBehavioursWithKitten.behaviours.filemanager = (function () {



    function prepareFilesUploading() {

        var uploadPath = '';

        function fileDragHover(e) {
            e.stopPropagation();
            e.preventDefault();

            uploadPath = undefined;

            if (fileManagerPanel) {
                onDocumentMouseMove(e);

                var nod, entries = [];
                if (fileManagerPanel.__hitTest(mouse)) {

                    entries = [fileManagerPanel];
                    fileManagerPanel.__traverse(function (n) {
                        if (n.__hitTest(mouse)) {
                            var entry = n.entry || n.contentEntry;
                            if (entry && entry.directory) {
                                entries.push(n);
                            }
                        }
                    });

                    entries.sort(function (a, b) { return a.z == b.z ? b.id - a.id : b.z - a.z });

                    var e = entries[0];
                    var entry = e.contentEntry || e.entry;

                    uploadPath = entry ? entry.path : '/';

                }

            }

        }

        function readFile(file, onload, onprogress, asText, asBuffer) {

            if (file) {

                if (file instanceof File) {
                    var filename = file.fullpath || file.name;
                    var reader = new FileReader();

                    if (!reader) {
                        consoleError("no reader");
                        return;
                    }

                    reader.onerror = onError;

                    if (onprogress) {
                        reader.onprogress = function (e) {
                            if (e && e.lengthComputable) {
                                onprogress(e.position || e.loaded, e.totalSize || e.total || file.size, filename);
                            }
                        };
                    }

                    reader.onload = function (e) {
                        if (asBuffer) {
                            result = e.target.result;
                        } else if (asText || reader.readAsBinaryString) {
                            result = btoa(e.target.result);
                        } else {
                            result = '';
                            var a = new Uint8Array(e.target.result);
                            for (var i = 0; i < a.length; i++)
                                result += String.fromCharCode(a[i]);
                        }
                        if (onprogress) onprogress(result.length, result.length, filename);
                        if (onload) onload(result, filename);
                    };

                    looperPost(() => {
                        if (asBuffer) reader.readAsArrayBuffer(file)
                        else if (asText) reader.readAsText(file)
                        else if (reader.readAsBinaryString) reader.readAsBinaryString(file);
                        else reader.readAsArrayBuffer(file);
                    });

                    return reader;

                } else if (isObject(file)) {

                    var filename = file.fullpath || file.name;
                    if (!filename)
                        return onError('no filename', file);

                    function trySaveOnServerSide() {

                        //TODO
                        onError.apply(this, arguments);

                    }

                    if (file.isImg) {

                        if (file.base64) {
                            looperPost(function () {
                                onload(file.base64, filename)
                            });
                            return { abort: function () { } };

                        } else if (file.url) {

                            var tex = loadImage({ n: filename, u: file.url }, function () {
                                if (onload) {
                                    try {
                                        var base64data = base64ImageFromNormalTexture(tex, file.type);
                                        onload(base64data, filename);
                                    } catch (e) {
                                        // may need CORS policies, need saving on server side
                                        trySaveOnServerSide();
                                    }
                                }
                            }, 0, function (e) {
                                if (onprogress) onprogress(e.position || e.loaded, e.totalSize || e.total || file.size, filename);
                            }, trySaveOnServerSide);

                            return tex;
                        }

                    } else if (file.url) {

                        // dont checked!! need CORS policy

                        var xhr = new XMLHttpRequest();

                        xhr.onerror = trySaveOnServerSide;

                        xhr.onload = function () {
                            if (xhr.status > 299) trySaveOnServerSide(xhr.status);
                            else {
                                var res;
                                switch (xhr.responseType) {
                                    case "arraybuffer": res = new Uint8Array(xhr.response); break;
                                    case "blob": res = xhr.response; break;
                                    default: res = xhr.responseText; break;
                                }
                                if (res) {
                                    onload(res, filename);
                                }
                            }
                        };

                        xhr.onprogress = function (e) {
                            if (e && e.lengthComputable) {
                                onprogress((e.position || e.loaded), e.totalSize || e.total || file.size, filename);
                            }
                        }

                        xhr.onloadend = function () { if (xhr.status > 299) trySaveOnServerSide(xhr.status); };

                        xhr.open('GET', file.url, true);
                        xhr.send();

                        return xhr;
                    }

                }
            }
        }

        Editor.supportedDownloadTypes = ['image/png', 'image/jpeg', 'image/webp', 'psd', 'video/mp4', 'video/webm'];

        function processFiles(files, needAsker, hasDir) {

            var count = 0;

            var totalFilesSize = 0;
            var loaded = 0;
            var ftsk = {};

            var _isSpine, skipCheck, _isDragonBones, _isPsd;

            var askerOk = 0;

            var askerOk2 = 0;

            var status = 'reading';
            var autocloseAsker = 0;


            function uploadFiles() {

                status = 'uploading';

                for (var filename in ftsk) {

                    var file = ftsk[filename];

                    file.loaded = 0;
                    file.progress = 0;

                    consoleLog('upload', filename);

                    serverCommand({
                        command: 'fileWrite',
                        file: file.uploadPath,
                        content: file.result,
                        binary: 1
                    },
                        // onLoad
                        function (r) {
                            onloadOneFile(r, this);
                        }.bind(filename),
                        // onProgress
                        function (loaded, total) {

                        },
                        //onError
                        0,

                        //uploadProgress
                        function (loaded, total) {
                            onprogressOneFile(loaded, total, this);
                        }.bind(filename));

                }

                if (needAsker) {
                    AskerWithKitten.o.cancel = function () {
                        for (var i in ftsk) {
                            ftsk[i].writer.abort();
                        }
                    }

                    AskerWithKitten.o.ok = function () { return 1; }
                }

            }


            function onPSDUploaded(changes, sn, f, p) {
                changes.push({ type: 'unselect', node: sn });
                sn.__unselect();

                var psdName = (f.filename || p)
                    .replace(/.psd$/, '')
                    .replace(/[^\w\d]*/gi, '');

                var n = sn.__addChildBox({
                    __userData: {
                        psd: p
                    },
                    name: psdName
                });

                var PSD = require('psd');
                var psd = new PSD(new Uint8Array(f.result));
                psd.parse();
                if (psd.image) {
                    n.__size = [psd.image.width(), psd.image.height()];
                }

                function trv(n, tree) {
                    if (tree && tree.children) {
                        var childs = tree.children();
                        if (isArray(childs)) {
                            childs.reverse();
                            var tmpp = 0;
                            var namemap = {};
                            $each(childs, c => {
                                var x = c.left
                                    , y = c.top
                                    , r = c.right
                                    , b = c.bottom
                                    , w = r - x
                                    , h = b - y;

                                n.ha = 0; n.va = 0;

                                var img, i = (c.layer || 0).image;
                                if (i) {
                                    try {
                                        img = i.toBase64();
                                    }
                                    catch (e) {
                                        consoleLog("can't get image from psd layer ", c.name);
                                    }
                                }
                                if (img) {

                                    var cn = n.__addChildBox({
                                        __ofs: [x, y, -1],
                                        __size: [w, h],
                                        name: c.name,
                                        __img: img
                                    });

                                    var uid = (namemap[c.name] || 0);
                                    namemap[c.name] = uid + 1;

                                    if (askerOk2 == 1) {
                                        tmpp++;
                                        var imageName = 'img/psd/' + psdName + "/" + c.name + (uid ? uid : '') + ".png";
                                        serverCommand({
                                            command: 'fileWrite',
                                            file: imageName,
                                            content: img.replace('data:image/png;base64,', ''),
                                            binary: 1
                                        }, r => {
                                            if (r) {
                                                cn.__img = imageName + "?";
                                            } else {
                                                onError("can't upload ", imageName);
                                            }
                                            tmpp--;
                                            if (!tmpp) {
                                                BUS.__post('FILES_CHANGED');
                                            }
                                        });
                                    }

                                } else {

                                    var nc = n.__addChildBox({
                                        __size: [1, 1],
                                        __z: -1,
                                        name: c.name
                                    });

                                    trv(nc, c);
                                }
                            });
                        }
                    }
                }

                trv(n, psd.tree());

                consoleLog("PSD tree:\n", psd.tree().export());

                /*
                PSD.fromURL(modUrl(f.uploadPath)).then(psd => {
                    consoleLog(psd.tree().export());
                }).catch(e => onError(e));
                */

                changes.push({ type: '+', node: n });
                n.__select();
            }

            function uploadFinished() {
                status = '';
                if (needAsker) {
                    AskerWithKitten.o.ok = function () { }
                    AskerWithKitten.o.cancel = function () { }
                    AskerWithKitten.setCaption('upload finished');
                    if (autocloseAsker)
                        AskerWithKitten.close();
                }

                var changes = [];

                activateProjectOptions();

                eachSelected(sn => {

                    if ((_isDragonBones || _isSpine) && (sn == Editor.currentLayout.layoutView)) {
                        sn = sn.__addChildBox({
                            __size: [500, 500]
                        });

                        changes.push({ type: '+', node: sn });
                        sn.__select();
                    }

                    if (_isDragonBones) {

                        var dir;
                        for (var i in ftsk) {
                            dir = dirname(i).replace(/^\/(.*)\/$/, '$1');
                            break;
                        }

                        //TODO ??
                        sn.__dragonBones = dir;
                        // debugger;
                    } else
                        if (_isSpine) {
                            var dir;
                            for (var i in ftsk) {
                                dir = dirname(i).replace(/^\/(.*)\/$/, '$1');
                                break;
                            }

                            sn.__spine = {
                                __name: dir,
                                __binary: ftsk['/' + dir + '/' + dir + '.skel'] ? 1 : 0,
                                __hd: ftsk['/' + dir + '/hd/' + dir + '.png'] ? 1 : 0
                            };

                        } else {
                            $each(ftsk, f => {
                                var p = f.uploadPath;
                                if (p.endsWith('.jpg') ||
                                    p.endsWith('.jpeg') ||
                                    p.endsWith('.png') ||
                                    p.endsWith('.webp')) {

                                    changes.push({ type: 'unselect', node: sn });
                                    sn.__unselect();

                                    var n = sn.__addChildBox({
                                        __img: p + '?'
                                    }).__anim({ __alpha: [0, 1], __scaleF: [2, 1] }, 0.1);

                                    changes.push({ type: '+', node: n });
                                    n.__select();
                                } else
                                    if (p.endsWith('.psd')) {
                                        onPSDUploaded(changes, sn, f, p);
                                    }
                            });
                        }

                }, 1);

                deactivateProjectOptions();

                // consoleLog(changes);
                BUS.__post('FILES_CHANGED');

                objectChanged(changes);

            }

            function updateBar() {
                var progress = 0;
                for (var i in ftsk) {
                    progress += ftsk[i].progress;
                }

                progress /= count;

                if (needAsker && status) {
                    AskerWithKitten.progress(progress, status);
                }

                if (progress == 1) {

                    if (Editor.fileDropHanler) {

                        if (status == 'reading') {
                            if ($find(ftsk, f => !f.result)) {
                                return;
                            }

                            Editor.fileDropHanler(ftsk);
                            status = '';
                        }

                        return;
                    }

                    if (!needAsker || askerOk) {
                        if (status == 'reading') {

                            if ($find(ftsk, f => !f.result)) {
                                return;
                            }

                            if (askerOk == -1 && askerOk2) {
                                autocloseAsker = 1;
                                uploadFinished();
                            } else {
                                uploadFiles();
                            }
                        }
                        else
                            if (status == 'uploading') {
                                uploadFinished();
                            }
                    }
                }
            }


            function onloadOneFile(result, filename) {
                ftsk[filename].progress = 1;
                ftsk[filename].result = result;
                consoleLog("onload", filename);
                updateBar();
            }

            function onprogressOneFile(current, max, filename) {
                ftsk[filename].loaded = current;
                ftsk[filename].max = max;
                ftsk[filename].progress = current / max;
                updateBar();
            }

            if (files) {

                // набор для спайна/db
                var list = $map(files, f => f.name);
                _isDragonBones = isDB1(list) || isDB2(list);
                _isSpine = isSpine(list)
                skipCheck = _isSpine || _isDragonBones;

                if (uploadPath === undefined) {
                    if (_isSpine) {
                        uploadPath = options.__baseSpineFolder;
                    } else
                        if (_isDragonBones) {
                            uploadPath = options.__baseDragonBonesFolder;
                        }
                }

                for (var i = 0, f; f = files[i]; i++) {
                    var type = f.type;
                    if (!f.type && f.name && f.name.endsWith('.psd')) {
                        type = 'psd';
                        _isPsd = (_isPsd || 0) + 1;
                    }

                    if (!skipCheck && Editor.supportedDownloadTypes.indexOf(type) < 0) {
                        onError('unsupported type', type);
                    }

                    if (uploadPath === undefined) {
                        if (isImageType(type)) {
                            uploadPath = 'img/';
                        } else if (type == 'psd') {
                            uploadPath = 'psd/';
                        } else {
                            debugger;
                        }
                    }
                }

                // process all File objects
                $each(files, f => {
                    var filename = f.fullpath || f.name;
                    consoleLog("read", filename);
                    var asBuffer = filename.endsWith('psd');
                    var reader = readFile(f, onloadOneFile, onprogressOneFile, 0, asBuffer);
                    if (reader) {
                        ftsk[filename] = {
                            file: f,
                            uploadPath: uploadPath + filename,
                            filename: filename,
                            loaded: 0,
                            max: f.size,
                            progress: 0,
                            reader: reader
                        };
                        totalFilesSize += f.size;
                        count++;
                    }
                });
            }

            if (Editor.fileDropHanler)
                return;

            if (!uploadPath || !uploadPath.endsWith("/")) {
                return onError('uploadPath error : ', uploadPath);
            }

            if (totalFilesSize > 1 * 1024 * 1024 || count > 10) {
                autocloseAsker = !needAsker;
                needAsker = 1;
            }

            if (needAsker) {
                var cancel = function () {
                    for (var i in ftsk) {
                        if (ftsk[i].reader) {
                            ftsk[i].reader.abort();
                        }
                    }
                }

                var psdImageAsk = function () {

                    AskerWithKitten.ask({
                        caption: 'upload images after psd import?',
                        noinput: 1,
                        bar: 1,
                        ok() {
                            askerOk2 = 1;
                            updateBar();
                        },
                        no() {
                            askerOk2 = -1;
                            updateBar();
                        },
                        cancel: cancel
                    });
                }

                var askerOpts = {

                    caption: 'upload ' + files.length + ' files to ' + uploadPath + ' ?',

                    noinput: 1,

                    bar: 1,

                    ok() {
                        // fetch FileList object
                        askerOk = 1;
                        if (_isPsd) {
                            psdImageAsk();
                        } else {
                            updateBar();
                        }
                    },

                    cancel: cancel
                };

                if (_isPsd) {
                    askerOpts.no = function () {
                        askerOk = -1;
                        psdImageAsk();
                        return 1;
                    }
                }

                AskerWithKitten.ask(askerOpts);
            }

            updateBar();

        }


        addEventListenersToElement(__document, {
            dragover: fileDragHover,
            dragleave: fileDragHover,

            drop: function (e) {
                fileDragHover(e);

                var files = e.target.files || e.dataTransfer.files;
                var needAsker = uploadPath !== undefined;
                var hasDir = 0;

                // if directory support is available
                // поддержка не очень, правда
                // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
                if (e.dataTransfer.items) {

                    files = [];
                    var c = 0, nc = 0;
                    function addDirectory(item) {
                        if (item.isDirectory) {
                            var directoryReader = item.createReader();
                            nc++;
                            directoryReader.readEntries(entries => {
                                c++;
                                $each(entries, addDirectory);
                                if (c == nc) {
                                    processFiles(files, needAsker, hasDir);
                                }
                            }, onError);
                        } else
                            if (item.isFile) {
                                nc++;
                                var fullpath = item.fullPath;
                                item.file(file => {
                                    c++;
                                    file.fullpath = fullpath;
                                    files.push(file);
                                    if (c == nc) {
                                        processFiles(files, needAsker, hasDir);
                                    }
                                }, onError);
                            }
                    }

                    $each(e.dataTransfer.items, item => {
                        if (item.webkitGetAsEntry) {
                            item = item.webkitGetAsEntry();
                            if (item) {
                                hasDir = 1;
                                needAsker = 1;
                                addDirectory(item);
                            }
                        }
                    });

                    return;
                }

                if (!files || files.length == 0) {
                    try {
                        files = [];
                        var text = e.dataTransfer.getData('text/html');
                        if (!text) text = e.dataTransfer.getData('text/plain');
                        if (isString(text)) {
                            // not good regexp 
                            var base64matches = text.match(/data:image\/(png|jpeg|webp);base64,[\w\d+\/=]*/gi);

                            if (base64matches && base64matches.length) {
                                var d = Date.now(), i = 0;
                                files = concatArraysWithUniqueItems(files, base64matches).map(
                                    function (b64) {
                                        b64 = b64.split(',');
                                        var type = b64[0].match(/image.png/i) ? 'png' :
                                            b64[0].match(/image.webp/i) ? 'webp' : 'jpeg';
                                        return {
                                            isImg: 1,
                                            base64: b64[1],
                                            name: 'b64_' + d + '_' + i + '.' + type.replace('e', ''),
                                            size: 1,
                                            type: 'image/' + type
                                        }
                                    }
                                );

                            }

                            var urls = text.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp)[^\s'"]*)/gi);

                            if (urls && urls.length) {
                                files = concatArraysWithUniqueItems(files, urls).map(
                                    function (url) {
                                        return {
                                            isImg: 1,
                                            url: url,
                                            name: url.replace(/https?:\/\/[^\s]*\/([\w\d%]+\.(png|jpg|jpeg|webp))/gi, function (a, b, c) { return b; }),
                                            size: 1,
                                            type: url.match(/(https?:\/\/[^\s]+\.png[^\s'"]*)/gi) ? 'image/png' :
                                                url.match(/(https?:\/\/[^\s]+\.webp[^\s'"]*)/gi) ? 'image/webp' : 'image/jpeg'
                                        }
                                    }
                                );
                            }
                            consoleLog(files);
                            //                                 needAsker = 1;
                        }
                    } catch (e) {
                        return onError(e);
                    }
                }

                if (!files || !((files instanceof FileList) || isArray(files)) || files.length == 0)
                    return onError("no files in drop event! or I don't understand you... I'm just a stupid robot.");

                processFiles(files, needAsker, hasDir);

            }

        }
        );

    }

    BUS.__addEventListener({

        FILES_CHANGED: function () {
            updateFiles();
        },

        PROJECT_OPENED: function () {
            updateFiles(Editor.currentProject.files);
        },

        EDITOR_PREPARED: function () {
            prepareFilesUploading();
        }
    }
    );


    var findPanel;
    addEditorEvents('Files', {

        cancelFind: function () {
            if (findPanel) {
                findPanel.input.unfocus();
            }
        },

        find: function () {

            if (findPanel) {

                findPanel.__visible = 1;

                if (!findPanel.input.__bindedObject) {
                    ObjectDefineProperty(fileManagerPanel, 'findText', createSomePropertyWithGetterAndSetter(
                        function () { return this.__findText; },
                        function (v) {
                            this.__findText = v;
                            if (v) {
                                var files = (Editor.currentProject || 0).files;
                                if (files) {

                                    function matched(e) {
                                        return e.text && e.text.match(v)
                                    }

                                    function finder(e) {
                                        if (matched(e)) return e;
                                        var se = $find(e.data, function (ed) { return matched(ed) });
                                        if (se) return se;
                                        for (var i in e.data) {
                                            var f = finder(e.data[i]);
                                            if (f) return f;
                                        }
                                    }

                                    var rootEntry = getDeepFieldFromObject(fileManagerPanel, '__contentNode', '__pentry');
                                    if (rootEntry) {
                                        focusFileEntry(finder(rootEntry), { withAutoExpand: 1, withAutoScroll: 1 });
                                    }

                                }
                            }
                        }
                    ));

                    findPanel.input.__onBlur = function () {
                        findPanel.__visible = 0;
                    };

                    EditFieldsWithKitten.bindInput(findPanel.input, fileManagerPanel, 'findText');
                }

                findPanel.input.focus();

            }

        },


        mkdir: function (e) {
            //{ path: fullpath, name: r  });
            if (e && e.path && e.name && isString(e.path) && isString(e.name)) {
                if (!e.name.match(/^\w*$/g)) {
                    return onError('bad name. use latin characters, digits and _');
                }
                return serverCommand({ command: 'mkdir', path: e.path, name: e.name }, function () { updateFiles() });
            }
            return onError('bad args', e);
        },

        remove: function (e) {
            //{ path: fullpath } );
            //{ path: fullpath, name: r  });
            var path = e ? e.entry && e.entry.fullpath ? e.entry.fullpath : e.fullpath || e.path : 0;
            if (path && isString(path)) {
                return serverCommand({ command: 'fileRemove', path: path }, function () {
                    if (e.entry) {
                        e.entry.remove();
                    }
                    else {
                        updateFiles();
                    }
                });
            }
            return onError('bad args', e);
        },

        rename: function (e) {
            //{ path: fullpath, name: r  });

            if (e && e.path && e.name && isString(e.path) && isString(e.name)) {
                var srcName = basename(e.path);
                if (srcName == e.name) {
                    if (e.canMove) {
                        if (dirname(e.name) == dirname(e.path)) {
                            return;
                        }
                    } else {
                        return;
                    }
                }

                var m = e.canMove ? e.name.match(/^[\w\/]*\.?\w*$/g) : e.name.match(/^\w*\.?\w*$/g);

                if (!m) {
                    return onError('bad name. use latin characters, digits, one dot and _.');
                }

                return serverCommand({
                    command: 'fileRename',
                    path: e.path,
                    name: e.name,
                    canMove: e.canMove

                }, function () {

                    if (e.entry && !e.canMove) {

                        var path, icon;

                        if (e.entry.directory) {
                            path = dirname(e.path).split('/');
                            path.pop(); path.pop(); path.push(e.name);
                            path = path.join('/');
                            icon = 'folder';
                        }
                        else {
                            path = (dirname(e.path) + e.name);
                            icon = FileManagerWithKitten.getIconByFilename(e.name);
                        }

                        e.entry.init({ text: e.name, path: path, icon: icon });

                    } else {
                        updateFiles();
                    }

                });
            }
            return onError('bad args', e);
        }
    });


    addKeyboardMap({
        'ctrl+shift+f': 'Files.find'
    });

    return function (n) {

        fileManagerPanel = n;

        findPanel = fileManagerPanel.__parent.__alias('findPanel') || 0;
        findPanel.__visible = 0;

        focusFileEntry = function (e, params) {
            var rootEntry = getDeepFieldFromObject(fileManagerPanel, '__contentNode', '__pentry');
            if (rootEntry) {
                if (rootEntry.__focusedEntry) {
                    rootEntry.__focusedEntry.unfocus();
                }
                if (e) e.focus(params);
                rootEntry.__focusedEntry = e;
            }
        }

        updateFiles = function (files) {
            if (files) {

                FileManagerWithKitten.currentFiles = FileManagerWithKitten.fileListToTree(
                    FileManagerWithKitten.filter(files)
                ).data;

                if (fileManagerPanel) {

                    TreeWithKitten.refill(fileManagerPanel,
                        FileManagerWithKitten.currentFiles,
                        0,
                        {
                            onEntryPlateDragEnd: function (pl) {
                                var e = pl.entry;
                                var entry = (pl.p0 || pl.p1 || pl.p2 || 0).entry;
                                if (entry) {
                                    var dstdir = dirname(entry.path);
                                    var name = e.directory ? e.text : basename(e.path);
                                    var srcdir = dirname(e.path);

                                    if (srcdir != dstdir)
                                        renameFile(e.path.replace(/\/$/, ''), dstdir + name, entry, 1);
                                }

                            }
                        }
                    );
                    fileManagerPanel.__scrollToBegin();

                    BUS.__post('FILES_UPDATED');

                }
            } else {
                serverCommand({ command: 'dirlist' }, function (list) {
                    Editor.currentProject.files = list;
                    updateFiles(Editor.currentProject.files);
                });
            }

        };

        fileManagerPanel.__contextMenu = onFileContextMenu;
    }

})();

function deactivateProjectOptions(l) {
    l = l || Editor.currentLayout;
    if (l) {
        l.deactivateOptions();
    } else {
        deactivateOptions(Editor.currentProject.options);
    }
}

function activateProjectOptions(l) {
    l = l || Editor.currentLayout;
    if (l) {
        l.activateOptions();
    } else {
        activateOptions(Editor.currentProject.options);
    }
}

