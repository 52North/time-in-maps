var server_pollution = "http://time2maps.dyndns.org/cgi-bin/saxony_air_pollution_static?";
var server_risk = "http://time2maps.dyndns.org/cgi-bin/saxony_risk_static?";
var server_osm_background = "http://141.30.100.177:8080/service";

//var server = "http://time2maps.dyndns.org/cgi-bin/saxony_air_pollution";

var capabilities;
var host = "http://time2maps.dyndns.org/saxony";

var timeWindow, hilites, layers;

var hilightProcess = false;
var evnt;
var popup_array = new Array();

OpenLayers.ImgPath = "./resources/libs/ol/img/";
OpenLayers.ThemePath = "./resources/libs/ol/img/";

Ext.Date.patterns = {
    ISO8601Long : "Y-m-d H:i:s",
    ISO8601Short : "Y-m-d",
    ShortDate : "n/j/Y",
    LongDate : "l, F d, Y",
    FullDateTime : "l, F d, Y g:i:s A",
    MonthDay : "F d",
    ShortTime : "g:i A",
    LongTime : "g:i:s A",
    SortableDateTime : "Y-m-d\\TH:i:s",
    UniversalSortableDateTime : "Y-m-d H:i:sO",
    YearMonth : "Y-m",
    WeekYear : "W/Y",
    WeekOnly : "W",
    YearMonthDay : "Y-m-d",
    YearMonthDayWeekday : "l, Y-m-d",
    YearOnly : "Y"
};

var initTimeSliderDate = new Date('2003-01-04');

var tabServices = [
    {
        url : server_pollution,
        layers : [
            'pm10',
            'o3',
            'temp'
        ],
        visibility : [
            true,
            false,
            false
        ],
        type : "environment",
        ogcType : "wms",
        style : "default",
        time : [
            'all_images',
            'all_images',
            'all_images'
        ]
    },
    {
        url : server_risk,
        layers : [
            'asthma',
            'angina',
            'ihd',
            'bronchitis',
            'who'     
        ],
        visibility : [
            false,
            false,
            false,
            false,
            false
        ],
        type : "health",
        ogcType : "wms",
        style : "default",
        time : [
            'all_images',
            'all_images',
            'all_images',
            'all_images',
            'all_images'
        ]
    }

];

var tabTemporalResolution = {
    "P7D" : "weekly",
    "P1M" : "monthly",
    "P1Y" : "yearly",
    "P1D" : "daily"
};

