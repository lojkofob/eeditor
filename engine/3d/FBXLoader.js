
FBXLoader = function () { };

(a => {

    /// \todo:
    var SRGBColorSpace = 123;

    var connections, sceneGraph;

    makeClass(FBXLoader, {

        __load: function (url, task) {

            var self = this;

            self.__resourceDirectory = "/" + dirname(url);
            task.__loadTaskOne(TASKS_RAWBUFFER, url);

            task.__addOnCompleted(a => {

                factory3d.__onDataLoaded(url, self.__parse(globalConfigsData[url], task.__onError || consoleDebug));

            });

        },

        __parse(FBXBuffer, onerr) {

            if (FBXBuffer) {
                var fbxTree;
                if (isFbxFormatBinary(FBXBuffer)) {

                    fbxTree = new BinaryParser().__parse(FBXBuffer, onerr);

                } else {

                    const FBXText = FBXBuffer;

                    if (!isFbxFormatASCII(FBXText)) {
                        onerr('FBXLoader: Unknown format.');
                    } else {

                        const versionRegExp = /FBXVersion: (\d+)/;
                        const match = FBXText.match(versionRegExp);

                        var ver = match ? parseInt(match[1]) : 0;

                        if (ver < 7000) {
                            onerr('FBXLoader: FBX version not supported, FileVersion: ' + ver);
                        } else {

                            fbxTree = new TextParser().__parse(FBXText);
                        }

                    }

                }

                if (fbxTree) {
                    consoleLog(fbxTree);
                    if (fbxTree.Objects) {
                        return new FBXTreeParser(this.__resourceDirectory).__parse(fbxTree);
                    } else {
                        onerr('FBXLoader: no objects.');
                    }
                }

            } else {
                onerr('FBXLoader: no data.');
            }
        }

    });

    // __parse the FBXTree object returned by the BinaryParser or TextParser and return a Group
    function FBXTreeParser(rd) {
        this.__resourceDirectory = rd;
    }

    makeClass(FBXTreeParser, {

        __parse(fbxTree) {
            this.__fbxTree = fbxTree;
            this.__objects = fbxTree.Objects;

            connections = this.__parseConnections();

            const images = this.__parseImages();
            const textures = this.__parseTextures(images);
            const materials = this.__parseMaterials(textures);
            const deformers = this.__parseDeformers();
            const geometryMap = new GeometryParser(this).__parse(deformers);

            this.__parseScene(deformers, geometryMap, materials);

            return sceneGraph;

        },

        // __parses FBXTree.Connections which holds parent-child connections between objects (e.g. material -> texture, model->geometry )
        // and details the connection type
        __parseConnections() {

            const connectionMap = new Map();

            if ('Connections' in this.__fbxTree) {

                const rawConnections = this.__fbxTree.Connections.connections;

                rawConnections.forEach(function (rawConnection) {

                    const fromID = rawConnection[0];
                    const toID = rawConnection[1];
                    const relationship = rawConnection[2];

                    if (!connectionMap.has(fromID)) {

                        connectionMap.set(fromID, {
                            __parents: [],
                            children: []
                        });

                    }

                    const parentRelationship = { ID: toID, relationship: relationship };
                    connectionMap.get(fromID).__parents.push(parentRelationship);

                    if (!connectionMap.has(toID)) {

                        connectionMap.set(toID, {
                            __parents: [],
                            children: []
                        });

                    }

                    const childRelationship = { ID: fromID, relationship: relationship };
                    connectionMap.get(toID).children.push(childRelationship);

                });

            }

            return connectionMap;

        },

        // __parse FBXTree.Objects.Video for embedded image data
        // These images are connected to textures in FBXTree.Objects.Textures
        // via FBXTree.Connections.
        __parseImages() {

            const images = {};
            const blobs = {};

            if ('Video' in this.__objects) {

                const videoNodes = this.__objects.Video;

                for (const nodeID in videoNodes) {

                    const videoNode = videoNodes[nodeID];

                    const id = parseInt(nodeID);

                    images[id] = videoNode.RelativeFilename || videoNode.Filename;

                    // raw image data is in videoNode.Content
                    if ('Content' in videoNode) {

                        const arrayBufferContent = (videoNode.Content instanceof ArrayBuffer) && (videoNode.Content.byteLength > 0);
                        const base64Content = (typeof videoNode.Content === 'string') && (videoNode.Content !== '');

                        if (arrayBufferContent || base64Content) {

                            const image = this.__parseImage(videoNodes[nodeID]);

                            blobs[videoNode.RelativeFilename || videoNode.Filename] = image;

                        }

                    }

                }

            }

            for (const id in images) {

                const filename = images[id];

                if (blobs[filename] !== undefined) images[id] = blobs[filename];
                else images[id] = images[id].split('\\').pop();

            }

            return images;

        },


        // __parse embedded image data in FBXTree.Video.Content
        __parseImage(videoNode) {

            const content = videoNode.Content;
            const fileName = videoNode.RelativeFilename || videoNode.Filename;
            const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();

            let type;

            switch (extension) {

                case 'bmp':

                    type = 'image/bmp';
                    break;

                case 'jpg':
                case 'jpeg':

                    type = 'image/jpeg';
                    break;

                case 'png':

                    type = 'image/png';
                    break;

                case 'tif':

                    type = 'image/tiff';
                    break;

                case 'tga':

                    type = 'image/tga';
                    break;

                default:

                    consoleWarn('FBXLoader: Image type "' + extension + '" is not supported.');
                    return;

            }

            if (typeof content === 'string') { // ASCII format

                return 'data:' + type + ';base64,' + content;

            } else { // Binary Format

                const array = new Uint8Array(content);
                return window.URL.createObjectURL(new Blob([array], { type: type }));

            }

        },

        // __parse nodes in FBXTree.Objects.Texture
        // These contain details such as UV scaling, cropping, rotation etc and are connected
        // to images in FBXTree.Objects.Video
        __parseTextures(images) {

            const textureMap = new Map();

            if ('Texture' in this.__objects) {

                const textureNodes = this.__objects.Texture;
                for (const nodeID in textureNodes) {

                    const texture = this.__parseTexture(textureNodes[nodeID], images);
                    textureMap.set(parseInt(nodeID), texture);

                }

            }

            return textureMap;

        },

        // __parse individual node in FBXTree.Objects.Texture
        __parseTexture(textureNode, images) {

            const texture = this.__loadTexture(textureNode, images);

            texture.ID = textureNode.id;

            texture.name = textureNode.attrName;

            const wrapModeU = textureNode.WrapModeU;
            const wrapModeV = textureNode.WrapModeV;

            const valueU = wrapModeU !== undefined ? wrapModeU.value : 0;
            const valueV = wrapModeV !== undefined ? wrapModeV.value : 0;

            // http://download.autodesk.com/us/fbx/SDKdocs/FBX_SDK_Help/files/fbxsdkref/class_k_fbx_texture.html#889640e63e2e681259ea81061b85143a
            // 0: repeat(default), 1: clamp

            texture.__setWrapS(valueU === 0 ? 1 : 0);
            texture.__setWrapT(valueV === 0 ? 1 : 0);

            if ('Scaling' in textureNode) {
                const values = textureNode.Scaling.value;
                texture.__repeat = new Vector2(values[0], values[1]);
            }

            if ('Translation' in textureNode) {
                const values = textureNode.Translation.value;
                texture.__offset = new Vector2(values[0], values[1]);
            }

            return texture;

        },

        // load a texture specified as a blob or data URI, or via an external URL using TextureLoader
        __loadTexture(textureNode, images) {

            const children = connections.get(textureNode.id).children;

            let fileName = children && children.length > 0 ? images[children[0].ID] : 0;
            if (fileName) {
                if (fileName.indexOf('blob:') == 0 || fileName.indexOf('data:') == 0) {
                    return loadImage({ u: fileName, n: fileName });
                }

                return loadImage(this.__resourceDirectory + fileName + "?");
            }

        },

        // __parse nodes in FBXTree.Objects.Material
        __parseMaterials(textureMap) {
            var t = this;
            const materialMap = new Map();

            $each(this.__objects.Material, (v, nodeID) => {

                var material = t.__parseMaterial(v, textureMap);
                if (material !== null) materialMap.set(parseInt(nodeID), material);
            });

            return materialMap;

        },

        // __parse single node in FBXTree.Objects.Material
        // Materials are connected to texture maps in FBXTree.Objects.Textures
        // FBX format currently only supports Lambert and Phong shading models
        __parseMaterial(materialNode, textureMap) {

            const ID = materialNode.id;
            let type = materialNode.ShadingModel;

            // Case where FBX wraps shading model in property object.
            if (typeof type === 'object') {
                type = type.value;
            }

            // Ignore unused materials which don't have any connections.
            if (!connections.has(ID)) return null;

            let material = {
                __name: materialNode.attrName,
                __type: type.toLowerCase()
            };

            if (materialNode.BumpFactor) {
                material.__bumpScale = materialNode.BumpFactor.value;
            }

            if (materialNode.Diffuse) {
                material.__color = new Color().__fromJsonSRGB(materialNode.Diffuse.value);
            } else if (materialNode.DiffuseColor && (materialNode.DiffuseColor.type === 'Color' || materialNode.DiffuseColor.type === 'ColorRGB')) {
                // The blender exporter exports diffuse here instead of in materialNode.Diffuse
                material.color = new Color().__fromJsonSRGB(materialNode.DiffuseColor.value);
            }

            if (materialNode.DisplacementFactor) {
                material.__displacementScale = materialNode.DisplacementFactor.value;
            }

            if (materialNode.Emissive) {
                material.__emissive = new Color().__fromJsonSRGB(materialNode.Emissive.value);
            } else if (materialNode.EmissiveColor && (materialNode.EmissiveColor.type === 'Color' || materialNode.EmissiveColor.type === 'ColorRGB')) {
                // The blender exporter exports emissive color here instead of in materialNode.Emissive
                material.__emissive = new Color().__fromJsonSRGB(materialNode.EmissiveColor.value);
            }

            if (materialNode.EmissiveFactor) {
                material.__emissiveIntensity = parseFloat(materialNode.EmissiveFactor.value);
            }

            if (materialNode.Opacity) {
                material.__opacity = parseFloat(materialNode.Opacity.value);
            }

            if (material.__opacity < 1.0) {
                material.__transparent = true;
            }

            if (materialNode.ReflectionFactor) {
                material.__reflectivity = materialNode.ReflectionFactor.value;
            }

            if (materialNode.Shininess) {
                material.__shininess = materialNode.Shininess.value;
            }

            if (materialNode.Specular) {
                material.__specular = new Color().__fromJsonSRGB(materialNode.Specular.value);
            } else if (materialNode.SpecularColor && materialNode.SpecularColor.type === 'Color') {
                // The blender exporter exports specular color here instead of in materialNode.Specular
                material.__specular = new Color().__fromJsonSRGB(materialNode.SpecularColor.value);
            }

            const scope = this;
            connections.get(ID).children.forEach(function (child) {

                const type = child.relationship;

                switch (type) {

                    case 'Bump':
                        material.__bumpMap = scope.__getTexture(textureMap, child.ID);
                        break;

                    case 'Maya|TEX_ao_map':
                        material.__aoMap = scope.__getTexture(textureMap, child.ID);
                        break;

                    case 'DiffuseColor':
                    case 'Maya|TEX_color_map':
                        material.__map = scope.__getTexture(textureMap, child.ID);
                        if (material.__map) {

                            material.__map.__colorSpace = SRGBColorSpace;

                        }

                        break;

                    case 'DisplacementColor':
                        material.__displacementMap = scope.__getTexture(textureMap, child.ID);
                        break;

                    case 'EmissiveColor':
                        material.__emissiveMap = scope.__getTexture(textureMap, child.ID);
                        if (material.__emissiveMap) {

                            material.__emissiveMap.__colorSpace = SRGBColorSpace;

                        }

                        break;

                    case 'NormalMap':
                    case 'Maya|TEX_normal_map':
                        material.__normalMap = scope.__getTexture(textureMap, child.ID);
                        break;

                    case 'ReflectionColor':
                        material.__envMap = scope.__getTexture(textureMap, child.ID);
                        if (material.__envMap) {

                            material.__envMap.mapping = EquirectangularReflectionMapping;
                            material.__envMap.__colorSpace = SRGBColorSpace;

                        }

                        break;

                    case 'SpecularColor':
                        material.__specularMap = scope.__getTexture(textureMap, child.ID);
                        if (material.__specularMap) {
                            material.__specularMap.__colorSpace = SRGBColorSpace;
                        }
                        break;

                    case 'TransparentColor':
                    case 'TransparencyFactor':
                        material.__alphaMap = scope.__getTexture(textureMap, child.ID);
                        material.__transparent = true;
                        break;

                    case 'AmbientColor':
                    case 'ShininessExponent': // AKA glossiness map
                    case 'SpecularFactor': // AKA specularLevel
                    case 'VectorDisplacementColor': // NOTE: Seems to be a copy of DisplacementColor
                    default:
                        consoleWarn('FBXLoader: ', type, ' map is not supported, skipping texture.');
                        break;

                }

            });

            return material;

        },


        // get a texture from the textureMap for use by a material.
        __getTexture(textureMap, id) {

            // if the texture is a layered texture, just use the first layer and issue a warning
            if ('LayeredTexture' in this.__objects && id in this.__objects.LayeredTexture) {

                consoleWarn('FBXLoader: layered textures are not supported. Discarding all but first layer.');
                id = connections.get(id).children[0].ID;

            }

            return textureMap.get(id);

        },

        // __parse nodes in FBXTree.Objects.Deformer
        // Deformer node can contain skinning or Vertex Cache animation data, however only skinning is supported here
        // Generates map of Skeleton-like objects for use later when generating and binding skeletons.
        __parseDeformers() {

            const skeletons = {};
            const morphTargets = {};

            if ('Deformer' in this.__objects) {

                const DeformerNodes = this.__objects.Deformer;

                for (const nodeID in DeformerNodes) {

                    const deformerNode = DeformerNodes[nodeID];

                    const relationships = connections.get(parseInt(nodeID));

                    if (deformerNode.attrType === 'Skin') {

                        const skeleton = this.__parseSkeleton(relationships, DeformerNodes);
                        skeleton.ID = nodeID;

                        if (relationships.__parents.length > 1) consoleWarn('FBXLoader: skeleton attached to more than one geometry is not supported.');
                        skeleton.geometryID = relationships.__parents[0].ID;

                        skeletons[nodeID] = skeleton;

                    } else if (deformerNode.attrType === 'BlendShape') {

                        const morphTarget = {
                            id: nodeID,
                        };

                        morphTarget.rawTargets = this.__parseMorphTargets(relationships, DeformerNodes);
                        morphTarget.id = nodeID;

                        if (relationships.__parents.length > 1) consoleWarn('FBXLoader: morph target attached to more than one geometry is not supported.');

                        morphTargets[nodeID] = morphTarget;

                    }

                }

            }

            return {

                skeletons: skeletons,
                morphTargets: morphTargets,

            };

        },

        // __parse single nodes in FBXTree.Objects.Deformer
        // The top level skeleton node has type 'Skin' and sub nodes have type 'Cluster'
        // Each skin node represents a skeleton and each cluster node represents a bone
        __parseSkeleton(relationships, deformerNodes) {

            const rawBones = [];

            relationships.children.forEach(function (child) {

                const boneNode = deformerNodes[child.ID];

                if (boneNode.attrType !== 'Cluster') return;

                const rawBone = {

                    ID: child.ID,
                    indices: [],
                    weights: [],
                    transformLink: new Matrix4(boneNode.TransformLink.a, 1),
                    // transform: new Matrix4().__fromArray( boneNode.Transform.a ),
                    // linkMode: boneNode.Mode,

                };

                if ('Indexes' in boneNode) {

                    rawBone.indices = boneNode.Indexes.a;
                    rawBone.weights = boneNode.Weights.a;

                }

                rawBones.push(rawBone);

            });

            return {

                rawBones: rawBones,
                bones: []

            };

        },

        // The top level morph deformer node has type "BlendShape" and sub nodes have type "BlendShapeChannel"
        __parseMorphTargets(relationships, deformerNodes) {

            const rawMorphTargets = [];

            for (let i = 0; i < relationships.children.length; i++) {

                const child = relationships.children[i];

                const morphTargetNode = deformerNodes[child.ID];

                const rawMorphTarget = {

                    name: morphTargetNode.attrName,
                    initialWeight: morphTargetNode.DeformPercent,
                    id: morphTargetNode.id,
                    fullWeights: morphTargetNode.FullWeights.a

                };

                if (morphTargetNode.attrType !== 'BlendShapeChannel') return;

                rawMorphTarget.geoID = connections.get(parseInt(child.ID)).children.filter(function (child) {

                    return child.relationship === undefined;

                })[0].ID;

                rawMorphTargets.push(rawMorphTarget);

            }

            return rawMorphTargets;

        },

        // create the main Group() to be returned by the loader
        __parseScene(deformers, geometryMap, materialMap) {
            var t = this;
            sceneGraph = new Node3d();

            const modelMap = t.__parseModels(deformers.skeletons, geometryMap, materialMap);

            const modelNodes = t.__objects.Model;

            const scope = t;
            modelMap.forEach(function (model) {

                const modelNode = modelNodes[model.ID];
                scope.__setLookAtProperties(model, modelNode);

                const parentConnections = connections.get(model.ID).__parents;

                parentConnections.forEach(function (connection) {

                    const parent = modelMap.get(connection.ID);
                    if (parent) parent.__addChildBox(model);

                });

                if (!model.__parent) {

                    sceneGraph.__addChildBox(model);

                }


            });

            t.__bindSkeleton(deformers.skeletons, geometryMap, modelMap);

            t.__addGlobalSceneSettings();

            sceneGraph.__traverse(function (node) {

                if (node.__transformData) {

                    if (node.__parent) {

                        node.__transformData.__parentMatrix = node.__parent.__matrix;
                        node.__transformData.__parentMatrixWorld = node.__parent.__matrixWorld;

                    }

                    const transform = generateTransform(node.__transformData);

                    node.__applyMatrix4(transform);
                    // node.__updateWorldMatrix();
                }

            });

            const animations = new AnimationParser(t).__parse();


            // if all the models where already combined in a single group, just return that
            if (sceneGraph.__childs.length === 1 /* && sceneGraph.__childs[0].isGroup */) {

                // sceneGraph.__childs[0].animations = animations;
                sceneGraph = sceneGraph.__childs[0];

            }

            sceneGraph.animations = animations;

        },

        // __parse nodes in FBXTree.Objects.Model
        __parseModels(skeletons, geometryMap, materialMap) {
            var t = this;
            const modelMap = new Map();
            const modelNodes = t.__objects.Model;

            for (const nodeID in modelNodes) {

                const id = parseInt(nodeID);
                const node = modelNodes[nodeID];
                const relationships = connections.get(id);

                let model = t.__buildSkeleton(relationships, skeletons, id, node.attrName);

                if (!model) {

                    switch (node.attrType) {

                        case 'Camera':
                            model = t.__createCamera(relationships);
                            break;
                        case 'Light':
                            model = t.__createLight(relationships);
                            break;
                        case 'Mesh':
                            model = t.__createMesh(relationships, geometryMap, materialMap);
                            break;
                        case 'NurbsCurve':
                            model = t.__createCurve(relationships, geometryMap);
                            break;
                        case 'LimbNode':
                        case 'Root':
                            model = new Bone();
                            break;
                        case 'Null':
                        default:
                            model = new Node3d();
                            break;

                    }

                    model.name = node.attrName ? PropertyBinding_sanitizeNodeName(node.attrName) : '';
                    model.__originalName = node.attrName;

                    model.ID = id;

                }

                t.__getTransformData(model, node);
                modelMap.set(id, model);

            }

            return modelMap;

        },

        __buildSkeleton(relationships, skeletons, id, name) {

            let bone = null;

            relationships.__parents.forEach(function (parent) {

                for (const ID in skeletons) {

                    const skeleton = skeletons[ID];

                    skeleton.rawBones.forEach(function (rawBone, i) {

                        if (rawBone.ID === parent.ID) {

                            const subBone = bone;
                            bone = new Node3d();

                            bone.__matrixWorld.__copy(rawBone.transformLink);

                            // set name and id here - otherwise in cases where "subBone" is created it will not have a name / id

                            bone.name = name ? PropertyBinding_sanitizeNodeName(name) : '';
                            bone.__originalName = name;
                            bone.ID = id;

                            skeleton.bones[i] = bone;

                            // In cases where a bone is shared between multiple meshes
                            // duplicate the bone here and and it as a child of the first bone
                            if (subBone !== null) {

                                bone.__addChildBox(subBone);

                            }

                        }

                    });

                }

            });

            return bone;

        },

        // create a PerspectiveCamera or OrthographicCamera
        __createCamera(relationships) {
            /* todo
            let model;
            let cameraAttribute;

            relationships.children.forEach(function (child) {

                const attr = this.__objects.NodeAttribute[child.ID];

                if (attr !== undefined) {

                    cameraAttribute = attr;

                }

            });

            if (cameraAttribute === undefined) {

                model = new Object3D();

            } else {

                let type = 0;
                if (cameraAttribute.CameraProjectionType !== undefined && cameraAttribute.CameraProjectionType.value === 1) {

                    type = 1;

                }

                let nearClippingPlane = 1;
                if (cameraAttribute.NearPlane !== undefined) {

                    nearClippingPlane = cameraAttribute.NearPlane.value / 1000;

                }

                let farClippingPlane = 1000;
                if (cameraAttribute.FarPlane !== undefined) {

                    farClippingPlane = cameraAttribute.FarPlane.value / 1000;

                }


                let width = window.innerWidth;
                let height = window.innerHeight;

                if (cameraAttribute.AspectWidth !== undefined && cameraAttribute.AspectHeight !== undefined) {

                    width = cameraAttribute.AspectWidth.value;
                    height = cameraAttribute.AspectHeight.value;

                }

                const aspect = width / height;

                let fov = 45;
                if (cameraAttribute.FieldOfView !== undefined) {

                    fov = cameraAttribute.FieldOfView.value;

                }

                const focalLength = cameraAttribute.FocalLength ? cameraAttribute.FocalLength.value : null;

                switch (type) {

                    case 0: // Perspective
                        model = new PerspectiveCamera(fov, aspect, nearClippingPlane, farClippingPlane);
                        if (focalLength !== null) model.setFocalLength(focalLength);
                        break;

                    case 1: // Orthographic
                        model = new OrthographicCamera(- width / 2, width / 2, height / 2, - height / 2, nearClippingPlane, farClippingPlane);
                        break;

                    default:
                        consoleWarn('FBXLoader: Unknown camera type ' + type + '.');
                        model = new Object3D();
                        break;

                }

            }

            return model;
            */
        },

        // Create a DirectionalLight, PointLight or SpotLight
        __createLight(relationships) {
            /* todo
            let model;
            let lightAttribute;

            relationships.children.forEach(function (child) {

                const attr = this.__objects.NodeAttribute[child.ID];

                if (attr !== undefined) {

                    lightAttribute = attr;

                }

            });

            if (lightAttribute === undefined) {

                model = new Object3D();

            } else {

                let type;

                // LightType can be undefined for Point lights
                if (lightAttribute.LightType === undefined) {

                    type = 0;

                } else {

                    type = lightAttribute.LightType.value;

                }

                let color = 0xffffff;

                if (lightAttribute.Color) {

                    color = new Color().__fromArray(lightAttribute.Color.value).convertSRGBToLinear();

                }

                let intensity = (lightAttribute.Intensity === undefined) ? 1 : lightAttribute.Intensity.value / 100;

                // light disabled
                if (lightAttribute.CastLightOnObject && lightAttribute.CastLightOnObject.value === 0) {

                    intensity = 0;

                }

                let distance = 0;
                if (lightAttribute.FarAttenuationEnd) {

                    if (lightAttribute.EnableFarAttenuation && lightAttribute.EnableFarAttenuation.value === 0) {

                        distance = 0;

                    } else {

                        distance = lightAttribute.FarAttenuationEnd.value;

                    }

                }

                // TODO: could this be calculated linearly from FarAttenuationStart to FarAttenuationEnd?
                const decay = 1;

                switch (type) {

                    case 0: // Point
                        model = new PointLight(color, intensity, distance, decay);
                        break;

                    case 1: // Directional
                        model = new DirectionalLight(color, intensity);
                        break;

                    case 2: // Spot
                        let angle = Math.PI / 3;

                        if (lightAttribute.InnerAngle !== undefined) {

                            angle = degToRad(lightAttribute.InnerAngle.value);

                        }

                        let penumbra = 0;
                        if (lightAttribute.OuterAngle !== undefined) {

                            // TODO: this is not correct - FBX calculates outer and inner angle in degrees
                            // with OuterAngle > InnerAngle && OuterAngle <= Math.PI
                            // while uses a penumbra between (0, 1) to attenuate the inner angle
                            penumbra = degToRad(lightAttribute.OuterAngle.value);
                            penumbra = Math.max(penumbra, 1);

                        }

                        model = new SpotLight(color, intensity, distance, angle, penumbra, decay);
                        break;

                    default:
                        consoleWarn('FBXLoader: Unknown light type ' + lightAttribute.LightType.value + ', defaulting to a PointLight.');
                        model = new PointLight(color, intensity);
                        break;

                }

                if (lightAttribute.CastShadows !== undefined && lightAttribute.CastShadows.value === 1) {

                    model.castShadow = true;

                }

            }

            return model;
            */
        },

        __createMesh(relationships, geometryMap, materialMap) {

            let model;
            let geometry = null;
            let material = null;
            const materials = [];

            // get geometry and materials(s) from connections
            relationships.children.forEach(function (child) {

                if (geometryMap.has(child.ID)) {

                    geometry = geometryMap.get(child.ID);

                }

                if (materialMap.has(child.ID)) {

                    materials.push(materialMap.get(child.ID));

                }

            });

            if (materials.length > 1) {

                material = materials;

            } else if (materials.length > 0) {

                material = materials[0];

            } else {

                material = {};
                materials.push(material);

            }

            if ('a_color' in geometry.__buffers) {

                materials.forEach(function (material) {

                    material.vertexColors = true;

                });

            }

            model = new Node3d({
                __geometry: geometry, __material: material
            });


            return model;

        },

        __createCurve(relationships, geometryMap) {
            /* todo
            const geometry = relationships.children.reduce(function (geo, child) {

                if (geometryMap.has(child.ID)) geo = geometryMap.get(child.ID);

                return geo;

            }, null);

            // FBX does not list materials for Nurbs lines, so we'll just put our own in here.
            const material = new LineBasicMaterial({
                name: Loader.DEFAULT_MATERIAL_NAME,
                color: 0x3300ff,
                linewidth: 1
            });
            return new Line(geometry, material);
            */

        },

        // __parse the model node for transform data
        __getTransformData(model, modelNode) {

            const transformData = {};

            if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);

            if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);
            else transformData.eulerOrder = 'ZYX';

            if ('Lcl_Translation' in modelNode) transformData.translation = modelNode.Lcl_Translation.value;

            if ('PreRotation' in modelNode) transformData.preRotation = modelNode.PreRotation.value;
            if ('Lcl_Rotation' in modelNode) transformData.rotation = modelNode.Lcl_Rotation.value;
            if ('PostRotation' in modelNode) transformData.postRotation = modelNode.PostRotation.value;

            if ('Lcl_Scaling' in modelNode) transformData.__scale = modelNode.Lcl_Scaling.value;

            if ('ScalingOffset' in modelNode) transformData.scalingOffset = modelNode.ScalingOffset.value;
            if ('ScalingPivot' in modelNode) transformData.scalingPivot = modelNode.ScalingPivot.value;

            if ('RotationOffset' in modelNode) transformData.rotationOffset = modelNode.RotationOffset.value;
            if ('RotationPivot' in modelNode) transformData.rotationPivot = modelNode.RotationPivot.value;

            model.__transformData = transformData;

        },

        __setLookAtProperties(model, modelNode) {

            if ('LookAtProperty' in modelNode) {

                const children = connections.get(model.ID).children;

                children.forEach(function (child) {

                    if (child.relationship === 'LookAtProperty') {

                        const lookAtTarget = this.__objects.Model[child.ID];

                        if ('Lcl_Translation' in lookAtTarget) {

                            const pos = lookAtTarget.Lcl_Translation.value;

                            // DirectionalLight, SpotLight
                            if (model.target) {

                                model.target.__position.__fromArray(pos);
                                sceneGraph.__addChildBox(model.target);

                            } else { // Cameras and other Object3Ds

                                model.lookAt(new Vector3().__fromArray(pos));

                            }

                        }

                    }

                });

            }

        },

        __bindSkeleton(skeletons, geometryMap, modelMap) {

            const bindMatrices = this.__parsePoseNodes();

            for (const ID in skeletons) {

                const skeleton = skeletons[ID];

                const parents = connections.get(parseInt(skeleton.ID)).__parents;

                parents.forEach(function (parent) {

                    if (geometryMap.has(parent.ID)) {

                        const geoID = parent.ID;
                        const geoRelationships = connections.get(geoID);

                        geoRelationships.__parents.forEach(function (geoConnParent) {

                            if (modelMap.has(geoConnParent.ID)) {

                                const model = modelMap.get(geoConnParent.ID);

                                model.__bind(new Skeleton(skeleton.bones), bindMatrices[geoConnParent.ID]);

                            }

                        });

                    }

                });

            }

        },

        __parsePoseNodes() {

            const bindMatrices = {};

            if ('Pose' in this.__objects) {

                const BindPoseNode = this.__objects.Pose;

                for (const nodeID in BindPoseNode) {

                    if (BindPoseNode[nodeID].attrType === 'BindPose' && BindPoseNode[nodeID].NbPoseNodes > 0) {

                        const poseNodes = BindPoseNode[nodeID].PoseNode;

                        if (Array.isArray(poseNodes)) {

                            poseNodes.forEach(function (poseNode) {

                                bindMatrices[poseNode.Node] = new Matrix4(poseNode.Matrix.a, 1);

                            });

                        } else {

                            bindMatrices[poseNodes.Node] = new Matrix4(poseNodes.Matrix.a, 1);

                        }

                    }

                }

            }

            return bindMatrices;

        },

        __addGlobalSceneSettings() {
            /* todo
            if ('GlobalSettings' in this.__fbxTree) {

                if ('AmbientColor' in this.__fbxTree.GlobalSettings) {

                    // __parse ambient color - if it's not set to black (default), create an ambient light

                    const ambientColor = this.__fbxTree.GlobalSettings.AmbientColor.value;
                    const r = ambientColor[0];
                    const g = ambientColor[1];
                    const b = ambientColor[2];

                    if (r !== 0 || g !== 0 || b !== 0) {

                        const color = new Color(r, g, b).convertSRGBToLinear();
                        sceneGraph.__addChildBox(new AmbientLight(color, 1));

                    }

                }

                if ('UnitScaleFactor' in this.__fbxTree.GlobalSettings) {

                    sceneGraph.__userData.unitScaleFactor = this.__fbxTree.GlobalSettings.UnitScaleFactor.value;

                }

            }*/

        }

    });

    // __parse Geometry data from FBXTree and return map of BufferGeometries
    function GeometryParser(parser) {
        this.__negativeMaterialIndices = false;
        this.__objects = parser.__objects;
        this.__fbxTree = parser.__fbxTree;

    }

    makeClass(GeometryParser, {

        // __parse nodes in FBXTree.Objects.Geometry
        __parse(deformers) {

            var t = this;
            const geometryMap = new Map();

            if ('Geometry' in t.__objects) {

                const geoNodes = t.__objects.Geometry;

                for (const nodeID in geoNodes) {

                    const relationships = connections.get(parseInt(nodeID));

                    const geo = t.__parseGeometry(relationships, geoNodes[nodeID], deformers);

                    geometryMap.set(parseInt(nodeID), geo);

                }

            }

            // report warnings

            if (t.__negativeMaterialIndices === true) {

                consoleWarn('FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected.');

            }

            return geometryMap;

        },

        // __parse single node in FBXTree.Objects.Geometry
        __parseGeometry(relationships, geoNode, deformers) {

            switch (geoNode.attrType) {
                case 'Mesh':
                    return this.__parseMeshGeometry(relationships, geoNode, deformers);
                case 'NurbsCurve':
                    return this.__parseNurbsGeometry(geoNode);
            }

        },

        // __parse single node mesh geometry in FBXTree.Objects.Geometry
        __parseMeshGeometry(relationships, geoNode, deformers) {

            const skeletons = deformers.skeletons;
            const morphTargets = [];
            var t = this;
            const modelNodes = relationships.__parents.map(function (parent) {

                return t.__objects.Model[parent.ID];

            });

            // don't create geometry if it is not associated with any models
            if (modelNodes.length === 0) return;

            const skeleton = relationships.children.reduce(function (skeleton, child) {

                if (skeletons[child.ID]) skeleton = skeletons[child.ID];

                return skeleton;

            }, null);

            relationships.children.forEach(function (child) {

                if (deformers.morphTargets[child.ID]) {

                    morphTargets.push(deformers.morphTargets[child.ID]);

                }

            });

            // Assume one model and get the preRotation from that
            // if there is more than one model associated with the geometry this may cause problems
            const modelNode = modelNodes[0];

            const transformData = {};

            if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);
            if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);

            if ('GeometricTranslation' in modelNode) transformData.translation = modelNode.GeometricTranslation.value;
            if ('GeometricRotation' in modelNode) transformData.rotation = modelNode.GeometricRotation.value;
            if ('GeometricScaling' in modelNode) transformData.__scale = modelNode.GeometricScaling.value;

            const preTransform = generateTransform(transformData);

            const geo = new Node3d();

            if (geoNode.attrName) geo.name = geoNode.attrName;

            const geoInfo = t.__parseGeoNode(geoNode, skeleton);
            const buffers = t.__genBuffers(geoInfo);

            function Attribute_applyMatrix4(attr, matrix) {
                var a = attr.__array, v = new Vector3();
                for (var i = 0; i < a.length; i += 3) {
                    v.set(a[i], a[i + 1], a[i + 2]).__applyMatrix4(matrix);
                    a[i] = v.x; a[i + 1] = v.y; a[i + 2] = v.z;
                }
            }

            function Attribute_applyNormalMatrix(attr, matrix) {
                var a = attr.__array, v = new Vector3();
                for (var i = 0; i < a.length; i += 3) {
                    v.set(a[i], a[i + 1], a[i + 2]).__applyMatrix4(matrix).__normalize();
                    a[i] = v.x; a[i + 1] = v.y; a[i + 2] = v.z;
                }
            }

            Attribute_applyMatrix4(
                geo.__addAttributeBuffer('a_position', 3, buffers.vertex),
                preTransform
            );


            if (buffers.colors.length > 0) {
                geo.__addAttributeBuffer('a_color', 3, buffers.colors);
            }

            if (skeleton) {
                geo.__buffers['a_skinIndex'] = new MyBufferAttribute('a_skinIndex', Uint16Array, 4, GL_ARRAY_BUFFER, buffers.weightsIndices);
                geo.__addAttributeBuffer('a_skinWeight', 4, buffers.vertexWeights);
                // used later to bind the skeleton to the model
                geo.FBX_Deformer = skeleton;
            }

            if (buffers.normal.length > 0) {

                const normalMatrix = preTransform.__getInverseMatrix().__transpose();

                Attribute_applyNormalMatrix(
                    geo.__addAttributeBuffer('a_normal', 3, buffers.normal),
                    normalMatrix
                );

            }

            $each(buffers.uvs, (v, i) => {
                geo.__addAttributeBuffer('a_uv' + i, 2, v);
            });

            if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {

                // Convert the material indices of each vertex into rendering groups on the geometry.
                let prevMaterialIndex = buffers.materialIndex[0];
                let startIndex = 0;

                buffers.materialIndex.forEach(function (currentIndex, i) {

                    if (currentIndex !== prevMaterialIndex) {

                        geo.__addGroup(startIndex, i - startIndex, prevMaterialIndex);

                        prevMaterialIndex = currentIndex;
                        startIndex = i;

                    }

                });

                // the loop above doesn't add the last group, do that here.
                if (geo.__groups.length > 0) {

                    const lastGroup = geo.__groups[geo.__groups.length - 1];
                    const lastIndex = lastGroup[0] + lastGroup[1];

                    if (lastIndex !== buffers.materialIndex.length) {

                        geo.__addGroup(lastIndex, buffers.materialIndex.length - lastIndex, prevMaterialIndex);

                    }

                }

                // case where there are multiple materials but the whole geometry is only
                // using one of them
                if (!geo.__groups || geo.__groups.length === 0) {

                    geo.__addGroup(0, buffers.materialIndex.length, buffers.materialIndex[0]);

                }

            }

            t.__addMorphTargets(geo, geoNode, morphTargets, preTransform);

            return geo;

        },

        __parseGeoNode(geoNode, skeleton) {

            const geoInfo = {};
            var t = this;

            geoInfo.vertexPositions = (geoNode.Vertices) ? geoNode.Vertices.a : [];
            geoInfo.vertexIndices = (geoNode.PolygonVertexIndex) ? geoNode.PolygonVertexIndex.a : [];

            if (geoNode.LayerElementColor) {

                geoInfo.color = t.__parseVertexColors(geoNode.LayerElementColor[0]);

            }

            if (geoNode.LayerElementMaterial) {

                geoInfo.material = t.__parseMaterialIndices(geoNode.LayerElementMaterial[0]);

            }

            if (geoNode.LayerElementNormal) {

                geoInfo.normal = t.__parseNormals(geoNode.LayerElementNormal[0]);

            }

            if (geoNode.LayerElementUV) {

                geoInfo.uv = [];

                let i = 0;
                while (geoNode.LayerElementUV[i]) {

                    if (geoNode.LayerElementUV[i].UV) {

                        geoInfo.uv.push(t.__parseUVs(geoNode.LayerElementUV[i]));

                    }

                    i++;

                }

            }

            geoInfo.weightTable = {};

            if (skeleton !== null) {

                geoInfo.skeleton = skeleton;

                skeleton.rawBones.forEach(function (rawBone, i) {

                    // loop over the bone's vertex indices and weights
                    rawBone.indices.forEach(function (index, j) {

                        if (geoInfo.weightTable[index] === undefined) geoInfo.weightTable[index] = [];

                        geoInfo.weightTable[index].push({

                            id: i,
                            weight: rawBone.weights[j],

                        });

                    });

                });

            }

            return geoInfo;

        },

        __genBuffers(geoInfo) {

            const buffers = {
                vertex: [],
                normal: [],
                colors: [],
                uvs: [],
                materialIndex: [],
                vertexWeights: [],
                weightsIndices: [],
            };

            let polygonIndex = 0;
            let faceLength = 0;
            let displayedWeightsWarning = false;

            // these will hold data for a single face
            let facePositionIndexes = [];
            let faceNormals = [];
            let faceColors = [];
            let faceUVs = [];
            let faceWeights = [];
            let faceWeightIndices = [];

            const scope = this;
            geoInfo.vertexIndices.forEach(function (vertexIndex, polygonVertexIndex) {

                let materialIndex;
                let endOfFace = false;

                // Face index and vertex index arrays are combined in a single array
                // A cube with quad faces looks like this:
                // PolygonVertexIndex: *24 {
                //  a: 0, 1, 3, -3, 2, 3, 5, -5, 4, 5, 7, -7, 6, 7, 1, -1, 1, 7, 5, -4, 6, 0, 2, -5
                //  }
                // Negative numbers mark the end of a face - first face here is 0, 1, 3, -3
                // to find index of last vertex bit shift the index: ^ - 1
                if (vertexIndex < 0) {

                    vertexIndex = vertexIndex ^ - 1; // equivalent to ( x * -1 ) - 1
                    endOfFace = true;

                }

                let weightIndices = [];
                let weights = [];

                facePositionIndexes.push(vertexIndex * 3, vertexIndex * 3 + 1, vertexIndex * 3 + 2);

                if (geoInfo.color) {

                    const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.color);

                    faceColors.push(data[0], data[1], data[2]);

                }

                if (geoInfo.skeleton) {

                    if (geoInfo.weightTable[vertexIndex]) {

                        geoInfo.weightTable[vertexIndex].forEach(function (wt) {

                            weights.push(wt.weight);
                            weightIndices.push(wt.id);

                        });


                    }

                    if (weights.length > 4) {

                        if (!displayedWeightsWarning) {

                            consoleWarn('FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.');
                            displayedWeightsWarning = true;

                        }

                        const wIndex = [0, 0, 0, 0];
                        const Weight = [0, 0, 0, 0];

                        weights.forEach(function (weight, weightIndex) {

                            let currentWeight = weight;
                            let currentIndex = weightIndices[weightIndex];

                            Weight.forEach(function (comparedWeight, comparedWeightIndex, comparedWeightArray) {

                                if (currentWeight > comparedWeight) {

                                    comparedWeightArray[comparedWeightIndex] = currentWeight;
                                    currentWeight = comparedWeight;

                                    const tmp = wIndex[comparedWeightIndex];
                                    wIndex[comparedWeightIndex] = currentIndex;
                                    currentIndex = tmp;

                                }

                            });

                        });

                        weightIndices = wIndex;
                        weights = Weight;

                    }

                    // if the weight array is shorter than 4 pad with 0s
                    while (weights.length < 4) {

                        weights.push(0);
                        weightIndices.push(0);

                    }

                    for (let i = 0; i < 4; ++i) {

                        faceWeights.push(weights[i]);
                        faceWeightIndices.push(weightIndices[i]);

                    }

                }

                if (geoInfo.normal) {

                    const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.normal);

                    faceNormals.push(data[0], data[1], data[2]);

                }

                if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {

                    materialIndex = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.material)[0];

                    if (materialIndex < 0) {

                        scope.__negativeMaterialIndices = true;
                        materialIndex = 0; // fallback

                    }

                }

                if (geoInfo.uv) {

                    geoInfo.uv.forEach(function (uv, i) {

                        const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, uv);

                        if (faceUVs[i] === undefined) {

                            faceUVs[i] = [];

                        }

                        faceUVs[i].push(data[0]);
                        faceUVs[i].push(data[1]);

                    });

                }

                faceLength++;

                if (endOfFace) {

                    scope.__genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength);

                    polygonIndex++;
                    faceLength = 0;

                    // reset arrays for the next face
                    facePositionIndexes = [];
                    faceNormals = [];
                    faceColors = [];
                    faceUVs = [];
                    faceWeights = [];
                    faceWeightIndices = [];

                }

            });

            return buffers;

        },

        // See https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
        __getNormalNewell(vertices) {

            const normal = new Vector3(0.0, 0.0, 0.0);

            for (let i = 0; i < vertices.length; i++) {

                const current = vertices[i];
                const next = vertices[(i + 1) % vertices.length];

                normal.x += (current.y - next.y) * (current.z + next.z);
                normal.y += (current.z - next.z) * (current.x + next.x);
                normal.z += (current.x - next.x) * (current.y + next.y);

            }

            normal.__normalize();

            return normal;

        },

        __getNormalTangentAndBitangent(vertices) {

            const normalVector = this.__getNormalNewell(vertices);
            // Avoid up being equal or almost equal to normalVector
            const up = Math.abs(normalVector.z) > 0.5 ? new Vector3(0.0, 1.0, 0.0) : new Vector3(0.0, 0.0, 1.0);
            const tangent = up.__cross(normalVector).__normalize();
            const bitangent = normalVector.__clone().__cross(tangent).__normalize();

            return {
                normal: normalVector,
                tangent: tangent,
                bitangent: bitangent
            };

        },

        __flattenVertex(vertex, normalTangent, normalBitangent) {

            return new Vector2(
                vertex.dot(normalTangent),
                vertex.dot(normalBitangent)
            );

        },

        // Generate data for a single face in a geometry. If the face is a quad then split it into 2 tris
        __genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength) {

            let triangles;

            if (faceLength > 3) {

                // Triangulate n-gon using earcut

                const vertices = [];
                // in morphing scenario vertexPositions represent morphPositions
                // while baseVertexPositions represent the original geometry's positions
                const positions = geoInfo.baseVertexPositions || geoInfo.vertexPositions;
                for (let i = 0; i < facePositionIndexes.length; i += 3) {

                    vertices.push(
                        new Vector3(
                            positions[facePositionIndexes[i]],
                            positions[facePositionIndexes[i + 1]],
                            positions[facePositionIndexes[i + 2]]
                        )
                    );

                }

                const { tangent, bitangent } = this.__getNormalTangentAndBitangent(vertices);
                const triangulationInput = [];

                for (const vertex of vertices) {

                    triangulationInput.push(this.__flattenVertex(vertex, tangent, bitangent));

                }

                // When vertices is an array of [0,0,0] elements (which is the case for vertices not participating in morph)
                // the triangulationInput will be an array of [0,0] elements
                // resulting in an array of 0 triangles being returned from ShapeUtils.triangulateShape
                // leading to not pushing into buffers.vertex the redundant vertices (the vertices that are not morphed).
                // That's why, in order to support morphing scenario, "positions" is looking first for baseVertexPositions,
                // so that we don't end up with an array of 0 triangles for the faces not participating in morph.
                triangles = ShapeUtils_triangulateShape(triangulationInput, []);

            } else {

                // Regular triangle, skip earcut triangulation step
                triangles = [[0, 1, 2]];

            }

            for (const [i0, i1, i2] of triangles) {

                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3 + 1]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3 + 2]]);

                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3 + 1]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3 + 2]]);

                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3 + 1]]);
                buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3 + 2]]);

                if (geoInfo.skeleton) {

                    buffers.vertexWeights.push(faceWeights[i0 * 4]);
                    buffers.vertexWeights.push(faceWeights[i0 * 4 + 1]);
                    buffers.vertexWeights.push(faceWeights[i0 * 4 + 2]);
                    buffers.vertexWeights.push(faceWeights[i0 * 4 + 3]);

                    buffers.vertexWeights.push(faceWeights[i1 * 4]);
                    buffers.vertexWeights.push(faceWeights[i1 * 4 + 1]);
                    buffers.vertexWeights.push(faceWeights[i1 * 4 + 2]);
                    buffers.vertexWeights.push(faceWeights[i1 * 4 + 3]);

                    buffers.vertexWeights.push(faceWeights[i2 * 4]);
                    buffers.vertexWeights.push(faceWeights[i2 * 4 + 1]);
                    buffers.vertexWeights.push(faceWeights[i2 * 4 + 2]);
                    buffers.vertexWeights.push(faceWeights[i2 * 4 + 3]);

                    buffers.weightsIndices.push(faceWeightIndices[i0 * 4]);
                    buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 1]);
                    buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 2]);
                    buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 3]);

                    buffers.weightsIndices.push(faceWeightIndices[i1 * 4]);
                    buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 1]);
                    buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 2]);
                    buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 3]);

                    buffers.weightsIndices.push(faceWeightIndices[i2 * 4]);
                    buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 1]);
                    buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 2]);
                    buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 3]);

                }

                if (geoInfo.color) {

                    buffers.colors.push(faceColors[i0 * 3]);
                    buffers.colors.push(faceColors[i0 * 3 + 1]);
                    buffers.colors.push(faceColors[i0 * 3 + 2]);

                    buffers.colors.push(faceColors[i1 * 3]);
                    buffers.colors.push(faceColors[i1 * 3 + 1]);
                    buffers.colors.push(faceColors[i1 * 3 + 2]);

                    buffers.colors.push(faceColors[i2 * 3]);
                    buffers.colors.push(faceColors[i2 * 3 + 1]);
                    buffers.colors.push(faceColors[i2 * 3 + 2]);

                }

                if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {

                    buffers.materialIndex.push(materialIndex);
                    buffers.materialIndex.push(materialIndex);
                    buffers.materialIndex.push(materialIndex);

                }

                if (geoInfo.normal) {

                    buffers.normal.push(faceNormals[i0 * 3]);
                    buffers.normal.push(faceNormals[i0 * 3 + 1]);
                    buffers.normal.push(faceNormals[i0 * 3 + 2]);

                    buffers.normal.push(faceNormals[i1 * 3]);
                    buffers.normal.push(faceNormals[i1 * 3 + 1]);
                    buffers.normal.push(faceNormals[i1 * 3 + 2]);

                    buffers.normal.push(faceNormals[i2 * 3]);
                    buffers.normal.push(faceNormals[i2 * 3 + 1]);
                    buffers.normal.push(faceNormals[i2 * 3 + 2]);

                }

                if (geoInfo.uv) {

                    geoInfo.uv.forEach(function (uv, j) {

                        if (buffers.uvs[j] === undefined) buffers.uvs[j] = [];

                        buffers.uvs[j].push(faceUVs[j][i0 * 2]);
                        buffers.uvs[j].push(faceUVs[j][i0 * 2 + 1]);

                        buffers.uvs[j].push(faceUVs[j][i1 * 2]);
                        buffers.uvs[j].push(faceUVs[j][i1 * 2 + 1]);

                        buffers.uvs[j].push(faceUVs[j][i2 * 2]);
                        buffers.uvs[j].push(faceUVs[j][i2 * 2 + 1]);

                    });

                }

            }

        },

        __addMorphTargets(parentGeo, parentGeoNode, morphTargets, preTransform) {

            if (morphTargets.length === 0) return;

            parentGeo.morphTargetsRelative = true;

            parentGeo.morphAttributes.position = [];
            // parentGeo.morphAttributes.normal = []; // not implemented

            const scope = this;
            morphTargets.forEach(function (morphTarget) {

                morphTarget.rawTargets.forEach(function (rawTarget) {

                    const morphGeoNode = this.__objects.Geometry[rawTarget.geoID];

                    if (morphGeoNode) {

                        scope.__genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, rawTarget.name);

                    }

                });

            });

        },

        // a morph geometry node is similar to a standard  node, and the node is also contained
        // in FBXTree.Objects.Geometry, however it can only have attributes for position, normal
        // and a special attribute Index defining which vertices of the original geometry are affected
        // Normal and position attributes only have data for the vertices that are affected by the morph
        __genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, name) {

            const basePositions = parentGeoNode.Vertices ? parentGeoNode.Vertices.a : [];
            const baseIndices = parentGeoNode.PolygonVertexIndex ? parentGeoNode.PolygonVertexIndex.a : [];

            const morphPositionsSparse = morphGeoNode.Vertices ? morphGeoNode.Vertices.a : [];
            const morphIndices = morphGeoNode.Indexes ? morphGeoNode.Indexes.a : [];

            const length = parentGeo.__buffers.a_position.__array.length;
            const morphPositions = new Float32Array(length);

            for (let i = 0; i < morphIndices.length; i++) {

                const morphIndex = morphIndices[i] * 3;

                morphPositions[morphIndex] = morphPositionsSparse[i * 3];
                morphPositions[morphIndex + 1] = morphPositionsSparse[i * 3 + 1];
                morphPositions[morphIndex + 2] = morphPositionsSparse[i * 3 + 2];

            }

            // TODO: add morph normal support
            const morphGeoInfo = {
                vertexIndices: baseIndices,
                vertexPositions: morphPositions,
                baseVertexPositions: basePositions
            };

            const morphBuffers = this.__genBuffers(morphGeoInfo);

            const positionAttribute = new Float32BufferAttribute(morphBuffers.vertex, 3);
            positionAttribute.name = name || morphGeoNode.attrName;

            positionAttribute.applyMatrix4(preTransform);

            parentGeo.morphAttributes.position.push(positionAttribute);

        },

        // __parse normal from FBXTree.Objects.Geometry.LayerElementNormal if it exists
        __parseNormals(NormalNode) {

            const mappingType = NormalNode.MappingInformationType;
            const referenceType = NormalNode.ReferenceInformationType;
            const buffer = NormalNode.Normals.a;
            let indexBuffer = [];
            if (referenceType === 'IndexToDirect') {

                if ('NormalIndex' in NormalNode) {

                    indexBuffer = NormalNode.NormalIndex.a;

                } else if ('NormalsIndex' in NormalNode) {

                    indexBuffer = NormalNode.NormalsIndex.a;

                }

            }

            return {
                dataSize: 3,
                buffer: buffer,
                indices: indexBuffer,
                mappingType: mappingType,
                referenceType: referenceType
            };

        },

        // __parse UVs from FBXTree.Objects.Geometry.LayerElementUV if it exists
        __parseUVs(UVNode) {

            const mappingType = UVNode.MappingInformationType;
            const referenceType = UVNode.ReferenceInformationType;
            const buffer = UVNode.UV.a;
            let indexBuffer = [];
            if (referenceType === 'IndexToDirect') {

                indexBuffer = UVNode.UVIndex.a;

            }

            return {
                dataSize: 2,
                buffer: buffer,
                indices: indexBuffer,
                mappingType: mappingType,
                referenceType: referenceType
            };

        },

        // __parse Vertex Colors from FBXTree.Objects.Geometry.LayerElementColor if it exists
        __parseVertexColors(ColorNode) {

            const mappingType = ColorNode.MappingInformationType;
            const referenceType = ColorNode.ReferenceInformationType;
            const buffer = ColorNode.Colors.a;
            let indexBuffer = [];
            if (referenceType === 'IndexToDirect') {

                indexBuffer = ColorNode.ColorIndex.a;

            }

            for (let i = 0, c = new Color(); i < buffer.length; i += 4) {
                /// \todo: why 4?
                debugger;
                c.__fromJsonSRGB(buffer, i);
                buffer[i] = c.r;
                buffer[i + 1] = c.g;
                buffer[i + 2] = c.b;
                buffer[i + 3] = c.a;
            }

            return {
                dataSize: 4,
                buffer: buffer,
                indices: indexBuffer,
                mappingType: mappingType,
                referenceType: referenceType
            };

        },

        // __parse mapping and material data in FBXTree.Objects.Geometry.LayerElementMaterial if it exists
        __parseMaterialIndices(MaterialNode) {

            const mappingType = MaterialNode.MappingInformationType;
            const referenceType = MaterialNode.ReferenceInformationType;

            if (mappingType === 'NoMappingInformation') {

                return {
                    dataSize: 1,
                    buffer: [0],
                    indices: [0],
                    mappingType: 'AllSame',
                    referenceType: referenceType
                };

            }

            const materialIndexBuffer = MaterialNode.Materials.a;

            // Since materials are stored as indices, there's a bit of a mismatch between FBX and what
            // we expect.So we create an intermediate buffer that points to the index in the buffer,
            // for conforming with the other functions we've written for other data.
            const materialIndices = [];

            for (let i = 0; i < materialIndexBuffer.length; ++i) {

                materialIndices.push(i);

            }

            return {
                dataSize: 1,
                buffer: materialIndexBuffer,
                indices: materialIndices,
                mappingType: mappingType,
                referenceType: referenceType
            };

        },

        // Generate a NurbGeometry from a node in FBXTree.Objects.Geometry
        __parseNurbsGeometry(geoNode) {
            /* todo
            const order = parseInt(geoNode.Order);

            if (isNaN(order)) {

                consoleDebug('FBXLoader: Invalid Order ', geoNode.Order, ' given for geometry ID: ', geoNode.id);
                return new BufferGeometry();

            }

            const degree = order - 1;

            const knots = geoNode.KnotVector.a;
            const controlPoints = [];
            const pointsValues = geoNode.Points.a;

            for (let i = 0, l = pointsValues.length; i < l; i += 4) {

                controlPoints.push(new Vector4().__fromArray(pointsValues, i));

            }

            let startKnot, endKnot;

            if (geoNode.Form === 'Closed') {

                controlPoints.push(controlPoints[0]);

            } else if (geoNode.Form === 'Periodic') {

                startKnot = degree;
                endKnot = knots.length - 1 - startKnot;

                for (let i = 0; i < degree; ++i) {

                    controlPoints.push(controlPoints[i]);

                }

            }

            const curve = new NURBSCurve(degree, knots, controlPoints, startKnot, endKnot);
            const points = curve.getPoints(controlPoints.length * 12);

            return new BufferGeometry().setFromPoints(points);
            */

        }

    });

    function AnimationParser(parser) {
        this.__objects = parser.__objects;
        this.__fbxTree = parser.__fbxTree;
    }

    // __parse animation data from FBXTree
    makeClass(AnimationParser, {

        // take raw animation clips and turn them into animation clips
        __parse() {

            const animationClips = [];

            const rawClips = this.__parseClips();

            if (rawClips) {

                for (const key in rawClips) {

                    const rawClip = rawClips[key];

                    const clip = this.__addClip(rawClip);

                    animationClips.push(clip);

                }

            }

            return animationClips;

        },

        __parseClips() {

            // since the actual transformation data is stored in FBXTree.Objects.AnimationCurve,
            // if this is undefined we can safely assume there are no animations
            if (this.__objects.AnimationCurve === undefined) return undefined;

            const curveNodesMap = this.__parseAnimationCurveNodes();

            this.__parseAnimationCurves(curveNodesMap);

            const layersMap = this.__parseAnimationLayers(curveNodesMap);
            const rawClips = this.__parseAnimStacks(layersMap);

            return rawClips;

        },

        // __parse nodes in FBXTree.Objects.AnimationCurveNode
        // each AnimationCurveNode holds data for an animation transform for a model (e.g. left arm rotation )
        // and is referenced by an AnimationLayer
        __parseAnimationCurveNodes() {

            const rawCurveNodes = this.__objects.AnimationCurveNode;

            const curveNodesMap = new Map();

            for (const nodeID in rawCurveNodes) {

                const rawCurveNode = rawCurveNodes[nodeID];

                if (rawCurveNode.attrName.match(/S|R|T|DeformPercent/) !== null) {

                    const curveNode = {

                        id: rawCurveNode.id,
                        attr: rawCurveNode.attrName,
                        curves: {},

                    };

                    curveNodesMap.set(curveNode.id, curveNode);

                }

            }

            return curveNodesMap;

        },

        // __parse nodes in FBXTree.Objects.AnimationCurve and connect them up to
        // previously __parsed AnimationCurveNodes. Each AnimationCurve holds data for a single animated
        // axis ( e.g. times and values of x rotation)
        __parseAnimationCurves(curveNodesMap) {

            const rawCurves = this.__objects.AnimationCurve;

            // TODO: Many values are identical up to roundoff error, but won't be optimised
            // e.g. position times: [0, 0.4, 0. 8]
            // position values: [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.235384487103147e-7, 93.67520904541016, -0.9982695579528809]
            // clearly, this should be optimised to
            // times: [0], positions [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809]
            // this shows up in nearly every FBX file, and generally time array is length > 100

            for (const nodeID in rawCurves) {

                const animationCurve = {

                    id: rawCurves[nodeID].id,
                    times: rawCurves[nodeID].KeyTime.a.map(convertFBXTimeToSeconds),
                    values: rawCurves[nodeID].KeyValueFloat.a,

                };

                const relationships = connections.get(animationCurve.id);

                if (relationships) {

                    const animationCurveID = relationships.__parents[0].ID;
                    const animationCurveRelationship = relationships.__parents[0].relationship;

                    if (animationCurveRelationship.match(/X/)) {

                        curveNodesMap.get(animationCurveID).curves['x'] = animationCurve;

                    } else if (animationCurveRelationship.match(/Y/)) {

                        curveNodesMap.get(animationCurveID).curves['y'] = animationCurve;

                    } else if (animationCurveRelationship.match(/Z/)) {

                        curveNodesMap.get(animationCurveID).curves['z'] = animationCurve;

                    } else if (animationCurveRelationship.match(/DeformPercent/) && curveNodesMap.has(animationCurveID)) {

                        curveNodesMap.get(animationCurveID).curves['morph'] = animationCurve;

                    }

                }

            }

        },

        // __parse nodes in FBXTree.Objects.AnimationLayer. Each layers holds references
        // to various AnimationCurveNodes and is referenced by an AnimationStack node
        // note: theoretically a stack can have multiple layers, however in practice there always seems to be one per stack
        __parseAnimationLayers(curveNodesMap) {
            var t = this;
            const rawLayers = t.__objects.AnimationLayer;

            const layersMap = new Map();

            for (const nodeID in rawLayers) {

                const layerCurveNodes = [];

                const connection = connections.get(parseInt(nodeID));

                if (connection) {

                    // all the animationCurveNodes used in the layer
                    const children = connection.children;

                    children.forEach(function (child, i) {

                        if (curveNodesMap.has(child.ID)) {

                            const curveNode = curveNodesMap.get(child.ID);

                            // check that the curves are defined for at least one axis, otherwise ignore the curveNode
                            if (curveNode.curves.x !== undefined || curveNode.curves.y !== undefined || curveNode.curves.z !== undefined) {

                                if (layerCurveNodes[i] === undefined) {

                                    const modelID = connections.get(child.ID).__parents.filter(function (parent) {

                                        return parent.relationship;

                                    })[0].ID;

                                    if (modelID !== undefined) {

                                        const rawModel = t.__objects.Model[modelID.toString()];

                                        if (rawModel === undefined) {

                                            consoleWarn('FBXLoader: Encountered a unused curve.', child);
                                            return;

                                        }

                                        const node = {

                                            modelName: rawModel.attrName ? PropertyBinding_sanitizeNodeName(rawModel.attrName) : '',
                                            ID: rawModel.id,
                                            initialPosition: [0, 0, 0],
                                            initialRotation: [0, 0, 0],
                                            initialScale: [1, 1, 1],

                                        };

                                        sceneGraph.__traverse(function (child) {

                                            if (child.ID === rawModel.id) {

                                                node.transform = child.matrix;

                                                if (child.__transformData) node.eulerOrder = child.__transformData.eulerOrder;

                                            }

                                        });

                                        if (!node.transform) node.transform = new Matrix4(0, 1);

                                        // if the animated model is pre rotated, we'll have to apply the pre rotations to every
                                        // animation value as well
                                        if ('PreRotation' in rawModel) node.preRotation = rawModel.PreRotation.value;
                                        if ('PostRotation' in rawModel) node.postRotation = rawModel.PostRotation.value;

                                        layerCurveNodes[i] = node;

                                    }

                                }

                                if (layerCurveNodes[i]) layerCurveNodes[i][curveNode.attr] = curveNode;

                            } else if (curveNode.curves.morph !== undefined) {

                                if (layerCurveNodes[i] === undefined) {

                                    const deformerID = connections.get(child.ID).__parents.filter(function (parent) {

                                        return parent.relationship !== undefined;

                                    })[0].ID;

                                    const morpherID = connections.get(deformerID).__parents[0].ID;
                                    const geoID = connections.get(morpherID).__parents[0].ID;

                                    // assuming geometry is not used in more than one model
                                    const modelID = connections.get(geoID).__parents[0].ID;

                                    const rawModel = t.__objects.Model[modelID];

                                    const node = {

                                        modelName: rawModel.attrName ? PropertyBinding_sanitizeNodeName(rawModel.attrName) : '',
                                        morphName: t.__objects.Deformer[deformerID].attrName,

                                    };

                                    layerCurveNodes[i] = node;

                                }

                                layerCurveNodes[i][curveNode.attr] = curveNode;

                            }

                        }

                    });

                    layersMap.set(parseInt(nodeID), layerCurveNodes);

                }

            }

            return layersMap;

        },

        // __parse nodes in FBXTree.Objects.AnimationStack. These are the top level node in the animation
        // hierarchy. Each Stack node will be used to create a AnimationClip
        __parseAnimStacks(layersMap) {

            const rawStacks = this.__objects.AnimationStack;

            // connect the stacks (clips) up to the layers
            const rawClips = {};

            for (const nodeID in rawStacks) {

                const children = connections.get(parseInt(nodeID)).children;

                if (children.length > 1) {

                    // it seems like stacks will always be associated with a single layer. But just in case there are files
                    // where there are multiple layers per stack, we'll display a warning
                    consoleWarn('FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.');

                }

                const layer = layersMap.get(children[0].ID);

                rawClips[nodeID] = {

                    name: rawStacks[nodeID].attrName,
                    layer: layer,

                };

            }

            return rawClips;

        },

        __addClip(rawClip) {

            let tracks = [];

            const scope = this;
            rawClip.layer.forEach(function (rawTracks) {

                tracks = tracks.concat(scope.__generateTracks(rawTracks));

            });

            return new AnimationClip(rawClip.name, - 1, tracks);

        },

        __generateTracks(rawTracks) {

            const tracks = [];

            let initialPosition = new Vector3();
            let initialScale = new Vector3();

            if (rawTracks.transform) rawTracks.transform.__decompose(initialPosition, new Quaternion(), initialScale);


            if (rawTracks.T && Object.keys(rawTracks.T.curves).length > 0) {

                const positionTrack = this.__generateVectorTrack(rawTracks.modelName, rawTracks.T.curves, initialPosition, 'position');
                if (positionTrack) tracks.push(positionTrack);

            }

            if (rawTracks.R && Object.keys(rawTracks.R.curves).length > 0) {

                const rotationTrack = this.__generateRotationTrack(rawTracks.modelName, rawTracks.R.curves, rawTracks.preRotation, rawTracks.postRotation, rawTracks.eulerOrder);
                if (rotationTrack) tracks.push(rotationTrack);

            }

            if (rawTracks.S && Object.keys(rawTracks.S.curves).length > 0) {

                const scaleTrack = this.__generateVectorTrack(rawTracks.modelName, rawTracks.S.curves, initialScale, 'scale');
                if (scaleTrack) tracks.push(scaleTrack);

            }

            if (rawTracks.DeformPercent) {

                const morphTrack = this.__generateMorphTrack(rawTracks);
                if (morphTrack) tracks.push(morphTrack);

            }

            return tracks;

        },

        __generateVectorTrack(modelName, curves, initialValue, type) {

            const times = this.__getTimesForAllAxes(curves);
            const values = this.__getKeyframeTrackValues(times, curves, initialValue);

            return new VectorKeyframeTrack(modelName + '.' + type, times, values);

        },

        __generateRotationTrack(modelName, curves, preRotation, postRotation, eulerOrder) {

            let times;
            let values;

            if (curves.x !== undefined && curves.y !== undefined && curves.z !== undefined) {

                const result = this.__interpolateRotations(curves.x, curves.y, curves.z, eulerOrder);

                times = result[0];
                values = result[1];

            }

            if (preRotation !== undefined) {

                preRotation = preRotation.map(degToRad);
                preRotation.push(eulerOrder);
                preRotation = new Quaternion().__setFromEulerArray(preRotation);

            }

            if (postRotation !== undefined) {

                postRotation = postRotation.map(degToRad);
                postRotation.push(eulerOrder);
                postRotation = new Quaternion().__setFromEulerArray(postRotation).invert();

            }

            const quaternion = new Quaternion();

            const quaternionValues = [];

            if (!values || !times) return new QuaternionKeyframeTrack(modelName + '.quaternion', [0], [0]);

            for (let i = 0; i < values.length; i += 3) {

                quaternion.__setFromEulerXYZO(values[i], values[i + 1], values[i + 2], eulerOrder);

                if (preRotation !== undefined) quaternion.__premultiply(preRotation);
                if (postRotation !== undefined) quaternion.__multiply(postRotation);

                // Check unroll
                if (i > 2) {

                    const prevQuat = new Quaternion().__fromArray(
                        quaternionValues,
                        ((i - 3) / 3) * 4
                    );

                    if (prevQuat.dot(quaternion) < 0) {

                        quaternion.set(- quaternion.x, - quaternion.y, - quaternion.z, - quaternion.w);

                    }

                }

                quaternion.__toArray(quaternionValues, (i / 3) * 4);

            }

            return new QuaternionKeyframeTrack(modelName + '.quaternion', times, quaternionValues);

        },

        __generateMorphTrack(rawTracks) {

            const curves = rawTracks.DeformPercent.curves.morph;
            const values = curves.values.map(function (val) {

                return val / 100;

            });

            const morphNum = sceneGraph.__getObjectByName(rawTracks.modelName).morphTargetDictionary[rawTracks.morphName];

            return new NumberKeyframeTrack(rawTracks.modelName + '.morphTargetInfluences[' + morphNum + ']', curves.times, values);

        },

        // For all animated objects, times are defined separately for each axis
        // Here we'll combine the times into one sorted array without duplicates
        __getTimesForAllAxes(curves) {

            let times = [];

            // first join together the times for each axis, if defined
            if (curves.x !== undefined) times = times.concat(curves.x.times);
            if (curves.y !== undefined) times = times.concat(curves.y.times);
            if (curves.z !== undefined) times = times.concat(curves.z.times);

            // then sort them
            times = times.sort(function (a, b) {

                return a - b;

            });

            // and remove duplicates
            if (times.length > 1) {

                let targetIndex = 1;
                let lastValue = times[0];
                for (let i = 1; i < times.length; i++) {

                    const currentValue = times[i];
                    if (currentValue !== lastValue) {

                        times[targetIndex] = currentValue;
                        lastValue = currentValue;
                        targetIndex++;

                    }

                }

                times = times.slice(0, targetIndex);

            }

            return times;

        },

        __getKeyframeTrackValues(times, curves, initialValue) {

            const prevValue = initialValue;

            const values = [];

            let xIndex = - 1;
            let yIndex = - 1;
            let zIndex = - 1;

            times.forEach(function (time) {

                if (curves.x) xIndex = curves.x.times.indexOf(time);
                if (curves.y) yIndex = curves.y.times.indexOf(time);
                if (curves.z) zIndex = curves.z.times.indexOf(time);

                // if there is an x value defined for this frame, use that
                if (xIndex !== - 1) {

                    const xValue = curves.x.values[xIndex];
                    values.push(xValue);
                    prevValue.x = xValue;

                } else {

                    // otherwise use the x value from the previous frame
                    values.push(prevValue.x);

                }

                if (yIndex !== - 1) {

                    const yValue = curves.y.values[yIndex];
                    values.push(yValue);
                    prevValue.y = yValue;

                } else {

                    values.push(prevValue.y);

                }

                if (zIndex !== - 1) {

                    const zValue = curves.z.values[zIndex];
                    values.push(zValue);
                    prevValue.z = zValue;

                } else {

                    values.push(prevValue.z);

                }

            });

            return values;

        },

        // Rotations are defined as Euler angles which can have values  of any size
        // These will be converted to quaternions which don't support values greater than
        // PI, so we'll interpolate large rotations
        __interpolateRotations(curvex, curvey, curvez, eulerOrder) {

            const times = [];
            const values = [];

            // Add first frame
            times.push(curvex.times[0]);
            values.push(degToRad(curvex.values[0]));
            values.push(degToRad(curvey.values[0]));
            values.push(degToRad(curvez.values[0]));

            for (let i = 1; i < curvex.values.length; i++) {

                const initialValue = [
                    curvex.values[i - 1],
                    curvey.values[i - 1],
                    curvez.values[i - 1],
                ];

                if (isNaN(initialValue[0]) || isNaN(initialValue[1]) || isNaN(initialValue[2])) {

                    continue;

                }

                const initialValueRad = initialValue.map(degToRad);

                const currentValue = [
                    curvex.values[i],
                    curvey.values[i],
                    curvez.values[i],
                ];

                if (isNaN(currentValue[0]) || isNaN(currentValue[1]) || isNaN(currentValue[2])) {

                    continue;

                }

                const currentValueRad = currentValue.map(degToRad);

                const valuesSpan = [
                    currentValue[0] - initialValue[0],
                    currentValue[1] - initialValue[1],
                    currentValue[2] - initialValue[2],
                ];

                const absoluteSpan = [
                    Math.abs(valuesSpan[0]),
                    Math.abs(valuesSpan[1]),
                    Math.abs(valuesSpan[2]),
                ];

                if (absoluteSpan[0] >= 180 || absoluteSpan[1] >= 180 || absoluteSpan[2] >= 180) {

                    const maxAbsSpan = Math.max(...absoluteSpan);

                    const numSubIntervals = maxAbsSpan / 180;

                    const Q1 = new Quaternion().__setFromEulerXYZO(initialValueRad[0], initialValueRad[1], initialValueRad[2], eulerOrder);
                    const Q2 = new Quaternion().__setFromEulerXYZO(currentValueRad[0], currentValueRad[1], currentValueRad[2], eulerOrder);

                    // Check unroll
                    if (Q1.dot(Q2)) {

                        Q2.set(- Q2.x, - Q2.y, - Q2.z, - Q2.w);

                    }

                    // Interpolate
                    const initialTime = curvex.times[i - 1];
                    const timeSpan = curvex.times[i] - initialTime;

                    const Q = new Quaternion();
                    const E = new Euler();
                    for (let t = 0; t < 1; t += 1 / numSubIntervals) {

                        Q.__copy(Q1.__clone().slerp(Q2.__clone(), t));

                        times.push(initialTime + t * timeSpan);
                        E.__setFromQuaternion(Q, eulerOrder);

                        values.push(E.x);
                        values.push(E.y);
                        values.push(E.z);

                    }

                } else {

                    times.push(curvex.times[i]);
                    values.push(degToRad(curvex.values[i]));
                    values.push(degToRad(curvey.values[i]));
                    values.push(degToRad(curvez.values[i]));

                }

            }

            return [times, values];

        }

    });

    // __parse an FBX file in ASCII format
    function TextParser() { }
    makeClass(TextParser, {

        __getPrevNode() {

            return this.nodeStack[this.currentIndent - 2];

        },

        __getCurrentNode() {

            return this.nodeStack[this.currentIndent - 1];

        },

        __getCurrentProp() {

            return this.currentProp;

        },

        __pushStack(node) {

            this.nodeStack.push(node);
            this.currentIndent += 1;

        },

        __popStack() {

            this.nodeStack.pop();
            this.currentIndent -= 1;

        },

        __setCurrentProp(val, name) {

            this.currentProp = val;
            this.currentPropName = name;

        },

        __parse(text) {

            this.currentIndent = 0;

            this.allNodes = new FBXTree();
            this.nodeStack = [];
            this.currentProp = [];
            this.currentPropName = '';

            const scope = this;

            const split = text.split(/[\r\n]+/);

            split.forEach(function (line, i) {

                const matchComment = line.match(/^[\s\t]*;/);
                const matchEmpty = line.match(/^[\s\t]*$/);

                if (matchComment || matchEmpty) return;

                const matchBeginning = line.match('^\\t{' + scope.currentIndent + '}(\\w+):(.*){', '');
                const matchProperty = line.match('^\\t{' + (scope.currentIndent) + '}(\\w+):[\\s\\t\\r\\n](.*)');
                const matchEnd = line.match('^\\t{' + (scope.currentIndent - 1) + '}}');

                if (matchBeginning) {

                    scope.__parseNodeBegin(line, matchBeginning);

                } else if (matchProperty) {

                    scope.__parseNodeProperty(line, matchProperty, split[++i]);

                } else if (matchEnd) {

                    scope.__popStack();

                } else if (line.match(/^[^\s\t}]/)) {

                    // large arrays are split over multiple lines terminated with a ',' character
                    // if this is encountered the line needs to be joined to the previous line
                    scope.__parseNodePropertyContinued(line);

                }

            });

            return this.allNodes;

        },

        __parseNodeBegin(line, property) {

            const nodeName = property[1].trim().replace(/^"/, '').replace(/"$/, '');

            const nodeAttrs = property[2].split(',').map(function (attr) {

                return attr.trim().replace(/^"/, '').replace(/"$/, '');

            });

            const node = { name: nodeName };
            const attrs = this.__parseNodeAttr(nodeAttrs);

            const currentNode = this.__getCurrentNode();

            // a top node
            if (this.currentIndent === 0) {

                this.allNodes.add(nodeName, node);

            } else { // a subnode

                // if the subnode already exists, append it
                if (nodeName in currentNode) {

                    // special case Pose needs PoseNodes as an array
                    if (nodeName === 'PoseNode') {

                        currentNode.PoseNode.push(node);

                    } else if (currentNode[nodeName].id !== undefined) {

                        currentNode[nodeName] = {};
                        currentNode[nodeName][currentNode[nodeName].id] = currentNode[nodeName];

                    }

                    if (attrs.id !== '') currentNode[nodeName][attrs.id] = node;

                } else if (typeof attrs.id === 'number') {

                    currentNode[nodeName] = {};
                    currentNode[nodeName][attrs.id] = node;

                } else if (nodeName !== 'Properties70') {

                    if (nodeName === 'PoseNode') currentNode[nodeName] = [node];
                    else currentNode[nodeName] = node;

                }

            }

            if (typeof attrs.id === 'number') node.id = attrs.id;
            if (attrs.name !== '') node.attrName = attrs.name;
            if (attrs.type !== '') node.attrType = attrs.type;

            this.__pushStack(node);

        },

        __parseNodeAttr(attrs) {

            let id = attrs[0];

            if (attrs[0] !== '') {

                id = parseInt(attrs[0]);

                if (isNaN(id)) {

                    id = attrs[0];

                }

            }

            let name = '', type = '';

            if (attrs.length > 1) {

                name = attrs[1].replace(/^(\w+)::/, '');
                type = attrs[2];

            }

            return { id: id, name: name, type: type };

        },

        __parseNodeProperty(line, property, contentLine) {

            let propName = property[1].replace(/^"/, '').replace(/"$/, '').trim();
            let propValue = property[2].replace(/^"/, '').replace(/"$/, '').trim();

            // for special case: base64 image data follows "Content: ," line
            //	Content: ,
            //	 "/9j/4RDaRXhpZgAATU0A..."
            if (propName === 'Content' && propValue === ',') {

                propValue = contentLine.replace(/"/g, '').replace(/,$/, '').trim();

            }

            const currentNode = this.__getCurrentNode();
            const parentName = currentNode.name;

            if (parentName === 'Properties70') {

                this.__parseNodeSpecialProperty(line, propName, propValue);
                return;

            }

            // Connections
            if (propName === 'C') {

                const connProps = propValue.split(',').slice(1);
                const from = parseInt(connProps[0]);
                const to = parseInt(connProps[1]);

                let rest = propValue.split(',').slice(3);

                rest = rest.map(function (elem) {

                    return elem.trim().replace(/^"/, '');

                });

                propName = 'connections';
                propValue = [from, to];
                append(propValue, rest);

                if (currentNode[propName] === undefined) {

                    currentNode[propName] = [];

                }

            }

            // Node
            if (propName === 'Node') currentNode.id = propValue;

            // connections
            if (propName in currentNode && Array.isArray(currentNode[propName])) {

                currentNode[propName].push(propValue);

            } else {

                if (propName !== 'a') currentNode[propName] = propValue;
                else currentNode.a = propValue;

            }

            this.__setCurrentProp(currentNode, propName);

            // convert string to array, unless it ends in ',' in which case more will be added to it
            if (propName === 'a' && propValue.slice(- 1) !== ',') {

                currentNode.a = parseNumberArray(propValue);

            }

        },

        __parseNodePropertyContinued(line) {

            const currentNode = this.__getCurrentNode();

            currentNode.a += line;

            // if the line doesn't end in ',' we have reached the end of the property value
            // so convert the string to an array
            if (line.slice(- 1) !== ',') {

                currentNode.a = parseNumberArray(currentNode.a);

            }

        },

        // __parse "Property70"
        __parseNodeSpecialProperty(line, propName, propValue) {

            // split this
            // P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
            // into array like below
            // ["Lcl Scaling", "Lcl Scaling", "", "A", "1,1,1" ]
            const props = propValue.split('",').map(function (prop) {

                return prop.trim().replace(/^\"/, '').replace(/\s/, '_');

            });

            const innerPropName = props[0];
            const innerPropType1 = props[1];
            const innerPropType2 = props[2];
            const innerPropFlag = props[3];
            let innerPropValue = props[4];

            // cast values where needed, otherwise leave as strings
            switch (innerPropType1) {

                case 'int':
                case 'enum':
                case 'bool':
                case 'ULongLong':
                case 'double':
                case 'Number':
                case 'FieldOfView':
                    innerPropValue = parseFloat(innerPropValue);
                    break;

                case 'Color':
                case 'ColorRGB':
                case 'Vector3D':
                case 'Lcl_Translation':
                case 'Lcl_Rotation':
                case 'Lcl_Scaling':
                    innerPropValue = parseNumberArray(innerPropValue);
                    break;

            }

            // CAUTION: these props must append to parent's parent
            this.__getPrevNode()[innerPropName] = {

                'type': innerPropType1,
                'type2': innerPropType2,
                'flag': innerPropFlag,
                'value': innerPropValue

            };

            this.__setCurrentProp(this.__getPrevNode(), innerPropName);

        }

    });

    // __parse an FBX file in Binary format
    function BinaryParser() { }

    makeClass(BinaryParser, {

        __parse(buffer, onerr) {

            const reader = new BinaryReader(buffer);
            reader.skip(23); // skip magic 23 bytes

            const version = reader.__getUint32();

            if (version < 6400) {

                onerr('FBXLoader: FBX version not supported, FileVersion: ' + version);

            }

            const allNodes = new FBXTree();

            while (!this.__endOfContent(reader)) {

                const node = this.__parseNode(reader, version);
                if (node !== null) allNodes.add(node.name, node);

            }

            return allNodes;

        },

        // Check if reader has reached the end of content.
        __endOfContent(reader) {

            // footer size: 160bytes + 16-byte alignment padding
            // - 16bytes: magic
            // - padding til 16-byte alignment (at least 1byte?)
            //	(seems like some exporters embed fixed 15 or 16bytes?)
            // - 4bytes: magic
            // - 4bytes: version
            // - 120bytes: zero
            // - 16bytes: magic
            if (reader.size() % 16 === 0) {

                return ((reader.__getOffset() + 160 + 16) & ~0xf) >= reader.size();

            } else {

                return reader.__getOffset() + 160 + 16 >= reader.size();

            }

        },

        // recursively __parse nodes until the end of the file is reached
        __parseNode(reader, version) {

            const node = {};

            // The first three data sizes depends on version.
            const endOffset = (version >= 7500) ? reader.__getUint64() : reader.__getUint32();
            const numProperties = (version >= 7500) ? reader.__getUint64() : reader.__getUint32();

            (version >= 7500) ? reader.__getUint64() : reader.__getUint32(); // the returned propertyListLen is not used

            const nameLen = reader.__getUint8();
            const name = reader.__getString(nameLen);

            // Regards this node as NULL-record if endOffset is zero
            if (endOffset === 0) return null;

            const propertyList = [];

            for (let i = 0; i < numProperties; i++) {

                propertyList.push(this.__parseProperty(reader));

            }

            // Regards the first three elements in propertyList as id, attrName, and attrType
            const id = propertyList.length > 0 ? propertyList[0] : '';
            const attrName = propertyList.length > 1 ? propertyList[1] : '';
            const attrType = propertyList.length > 2 ? propertyList[2] : '';

            // check if this node represents just a single property
            // like (name, 0) set or (name2, [0, 1, 2]) set of {name: 0, name2: [0, 1, 2]}
            node.singleProperty = (numProperties === 1 && reader.__getOffset() === endOffset) ? true : false;

            while (endOffset > reader.__getOffset()) {

                const subNode = this.__parseNode(reader, version);

                if (subNode !== null) this.__parseSubNode(name, node, subNode);

            }

            node.propertyList = propertyList; // raw property list used by parent

            if (typeof id === 'number') node.id = id;
            if (attrName !== '') node.attrName = attrName;
            if (attrType !== '') node.attrType = attrType;
            if (name !== '') node.name = name;

            return node;

        },

        __parseSubNode(name, node, subNode) {

            // special case: child node is single property
            if (subNode.singleProperty === true) {

                const value = subNode.propertyList[0];

                if (Array.isArray(value)) {

                    node[subNode.name] = subNode;

                    subNode.a = value;

                } else {

                    node[subNode.name] = value;

                }

            } else if (name === 'Connections' && subNode.name === 'C') {

                const array = [];

                subNode.propertyList.forEach(function (property, i) {

                    // first Connection is FBX type (OO, OP, etc.). We'll discard these
                    if (i !== 0) array.push(property);

                });

                if (node.connections === undefined) {

                    node.connections = [];

                }

                node.connections.push(array);

            } else if (subNode.name === 'Properties70') {

                const keys = Object.keys(subNode);

                keys.forEach(function (key) {

                    node[key] = subNode[key];

                });

            } else if (name === 'Properties70' && subNode.name === 'P') {

                let innerPropName = subNode.propertyList[0];
                let innerPropType1 = subNode.propertyList[1];
                const innerPropType2 = subNode.propertyList[2];
                const innerPropFlag = subNode.propertyList[3];
                let innerPropValue;

                if (innerPropName.indexOf('Lcl ') === 0) innerPropName = innerPropName.replace('Lcl ', 'Lcl_');
                if (innerPropType1.indexOf('Lcl ') === 0) innerPropType1 = innerPropType1.replace('Lcl ', 'Lcl_');

                if (innerPropType1 === 'Color' || innerPropType1 === 'ColorRGB' || innerPropType1 === 'Vector' || innerPropType1 === 'Vector3D' || innerPropType1.indexOf('Lcl_') === 0) {

                    innerPropValue = [
                        subNode.propertyList[4],
                        subNode.propertyList[5],
                        subNode.propertyList[6]
                    ];

                } else {

                    innerPropValue = subNode.propertyList[4];

                }

                // this will be copied to parent, see above
                node[innerPropName] = {

                    'type': innerPropType1,
                    'type2': innerPropType2,
                    'flag': innerPropFlag,
                    'value': innerPropValue

                };

            } else if (node[subNode.name] === undefined) {

                if (typeof subNode.id === 'number') {

                    node[subNode.name] = {};
                    node[subNode.name][subNode.id] = subNode;

                } else {

                    node[subNode.name] = subNode;

                }

            } else {

                if (subNode.name === 'PoseNode') {

                    if (!Array.isArray(node[subNode.name])) {

                        node[subNode.name] = [node[subNode.name]];

                    }

                    node[subNode.name].push(subNode);

                } else if (node[subNode.name][subNode.id] === undefined) {

                    node[subNode.name][subNode.id] = subNode;

                }

            }

        },

        __parseProperty(reader) {

            const type = reader.__getString(1);
            let length;

            switch (type) {

                case 'C':
                    return reader.__getBoolean();

                case 'D':
                    return reader.__getFloat64();

                case 'F':
                    return reader.__getFloat32();

                case 'I':
                    return reader.__getInt32();

                case 'L':
                    return reader.__getInt64();

                case 'R':
                    length = reader.__getUint32();
                    return reader.__getArrayBuffer(length);

                case 'S':
                    length = reader.__getUint32();
                    return reader.__getString(length);

                case 'Y':
                    return reader.__getInt16();

                case 'b':
                case 'c':
                case 'd':
                case 'f':
                case 'i':
                case 'l':

                    const arrayLength = reader.__getUint32();
                    const encoding = reader.__getUint32(); // 0: non-compressed, 1: compressed
                    const compressedLength = reader.__getUint32();

                    if (encoding === 0) {

                        switch (type) {

                            case 'b':
                            case 'c':
                                return reader.__getBooleanArray(arrayLength);

                            case 'd':
                                return reader.__getFloat64Array(arrayLength);

                            case 'f':
                                return reader.__getFloat32Array(arrayLength);

                            case 'i':
                                return reader.__getInt32Array(arrayLength);

                            case 'l':
                                return reader.__getInt64Array(arrayLength);

                        }

                    }

                    const data = fflate.unzlibSync(new Uint8Array(reader.__getArrayBuffer(compressedLength)));
                    const reader2 = new BinaryReader(data.buffer);

                    switch (type) {

                        case 'b':
                        case 'c':
                            return reader2.__getBooleanArray(arrayLength);

                        case 'd':
                            return reader2.__getFloat64Array(arrayLength);

                        case 'f':
                            return reader2.__getFloat32Array(arrayLength);

                        case 'i':
                            return reader2.__getInt32Array(arrayLength);

                        case 'l':
                            return reader2.__getInt64Array(arrayLength);

                    }

                    break; // cannot happen but is required by the DeepScan

                default:
                    throw new Error('FBXLoader: Unknown property type ' + type);

            }

        }

    });

    function BinaryReader(arr, littleEndian) {
        if (arr.buffer) {
            this.dv = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
        } else {
            this.dv = new DataView(arr);
        }
        this.offset = 0;
        this.littleEndian = (littleEndian !== undefined) ? littleEndian : true;
        this._textDecoder = new TextDecoder();
    }

    makeClass(BinaryReader, {

        __getOffset() {

            return this.offset;

        },

        size() {

            return this.dv.buffer.byteLength;

        },

        skip(length) {

            this.offset += length;

        },

        // seems like true/false representation depends on exporter.
        // true: 1 or 'Y'(=0x59), false: 0 or 'T'(=0x54)
        // then sees LSB.
        __getBoolean() {

            return (this.__getUint8() & 1) === 1;

        },

        __getBooleanArray(size) {

            const a = [];

            for (let i = 0; i < size; i++) {

                a.push(this.__getBoolean());

            }

            return a;

        },

        __getUint8() {

            const value = this.dv.getUint8(this.offset);
            this.offset += 1;
            return value;

        },

        __getInt16() {

            const value = this.dv.getInt16(this.offset, this.littleEndian);
            this.offset += 2;
            return value;

        },

        __getInt32() {

            const value = this.dv.getInt32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;

        },

        __getInt32Array(size) {

            const a = [];

            for (let i = 0; i < size; i++) {

                a.push(this.__getInt32());

            }

            return a;

        },

        __getUint32() {

            const value = this.dv.getUint32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;

        },

        // JavaScript doesn't support 64-bit integer so calculate this here
        // 1 << 32 will return 1 so using multiply operation instead here.
        // There's a possibility that this method returns wrong value if the value
        // is out of the range between Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER.
        // TODO: safely handle 64-bit integer
        __getInt64() {

            let low, high;

            if (this.littleEndian) {

                low = this.__getUint32();
                high = this.__getUint32();

            } else {

                high = this.__getUint32();
                low = this.__getUint32();

            }

            // calculate negative value
            if (high & 0x80000000) {

                high = ~high & 0xFFFFFFFF;
                low = ~low & 0xFFFFFFFF;

                if (low === 0xFFFFFFFF) high = (high + 1) & 0xFFFFFFFF;

                low = (low + 1) & 0xFFFFFFFF;

                return - (high * 0x100000000 + low);

            }

            return high * 0x100000000 + low;

        },

        __getInt64Array(size) {

            const a = [];

            for (let i = 0; i < size; i++) {

                a.push(this.__getInt64());

            }

            return a;

        },

        // Note: see __getInt64() comment
        __getUint64() {

            let low, high;

            if (this.littleEndian) {

                low = this.__getUint32();
                high = this.__getUint32();

            } else {

                high = this.__getUint32();
                low = this.__getUint32();

            }

            return high * 0x100000000 + low;

        },

        __getFloat32() {

            const value = this.dv.getFloat32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;

        },

        __getFloat32Array(size) {

            const a = [];

            for (let i = 0; i < size; i++) {

                a.push(this.__getFloat32());

            }

            return a;

        },

        __getFloat64() {

            const value = this.dv.getFloat64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;

        },

        __getFloat64Array(size) {

            const a = [];

            for (let i = 0; i < size; i++) {

                a.push(this.__getFloat64());

            }

            return a;

        },

        __getArrayBuffer(size) {

            const value = this.dv.buffer.slice(this.offset, this.offset + size);
            this.offset += size;
            return value;

        },

        __getString(size) {

            const start = this.offset;
            let a = new Uint8Array(this.dv.buffer, start, size);

            this.skip(size);

            const nullByte = a.indexOf(0);
            if (nullByte >= 0) a = new Uint8Array(this.dv.buffer, start, nullByte);

            return this._textDecoder.decode(a);

        }

    });

    // FBXTree holds a representation of the FBX data, returned by the TextParser ( FBX ASCII format)
    // and BinaryParser( FBX Binary format)
    function FBXTree() { }
    makeClass(FBXTree, {
        add(key, val) {
            this[key] = val;
        }
    });

    // ************** UTILITY FUNCTIONS **************

    const CORRECT = 'Kaydara FBX Binary  ';
    function isFbxFormatBinary(buffer) {
        if (buffer && buffer.byteLength >= CORRECT.length) {
            for (var i = 0; i < CORRECT.length; i++) {
                if (buffer[i] != CORRECT.charCodeAt(i)) {
                    return;
                }
            }
            return true;
        }
    }

    function isFbxFormatASCII(text) {

        const CORRECT = ['K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F', 'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\'];

        let cursor = 0;

        function read(offset) {

            const result = text[offset - 1];
            text = text.slice(cursor + offset);
            cursor++;
            return result;

        }

        for (let i = 0; i < CORRECT.length; ++i) {

            const num = read(1);
            if (num === CORRECT[i]) {

                return false;

            }

        }

        return true;

    }

    // Converts FBX ticks into real time seconds.
    function convertFBXTimeToSeconds(time) {

        return time / 46186158000;

    }

    const dataArray = [];

    // extracts the data from the correct position in the FBX array based on indexing type
    function getData(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {

        let index;

        switch (infoObject.mappingType) {
            case 'ByPolygonVertex': index = polygonVertexIndex; break;
            case 'ByPolygon': index = polygonIndex; break;
            case 'ByVertice': index = vertexIndex; break;
            case 'AllSame': index = infoObject.indices[0]; break;
            default:
                consoleWarn('FBXLoader: unknown attribute mapping type ' + infoObject.mappingType);

        }

        if (infoObject.referenceType === 'IndexToDirect') index = infoObject.indices[index];

        const from = index * infoObject.dataSize;
        const to = from + infoObject.dataSize;

        return slice(dataArray, infoObject.buffer, from, to);

    }

    const tempVec = new Vector3();

    // generate transformation from FBX transform data
    // ref: https://help.autodesk.com/view/FBX/2017/ENU/?guid=__files_GUID_10CDD63C_79C1_4F2D_BB28_AD2BE65A02ED_htm
    // ref: http://docs.autodesk.com/FBX/2014/ENU/FBX-SDK-Documentation/index.html?url=cpp_ref/_transformations_2main_8cxx-example.html,topicNumber=cpp_ref__transformations_2main_8cxx_example_htmlfc10a1e1-b18d-4e72-9dc0-70d0f1959f5e
    function generateTransform(transformData) {

        const lTranslationM = new Matrix4(0, 1);
        const lPreRotationM = new Matrix4(0, 1);
        const lRotationM = new Matrix4(0, 1);
        const lPostRotationM = new Matrix4(0, 1);

        const lScalingM = new Matrix4(0, 1);
        const lScalingPivotM = new Matrix4(0, 1);
        const lScalingOffsetM = new Matrix4(0, 1);
        const lRotationOffsetM = new Matrix4(0, 1);
        const lRotationPivotM = new Matrix4(0, 1);

        const lParentGX = new Matrix4(0, 1);
        const lParentLX = new Matrix4(0, 1);
        const lGlobalT = new Matrix4(0, 1);

        const inheritType = (transformData.inheritType) ? transformData.inheritType : 0;

        if (transformData.translation) {
            lTranslationM.__setPosition(tempVec.__fromArray(transformData.translation));
        }

        if (transformData.preRotation) {

            const a = transformData.preRotation.map(degToRad);
            lPreRotationM.__makeRotationFromEuler(new Euler(a[0], a[1], a[2], transformData.eulerOrder));

        }

        if (transformData.rotation) {

            const a = transformData.rotation.map(degToRad);
            lRotationM.__makeRotationFromEuler(new Euler(a[0], a[1], a[2], transformData.eulerOrder));

        }

        if (transformData.postRotation) {

            const a = transformData.postRotation.map(degToRad);
            lPostRotationM
                .__makeRotationFromEuler(new Euler(a[0], a[1], a[2], transformData.eulerOrder))
                .__invert();
        }

        if (transformData.__scale) lScalingM.__scale(tempVec.__fromArray(transformData.__scale));

        // Pivots and offsets
        if (transformData.scalingOffset) lScalingOffsetM.__setPosition(tempVec.__fromArray(transformData.scalingOffset));
        if (transformData.scalingPivot) lScalingPivotM.__setPosition(tempVec.__fromArray(transformData.scalingPivot));
        if (transformData.rotationOffset) lRotationOffsetM.__setPosition(tempVec.__fromArray(transformData.rotationOffset));
        if (transformData.rotationPivot) lRotationPivotM.__setPosition(tempVec.__fromArray(transformData.rotationPivot));

        // parent transform
        if (transformData.__parentMatrixWorld) {

            lParentLX.__copy(transformData.__parentMatrix);
            lParentGX.__copy(transformData.__parentMatrixWorld);

        }

        const lLRM = lPreRotationM.__clone().__multiply(lRotationM).__multiply(lPostRotationM);
        // Global Rotation
        const lParentGRM = new Matrix4(0, 1);

        lParentGRM.__extractRotation(lParentGX);

        // Global Shear*Scaling
        const lParentTM = new Matrix4(0, 1);
        lParentTM.__copyPosition(lParentGX);

        const lParentGRSM = lParentTM.__getInverseMatrix().__multiply(lParentGX);
        const lParentGSM = lParentGRM.__getInverseMatrix().__multiply(lParentGRSM);
        const lLSM = lScalingM;

        const lGlobalRS = new Matrix4(0, 1);

        if (inheritType === 0) {

            lGlobalRS.__copy(lParentGRM).__multiply(lLRM).__multiply(lParentGSM).__multiply(lLSM);

        } else if (inheritType === 1) {

            lGlobalRS.__copy(lParentGRM).__multiply(lParentGSM).__multiply(lLRM).__multiply(lLSM);

        } else {

            const lParentLSM = new Matrix4(0, 1).__scale(new Vector3().setFromMatrixScale(lParentLX));
            const lParentLSM_inv = lParentLSM.__getInverseMatrix();
            const lParentGSM_noLocal = lParentGSM.__clone().__multiply(lParentLSM_inv);

            lGlobalRS.__copy(lParentGRM).__multiply(lLRM).__multiply(lParentGSM_noLocal).__multiply(lLSM);

        }

        const lRotationPivotM_inv = lRotationPivotM.__getInverseMatrix();
        const lScalingPivotM_inv = lScalingPivotM.__getInverseMatrix();
        // Calculate the local transform matrix
        let lTransform = lTranslationM.__clone().__multiply(lRotationOffsetM).__multiply(lRotationPivotM).__multiply(lPreRotationM).__multiply(lRotationM).__multiply(lPostRotationM).__multiply(lRotationPivotM_inv).__multiply(lScalingOffsetM).__multiply(lScalingPivotM).__multiply(lScalingM).__multiply(lScalingPivotM_inv);

        const lLocalTWithAllPivotAndOffsetInfo = new Matrix4(0, 1).__copyPosition(lTransform);

        const lGlobalTranslation = lParentGX.__clone().__multiply(lLocalTWithAllPivotAndOffsetInfo);
        lGlobalT.__copyPosition(lGlobalTranslation);

        lTransform = lGlobalT.__clone().__multiply(lGlobalRS);

        // from global to local
        lTransform.__multiplyMatrices(lParentGX.__invert(), lTransform);


        return lTransform;

    }

    // Returns the intrinsic Euler order corresponding to FBX extrinsic Euler order
    // ref: http://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_class_fbx_euler_html
    function getEulerOrder(order) {

        order = order || 0;

        const enums = [
            'ZYX', // -> XYZ extrinsic
            'YZX', // -> XZY extrinsic
            'XZY', // -> YZX extrinsic
            'ZXY', // -> YXZ extrinsic
            'YXZ', // -> ZXY extrinsic
            'XYZ', // -> ZYX extrinsic
            //'SphericXYZ', // not possible to support
        ];

        if (order === 6) {

            consoleWarn('FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect.');
            return enums[0];

        }

        return enums[order];

    }

    // __parses comma separated list of numbers and returns them an array.
    // Used internally by the TextParser
    function parseNumberArray(value) {
        return $map(value.split(','), v => parseFloat(v))

    }

    function append(a, b) {
        for (let i = 0, j = a.length, l = b.length; i < l; i++, j++) {
            a[j] = b[i];
        }
    }

    function slice(a, b, from, to) {
        for (let i = from, j = 0; i < to; i++, j++) {
            a[j] = b[i];
        }
        return a;
    }


    function removeDupEndPts(points) {

        const l = points.length;

        if (l > 2 && points[l - 1].__equals(points[0])) {

            points.pop();

        }

    }

    function addContour(vertices, contour) {

        for (let i = 0; i < contour.length; i++) {

            vertices.push(contour[i].x);
            vertices.push(contour[i].y);

        }

    }


    function Earcut_triangulate(data, holeIndices, dim = 2) {

        const hasHoles = holeIndices && holeIndices.length;
        const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
        let outerNode = linkedList(data, 0, outerLen, dim, true);
        const triangles = [];

        if (!outerNode || outerNode.next === outerNode.prev) return triangles;

        let minX, minY, maxX, maxY, x, y, invSize;

        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {

            minX = maxX = data[0];
            minY = maxY = data[1];

            for (let i = dim; i < outerLen; i += dim) {

                x = data[i];
                y = data[i + 1];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;

            }

            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 32767 / invSize : 0;

        }

        earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);

        return triangles;

    }



    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data, start, end, dim, clockwise) {

        let i, last;

        if (clockwise === (signedArea(data, start, end, dim) > 0)) {

            for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);

        } else {

            for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);

        }

        if (last && equals(last, last.next)) {

            removeNode(last);
            last = last.next;

        }

        return last;

    }

    // eliminate colinear or duplicate points
    function filterPoints(start, end) {

        if (!start) return start;
        if (!end) end = start;

        let p = start,
            again;
        do {

            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {

                removeNode(p);
                p = end = p.prev;
                if (p === p.next) break;
                again = true;

            } else {

                p = p.next;

            }

        } while (again || p !== end);

        return end;

    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {

        if (!ear) return;

        // interlink polygon nodes in z-order
        if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

        let stop = ear,
            prev, next;

        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {

            prev = ear.prev;
            next = ear.next;

            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {

                // cut off the triangle
                triangles.push(prev.i / dim | 0);
                triangles.push(ear.i / dim | 0);
                triangles.push(next.i / dim | 0);

                removeNode(ear);

                // skipping the next vertex leads to less sliver triangles
                ear = next.next;
                stop = next.next;

                continue;

            }

            ear = next;

            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {

                // try filtering points and slicing again
                if (!pass) {

                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

                    // if this didn't work, try curing all small self-intersections locally

                } else if (pass === 1) {

                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

                    // as a last resort, try splitting the remaining polygon into two

                } else if (pass === 2) {

                    splitEarcut(ear, triangles, dim, minX, minY, invSize);

                }

                break;

            }

        }

    }

    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear) {

        const a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

        // triangle bbox; min & max are calculated like this for speed
        const x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
            y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
            x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
            y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

        let p = c.next;
        while (p !== a) {

            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.next;

        }

        return true;

    }

    function isEarHashed(ear, minX, minY, invSize) {

        const a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

        // triangle bbox; min & max are calculated like this for speed
        const x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
            y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
            x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
            y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

        // z-order range for the current triangle bbox;
        const minZ = zOrder(x0, y0, minX, minY, invSize),
            maxZ = zOrder(x1, y1, minX, minY, invSize);

        let p = ear.prevZ,
            n = ear.nextZ;

        // look for points inside the triangle in both directions
        while (p && p.z >= minZ && n && n.z <= maxZ) {

            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;

            if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;

        }

        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {

            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;

        }

        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {

            if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;

        }

        return true;

    }

    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start, triangles, dim) {

        let p = start;
        do {

            const a = p.prev,
                b = p.next.next;

            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

                triangles.push(a.i / dim | 0);
                triangles.push(p.i / dim | 0);
                triangles.push(b.i / dim | 0);

                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);

                p = start = b;

            }

            p = p.next;

        } while (p !== start);

        return filterPoints(p);

    }

    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {

        // look for a valid diagonal that divides the polygon into two
        let a = start;
        do {

            let b = a.next.next;
            while (b !== a.prev) {

                if (a.i !== b.i && isValidDiagonal(a, b)) {

                    // split the polygon in two by the diagonal
                    let c = splitPolygon(a, b);

                    // filter colinear points around the cuts
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);

                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, invSize, 0);
                    earcutLinked(c, triangles, dim, minX, minY, invSize, 0);
                    return;

                }

                b = b.next;

            }

            a = a.next;

        } while (a !== start);

    }

    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data, holeIndices, outerNode, dim) {

        const queue = [];
        let i, len, start, end, list;

        for (i = 0, len = holeIndices.length; i < len; i++) {

            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) list.steiner = true;
            queue.push(getLeftmost(list));

        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {

            outerNode = eliminateHole(queue[i], outerNode);

        }

        return outerNode;

    }

    function compareX(a, b) {

        return a.x - b.x;

    }

    // find a bridge between vertices that connects hole with an outer ring and link it
    function eliminateHole(hole, outerNode) {

        const bridge = findHoleBridge(hole, outerNode);
        if (!bridge) {

            return outerNode;

        }

        const bridgeReverse = splitPolygon(bridge, hole);

        // filter collinear points around the cuts
        filterPoints(bridgeReverse, bridgeReverse.next);
        return filterPoints(bridge, bridge.next);

    }

    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole, outerNode) {

        let p = outerNode,
            qx = - Infinity,
            m;

        const hx = hole.x, hy = hole.y;

        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {

            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {

                const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {

                    qx = x;
                    m = p.x < p.next.x ? p : p.next;
                    if (x === hx) return m; // hole touches outer segment; pick leftmost endpoint

                }

            }

            p = p.next;

        } while (p !== outerNode);

        if (!m) return null;

        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point

        const stop = m,
            mx = m.x,
            my = m.y;
        let tanMin = Infinity, tan;

        p = m;

        do {

            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

                if (locallyInside(p, hole) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {

                    m = p;
                    tanMin = tan;

                }

            }

            p = p.next;

        } while (p !== stop);

        return m;

    }

    // whether sector in vertex m contains sector in vertex p in the same coordinates
    function sectorContainsSector(m, p) {

        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;

    }

    // interlink polygon nodes in z-order
    function indexCurve(start, minX, minY, invSize) {

        let p = start;
        do {

            if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;

        } while (p !== start);

        p.prevZ.nextZ = null;
        p.prevZ = null;

        sortLinked(p);

    }

    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list) {

        let i, p, q, e, tail, numMerges, pSize, qSize,
            inSize = 1;

        do {

            p = list;
            list = null;
            tail = null;
            numMerges = 0;

            while (p) {

                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {

                    pSize++;
                    q = q.nextZ;
                    if (!q) break;

                }

                qSize = inSize;

                while (pSize > 0 || (qSize > 0 && q)) {

                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {

                        e = p;
                        p = p.nextZ;
                        pSize--;

                    } else {

                        e = q;
                        q = q.nextZ;
                        qSize--;

                    }

                    if (tail) tail.nextZ = e;
                    else list = e;

                    e.prevZ = tail;
                    tail = e;

                }

                p = q;

            }

            tail.nextZ = null;
            inSize *= 2;

        } while (numMerges > 1);

        return list;

    }

    // z-order of a point given coords and inverse of the longer side of data bbox
    function zOrder(x, y, minX, minY, invSize) {

        // coords are transformed into non-negative 15-bit integer range
        x = (x - minX) * invSize | 0;
        y = (y - minY) * invSize | 0;

        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;

        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        return x | (y << 1);

    }

    // find the leftmost node of a polygon ring
    function getLeftmost(start) {

        let p = start,
            leftmost = start;
        do {

            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
            p = p.next;

        } while (p !== start);

        return leftmost;

    }

    // check if a point lies within a convex triangle
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {

        return (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
            (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
            (bx - px) * (cy - py) >= (cx - px) * (by - py);

    }

    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a, b) {

        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
            (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case

    }

    // signed area of a triangle
    function area(p, q, r) {

        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

    }

    // check if two points are equal
    function equals(p1, p2) {

        return p1.x === p2.x && p1.y === p2.y;

    }

    // check if two segments intersect
    function intersects(p1, q1, p2, q2) {

        const o1 = sign(area(p1, q1, p2));
        const o2 = sign(area(p1, q1, q2));
        const o3 = sign(area(p2, q2, p1));
        const o4 = sign(area(p2, q2, q1));

        if (o1 !== o2 && o3 !== o4) return true; // general case

        if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

        return false;

    }

    // for collinear points p, q, r, check if point q lies on segment pr
    function onSegment(p, q, r) {

        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);

    }

    function sign(num) {

        return num > 0 ? 1 : num < 0 ? - 1 : 0;

    }

    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a, b) {

        let p = a;
        do {

            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
            p = p.next;

        } while (p !== a);

        return false;

    }

    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a, b) {

        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;

    }

    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a, b) {

        let p = a,
            inside = false;
        const px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {

            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                inside = !inside;
            p = p.next;

        } while (p !== a);

        return inside;

    }

    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a, b) {

        const a2 = new _E_Node(a.i, a.x, a.y),
            b2 = new _E_Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;

        a.next = b;
        b.prev = a;

        a2.next = an;
        an.prev = a2;

        b2.next = a2;
        a2.prev = b2;

        bp.next = b2;
        b2.prev = bp;

        return b2;

    }

    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i, x, y, last) {

        const p = new _E_Node(i, x, y);

        if (!last) {

            p.prev = p;
            p.next = p;

        } else {

            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;

        }

        return p;

    }

    function removeNode(p) {

        p.next.prev = p.prev;
        p.prev.next = p.next;

        if (p.prevZ) p.prevZ.nextZ = p.nextZ;
        if (p.nextZ) p.nextZ.prevZ = p.prevZ;

    }

    function _E_Node(i, x, y) {

        // vertex index in coordinates array
        this.i = i;

        // vertex coordinates
        this.x = x;
        this.y = y;

        // previous and next vertex nodes in a polygon ring
        this.prev = null;
        this.next = null;

        // z-order curve value
        this.z = 0;

        // previous and next nodes in z-order
        this.prevZ = null;
        this.nextZ = null;

        // indicates whether this is a steiner point
        this.steiner = false;

    }

    function signedArea(data, start, end, dim) {

        let sum = 0;
        for (let i = start, j = end - dim; i < end; i += dim) {

            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;

        }

        return sum;

    }

    //------------------------------------------


    function ShapeUtils_triangulateShape(contour, holes) {

        const vertices = []; // flat array of vertices like [ x0,y0, x1,y1, x2,y2, ... ]
        const holeIndices = []; // array of hole indices
        const faces = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

        removeDupEndPts(contour);
        addContour(vertices, contour);

        //

        let holeIndex = contour.length;

        holes.forEach(removeDupEndPts);

        for (let i = 0; i < holes.length; i++) {

            holeIndices.push(holeIndex);
            holeIndex += holes[i].length;
            addContour(vertices, holes[i]);

        }

        //

        const triangles = Earcut_triangulate(vertices, holeIndices);

        //

        for (let i = 0; i < triangles.length; i += 3) {

            faces.push(triangles.slice(i, i + 3));

        }

        return faces;

    }


    // Characters [].:/ are reserved for track binding syntax.
    const _RESERVED_CHARS_RE = '\\[\\]\\.:\\/';
    const _reservedRe = new RegExp('[' + _RESERVED_CHARS_RE + ']', 'g');

    function PropertyBinding_sanitizeNodeName(name) {

        return name.replace(/\s/g, '_').replace(_reservedRe, '');

    }

})();

