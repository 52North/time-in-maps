/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
* license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.LayerSwitcher
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.UgandaLayerSwitcher = OpenLayers.Class(OpenLayers.Control.LayerSwitcher, {

    /**
     * Property: activeColor
     * {String}
     */
    activeColor : "white",

    /**
     * Property: layerStates
     * {Array(Object)} Basically a copy of the "state" of the map's layers
     *     the last time the control was drawn. We have this in order to avoid
     *     unnecessarily redrawing the control.
     */
    layerStates : null,

    /**
     * Property: useLegendGraphics
     */
    useLegendGraphics : false,

    // DOM Elements

    /**
     * Property: layersDiv
     * {DOMElement}
     */
    layersDiv : null,

    /**
     * Property: baseLayersDiv
     * {DOMElement}
     */
    baseLayersDiv : null,

    /**
     * Property: baseLayers
     * {Array(<OpenLayers.Layer>)}
     */
    baseLayers : null,

    /**
     * Property: dataLayersDiv
     * {DOMElement}
     */
    dataLayersDiv : null,

    /**
     * Property: dataLayers
     * {Array(<OpenLayers.Layer>)}
     */
    dataLayers : null,

    /**
     * Property: activeLayer
     */
    activeLayer : null,

    /**
     * Property: minimizeDiv
     * {DOMElement}
     */
    minimizeDiv : null,

    /**
     * Property: maximizeDiv
     * {DOMElement}
     */
    maximizeDiv : null,

    /**
     * APIProperty: ascending
     * {Boolean}
     */
    ascending : true,

    /**
     * Constructor: OpenLayers.Control.LayerSwitcher
     *
     * Parameters:
     * options - {Object}
     */
    initialize : function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.layerStates = [];
    },

    /**
     * APIMethod: destroy
     */
    destroy : function() {

        OpenLayers.Event.stopObservingElement(this.div);

        //OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        //OpenLayers.Event.stopObservingElement(this.maximizeDiv);

        //clear out layers info and unregister their events
        this.clearLayersArray("base");
        this.clearLayersArray("data");

        this.map.events.un({
            "addlayer" : this.redraw,
            "changelayer" : this.redraw,
            "removelayer" : this.redraw,
            "changebaselayer" : this.redraw,
            scope : this
        });

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: setMap
     *
     * Properties:
     * map - {<OpenLayers.Map>}
     */
    setMap : function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.on({
            "addlayer" : this.redraw,
            "changelayer" : this.redraw,
            "removelayer" : this.redraw,
            "changebaselayer" : this.redraw,
            scope : this
        });
    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the
     *     switcher tabs.
     */
    draw : function() {
        OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // set mode to minimize
        if (!this.outsideViewport) {
            this.minimizeControl();
        }

        // populate div with current info
        this.redraw();

        return this.div;
    },

    /**
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     *
     * Parameters:
     * layersType - {String}
     */
    clearLayersArray : function(layersType) {
        var layers = this[layersType + "Layers"];
        if (layers) {
            for (var i = 0, len = layers.length; i < len; i++) {
                var layer = layers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
        this[layersType + "LayersDiv"].innerHTML = "";
        this[layersType + "Layers"] = [];
    },

    /**
     * Method: checkRedraw
     * Checks if the layer state has changed since the last redraw() call.
     *
     * Returns:
     * {Boolean} The layer state changed since the last redraw() call.
     */
    checkRedraw : function() {
        var redraw = false;
        if (!this.layerStates.length || (this.map.layers.length != this.layerStates.length)) {
            redraw = true;
        } else {
            for (var i = 0, len = this.layerStates.length; i < len; i++) {
                var layerState = this.layerStates[i];
                var layer = this.map.layers[i];
                if ((layerState.name != layer.name) || (layerState.inRange != layer.inRange) || (layerState.id != layer.id) || (layerState.visibility != layer.visibility) || (layerState.description != layer.description)) {
                    //when add new property here, that property needs to be added in redraw function (this.layerStates[i] = {...
                    redraw = true;
                    break;
                }
            }
        }
        return redraw;
    },

    /**
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */
    redraw : function() {
        //if the state hasn't changed since last redraw, no need
        // to do anything. Just return the existing div.

        if (!this.checkRedraw()) {
            return this.div;
        }

        //clear out previous layers
        this.clearLayersArray("base");
        this.clearLayersArray("data");

        var containsOverlays = false;
        var containsBaseLayers = false;

        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i = 0; i < len; i++) {
            var layer = this.map.layers[i];
            this.layerStates[i] = {
                'name' : layer.name,
                'visibility' : layer.visibility,
                'inRange' : layer.inRange,
                'id' : layer.id,
                'description' : layer.description
            };
        }
        //alert('ds LS');

        var layers = this.map.layers.slice();
        if (!this.ascending) {
            layers.reverse();
        }
        for (var i = 0, len = layers.length; i < len; i++) {

            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;
            
            // FIXME: adding the second AND-statement (necessary for displaying the cholera cases as a wfs in the layer switcher) leads to 
            // a not-working selectLatitude feature, and i don't know why 
            if ((layer.displayInLayerSwitcher && !layer.isVector) || (layer.displayInLayerSwitcher && layer.name == 'cholera_uploaded')) {

                if (baseLayer) {
                    containsBaseLayers = true;
                    //layer.displayInLayerSwitcher=false;
                } else {
                    containsOverlays = true;
                }

                // only check a baselayer if it is *the* baselayer, check data
                // layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer) : layer.getVisibility();

                var layerWrapper = document.createElement("div");
                //layerWrapper.style.margin = "8px 0px 8px 4px";
                layerWrapper.style.margin = "2px 0px 2px 1px";
                layerWrapper.id = "layer_" + layer.id;

                // create input element
                var inputElem = document.createElement("input");
                inputElem.id = this.id + "_input_" + layer.name;
                inputElem.name = (baseLayer) ? "baseLayers" : layer.name;
                inputElem.type = (baseLayer) ? "radio" : "checkbox";
                inputElem.value = layer.name;
                inputElem.checked = checked;
                inputElem.defaultChecked = checked;
                if (checked == true) {
                    inputElem.alt = "hide the layer";
                    inputElem.title = "hide the layer";
                } else {
                    inputElem.alt = "show the layer";
                    inputElem.title = "show the layer";
                }

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }

                // create the label span
                var labelSpan = document.createElement("div");
                if (!baseLayer && !layer.inRange) {
                    labelSpan.style.color = "gray";
                }

                if (layer.queryable) {
                    labelSpan.style.cursor = "pointer";
                }
                //BRGM need to find a better way to give title to the HeapMap layer
                if (layer.name.indexOf('Heatmap') != -1)
                    labelSpan.innerHTML = layer.name;
                else
                    labelSpan.innerHTML = layer.title;
                labelSpan.style.display = "block";
                labelSpan.style.width = "100%";
                //labelSpan.style.padding = "0px 0px 0px 1px";
                labelSpan.style.verticalAlign = (baseLayer) ? "bottom" : "baseline";

                //ABSTRACT
                var abstractDiv = document.createElement("div");
                abstractDiv.style.display = "none";
                abstractDiv.style.borderTop = "dashed 1px";
                abstractDiv.id = "abstract_" + layer.id;

                var abstractTitle = document.createElement("span");
                abstractTitle.style.fontWeight = 'bold';
                abstractTitle.innerHTML = 'Abstract : ';

                var abstractSpan = document.createElement("span");
                abstractSpan.innerHTML = layer.description;
                abstractSpan.style.fontWeight = "normal";
                abstractSpan.style.fontSize = "11px";

                abstractDiv.appendChild(abstractTitle);
                abstractDiv.appendChild(abstractSpan);

                if (layer.dataURL) {
                    var dataUrlLink = document.createElement("a");
                    dataUrlLink.style.cursor = "pointer";
                    dataUrlLink.style.display = "inline-block";
                    dataUrlLink.alt = "download";
                    dataUrlLink.title = "download";
                    dataUrlLink.innerHTML = '<img src="' + OpenLayers.Util.getImagesLocation() + 'download.png" style="border: none;" />';

                    var dataUrlLinkContext = {
                        'url' : layer.dataURL
                    };

                    OpenLayers.Event.observe(dataUrlLink, "click", OpenLayers.Function.bindAsEventListener(this.onDataUrlClick, dataUrlLinkContext));
                }

                if (layer.metadataURL) {
                    var metadataUrlLink = document.createElement("a");
                    metadataUrlLink.style.cursor = "pointer";
                    metadataUrlLink.style.display = "inline-block";
                    metadataUrlLink.style.margin = "5px 0px 0px 0px";
                    metadataUrlLink.alt = "metadata";
                    metadataUrlLink.title = "metadata";
                    metadataUrlLink.innerHTML = '<img src="' + OpenLayers.Util.getImagesLocation() + 'metadata.png" style="border: none;" />';

                    var metadataUrlLinkContext = {
                        'url' : layer.metadataURL
                    };

                    OpenLayers.Event.observe(metadataUrlLink, "click", OpenLayers.Function.bindAsEventListener(this.onMetadataUrlClick, metadataUrlLinkContext));

                    abstractToolbarSpan.appendChild(metadataUrlLink);
                }

                // create the title div
                var titleDiv = document.createElement("div");
                titleDiv.id = "title_" + layer.id;

                if (this.activeLayer == layer.id) {
                    titleDiv.style.backgroundColor = "#FFF";
                    titleDiv.style.border = "solid 1px #999";
                } else {
                    /* titleDiv.style.backgroundColor = "#e1e1e1";
                     titleDiv.style.border = "solid 1px #e1e1e1";*/
                    titleDiv.style.backgroundColor = "#FFFFFF";
                    if (layer.layerType == 'health') {
                        titleDiv.style.border = "solid 2px #a0a0a0";
                    } else if (layer.layerType == 'environment') {
                        titleDiv.style.border = "solid 2px #dfdfdf";
                    } else {
                        titleDiv.style.border = "solid 2px #808080";
                    }

                }

                titleDiv.style.width = "100%";
                titleDiv.style.padding = "2px";
                titleDiv.style.position = "relative";

                // create the layer operation panel
                var buttonSpan = document.createElement("span");
                buttonSpan.style.padding = "3px 3px 3px 0";

                // remove control
                /* var removeButton = document.createElement("img");
                removeButton.src = OpenLayers.Util.getImagesLocation() + "del.png";
                removeButton.style.cursor = "pointer";
                removeButton.alt = "remove layer";
                removeButton.title = "remove layer";*/

                // layer order controls
                var upButton = document.createElement("img");
                upButton.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/moveup.png";
                upButton.style.cursor = "pointer";
                upButton.alt = "move layer up";
                upButton.title = "move layer up";
                upButton.style.paddingLeft = "5px";
                upButton.style.paddingRight = "5px";

                var downButton = document.createElement("img");
                downButton.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/movedown.png";
                downButton.style.cursor = "pointer";
                downButton.alt = "move layer down";
                downButton.title = "move layer down";
                downButton.style.paddingLeft = "5px";
                downButton.style.paddingRight = "5px";

                // set the default opacity
                layer.setOpacity(layer.opacity);

                var opacitySlider = document.createElement("div");
                opacitySlider.setAttribute("id", "slider_" + layer.id);
                opacitySlider.style.width = "50px";
                opacitySlider.style.display = "inline-block";
                opacitySlider.style.cursor = "pointer";
                opacitySlider.alt = "change layer opacity";
                opacitySlider.title = "change layer opacity";

                var abstractButton = document.createElement("img");
                abstractButton.setAttribute("id", "abstractButton_" + layer.id);
                abstractButton.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/bloc_closed.png";
                abstractButton.style.cursor = "pointer";
                abstractButton.style.position = "absolute";
                abstractButton.style.top = "0";
                abstractButton.style.right = "0";
                abstractButton.alt = "view layer details";
                abstractButton.title = "view layer details";

                var context = {
                    'layer' : layer,
                    'inputElem' : inputElem,
                    'titleDiv' : titleDiv,
                    'layerSwitcher' : this
                };

                OpenLayers.Event.observe(inputElem, "mouseup", OpenLayers.Function.bindAsEventListener(this.onInputClick, context));

                /* if(layer.queryable) {

                 var queryableButton = document.createElement("img");
                 queryableButton.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/queryable.png";
                 queryableButton.style.cursor = "pointer";
                 queryableButton.alt = "select for query";
                 queryableButton.title = "select for query";

                 OpenLayers.Event.observe(labelSpan, "click",
                 OpenLayers.Function.bindAsEventListener(this.onTitleClick, context)
                 );

                 OpenLayers.Event.observe(queryableButton, "click",
                 OpenLayers.Function.bindAsEventListener(this.onTitleClick, context)
                 );
                 }*/

                OpenLayers.Event.observe(upButton, "click", OpenLayers.Function.bindAsEventListener(this.onUpClick, context));

                OpenLayers.Event.observe(downButton, "click", OpenLayers.Function.bindAsEventListener(this.onDownClick, context));

                /*OpenLayers.Event.observe(removeButton, "click",
                 OpenLayers.Function.bindAsEventListener(this.onRemoveClick, context)
                 );*/

                var abstractContext = {
                    'layer' : layer,
                    'button' : abstractButton
                };
                OpenLayers.Event.observe(abstractButton, "mouseup", OpenLayers.Function.bindAsEventListener(this.toggleAbstract, abstractContext));

                var groupArray = (baseLayer) ? this.baseLayers : this.dataLayers;
                groupArray.push({
                    'layer' : layer,
                    'inputElem' : inputElem,
                    'titleDiv' : titleDiv,
                    'labelSpan' : labelSpan
                });

                var groupDiv = (baseLayer) ? this.baseLayersDiv : this.dataLayersDiv;

                groupDiv.appendChild(layerWrapper);
                layerWrapper.appendChild(titleDiv);

                titleDiv.appendChild(inputElem);
                titleDiv.appendChild(buttonSpan);

                //if (baseLayer){
                buttonSpan.appendChild(upButton);
                buttonSpan.appendChild(downButton);
                //buttonSpan.appendChild(removeButton);
                //buttonSpan.appendChild(opacityMinusButton);
                //opacitySpan.appendChild(opacityImg);
                //buttonSpan.appendChild(opacitySpan);
                //opacitySpan.appendChild(opacitySlider);
                //buttonSpan.appendChild(opacitySpan);
                buttonSpan.appendChild(opacitySlider);
                //buttonSpan.appendChild(opacityTextInput);
                //buttonSpan.appendChild(opacityPlusButton);
                //}

                if (layer.description) {
                    titleDiv.appendChild(abstractButton);
                }
                /* if(layer.queryable) {
                 buttonSpan.appendChild(queryableButton);
                 }*/
                if (layer.dataURL) {
                    buttonSpan.appendChild(dataUrlLink);
                }

                titleDiv.appendChild(labelSpan);
                titleDiv.appendChild(abstractDiv);

                //TIME DIMENSION
                if (layer.timeStart) {
                    var timeDimDiv = document.createElement('div');

                    var timeDimTitle = document.createElement('span');
                    timeDimTitle.innerHTML = "Time Dimension :<br>";
                    timeDimTitle.style.fontWeight = 'bold';

                    var timeStart = document.createElement('span');
                    timeStart.innerHTML = "Start : " + layer.timeStart;
                    var timeEnd = document.createElement('span');
                    timeEnd.innerHTML = "End : " + layer.timeEnd;
                    timeEnd.style.cssFloat = 'right';

                    var timeStep = document.createElement('span');
                    timeStep.innerHTML = "<br>Time resolution : " + layer.timeStep;

                    var currentTime = document.createElement('span');
                    currentTime.innerHTML = "<br>Displayed period : ";
                    currentTime.style.fontWeight = 'bold';
                    var currentTimeValue = document.createElement('span');
                    currentTimeValue.id = "time_" + layer.id;

                    timeDimDiv.appendChild(timeDimTitle);
                    timeDimDiv.appendChild(timeStart);
                    timeDimDiv.appendChild(timeEnd);
                    timeDimDiv.appendChild(timeStep);
                    timeDimDiv.appendChild(currentTime);
                    timeDimDiv.appendChild(currentTimeValue);
                    abstractDiv.appendChild(timeDimDiv);

                }

                /*if(this.useLegendGraphics) {
                 var legendGraphicURL = layer.getFullRequestString({
                 REQUEST: "GetLegendGraphic",
                 LAYER: layer.params.LAYERS,
                 FORMAT: "image/png",
                 WIDTH: "150"});

                 var imgSpan = document.createElement('span');
                 imgSpan.innerHTML = "<img style=\"display:none\" src=\"" + legendGraphicURL + "\" onload=\"this.style.display = 'inline'\" alt=\"\" onerror=\"this.src='" + OpenLayers.Util.getImagesLocation() + "blank.gif" + "'\" />";
                 layerWrapper.appendChild(imgSpan);
                 }*/

                if (layer.legendURL) {
                    //display legend in the east Panel
                    this.displayLegend(layer);

                    //display legend in the LayerSwitcher
                    var legendDiv = document.createElement('div');

                    var legendTitle = document.createElement('span');
                    legendTitle.innerHTML = "Legend : ";
                    legendTitle.style.fontWeight = 'bold';
                    legendTitle.style.verticalAlign = 'top';

                    var legendImg = document.createElement('span');
                    legendImg.innerHTML = "<img style=\"display:none\" src=\"" + layer.legendURL + "\" onload=\"this.style.display = 'inline'\" alt=\"\" onerror=\"this.src='" + OpenLayers.Util.getImagesLocation() + "blank.gif" + "'\" />";

                    legendDiv.appendChild(legendTitle);
                    legendDiv.appendChild(legendImg);
                    abstractDiv.appendChild(legendDiv);

                }

            }

        }
        Ext.onReady(function() {
            for (var i = map.layers.length - 1; i > 1; i--) {
                if (!map.layers[i].isVector) {

                    if (Ext.getCmp("opacityImg_" + map.layers[i].id))
                        Ext.getCmp("opacityImg_" + map.layers[i].id).destroy();

                    var slider = new Ext.slider.Single({
                        //Ext.create('Ext.slider.Single', {
                        animate : false,
                        hideLabel : true,
                        renderTo : 'slider_' + map.layers[i].id,
                        id : "opacityImg_" + map.layers[i].id,
                        width : 70,
                        value : map.layers[i].opacity * 100,
                        minValue : 0,
                        maxValue : 100,
                        listeners : {
                            change : {
                                fn : function(slide, newValue) {
                                    var idLayer = slide.id.substring(slide.id.indexOf('_') + 1, slide.id.length);
                                    map.getLayer(idLayer).setOpacity(newValue / 100);
                                }
                            },
                            changeComplete : {
                                fn : function() {
                                    //alert("test");
                                }
                            }
                        },
                        tipText : function(thumb) {
                            return Ext.String.format('<b>{0}%</b>', thumb.value);
                        }
                    });

                    /*slider.on('change', function(slide, newValue){
                     var idLayer = slide.id.substring(slide.id.indexOf('_')+1, slide.id.length);
                     map.getLayer(idLayer).setOpacity(newValue/100);
                     });*/
                }

            }
        });
        return this.div;

    },

    displayLegend : function(layer) {
        var display = OpenLayers.Util.getElement("legend");
        var legendExist = OpenLayers.Util.getElement("legend_" + layer.id);
        if (display && !legendExist) {
            display.innerHTML += "<div id=\"legend_" + layer.id + "\" style=\"border-top:dashed 2px;\">" + layer.title + "<br><img style=\"display:none\" src=\"" + layer.legendURL + "\" onload=\"this.style.display = 'inline'\" alt=\"\" onerror=\"this.src='" + OpenLayers.Util.getImagesLocation() + "blank.gif" + "'\" /><br></div>";
        }
    },

    /**
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     *
     * Parameters:
     * e - {Event}
     *
     * Context:
     *  - {DOMElement} inputElem
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     *  - {<OpenLayers.Layer>} layer
     */

    onInputClick : function(e) {

        if (!this.inputElem.disabled) {
            if (this.inputElem.type == "radio") {
                this.inputElem.checked = true;
                this.layer.map.setBaseLayer(this.layer);

            } else {
                this.inputElem.checked = !this.inputElem.checked;

                layerSwitcherLayerClick = true;
                this.layerSwitcher.updateMap();
                updateServicesLayersConfigUserClick(this.layer);
                if (gfiWindow && !gfiWindow.hidden)
            		getFeatureInfo(null);
            }
        }

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: onRemoveClick
     * Remove the layer from the map
     *
     * Parameters:
     * e - {Event}
     */
    onRemoveClick : function(e) {
        map.removeLayer(this.layer);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: onDownClick
     * Set the layer position down one level
     *
     * Parameters:
     * e - {Event}
     */
    onDownClick : function(e) {
        map.raiseLayer(this.layer, -1);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: onUpClick
     * Set the layer position up one level
     *
     * Parameters:
     * e - {Event}
     */
    onUpClick : function(e) {
        map.raiseLayer(this.layer, 1);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: onTitleClick
     * Set the active layer
     *
     * Parameters:
     * e - {Event}
     */
    onTitleClick : function(e) {
        var id = this.layer.id;

        layerSwitcher.activeLayer = id;

        for (var i = 0; i < map.layers.length; i++) {
            var layer = map.layers[i];

            if (id == layer.id) {
                this.titleDiv.style.backgroundColor = "#999";
                this.titleDiv.style.border = "solid 1px #999";
            } else {
                var div = OpenLayers.Util.getElement("title_" + layer.id);

                if (div) {
                    div.style.backgroundColor = "#e1e1e1";
                    div.style.border = "solid 1px #e1e1e1";
                }
            }
        }

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    toggleAbstract : function(e) {
        var span = OpenLayers.Util.getElement("abstract_" + this.layer.id);
        var button = this.button;

        if (span && button) {
            var display = span.style.display;

            if (display == "block") {
                span.style.display = "none";
                button.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/bloc_closed.png";
            } else {
                span.style.display = "block";
                button.src = OpenLayers.Util.getImagesLocation() + "layerswitcher/bloc_opened.png";
            }
        }

    },

    /**
     * Method: onDataUrlClick
     * Open new window and redirect to URL.
     *
     * Parameters:
     * e - {Event}
     *
     * Context:
     *  - {string} url to redirect to
     */
    onDataUrlClick : function(e) {
        window.open(this.url, "data", "width=550,height=350,status=yes,scrollbars=yes,resizable=yes");
    },

    /**
     * Method: onMetadataUrlClick
     * Open new window and redirect to URL.
     *
     * Parameters:
     * e - {Event}
     *
     * Context:
     *  - {string} url to redirect to
     */
    onMetadataUrlClick : function(e) {
        window.open(this.url, "metadata", "width=550,height=350,status=yes,scrollbars=yes,resizable=yes");
    },

    /**
     * Method: onLayerClick
     * Need to update the map accordingly whenever user clicks in either of
     *     the layers.
     *
     * Parameters:
     * e - {Event}
     */
    onLayerClick : function(e) {
        this.updateMap();
    },

    /**
     * Method: changeLayerOpacity
     * Changes opacity of a given layer for a given delta
     *
     * Parameters:
     * e - {Event}
     *
     * Context:
     *  - {string} amount to increase or decrease opacity value
     *  - {<OpenLayers.Layer>} layer
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     */
    changeLayerOpacity : function(e) {
        var maxOpacity = 1.0;
        var minOpacity = 0.1;
        var opacity = (this.layer.opacity != null) ? this.layer.opacity : 1.0;
        var i = parseFloat(this.byOpacity);
        var opacityElement = "opacity_" + this.layer.id;
        var opacityImg = "opacityImg_" + this.layer.id;
        var newOpacity = (parseFloat(opacity + i)).toFixed(1);

        newOpacity = Math.min(maxOpacity, Math.max(minOpacity, newOpacity));

        OpenLayers.Util.getElement(opacityElement).value = newOpacity;
        OpenLayers.Util.getElement(opacityImg).width = (newOpacity * 23).toFixed(0);

        this.layer.setOpacity(newOpacity);
    },

    /**
     * Method: updateMap
     * Cycles through the loaded data and base layer input arrays and makes
     *     the necessary calls to the Map object such that that the map's
     *     visual state corresponds to what the user has selected in
     *     the control.
     */
    updateMap : function() {
        // set the newly selected base layer
        for (var i = 0, len = this.baseLayers.length; i < len; i++) {
            var layerEntry = this.baseLayers[i];
            if (layerEntry.inputElem.checked) {
                this.map.setBaseLayer(layerEntry.layer, false);
            }
        }

        // set the correct visibilities for the overlays
        for (var i = 0, len = this.dataLayers.length; i < len; i++) {
            var layerEntry = this.dataLayers[i];
            layerEntry.layer.setVisibility(layerEntry.inputElem.checked);
        }
    },

    /**
     * Method: maximizeControl
     * Set up the labels and divs for the control
     *
     * Parameters:
     * e - {Event}
     */
    maximizeControl : function(e) {
        this.div.style.width = "20em";
        this.div.style.height = "100%";
        this.div.style.borderLeft = "solid 1px #999";

        this.showControls(false);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size,
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event}
     */
    minimizeControl : function(e) {
        this.div.style.width = "0px";
        this.div.style.height = "100%";
        this.div.style.borderLeft = "none";

        this.showControls(true);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: showControls
     * Hide/Show all LayerSwitcher controls depending on whether we are
     *     minimized or not
     *
     * Parameters:
     * minimize - {Boolean}
     */
    showControls : function(minimize) {

        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";

        this.layersDiv.style.display = minimize ? "none" : "";
    },

    /**
     * Method: loadContents
     * Set up the labels and divs for the control
     */
    loadContents : function() {

        //configure main div
        //this.div.style.position = "absolute";
        this.div.style.top = "0px";
        this.div.style.right = "0px";
        this.div.style.left = "";
        this.div.style.fontFamily = "sans-serif";
        this.div.style.fontWeight = "bold";
        this.div.style.fontSize = "11px";
        this.div.style.color = "#333";
        this.div.style.backgroundColor = this.activeColor;
        //this.div.style.height = "86%";

        /*  OpenLayers.Event.observe(this.div, "mouseup",
        OpenLayers.Function.bindAsEventListener(this.mouseUp, this));
        OpenLayers.Event.observe(this.div, "click",
        this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "mousedown",
        OpenLayers.Function.bindAsEventListener(this.mouseDown, this));
        OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);
        */
        // layers list div
        this.layersDiv = document.createElement("div");
        //this.layersDiv.setAttribute("className", "olLayerSwitcherLayerContainer");
        this.layersDiv.id = this.id + "_layersDiv";
        this.layersDiv.style.overflowX = "hidden";
        //this.layersDiv.style.overflowY = "scroll";
        this.layersDiv.style.position = "relative";
        this.layersDiv.style.height = "100%";
        this.layersDiv.style.width = "100%";

        this.layersDiv.style.fontSize = "11px";

        // ignore any mousewheel events
        OpenLayers.Event.observe(this.layersDiv, "mousewheel", this.ignoreEvent);

        // had to set width/height to get transparency in IE to work.

        this.baseLayersDiv = document.createElement("div");
        //this.baseLayersDiv.style.display = "none";
        this.dataLayersDiv = document.createElement("div");
        //this.dataLayersDiv.style.paddingLeft = "5px";

        this.layersDiv.appendChild(this.baseLayersDiv);
        //ATA
        this.layersDiv.appendChild(this.dataLayersDiv);

        this.div.appendChild(this.layersDiv);
        //OpenLayers.Rico.Corner.changeOpacity(this.layersDiv, 0.95);

        /* var imgLocation = OpenLayers.Util.getImagesLocation();
         var sz = new OpenLayers.Size(20,60);

         // maximize button div
         var img = imgLocation + 'layer-switcher-maximize2.png';
         this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
         "OpenLayers_Control_MaximizeDiv",
         null,
         sz,
         img,
         "absolute");
         this.maximizeDiv.style.top = "50%";
         this.maximizeDiv.style.marginTop = "-30px";
         this.maximizeDiv.style.right = "0px";
         this.maximizeDiv.style.left = "";
         this.maximizeDiv.style.display = "none";
         OpenLayers.Event.observe(this.maximizeDiv, "click",
         OpenLayers.Function.bindAsEventListener(this.maximizeControl, this)
         );

         this.div.appendChild(this.maximizeDiv);
         //OpenLayers.Rico.Corner.changeOpacity(this.maximizeDiv, 0.95);

         // minimize button div
         var img = imgLocation + 'layer-switcher-minimize2.png';
         var sz = new OpenLayers.Size(20,60);
         this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
         "OpenLayers_Control_MinimizeDiv",
         null,
         sz,
         img,
         "absolute");
         this.minimizeDiv.style.top = "50%";
         this.minimizeDiv.style.marginTop = "-30px";
         this.minimizeDiv.style.right = "258px";
         this.minimizeDiv.style.left = "";
         OpenLayers.Event.observe(this.minimizeDiv, "click",
         OpenLayers.Function.bindAsEventListener(this.minimizeControl, this)
         );

         this.div.appendChild(this.minimizeDiv);
         //OpenLayers.Rico.Corner.changeOpacity(this.minimizeDiv, 0.95);
         */

    },

    /**
     * Method: ignoreEvent
     *
     * Parameters:
     * evt - {Event}
     */
    ignoreEvent : function(evt) {
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: mouseDown
     * Register a local 'mouseDown' flag so that we'll know whether or not
     *     to ignore a mouseUp event
     *
     * Parameters:
     * evt - {Event}
     */
    mouseDown : function(evt) {
        this.isMouseDown = true;
        this.ignoreEvent(evt);
    },

    /**
     * Method: mouseUp
     * If the 'isMouseDown' flag has been set, that means that the drag was
     *     started from within the LayerSwitcher control, and thus we can
     *     ignore the mouseup. Otherwise, let the Event continue.
     *
     * Parameters:
     * evt - {Event}
     */
    mouseUp : function(evt) {
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.ignoreEvent(evt);
        }
    },

    CLASS_NAME : "OpenLayers.Control.UgandaLayerSwitcher"
});