var init = function(div) {
	OpenLayers.ProxyHost = "http://time2maps.dyndns.org/cgi-bin/proxy.cgi?url=";
	var myDivName = Ext.get(div).dom.childNodes[0].id;
	map = new OpenLayers.Map({
	    projection : new OpenLayers.Projection("EPSG:3035"),
	    div : myDivName,
	    units : "m",
	    minResolution : "auto",
	    maxResolution : "auto",
	    numZoomLevels : 6,
	    // maxExtent : new OpenLayers.Bounds(4453511, 3009211, 4672492, 3200000)
	    maxExtent : new OpenLayers.Bounds(4453511, 2998000, 4672492, 3188000)
	});
	
	map.addControl(new OpenLayers.Control.LoadingPanel());
	
	var format = new OpenLayers.Format.WMSCapabilities({
		version : "1.3.0"
	});
	
	layers = new Array();
	layers[0] = new OpenLayers.Layer.WMS("saxony_boundaries", server_osm_background, {
	    'layers' : 'OSMBackground',
	    transparent : true,
	    format : 'image/png'
	}, {
	    isBaseLayer : true,
	    singleTile : true,
	    displayInLayerSwitcher : false,
	    ratio : 1,
	    transitionEffect : 'resize'
	});
	layers[1] = new OpenLayers.Layer.WMS("saxony_boundaries", server_pollution, {
	    'layers' : 'saxony_boundaries',
	    transparent : true,
	    format : 'image/png'
	}, {
	    isBaseLayer : false,
	    singleTile : true,
	    displayInLayerSwitcher : false,
	    ratio : 1,
	    transitionEffect : 'resize'
	});
	
	var numLayer = 2;
	for ( var i = 0; i < tabServices.length; i++) {
		for ( var j = 0; j < tabServices[i].layers.length; j++) {
			layers[numLayer] = new OpenLayers.Layer.WMS(tabServices[i].layers[j], tabServices[i].url, {
			    'layers' : tabServices[i].layers[j],
			    transparent : true,
			    format : 'image/png',
			    style : tabServices[i].style
			}, {
			    isBaseLayer : false,
			    singleTile : true,
			    opacity : 1.0,
			    ratio : 1,
			    transitionEffect : 'resize',
			    layerType : tabServices[i].type,
			    visibility : tabServices[i].visibility[j],
			});
			numLayer++;
		}
	}
	
	map.addLayers(layers);
	
	var OLSwitcher = new OpenLayers.Control.UgandaLayerSwitcher({
	    'div' : OpenLayers.Util.getElement('layerSwitcherCustom'),
	    'ascending' : false
	});
	
	map.addControl(OLSwitcher);
	
	map.zoomToMaxExtent();
	// ////////////GETCAPABILITIES////////////////////////////////////////////
	for ( var k = tabServices.length - 1; k >= 0; k--) {
		var serviceURL = tabServices[k].url;
		OpenLayers.Request.GET({
		    url : tabServices[k].url,
		    params : {
		        SERVICE : "WMS",
		        VERSION : "1.3.0",
		        REQUEST : "GetCapabilities"
		    },
		    success : function(request) {
			    
			    var doc = request.responseXML;
			    if (!doc || !doc.documentElement) {
				    doc = request.responseText;
			    }
			    capabilities = format.read(doc);
			    var layersProperties = capabilities.capability.layers;
			    
			    for ( var i = 0; i < layersProperties.length; i++) {
				    if (layersProperties[i].name && layersProperties[i].name != "") {
					    for ( var j = 1; j < layers.length; j++) {
						    if (map.layers[j].name.indexOf(layersProperties[i].name) != -1) {
							    if (map.layers[j].id.indexOf("WMS") == -1)
								    map.layers[j].opacity = 1;
							    map.layers[j].title = layersProperties[i].title;
							    map.layers[j].description = layersProperties[i].abstract;
							    map.layers[j].queryable = layersProperties[i].queryable;
							    if (layersProperties[i].dimensions.time) {
								    layersProperties[i].dimensions.time.values[0] = layersProperties[i].dimensions.time.values[0].trim();
								    map.layers[j].timeStart = layersProperties[i].dimensions.time.values[0].split('/')[0];
								    map.layers[j].timeEnd = layersProperties[i].dimensions.time.values[0].split('/')[1];
								    map.layers[j].timeStep = tabTemporalResolution[layersProperties[i].dimensions.time.values[0].split('/')[2]];
								    if (map.layers[j].timeEnd.length > 10) {// ATA
									    map.layers[j].timeStart = map.layers[j].timeStart.substring(0, 10);
									    map.layers[j].timeEnd = map.layers[j].timeEnd.substring(0, 10);
								    }
							    } else {
								    map.layers[j].timeStep = "NO";
							    }
							    map.layers[j].oldCurrentDate = new Date(map.layers[j].timeStart);
							    map.layers[j].visibilityUser = map.layers[j].visibility;
							    map.layers[j].serviceUrl = capabilities.capability.request.getcapabilities.href;
							    
							    if (layersProperties[i].styles.length > 0)
								    map.layers[j].legendURL = layersProperties[i].styles[0].legend.href;
						    }
					    }
				    }
			    }
			    if (allLayersLoaded()) {
				    initTimeSlider();
			    }
			    OLSwitcher.redraw();
		    },
		    failure : function(e) {
			    alert("Trouble getting capabilities ");
			    OpenLayers.Console.error.apply(OpenLayers.Console, e);
		    }
		});
		
	}
	
	var highlight_style = {
	    strokeColor : '#6e6e6e',
	    strokeOpacity : 1,
	    strokeWidth : 3,
	    fillOpacity : 0,
	    graphicZIndex : 10,
	    cursor : "pointer"
	};
	hilites = new OpenLayers.Layer.Vector("Highlighted", {
	    
	    style : highlight_style,
	    displayInLayerSwitcher : false
	});
	map.addLayer(hilites);
	
	var report = function(e) {
		OpenLayers.Console.log(e.type, e.feature.id);
	};
	
	map.addControl(new OpenLayers.Control.MousePosition());
	
	function handlerGFI(e) {
		getFeatureInfo(e);
	}
	map.events.register('click', null, handlerGFI);
	map.events.register('doubleclick', this, new OpenLayers.Control.ZoomBox());
	map.events.register('changelayer', null, function(evt) {
		// don't display legend of the hilighted layer
		// if (gfiWindow && !gfiWindow.hidden)
		// getFeatureInfo(null);
		// if(hilightProcess){hilites.destroyFeatures();}
	});
	
	Ext.get("impr_a").on('click', openLegalWindow);
	Ext.get("def_a").on('click', openDefinitionWindow);
};

var popup;
var gfiWindow;

opengfiWindow = function() {
	if (!gfiWindow) {
		var contenu = "<div id=\'gfi-win-content\' style=\'overflow:auto; padding: 10 10 10 20; height:100%; width:100%;\'>"
		    + "<div id=\"gfiLoading\" style=\"width:100%; text-align:center; display:block;\">" + "<img src=\"resources/images/loading.gif\" border=0 style=\"border:none;\"/>" + "</div>"
		    + "<div id='gfi-win-content-info'>" + "</div>" + "</div>";
		gfiWindow = new Ext.Window({
		    title : document.getElementById('gfi-win').title,
		    applyTo : 'gfi-win',
		    layout : 'fit',
		    width : 250, // ATA 20121114
		    height : 180,
		    closeAction : 'hide',
		    plain : true,
		    html : contenu,
		    resizable : false,
		    constrain : true,
		    styleHtmlContent : true,
		    listeners : {
			    beforehide : function(me, oPts) {
				    hilites.destroyFeatures();
				    return true;
			    }
		    }
		});
	}
	if (gfiWindow.hidden) {
		gfiWindow.show();
		$('gfi-win-content-info').innerHTML = '';
	}
};

var legalWindow;
openLegalWindow = function() {
	if (!legalWindow) {
		// var contenu = "<div id=\'gfi-win-content\' style=\'overflow:auto;
		// padding: 10 10 10 20; height:100%; width:100%;\'>" + "<div
		// id=\"gfiLoading\" style=\"width:100%; text-align:center;
		// display:block;\">" + "<img src=\"resources/images/loading.gif\"
		// border=0 style=\"border:none;\"/>" + "</div>" + "<div
		// id='gfi-win-content-info'>" + "</div>" + "</div>";
		var impr_text = "The <a href='http://tu-dresden.de/impressum'>legal notice of the Univerity of Dresden</a> applies with the following restriction:";
		impr_text += "<br />";
		impr_text += "<br />";
		impr_text += "<b>Contact person in case of technical problems:</b>";
		impr_text += "<br />";
		impr_text += "<br />";
		impr_text += "Daniel Kadner";
		impr_text += "<br />";
		impr_text += "Phone.: (+49) 351 46 33 35 76";
		impr_text += "<br />";
		impr_text += "E-Mail: Daniel.Kadner (at) tu-dresden (dot) de";
		impr_text += "<br />";
		legalWindow = new Ext.Window({
		    title : 'Legal notice',
		    applyTo : 'gfi-win',
		    layout : 'fit',
		    width : 400, // ATA 20121114
		    height : 180,
		    closeAction : 'hide',
		    bodyPadding : '0 0 0 30',
		    plain : true,
		    modal : true,
		    html : impr_text,
		    resizable : false,
		    constrain : true,
		    styleHtmlContent : true
		});
	}
	if (legalWindow.hidden) {
		legalWindow.show();
	}
};

var definitionWindow;
openDefinitionWindow = function() {
	if (!definitionWindow) {
		var def_text = "";
		def_text += "<div><b>Deutsch</b></div>";
		def_text += "<ul>";
		def_text += "<li><i>LOD</i> = Load of Disease: Durchschnittliche Anzahl der zu erwartenden ambulanten ärztlichen ICD-10 Diagnosen dieser Erkrankung pro Postleitzahl-Gebiet (kontinuierliche Skala; Wertebereich 0 bis unendlich, wobei 0 keine Diagnose bedeutet). Die Zusätze LCL und UCL kennzeichnen die jeweilige unteren und oberen Konfidenzgrenze.</li>";
		def_text += "<li><i>CI</i> = Confidence Interval: Ein Begriff aus der Statistik für die Präzision der Lageeinschätzung eines Parameters. In diesem Fall sind 95% der zu erwartenden Messungen des Parameters innerhalb des Intervalls.</i>";
		def_text += "<li><i>RR</i> = Relatives Risiko: Maß zur Quantifizierung eines Risikos, drückt aus, um welchen Faktor sich ein Risiko zwischen einer exponierten und nicht exponierten Gruppe unterscheidet (Wert 1 bedeutet keinen Unterschied). Die Zusätze LCL und UCL kennzeichnen die jeweilige unteren und oberen Konfidenzgrenze.</li>";
		def_text += "</ul>";
		def_text += "<div><b>English</b></div>";
		def_text += "<ul>";
		def_text += "<li><i>LOD</i> = Load of Disease: Average number of expected primary care ICD-10 diagnoses of the corresponding disease per postal code region (continuous scale; value range from 0 to inf., with 0 indicating no diagnosis at all). The values for LCL und UCL indicate the corresponding lower and upper conficence limit.</li>";
		def_text += "<li><i>CI</i> = Confidence Interval: A term in statics which is a type of interval estimate of a population parameter and is used to indicate the reliablity of an estimate (here 95%).</i>";
		def_text += "<li><i>RR</i> = Relative Risk: Measure for quantifying risks, expressing the ratio of probability of the event relative to exposure (Value 1 means no difference between exposition and non-exposition). The values for LCL und UCL indicate the corresponding lower and upper conficence limit.</li>";
		def_text += "</ul>";
		
		definitionWindow = new Ext.Window({
		    title : 'Definitions / Definitionen',
		    applyTo : 'gfi-win',
		    layout : 'fit',
		    width : 600, // ATA 20121114
		    height : 500,
		    closeAction : 'hide',
		    bodyPadding : '0 0 0 20',
		    plain : true,
		    modal : true,
		    html : def_text,
		    resizable : false,
		    constrain : true,
		    styleHtmlContent : true
		});
	}
	if (definitionWindow.hidden) {
		definitionWindow.show();
	}
};

var helpWindow;
openHelpWindow = function() {
	if (!helpWindow) {
		var help_img = "";
		help_img += '<img src="resources/images/Saxony_help_screen.png" alt="Help Screen for Saxony" height="456" width=786">';
		
		helpWindow = new Ext.Window({
		    title : 'Help / Introduction',
		    applyTo : 'gfi-win',
		    layout : 'fit',
		    width : 800, // ATA 20121114
		    height : 490,
		    closeAction : 'hide',
		    bodyPadding : '0 0 0 0',
		    plain : true,
		    modal : true,
		    html : help_img,
		    resizable : false,
		    constrain : true,
		    styleHtmlContent : true
		});
	}
	if (helpWindow.hidden) {
		helpWindow.show();
	}
};

function highlightFeatures(value) {
	var wfs_url = server_pollution + 'SERVICE=WFS&VERSION=1.0.0';
	var wfsurl = wfs_url + '&REQUEST=getfeature&typename=saxony_boundaries&Filter=<Filter><PropertyIsEqualTo><PropertyName>plz</PropertyName><Literal>' + value
	    + '</Literal></PropertyIsEqualTo></Filter>';
	
	OpenLayers.Request.GET({
	    url : wfsurl,
	    callback : highlight_Layer
	});
}

function highlight_Layer(response) {
	var features = new OpenLayers.Format.GML().read(response.responseText);
	hilites.destroyFeatures();
	hilites.addFeatures(features);
	hilightProcess = true;
	hilites.setVisibility(true);
}

var bool_onlyOneGFI = true;

function getFeatureInfo(event) {
	
	if (event == null) {
		$('gfi-win-content-info').innerHTML = '';
	} else {
		opengfiWindow();
	}
	document.getElementById('gfi-win-content-info').innerHTML = '<table width="100%;"><TBODY>';
	if (event != null)
		mouseLoc = (map.getControlsByClass("OpenLayers.Control.MousePosition")[0]).lastXy;
	for (i = 1; i < layers.length; i++) {
		if (map.layers[i].queryable == 1 || map.layers[i].queryable == true) {
			if (map.layers[i].visibility) {
				var url = map.layers[i].getFullRequestString({
				    REQUEST : "GetFeatureInfo",
				    EXCEPTIONS : "application/vnd.ogc.se_xml",
				    BBOX : map.getExtent().toBBOX(),
				    X : mouseLoc.x,
				    Y : mouseLoc.y,
				    INFO_FORMAT : 'text/html',
				    QUERY_LAYERS : map.layers[i].name, // map.layers[i].params.LAYERS,
				    // TIME : getCurrentDate(),
				    FEATURE_COUNT : 200,
				    WIDTH : map.size.w,
				    HEIGHT : map.size.h
				}, map.layers[i].serviceUrl);
				
				$.ajax({
				    type : "GET",
				    url : url,
				    dataType : "text",
				    success : function(text) {
					    var rx = /(^[0-9])/;
					    document.getElementById('gfi-win-content-info').innerHTML += (rx.test(text)) ? '<b><u>' + text + "</u></b><br>" : text + "<br>";
					    if (rx.test(text)) {
						    var plz = text.substring(0, text.indexOf(" "));
						    highlightFeatures(plz);
						    
						    var recordSelected = Ext.getCmp("zipName").getStore().find("name", plz);
						    // Ext.getCmp("zipName").setValue(Ext.getCmp("zipName").getStore().getAt(recordSelected).get('name'));
					    }
				    }
				});
			}
		}
	}
	stopLoadingGif();
}

function showInfo(response) {
	if (response.responseText !== "") {
		document.getElementById('gfi-win-content-info').innerHTML += response.responseText;
	}
}

function stopLoadingGif() {
	setTimeout(function() {
		document.getElementById('gfiLoading').style.display = 'none';
	}, 2500);
}

function allLayersLoaded() {
	for ( var j = 0; j < layers.length; j++) {
		if (!map.layers[j].isVector) {
			if (!map.layers[j].isBaseLayer && !map.layers[j].timeStep) {
				return false;
			}
		}
	}
	return true;
}

function getLabelsTimeSlider() {
	/**
	 * always based on the selected week
	 * 
	 * 1...Week/Year 2...selected Week: Week/Year (YYYY-mm-dd - YYYY-mm-dd)
	 * 3...YYYY-mm-dd/YYYY-mm-dd
	 */
	var tempResol = document.getElementById("temporalResolution").value;
	var d = new Date(Ext.getCmp('slider').getValue());
	var weekText = "";
	if (tempResol == "daily") {
		weekText = "selected day: " + Ext.Date.format(d, Ext.Date.patterns.YearMonthDayWeekday);
	} else if (tempResol == "weekly") {
		var d1 = new Date(d);
		d1.setDate(d.getDate() - 7);
		weekText = "selected week: " + Ext.Date.format(d, Ext.Date.patterns.WeekYear) + ": ]" + Ext.Date.format(d1, Ext.Date.patterns.YearMonthDay) + " .. "
		    + Ext.Date.format(d, Ext.Date.patterns.YearMonthDay) + "]";
	} else if (tempResol == "monthly") {
		var d1 = new Date(d);
		d1.setMonth(d.getMonth() - 1);
		weekText = "selected month: " + (d.getMonth() + 1) + ": ]" + Ext.Date.format(d1, Ext.Date.patterns.YearMonthDay) + " .. " + Ext.Date.format(d, Ext.Date.patterns.YearMonthDay) + "]";
	}
	return weekText;
}

function nextDate(temporalResolution, tdate) {
	var ndate = new Date(tdate);
	if (temporalResolution == "daily") {
		ndate.setDate(tdate.getDate() + 1);
	} else if (temporalResolution == "weekly") {
		ndate.setDate(tdate.getDate() + 7);
	} else if (temporalResolution == "monthly") {
		ndate.setMonth(tdate.getMonth() + 1);
	} else if (temporalResolution == "yearly") {
		ndate.setFullYear(tdate.getFullYear() + 1);
	}
	return ndate;
}

function endPeriod(temporalResolution, tdate) {
	var ndate = nextDate(temporalResolution, tdate);
	var t3 = new Date(ndate);
	t3.setDate(ndate.getDate() - 1);
	return t3;
}

function prevDate(temporalResolution, tdate) {
	var ndate = new Date(tdate);
	if (temporalResolution == "daily") {
		ndate.setDate(tdate.getDate() - 1);
	} else if (temporalResolution == "weekly") {
		ndate.setDate(tdate.getDate() - 7);
	} else if (temporalResolution == "monthly") {
		ndate.setMonth(tdate.getMonth() - 1);
	} else if (temporalResolution == "yearly") {
		ndate.setFullYear(tdate.getFullYear() - 1);
	}
	return ndate;
}

function initTimeSlider() {
	try {
		var startMin = new Date('2100-01-01');
		var endMax = new Date('1900-01-01');
		
		for ( var i = 0; i < layers.length; i++) {
			if (!map.layers[i].isBaseLayer) {
				if (map.layers[i].timeStep != "NO") {// temporal)
					if (startMin > new Date(map.layers[i].timeStart))
						startMin = new Date(map.layers[i].timeStart);
					if (endMax < new Date(map.layers[i].timeEnd))
						endMax = new Date(map.layers[i].timeEnd);
				}
			}
		}
		if (endMax > new Date())
			endMax = new Date();
		// today
		document.getElementById("startDate").innerHTML = Ext.Date.format(startMin, Ext.Date.patterns.YearMonthDay);
		document.getElementById("endDate").innerHTML = Ext.Date.format(endMax, Ext.Date.patterns.YearMonthDay);
		
		var sl = Ext.getCmp('slider');
		sl.minValue = startMin.getTime();
		sl.maxValue = endMax.getTime();
		sl.setValue(initTimeSliderDate);
		Ext.getCmp("label4slider").setText(getLabelsTimeSlider());
		timeValueChanged();
	} catch (e) {
		alert(e);
	}
}
function runAutoUpdateSlider() {
	var tempResol = document.getElementById("temporalResolution").value;
	var sl = Ext.getCmp('slider');
	if (sl.getValue() < sl.maxValue) {
		sl.setValue(nextDate(tempResol, new Date(sl.getValue())).getTime());
		timeValueChanged();
	} else if (sl.getValue() == sl.maxValue) {
		task.stop();
		Ext.getCmp('playButton').setIconCls("play-icon");
	}
}

function timeValueChanged() {
	if (!allLayersLoaded())
		return;
	
	var config = "";
	var temporalResolution = document.getElementById("temporalResolution").value;
	var currentDateTimeSlider = new Date(Ext.getCmp('slider').getValue());
	var previousDateTimeSlider = prevDate(temporalResolution, currentDateTimeSlider);
	
	var wfsLayers = new Array();
	
	for ( var i = 0; i < layers.length; i++) {
		if (!map.layers[i].isBaseLayer && map.layers[i].timeStep != "NO") {
			var period = "";
			var periodFilterWFS = "";
			var nbInPeriod = 0;// ATA 20121114
			if ((currentDateTimeSlider >= new Date(map.layers[i].timeStart)) && (currentDateTimeSlider <= new Date(map.layers[i].timeEnd))) {
				var oldCurrentDateLayer = map.layers[i].oldCurrentDate;
				if (oldCurrentDateLayer > currentDateTimeSlider) {
					oldCurrentDateLayer = new Date(map.layers[i].timeStart);
				}
				
				var currentDateLayer = oldCurrentDateLayer;
				if (currentDateLayer == "")
					currentDateLayer = new Date(map.layers[i].timeStart);
				period = "";
				periodFilterWFS = "";
				nbInPeriod = 0;// ATA 20121114
				while (currentDateLayer <= currentDateTimeSlider) {
					
					if (endPeriod(map.layers[i].timeStep, currentDateLayer) > previousDateTimeSlider) {// ATA
						if ((map.layers[i].timeImage == 'all_images') || (map.layers[i].id.indexOf("WMS") == -1))
							period += Ext.Date.format(currentDateLayer, Ext.Date.patterns.YearMonthDay) + ",";
						else
							period = Ext.Date.format(currentDateLayer, Ext.Date.patterns.YearMonthDay) + ",";
						if (map.layers[i].id.indexOf("WMS") == -1) {
							nbInPeriod = nbInPeriod + 1;
							var week = Ext.Date.format(currentDateLayer, Ext.Date.patterns.WeekOnly);
							if (nbInPeriod == 1) {
								periodFilterWFS = "<PropertyIsEqualTo><PropertyName>week</PropertyName><Literal>" + week + "</Literal></PropertyIsEqualTo>";
							} else {
								periodFilterWFS = "<OR>" + periodFilterWFS + "<PropertyIsEqualTo><PropertyName>week</PropertyName><Literal>" + week + "</Literal></PropertyIsEqualTo></OR>";
							}
						}
						map.layers[i].oldCurrentDate = currentDateLayer;
					}
					currentDateLayer = nextDate(map.layers[i].timeStep, currentDateLayer);
				}
				if (period.substring(period.length - 1) == ',') {// ATA
					period = period.substring(0, period.length - 1);
				}
				if (map.layers[i].id.indexOf("WMS") != -1) {
					map.layers[i].mergeNewParams({
						'time' : period
					});
				} else {
					wfsLayers.push(map.layers[i]);
					map.layers[i].periodFilterWFS = periodFilterWFS;
				}
				if (map.layers[i].visibilityUser == null || map.layers[i].visibilityUser == true)// ATA
					map.layers[i].setVisibility(true);
			} else {
				map.layers[i].oldCurrentDate = "";
				map.layers[i].setVisibility(false);
			}
			config += "|----------" + map.layers[i].name + " [" + Ext.Date.format(new Date(map.layers[i].timeStart), Ext.Date.patterns.YearMonthDay) + ".."
			    + Ext.Date.format(new Date(map.layers[i].timeEnd), Ext.Date.patterns.YearMonthDay) + "] " + map.layers[i].timeStep + " => "
			    + Ext.Date.format(map.layers[i].oldCurrentDate, Ext.Date.patterns.YearMonthDay) + " (" + period + ")<br>";
			if (map.layers[i].displayInLayerSwitcher)
				document.getElementById("time_" + map.layers[i].id).innerHTML = period;
		}
	}// End for (on servicesLayersConfig)
	
	if (gfiWindow && !gfiWindow.hidden)
		getFeatureInfo(null);
	
	Ext.getCmp("label4slider").setText(getLabelsTimeSlider());
}

function updateServicesLayersConfigUserClick(layer) {
	layer.visibilityUser = layer.visibility;
}

var chartData = new Array();

function createChart() {
	Ext.getCmp('chartWindow').show();
	Ext.getCmp('chartWindow').getEl().mask('Please wait ... loading data');
	var seriesOptions = [], seriesCounter = 0, names = [
	    'PM10',
	    'O3',
	    'Temp',
	    'Asthma',
	    'Angina',
	    'Bronchitis',
	    'IHD',
	    'WHO'
	];
	
	var plz = Ext.getCmp("zipName").getValue();
	// plz = plz.substring(0, plz.indexOf(" "));
	var secondTime = false;
	var secondCall = false;
	$.each(names, function(i, name) {
		
		var url = "";
		
		if (name == "Asthma" || name == "Angina" || name == "IHD" || name == "WHO" || name == "Bronchitis") {
			url += server_risk + "version=1.0.0&Service=wfs&request=getfeature&typename=" + name.toLowerCase() + "&propertyname=timestamp,lod_asthma,lod_angina,lod_ihd,lod_bronchitis,who_relativerisk";
			if (!secondTime) {
				secondTime = true;
			}
		} else {
			url += server_pollution + "version=1.0.0&Service=wfs&request=getfeature&typename=" + name.toLowerCase() + "&propertyname=timestamp,value_mean";
		}
		url += "&Filter=<Filter><PropertyIsEqualTo><PropertyName>plz</PropertyName><Literal>" + plz + "</Literal></PropertyIsEqualTo></Filter>";
		if (((((((name == "O3" || name == "PM10") || name == "Temp") || (name == "Asthma" && !secondCall)) || (name == "Angina" && !secondCall)) || (name == "IHD" && !secondCall)) || (name == "WHO" && !secondCall)) || (name == "Bronchitis" && !secondCall))  {
			$.ajax({
			    type : "GET",
			    url : url,
			    dataType : "xml",
			    success : function(xml) {
				    var pollArray1 = new Array();
				    var pollArray2 = new Array();
				    var pollArray3 = new Array();
				    var pollArray4 = new Array();
				    var pollArray5 = new Array();
				    var pollArray6 = new Array();
				    var gml = new OpenLayers.Format.GML();
				    var gml_readed = gml.read(xml);
				    var multi = false;
				    Ext.each(gml_readed, function(feature) {
					    var newArray1 = new Array();
					    var newArray2 = new Array();
					    var newArray3 = new Array();
					    var newArray4 = new Array();
					    var newArray5 = new Array();
					    var newArray6 = new Array();
					    if (feature.attributes["lod_asthma"] != undefined) {
						    multi = true;
						    newArray1.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray1.push(parseFloat(feature.attributes["lod_asthma"]));
						    pollArray1.push(newArray1);
						    
						    newArray2.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray2.push(parseFloat(feature.attributes["lod_angina"]));
						    pollArray2.push(newArray2);
						    
						    newArray3.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray3.push(parseFloat(feature.attributes["lod_ihd"]));
						    pollArray3.push(newArray3);

						    newArray6.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray6.push(parseFloat(feature.attributes["lod_bronchitis"]));
						    pollArray6.push(newArray6);
						    
						    newArray5.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray5.push(parseFloat(feature.attributes["who_relativerisk"]));
						    pollArray5.push(newArray5);
					    } else {
						    newArray4.push(parseFloat(new Date(feature.attributes["timestamp"]).getTime()));
						    newArray4.push(parseFloat(feature.attributes["value_mean"]));
						    pollArray4.push(newArray4);
					    }
				    });
				    if (multi) {
					    seriesOptions[i] = {
					        name : "LOD Asthma",
					        data : pollArray1
					    }
					    seriesCounter++;
					    seriesOptions[i + 1] = {
					        name : "LOD Angina",
					        data : pollArray2
					    }
					    seriesCounter++;
					    seriesOptions[i + 2] = {
					        name : "LOD IHD",
					        data : pollArray3
					    }
					    seriesCounter++;
					    seriesOptions[i + 3] = {
					        name : "LOD Bronchitis",
					        data : pollArray6
					    }
					    seriesCounter++;
					    seriesOptions[i + 4] = {
					        name : "WHO RR",
					        data : pollArray5
					    }
					    seriesCounter++;
					    Ext.each(map.layers, function(layer) {
						    if (layer.name.indexOf("asthma") != -1 && layer.visibility == false) {
							    seriesOptions[i].visible = false;
						    }
						    if (layer.name.indexOf("angina") != -1 && layer.visibility == false) {
							    seriesOptions[i + 1].visible = false;
						    }
						    if (layer.name.indexOf("ihd") != -1 && layer.visibility == false) {
							    seriesOptions[i + 2].visible = false;
						    }
						    if (layer.name.indexOf("bronchitis") != -1 && layer.visibility == false) {
							    seriesOptions[i + 3].visible = false;
						    }
						    if (layer.name.indexOf("who") != -1 && layer.visibility == false) {
							    seriesOptions[i + 4].visible = false;
						    }
						   
					    });
				    } else {
					    seriesOptions[i] = {
					        name : name,
					        data : pollArray4
					    }
					    seriesCounter++;
					    Ext.each(map.layers, function(layer) {
						    if (layer.name.indexOf(name.toLowerCase()) != -1 && layer.visibility == false) {
							    seriesOptions[i].visible = false;
						    }
					    });
				    }
				    
				    if (seriesCounter == names.length) {
					    Ext.getCmp('chartWindow').getEl().unmask();
					    Ext.getCmp('chartWindow').center();
					    getChart();
				    }
			    }
			});
			if (secondTime) {
				secondCall = true;
			}
		}
	});
	
	var buttons = {
		test1Button : {
		    symbol : 'csvIcon',
		    x : -62,
		    symbolX : 11.5,
		    symbolY : 10.5,
		    symbolFill : '#A8BF77',
		    hoverSymbolFill : '#768F3E',
		    _titleKey : 'downloadCSV',
		    onclick : function() {
			    this.exportChartAsCSV({
				    type : 'text/csv'
			    });
		    }
		}
	};
	
	function getChart() {
		$(document).ready(function() {
			chart = new Highcharts.StockChart({
			    chart : {
			        renderTo : 'contentChart',
			        width : 800,
			        height : 600
			    },
			    credits : {
			        enabled : true,
			        text : "click on the legend to deactivate/activate the data series",
			        href : "#",
			        style : {
			            cursor : 'auto',
			            color : '#909090',
			            fontSize : '11px'
			        }
			    },
			    xAxis: {
			    	type: 'datetime',
			    	labels: {
			    		formatter: function() {
			    			return Highcharts.dateFormat('%a %b %d ´%y', this.value);
			    		}
			    	}
			    },
			    legend : {
			        align : 'right',
			        y : -100,
			        enabled : true,
			        layout : "vertical"
			    },
			    title : {
			        text : Ext.getCmp("zipName").getValue() + " - " + Ext.getCmp("zipName").findRecordByValue(Ext.getCmp("zipName").getValue()).getData().name,
			        x : -20
			    },
			    tooltip : {
			        valueDecimals : 2,
			        formatter : function() {
				        var s = '<span style="font-size: 10px">' + Highcharts.dateFormat('%A, %b %e, %Y', this.x) + '</span>';
				        $.each(this.points, function(i, point) {
					        s += '<br><span style="color:' + point.series.color + '">' + point.series.name + '</span>: <b>' + Math.round(point.y * 100) / 100;
					        if (point.series.name == "Temp")
						        s += ' °C';
					        if (point.series.name == "PM10" || point.series.name == "O3")
						        s += ' µg/m³';
				        });
				        return s;
			        }
			    },
			    subtitle : {
			        text : 'Air Pollution & Risk',
			        x : -20
			    },
			    exporting : {
			        url : 'http://time2maps.dyndns.org:8080/highcharts-export',
			        width : 200
			    },
			    scrollbar : {
			        barBackgroundColor : '#777',
			        barBorderRadius : 3,
			        barBorderWidth : 0,
			        buttonBackgroundColor : '#777',
			        buttonBorderWidth : 0,
			        buttonBorderRadius : 3,
			        trackBackgroundColor : 'none',
			        trackBorderWidth : 1,
			        trackBorderRadius : 6,
			        trackBorderColor : '#777'
			    },
			    series : seriesOptions
			}, function(chart) {
				for (n in buttons)
					chart.addButton(buttons[n]);
				chart.setSize(chart.chartWidth, chart.chartHeight);
				
			});
		});
	}
}
