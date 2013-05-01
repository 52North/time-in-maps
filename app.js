Ext.require('Ext.container.Viewport');
var viewport, mapPanel, task, updateSlider, detailsWindow, chartWindow, chartWindow2, chartPanel2;
var map, info, cholera, srtm_background, water_background, admin_background, kasese_rainfall_time, kasese_rainfallanomaly_time, kasese_cholera_cases_subcounty, cholera_heatmap, popup, button1, activeTime, activeLayer, selectCtrl, activeCountry, buttonDetails, buttonOpenChart, buttonOpenUganda, rainfall_time, rainfallanomaly_time, cholera_cases100_time, cholera_density_time, sliderTooltip;
var opendapMinDate = new Date("1998-01-01");
var opendapMaxDate = new Date("2012-04-30");
Ext.application({
    autoInitViewport : false,
    name : 'HelloExt',
    launch : function() {

        var sliderHeight = 65;

        var runner = new Ext.util.TaskRunner();
        task = runner.newTask({
            run : runAutoUpdateSlider, //BRGM

            interval : 4000
        });

        var statisticsButton = Ext.create('Ext.Button', {
            text : 'See details/statistics',
            hidden : true,
            margin : '10 30 10 30',
            id : 'statisticsButton',
            handler : function() {
                var w = Ext.getCmp('detailsWindow');
                Ext.getCmp('detailsWindowData').setTitle(activeCountry.replace(/%20/g, " "));
                w.show();
                w.getEl().mask('Please wait ... loading data');
                getFeatureDetails();
            }
        });

        var playbutton = Ext.create('Ext.Button', {
            text : null,
            id : 'playButton',
            iconCls : 'play-icon',
            iconAlign : 'left',
            width : 45,
            height : 45,
            margin : '0 10 0 10',
            handler : function() {
                if (this.iconCls == "play-icon") {
                    this.setIconCls("pause-icon");
                    task.start();
                } else {
                    this.setIconCls("play-icon");
                    task.stop();
                }
            }
        });

        var slideraddbutton = Ext.create('Ext.Button', {
            text : null,
            id : 'slideraddbutton',
            iconCls : 'add-icon',
            scale : 'small',
            cls : 'x-btn-icon',
            iconAlign : 'left',
            handler : function() {
                var sl = Ext.getCmp('slider');
                if (sl.getValue() < sl.maxValue) {
                    var tempResol = document.getElementById("temporalResolution").value;
                    sl.setValue(nextDate(tempResol, new Date(sl.getValue())).getTime());
                    timeValueChanged();
                }
            }
        });

        var slidersubbutton = Ext.create('Ext.Button', {
            text : null,
            id : 'slidersubbutton',
            iconCls : 'sub-icon',
            scale : 'small',
            cls : 'x-btn-icon',
            iconAlign : 'left',
            handler : function() {
                var sl = Ext.getCmp('slider');
                if (sl.getValue() > sl.minValue) {
                    var tempResol = document.getElementById("temporalResolution").value;
                    sl.setValue(prevDate(tempResol, new Date(sl.getValue())).getTime());
                    timeValueChanged();
                }
            }
        });

        //TIME SERIES
        var parishList = new Ext.data.Store({
            fields: ['zip', 'name'],
        	data : [{"zip":"01067","name":"Dresden"}, {"zip":"01069","name":"Dresden"}, {"zip":"01097","name":"Dresden"}, {"zip":"01099","name":"Dresden"}, {"zip":"01108","name":"Dresden"}, {"zip":"01109","name":"Dresden"}, {"zip":"01127","name":"Dresden"}, {"zip":"01129","name":"Dresden"}, {"zip":"01139","name":"Dresden"}, {"zip":"01156","name":"Dresden"}, {"zip":"01157","name":"Dresden"}, {"zip":"01159","name":"Dresden"}, {"zip":"01169","name":"Dresden"}, {"zip":"01187","name":"Dresden"}, {"zip":"01189","name":"Dresden"}, {"zip":"01217","name":"Dresden"}, {"zip":"01219","name":"Dresden"}, {"zip":"01237","name":"Dresden"}, {"zip":"01239","name":"Dresden"}, {"zip":"01257","name":"Dresden"}, {"zip":"01259","name":"Dresden"}, {"zip":"01277","name":"Dresden"}, {"zip":"01279","name":"Dresden"}, {"zip":"01307","name":"Dresden"}, {"zip":"01309","name":"Dresden"}, {"zip":"01324","name":"Dresden"}, {"zip":"01326","name":"Dresden"}, {"zip":"01328","name":"Dresden"}, {"zip":"01445","name":"Radebeul"}, {"zip":"01454","name":"Radeberg"}, {"zip":"01458","name":"Ottendorf-Okrilla"}, {"zip":"01465","name":"Dresden"}, {"zip":"01468","name":"Moritzburg"}, {"zip":"01471","name":"Radeburg"}, {"zip":"01477","name":"Arnsdorf"}, {"zip":"01558","name":"Großenhain"}, {"zip":"01561","name":"Ebersbach"}, {"zip":"01587","name":"Riesa"}, {"zip":"01589","name":"Riesa"}, {"zip":"01591","name":"Riesa"}, {"zip":"01594","name":"Stauchitz"}, {"zip":"01609","name":"Gröditz"}, {"zip":"01612","name":"Nünchritz"}, {"zip":"01616","name":"Strehla"}, {"zip":"01619","name":"Zeithain"}, {"zip":"01623","name":"Lommatzsch"}, {"zip":"01640","name":"Coswig"}, {"zip":"01662","name":"Meißen"}, {"zip":"01665","name":"Klipphausen"}, {"zip":"01683","name":"Nossen"}, {"zip":"01689","name":"Weinböhla"}, {"zip":"01705","name":"Freital"}, {"zip":"01723","name":"Wilsdruff"}, {"zip":"01728","name":"Bannewitz"}, {"zip":"01731","name":"Kreischa"}, {"zip":"01734","name":"Rabenau"}, {"zip":"01737","name":"Tharandt"}, {"zip":"01738","name":"Pretzschendorf"}, {"zip":"01744","name":"Dippoldiswalde"}, {"zip":"01762","name":"Schmiedeberg"}, {"zip":"01768","name":"Glashütte"}, {"zip":"01773","name":"Altenberg"}, {"zip":"01774","name":"Höckendorf"}, {"zip":"01776","name":"Hermsdorf/Erzgeb."}, {"zip":"01778","name":"Geising"}, {"zip":"01796","name":"Pirna"}, {"zip":"01809","name":"Heidenau"}, {"zip":"01814","name":"Bad Schandau"}, {"zip":"01816","name":"Bad Gottleuba-Berggießhübel"}, {"zip":"01819","name":"Bad Gottleuba-Berggießhübel"}, {"zip":"01824","name":"Königstein/Sächs. Schw."}, {"zip":"01825","name":"Liebstadt"}, {"zip":"01829","name":"Stadt Wehlen"}, {"zip":"01833","name":"Stolpen"}, {"zip":"01844","name":"Neustadt i. Sa."}, {"zip":"01847","name":"Lohmen"}, {"zip":"01848","name":"Hohnstein"}, {"zip":"01855","name":"Sebnitz"}, {"zip":"01877","name":"Bischofswerda"}, {"zip":"01896","name":"Pulsnitz"}, {"zip":"01900","name":"Großröhrsdorf"}, {"zip":"01904","name":"Neukirch/Lausitz"}, {"zip":"01906","name":"Burkau"}, {"zip":"01909","name":"Großharthau"}, {"zip":"01917","name":"Kamenz"}, {"zip":"01920","name":"Haselbachtal"}, {"zip":"01936","name":"Königsbrück"}, {"zip":"02625","name":"Bautzen"}, {"zip":"02627","name":"Weißenberg"}, {"zip":"02633","name":"Göda"}, {"zip":"02681","name":"Wilthen"}, {"zip":"02689","name":"Sohland a. d. Spree"}, {"zip":"02692","name":"Großpostwitz/O.L."}, {"zip":"02694","name":"Großdubrau"}, {"zip":"02699","name":"Neschwitz"}, {"zip":"02708","name":"Löbau"}, {"zip":"02727","name":"Neugersdorf"}, {"zip":"02730","name":"Ebersbach/Sa."}, {"zip":"02733","name":"Cunewalde"}, {"zip":"02736","name":"Oppach"}, {"zip":"02739","name":"Eibau"}, {"zip":"02742","name":"Neusalza-Spremberg"}, {"zip":"02747","name":"Herrnhut"}, {"zip":"02748","name":"Bernstadt a. d. Eigen"}, {"zip":"02763","name":"Zittau"}, {"zip":"02779","name":"Großschönau"}, {"zip":"02782","name":"Seifhennersdorf"}, {"zip":"02785","name":"Olbersdorf"}, {"zip":"02788","name":"Hirschfelde"}, {"zip":"02791","name":"Oderwitz"}, {"zip":"02794","name":"Leutersdorf"}, {"zip":"02796","name":"Jonsdorf"}, {"zip":"02797","name":"Oybin"}, {"zip":"02799","name":"Großschönau"}, {"zip":"02826","name":"Görlitz"}, {"zip":"02827","name":"Görlitz"}, {"zip":"02828","name":"Görlitz"}, {"zip":"02829","name":"Görlitz"}, {"zip":"02894","name":"Reichenbach/O.L."}, {"zip":"02899","name":"Ostritz"}, {"zip":"02906","name":"Niesky"}, {"zip":"02923","name":"Horka"}, {"zip":"02929","name":"Rothenburg/O.L."}, {"zip":"02943","name":"Weißwasser/O.L."}, {"zip":"02953","name":"Bad Muskau"}, {"zip":"02956","name":"Rietschen"}, {"zip":"02957","name":"Krauschwitz"}, {"zip":"02959","name":"Schleife"}, {"zip":"02977","name":"Hoyerswerda"}, {"zip":"02979","name":"Elsterheide"}, {"zip":"02991","name":"Lauta"}, {"zip":"02994","name":"Bernsdorf"}, {"zip":"02997","name":"Wittichenau"}, {"zip":"02999","name":"Lohsa"}, {"zip":"04103","name":"Leipzig"}, {"zip":"04105","name":"Leipzig"}, {"zip":"04107","name":"Leipzig"}, {"zip":"04109","name":"Leipzig"}, {"zip":"04129","name":"Leipzig"}, {"zip":"04155","name":"Leipzig"}, {"zip":"04157","name":"Leipzig"}, {"zip":"04158","name":"Leipzig"}, {"zip":"04159","name":"Leipzig"}, {"zip":"04177","name":"Leipzig"}, {"zip":"04178","name":"Leipzig"}, {"zip":"04179","name":"Leipzig"}, {"zip":"04205","name":"Leipzig"}, {"zip":"04207","name":"Leipzig"}, {"zip":"04209","name":"Leipzig"}, {"zip":"04229","name":"Leipzig"}, {"zip":"04249","name":"Leipzig"}, {"zip":"04275","name":"Leipzig"}, {"zip":"04277","name":"Leipzig"}, {"zip":"04279","name":"Leipzig"}, {"zip":"04288","name":"Leipzig"}, {"zip":"04289","name":"Leipzig"}, {"zip":"04299","name":"Leipzig"}, {"zip":"04315","name":"Leipzig"}, {"zip":"04316","name":"Leipzig"}, {"zip":"04317","name":"Leipzig"}, {"zip":"04318","name":"Leipzig"}, {"zip":"04319","name":"Leipzig"}, {"zip":"04328","name":"Leipzig"}, {"zip":"04329","name":"Leipzig"}, {"zip":"04347","name":"Leipzig"}, {"zip":"04349","name":"Leipzig"}, {"zip":"04356","name":"Leipzig"}, {"zip":"04357","name":"Leipzig"}, {"zip":"04416","name":"Markkleeberg"}, {"zip":"04420","name":"Markranstädt"}, {"zip":"04425","name":"Taucha"}, {"zip":"04435","name":"Schkeuditz"}, {"zip":"04442","name":"Zwenkau"}, {"zip":"04451","name":"Borsdorf"}, {"zip":"04460","name":"Kitzen"}, {"zip":"04463","name":"Großpösna"}, {"zip":"04509","name":"Delitzsch"}, {"zip":"04519","name":"Rackwitz"}, {"zip":"04523","name":"Pegau"}, {"zip":"04539","name":"Groitzsch"}, {"zip":"04552","name":"Borna"}, {"zip":"04564","name":"Böhlen"}, {"zip":"04565","name":"Regis-Breitingen"}, {"zip":"04567","name":"Kitzscher"}, {"zip":"04571","name":"Rötha"}, {"zip":"04574","name":"Deutzen"}, {"zip":"04575","name":"Neukieritzsch"}, {"zip":"04579","name":"Espenhain"}, {"zip":"04643","name":"Geithain"}, {"zip":"04651","name":"Bad Lausick"}, {"zip":"04654","name":"Frohburg"}, {"zip":"04655","name":"Kohren-Sahlis"}, {"zip":"04657","name":"Narsdorf"}, {"zip":"04668","name":"Grimma"}, {"zip":"04680","name":"Colditz"}, {"zip":"04683","name":"Naunhof"}, {"zip":"04685","name":"Nerchau"}, {"zip":"04687","name":"Trebsen/Mulde"}, {"zip":"04688","name":"Mutzschen"}, {"zip":"04703","name":"Leisnig"}, {"zip":"04720","name":"Döbeln"}, {"zip":"04736","name":"Waldheim"}, {"zip":"04741","name":"Roßwein"}, {"zip":"04746","name":"Hartha"}, {"zip":"04749","name":"Ostrau"}, {"zip":"04758","name":"Oschatz"}, {"zip":"04769","name":"Mügeln"}, {"zip":"04774","name":"Dahlen"}, {"zip":"04779","name":"Wermsdorf"}, {"zip":"04808","name":"Wurzen"}, {"zip":"04821","name":"Brandis"}, {"zip":"04824","name":"Brandis"}, {"zip":"04827","name":"Machern"}, {"zip":"04828","name":"Bennewitz"}, {"zip":"04838","name":"Eilenburg"}, {"zip":"04849","name":"Bad Düben"}, {"zip":"04860","name":"Torgau"}, {"zip":"04862","name":"Mockrehna"}, {"zip":"04874","name":"Belgern"}, {"zip":"04880","name":"Dommitzsch"}, {"zip":"04886","name":"Arzberg"}, {"zip":"04889","name":"Schildau"}, {"zip":"07919","name":"Mühltroff"}, {"zip":"07952","name":"Pausa/Vogtl."}, {"zip":"07985","name":"Elsterberg"}, {"zip":"08056","name":"Zwickau"}, {"zip":"08058","name":"Zwickau"}, {"zip":"08060","name":"Zwickau"}, {"zip":"08062","name":"Zwickau"}, {"zip":"08064","name":"Zwickau"}, {"zip":"08066","name":"Zwickau"}, {"zip":"08107","name":"Kirchberg"}, {"zip":"08112","name":"Wilkau-Haßlau"}, {"zip":"08115","name":"Lichtentanne"}, {"zip":"08118","name":"Hartenstein"}, {"zip":"08132","name":"Mülsen"}, {"zip":"08134","name":"Wildenfels"}, {"zip":"08141","name":"Reinsdorf"}, {"zip":"08144","name":"Hirschfeld"}, {"zip":"08147","name":"Crinitzberg"}, {"zip":"08209","name":"Auerbach/Vogtl."}, {"zip":"08223","name":"Falkenstein/Vogtl."}, {"zip":"08228","name":"Rodewisch"}, {"zip":"08233","name":"Treuen"}, {"zip":"08236","name":"Ellefeld"}, {"zip":"08237","name":"Steinberg"}, {"zip":"08239","name":"Falkenstein/Vogtl."}, {"zip":"08248","name":"Klingenthal/Sa."}, {"zip":"08258","name":"Markneukirchen"}, {"zip":"08261","name":"Schöneck/Vogtl."}, {"zip":"08262","name":"Tannenbergsthal/Vogtl."}, {"zip":"08265","name":"Erlbach"}, {"zip":"08267","name":"Zwota"}, {"zip":"08269","name":"Hammerbrücke"}, {"zip":"08280","name":"Aue"}, {"zip":"08289","name":"Schneeberg"}, {"zip":"08294","name":"Lößnitz"}, {"zip":"08297","name":"Zwönitz"}, {"zip":"08301","name":"Bad Schlema"}, {"zip":"08304","name":"Schönheide"}, {"zip":"08309","name":"Eibenstock"}, {"zip":"08312","name":"Lauter/Sa."}, {"zip":"08315","name":"Bernsbach"}, {"zip":"08321","name":"Zschorlau"}, {"zip":"08324","name":"Bockau"}, {"zip":"08326","name":"Sosa"}, {"zip":"08328","name":"Stützengrün"}, {"zip":"08340","name":"Schwarzenberg/Erzgeb."}, {"zip":"08344","name":"Grünhain-Beierfeld"}, {"zip":"08349","name":"Johanngeorgenstadt"}, {"zip":"08352","name":"Raschau"}, {"zip":"08355","name":"Rittersgrün"}, {"zip":"08359","name":"Breitenbrunn/Erzgeb."}, {"zip":"08371","name":"Glauchau"}, {"zip":"08373","name":"Remse"}, {"zip":"08393","name":"Meerane"}, {"zip":"08396","name":"Waldenburg"}, {"zip":"08412","name":"Werdau"}, {"zip":"08427","name":"Fraureuth"}, {"zip":"08428","name":"Langenbernsdorf"}, {"zip":"08451","name":"Crimmitschau"}, {"zip":"08459","name":"Neukirchen/Pleiße"}, {"zip":"08468","name":"Reichenbach im Vogtland"}, {"zip":"08485","name":"Lengenfeld"}, {"zip":"08491","name":"Netzschkau"}, {"zip":"08496","name":"Neumark"}, {"zip":"08499","name":"Mylau"}, {"zip":"08523","name":"Plauen"}, {"zip":"08525","name":"Plauen"}, {"zip":"08527","name":"Plauen"}, {"zip":"08529","name":"Plauen"}, {"zip":"08538","name":"Weischlitz"}, {"zip":"08539","name":"Mehltheuer"}, {"zip":"08541","name":"Neuensalz"}, {"zip":"08543","name":"Pöhl"}, {"zip":"08547","name":"Plauen"}, {"zip":"08548","name":"Syrau"}, {"zip":"08606","name":"Oelsnitz"}, {"zip":"08626","name":"Adorf"}, {"zip":"08645","name":"Bad Elster"}, {"zip":"08648","name":"Bad Brambach"}, {"zip":"09111","name":"Chemnitz"}, {"zip":"09112","name":"Chemnitz"}, {"zip":"09113","name":"Chemnitz"}, {"zip":"09114","name":"Chemnitz"}, {"zip":"09116","name":"Chemnitz"}, {"zip":"09117","name":"Chemnitz"}, {"zip":"09119","name":"Chemnitz"}, {"zip":"09120","name":"Chemnitz"}, {"zip":"09122","name":"Chemnitz"}, {"zip":"09123","name":"Chemnitz"}, {"zip":"09125","name":"Chemnitz"}, {"zip":"09126","name":"Chemnitz"}, {"zip":"09127","name":"Chemnitz"}, {"zip":"09128","name":"Chemnitz"}, {"zip":"09130","name":"Chemnitz"}, {"zip":"09131","name":"Chemnitz"}, {"zip":"09212","name":"Limbach-Oberfrohna"}, {"zip":"09217","name":"Burgstädt"}, {"zip":"09221","name":"Neukirchen/Erzgeb."}, {"zip":"09224","name":"Chemnitz"}, {"zip":"09228","name":"Chemnitz"}, {"zip":"09232","name":"Hartmannsdorf"}, {"zip":"09235","name":"Burkhardtsdorf"}, {"zip":"09236","name":"Claußnitz"}, {"zip":"09241","name":"Mühlau"}, {"zip":"09243","name":"Niederfrohna"}, {"zip":"09244","name":"Lichtenau"}, {"zip":"09247","name":"Chemnitz"}, {"zip":"09249","name":"Taura"}, {"zip":"09306","name":"Erlau"}, {"zip":"09322","name":"Penig"}, {"zip":"09326","name":"Geringswalde"}, {"zip":"09328","name":"Lunzenau"}, {"zip":"09337","name":"Hohenstein-Ernstthal"}, {"zip":"09350","name":"Lichtenstein/Sa."}, {"zip":"09353","name":"Oberlungwitz"}, {"zip":"09355","name":"Gersdorf"}, {"zip":"09356","name":"St. Egidien"}, {"zip":"09366","name":"Stollberg/Erzgeb."}, {"zip":"09376","name":"Oelsnitz/Erzgeb."}, {"zip":"09380","name":"Thalheim/Erzgeb."}, {"zip":"09385","name":"Lugau/Erzgeb."}, {"zip":"09387","name":"Jahnsdorf/Erzgeb."}, {"zip":"09390","name":"Gornsdorf"}, {"zip":"09392","name":"Auerbach"}, {"zip":"09394","name":"Hohndorf"}, {"zip":"09395","name":"Hormersdorf"}, {"zip":"09399","name":"Niederwürschnitz"}, {"zip":"09405","name":"Zschopau"}, {"zip":"09419","name":"Thum"}, {"zip":"09423","name":"Gelenau/Erzgeb."}, {"zip":"09427","name":"Ehrenfriedersdorf"}, {"zip":"09429","name":"Wolkenstein"}, {"zip":"09430","name":"Drebach"}, {"zip":"09432","name":"Großolbersdorf"}, {"zip":"09434","name":"Zschopau"}, {"zip":"09435","name":"Drebach"}, {"zip":"09437","name":"Waldkirchen/Erzgeb."}, {"zip":"09439","name":"Amtsberg"}, {"zip":"09456","name":"Annaberg-Buchholz"}, {"zip":"09465","name":"Sehmatal"}, {"zip":"09468","name":"Geyer"}, {"zip":"09471","name":"Bärenstein"}, {"zip":"09474","name":"Crottendorf"}, {"zip":"09477","name":"Jöhstadt"}, {"zip":"09481","name":"Elterlein"}, {"zip":"09484","name":"Oberwiesenthal"}, {"zip":"09487","name":"Schlettau"}, {"zip":"09488","name":"Thermalbad Wiesenbad"}, {"zip":"09496","name":"Marienberg"}, {"zip":"09509","name":"Pockau"}, {"zip":"09514","name":"Lengefeld"}, {"zip":"09517","name":"Zöblitz"}, {"zip":"09518","name":"Großrückerswalde"}, {"zip":"09526","name":"Olbernhau"}, {"zip":"09544","name":"Neuhausen/Erzgeb."}, {"zip":"09548","name":"Seiffen/Erzgeb."}, {"zip":"09557","name":"Flöha"}, {"zip":"09569","name":"Oederan"}, {"zip":"09573","name":"Augustusburg"}, {"zip":"09575","name":"Eppendorf"}, {"zip":"09577","name":"Niederwiesa"}, {"zip":"09579","name":"Borstendorf"}, {"zip":"09599","name":"Freiberg"}, {"zip":"09600","name":"Oberschöna"}, {"zip":"09603","name":"Großschirma"}, {"zip":"09618","name":"Brand-Erbisdorf"}, {"zip":"09619","name":"Mulda/Sa."}, {"zip":"09623","name":"Frauenstein"}, {"zip":"09627","name":"Bobritzsch"}, {"zip":"09629","name":"Reinsberg"}, {"zip":"09633","name":"Halsbrücke"}, {"zip":"09634","name":"Reinsberg"}, {"zip":"09638","name":"Lichtenberg/Erzgeb."}, {"zip":"09648","name":"Mittweida"}, {"zip":"09661","name":"Hainichen"}, {"zip":"09669","name":"Frankenberg/Sa."}]
//	        fields : ['name'],
//            data : [['01067 Dresden'], ['01069 Dresden'], ['01097 Dresden'], ['01099 Dresden'], ['01108 Dresden'], ['01109 Dresden'], ['01127 Dresden'], ['01129 Dresden'], ['01139 Dresden'], ['01156 Dresden'], ['01157 Dresden'], ['01159 Dresden'], ['01169 Dresden'], ['01187 Dresden'], ['01189 Dresden'], ['01217 Dresden'], ['01219 Dresden'], ['01237 Dresden'], ['01239 Dresden'], ['01257 Dresden'], ['01259 Dresden'], ['01277 Dresden'], ['01279 Dresden'], ['01307 Dresden'], ['01309 Dresden'], ['01324 Dresden'], ['01326 Dresden'], ['01328 Dresden'], ['01445 Radebeul'], ['01454 Radeberg'], ['01458 Ottendorf-Okrilla'], ['01465 Dresden'], ['01468 Moritzburg'], ['01471 Radeburg'], ['01477 Arnsdorf'], ['01558 Großenhain'], ['01561 Ebersbach'], ['01587 Riesa'], ['01589 Riesa'], ['01591 Riesa'], ['01594 Stauchitz'], ['01609 Gröditz'], ['01612 Nünchritz'], ['01616 Strehla'], ['01619 Zeithain'], ['01623 Lommatzsch'], ['01640 Coswig'], ['01662 Meißen'], ['01665 Klipphausen'], ['01683 Nossen'], ['01689 Weinböhla'], ['01705 Freital'], ['01723 Wilsdruff'], ['01728 Bannewitz'], ['01731 Kreischa'], ['01734 Rabenau'], ['01737 Tharandt'], ['01738 Pretzschendorf'], ['01744 Dippoldiswalde'], ['01762 Schmiedeberg'], ['01768 Glashütte'], ['01773 Altenberg'], ['01774 Höckendorf'], ['01776 Hermsdorf/Erzgeb.'], ['01778 Geising'], ['01796 Pirna'], ['01809 Heidenau'], ['01814 Bad Schandau'], ['01816 Bad Gottleuba-Berggießhübel'], ['01819 Bad Gottleuba-Berggießhübel'], ['01824 Königstein/Sächs. Schw.'], ['01825 Liebstadt'], ['01829 Stadt Wehlen'], ['01833 Stolpen'], ['01844 Neustadt i. Sa.'], ['01847 Lohmen'], ['01848 Hohnstein'], ['01855 Sebnitz'], ['01877 Bischofswerda'], ['01896 Pulsnitz'], ['01900 Großröhrsdorf'], ['01904 Neukirch/Lausitz'], ['01906 Burkau'], ['01909 Großharthau'], ['01917 Kamenz'], ['01920 Haselbachtal'], ['01936 Königsbrück'], ['02625 Bautzen'], ['02627 Weißenberg'], ['02633 Göda'], ['02681 Wilthen'], ['02689 Sohland a. d. Spree'], ['02692 Großpostwitz/O.L.'], ['02694 Großdubrau'], ['02699 Neschwitz'], ['02708 Löbau'], ['02727 Neugersdorf'], ['02730 Ebersbach/Sa.'], ['02733 Cunewalde'], ['02736 Oppach'], ['02739 Eibau'], ['02742 Neusalza-Spremberg'], ['02747 Herrnhut'], ['02748 Bernstadt a. d. Eigen'], ['02763 Zittau'], ['02779 Großschönau'], ['02782 Seifhennersdorf'], ['02785 Olbersdorf'], ['02788 Hirschfelde'], ['02791 Oderwitz'], ['02794 Leutersdorf'], ['02796 Jonsdorf'], ['02797 Oybin'], ['02799 Großschönau'], ['02826 Görlitz'], ['02827 Görlitz'], ['02828 Görlitz'], ['02829 Görlitz'], ['02894 Reichenbach/O.L.'], ['02899 Ostritz'], ['02906 Niesky'], ['02923 Horka'], ['02929 Rothenburg/O.L.'], ['02943 Weißwasser/O.L.'], ['02953 Bad Muskau'], ['02956 Rietschen'], ['02957 Krauschwitz'], ['02959 Schleife'], ['02977 Hoyerswerda'], ['02979 Elsterheide'], ['02991 Lauta'], ['02994 Bernsdorf'], ['02997 Wittichenau'], ['02999 Lohsa'], ['04103 Leipzig'], ['04105 Leipzig'], ['04107 Leipzig'], ['04109 Leipzig'], ['04129 Leipzig'], ['04155 Leipzig'], ['04157 Leipzig'], ['04158 Leipzig'], ['04159 Leipzig'], ['04177 Leipzig'], ['04178 Leipzig'], ['04179 Leipzig'], ['04205 Leipzig'], ['04207 Leipzig'], ['04209 Leipzig'], ['04229 Leipzig'], ['04249 Leipzig'], ['04275 Leipzig'], ['04277 Leipzig'], ['04279 Leipzig'], ['04288 Leipzig'], ['04289 Leipzig'], ['04299 Leipzig'], ['04315 Leipzig'], ['04316 Leipzig'], ['04317 Leipzig'], ['04318 Leipzig'], ['04319 Leipzig'], ['04328 Leipzig'], ['04329 Leipzig'], ['04347 Leipzig'], ['04349 Leipzig'], ['04356 Leipzig'], ['04357 Leipzig'], ['04416 Markkleeberg'], ['04420 Markranstädt'], ['04425 Taucha'], ['04435 Schkeuditz'], ['04442 Zwenkau'], ['04451 Borsdorf'], ['04460 Kitzen'], ['04463 Großpösna'], ['04509 Delitzsch'], ['04519 Rackwitz'], ['04523 Pegau'], ['04539 Groitzsch'], ['04552 Borna'], ['04564 Böhlen'], ['04565 Regis-Breitingen'], ['04567 Kitzscher'], ['04571 Rötha'], ['04574 Deutzen'], ['04575 Neukieritzsch'], ['04579 Espenhain'], ['04643 Geithain'], ['04651 Bad Lausick'], ['04654 Frohburg'], ['04655 Kohren-Sahlis'], ['04657 Narsdorf'], ['04668 Grimma'], ['04680 Colditz'], ['04683 Naunhof'], ['04685 Nerchau'], ['04687 Trebsen/Mulde'], ['04688 Mutzschen'], ['04703 Leisnig'], ['04720 Döbeln'], ['04736 Waldheim'], ['04741 Roßwein'], ['04746 Hartha'], ['04749 Ostrau'], ['04758 Oschatz'], ['04769 Mügeln'], ['04774 Dahlen'], ['04779 Wermsdorf'], ['04808 Wurzen'], ['04821 Brandis'], ['04824 Brandis'], ['04827 Machern'], ['04828 Bennewitz'], ['04838 Eilenburg'], ['04849 Bad Düben'], ['04860 Torgau'], ['04862 Mockrehna'], ['04874 Belgern'], ['04880 Dommitzsch'], ['04886 Arzberg'], ['04889 Schildau'], ['07919 Mühltroff'], ['07952 Pausa/Vogtl.'], ['07985 Elsterberg'], ['08056 Zwickau'], ['08058 Zwickau'], ['08060 Zwickau'], ['08062 Zwickau'], ['08064 Zwickau'], ['08066 Zwickau'], ['08107 Kirchberg'], ['08112 Wilkau-Haßlau'], ['08115 Lichtentanne'], ['08118 Hartenstein'], ['08132 Mülsen'], ['08134 Wildenfels'], ['08141 Reinsdorf'], ['08144 Hirschfeld'], ['08147 Crinitzberg'], ['08209 Auerbach/Vogtl.'], ['08223 Falkenstein/Vogtl.'], ['08228 Rodewisch'], ['08233 Treuen'], ['08236 Ellefeld'], ['08237 Steinberg'], ['08239 Falkenstein/Vogtl.'], ['08248 Klingenthal/Sa.'], ['08258 Markneukirchen'], ['08261 Schöneck/Vogtl.'], ['08262 Tannenbergsthal/Vogtl.'], ['08265 Erlbach'], ['08267 Zwota'], ['08269 Hammerbrücke'], ['08280 Aue'], ['08289 Schneeberg'], ['08294 Lößnitz'], ['08297 Zwönitz'], ['08301 Bad Schlema'], ['08304 Schönheide'], ['08309 Eibenstock'], ['08312 Lauter/Sa.'], ['08315 Bernsbach'], ['08321 Zschorlau'], ['08324 Bockau'], ['08326 Sosa'], ['08328 Stützengrün'], ['08340 Schwarzenberg/Erzgeb.'], ['08344 Grünhain-Beierfeld'], ['08349 Johanngeorgenstadt'], ['08352 Raschau'], ['08355 Rittersgrün'], ['08359 Breitenbrunn/Erzgeb.'], ['08371 Glauchau'], ['08373 Remse'], ['08393 Meerane'], ['08396 Waldenburg'], ['08412 Werdau'], ['08427 Fraureuth'], ['08428 Langenbernsdorf'], ['08451 Crimmitschau'], ['08459 Neukirchen/Pleiße'], ['08468 Reichenbach im Vogtland'], ['08485 Lengenfeld'], ['08491 Netzschkau'], ['08496 Neumark'], ['08499 Mylau'], ['08523 Plauen'], ['08525 Plauen'], ['08527 Plauen'], ['08529 Plauen'], ['08538 Weischlitz'], ['08539 Mehltheuer'], ['08541 Neuensalz'], ['08543 Pöhl'], ['08547 Plauen'], ['08548 Syrau'], ['08606 Oelsnitz'], ['08626 Adorf'], ['08645 Bad Elster'], ['08648 Bad Brambach'], ['09111 Chemnitz'], ['09112 Chemnitz'], ['09113 Chemnitz'], ['09114 Chemnitz'], ['09116 Chemnitz'], ['09117 Chemnitz'], ['09119 Chemnitz'], ['09120 Chemnitz'], ['09122 Chemnitz'], ['09123 Chemnitz'], ['09125 Chemnitz'], ['09126 Chemnitz'], ['09127 Chemnitz'], ['09128 Chemnitz'], ['09130 Chemnitz'], ['09131 Chemnitz'], ['09212 Limbach-Oberfrohna'], ['09217 Burgstädt'], ['09221 Neukirchen/Erzgeb.'], ['09224 Chemnitz'], ['09228 Chemnitz'], ['09232 Hartmannsdorf'], ['09235 Burkhardtsdorf'], ['09236 Claußnitz'], ['09241 Mühlau'], ['09243 Niederfrohna'], ['09244 Lichtenau'], ['09247 Chemnitz'], ['09249 Taura'], ['09306 Erlau'], ['09322 Penig'], ['09326 Geringswalde'], ['09328 Lunzenau'], ['09337 Hohenstein-Ernstthal'], ['09350 Lichtenstein/Sa.'], ['09353 Oberlungwitz'], ['09355 Gersdorf'], ['09356 St. Egidien'], ['09366 Stollberg/Erzgeb.'], ['09376 Oelsnitz/Erzgeb.'], ['09380 Thalheim/Erzgeb.'], ['09385 Lugau/Erzgeb.'], ['09387 Jahnsdorf/Erzgeb.'], ['09390 Gornsdorf'], ['09392 Auerbach'], ['09394 Hohndorf'], ['09395 Hormersdorf'], ['09399 Niederwürschnitz'], ['09405 Zschopau'], ['09419 Thum'], ['09423 Gelenau/Erzgeb.'], ['09427 Ehrenfriedersdorf'], ['09429 Wolkenstein'], ['09430 Drebach'], ['09432 Großolbersdorf'], ['09434 Zschopau'], ['09435 Drebach'], ['09437 Waldkirchen/Erzgeb.'], ['09439 Amtsberg'], ['09456 Annaberg-Buchholz'], ['09465 Sehmatal'], ['09468 Geyer'], ['09471 Bärenstein'], ['09474 Crottendorf'], ['09477 Jöhstadt'], ['09481 Elterlein'], ['09484 Oberwiesenthal'], ['09487 Schlettau'], ['09488 Thermalbad Wiesenbad'], ['09496 Marienberg'], ['09509 Pockau'], ['09514 Lengefeld'], ['09517 Zöblitz'], ['09518 Großrückerswalde'], ['09526 Olbernhau'], ['09544 Neuhausen/Erzgeb.'], ['09548 Seiffen/Erzgeb.'], ['09557 Flöha'], ['09569 Oederan'], ['09573 Augustusburg'], ['09575 Eppendorf'], ['09577 Niederwiesa'], ['09579 Borstendorf'], ['09599 Freiberg'], ['09600 Oberschöna'], ['09603 Großschirma'], ['09618 Brand-Erbisdorf'], ['09619 Mulda/Sa.'], ['09623 Frauenstein'], ['09627 Bobritzsch'], ['09629 Reinsberg'], ['09633 Halsbrücke'], ['09634 Reinsberg'], ['09638 Lichtenberg/Erzgeb.'], ['09648 Mittweida'], ['09661 Hainichen'], ['09669 Frankenberg/Sa.']]
        });

        var timePeriod = new Ext.data.SimpleStore({
            fields : ['name'],
            data : [['daily']]
        });

        var viewParishTimeSeries = Ext.create('Ext.Button', {
            text : 'View time series',
            id : 'viewParish',
            hidden : false,
            margin : '10 30 10 30',
            handler : function() {
                createChart()
            }
        });

        viewport = Ext.create('Ext.container.Viewport', {
            layout : 'border',
            renderTo : document.body,
            padding : '0 80 0 80',
            items : [{//northern region: logo
                region : 'north',
                id : 'header',
                bodyPadding : '0 10 0 10',
                margin : '0 10 0 10',
                html : '<center><div id="logo"><div id="logo_text"><h1 class="stamp" id="title">Air pollution & risk in Saxony (Germany)</h1></div></div></center>'
            }, {//center section: map + slider part
                id : 'maps',
                region : 'center',
                layout : 'auto',
                xtype : 'panel',
                height : '100%',
                width : '100%',
                scope : this,
                bodyPadding : '0 0 0 0',
                margin : '0 0 0 5',
                listeners : {
                    resize : function() {// set map + slider sizes
                        Ext.getCmp('map').setHeight(this.getHeight() - sliderHeight - 10);
                        Ext.getCmp('slider_and_label').setWidth(this.getWidth() - playbutton.getWidth() - 30);
                        Ext.getCmp('label4slider').setWidth(this.getWidth() - playbutton.getWidth() - 30);
                        Ext.getCmp('slider').setWidth(Ext.getCmp('slider_and_label').getWidth() - 44);
                    }
                },
                items : [{//the map
                    id : 'map',
                    height : '100%',
                    width : '100%',
                    xtype : 'panel'
                }, 
                {
                    //slider + button panel
                    id : 'controlPanel',
                    minHeight : sliderHeight,
                    width : '100%',
                    xtype : 'panel',
                    layout : 'hbox',
                    bodyPadding : '10 0 0 0',
                    margin : '10 0 0 0',
                    items : [playbutton, {
                        xtype : 'panel',
                        id : 'slider_and_label',
                        layout : {
                            type : 'vbox',
                            align : 'fit'
                        },
                        defaults : {
                            cls : 'right'
                        },
                        items : [{
                            xtype : 'label',
                            id : 'label4slider',
                            text : '(...)'
                        }, {
                            xtype : 'panel',
                            layout : 'hbox',
                            items : [slidersubbutton, {
                                xtype : 'slider',
                                id : 'slider',
                                listeners : {
                                    changecomplete : function() {
                                        timeValueChanged();
                                    }
                                },
                                tipText : function() {
                                    return getLabelsTimeSlider();
                                }
                            }, slideraddbutton]
                        }]

                    }]
                }]

            }, {//BRGM Modification
                region : 'south',
                xtype : 'panel',
                bodyPadding : '0 0 0 0',
                margin : '0 0 0 0',
                id : 'southTEMP',
                html : 'Temporal resolution: <select id="temporalResolution" disabled><option value="daily">Daily'/* + '<option value="weekly">Weekly<option value="monthly">Monthly*/+'</select>' + ' | Starting date: <span id="startDate"></span> | End date: <span id="endDate"></span>'
            },
            //ADD BRGM 10-2012
            {
                region : 'east',
                width : 300,
                collapsible : false,
                split : true,
                layout : 'accordion',
                items : [{
                    title : 'LAYER MANAGER',
                    id : 'layerSwitcher',
                    html : '<div id="layerSwitcherCustom"></div>',
                    scope : this,
                    autoScroll : true
                },
                {
                    title : 'TIME SERIES',
                    styleHtmlContent : true,
                    autoScroll : true,
                    items : [
                    {
                        xtype : 'fieldset',
                        id : 'timeSeriesZIP',
                        title : 'Time series by postal code',
                        width : '100%',
                        items : [{
                            xtype : 'combobox',
                            store : parishList,
                            queryMode : 'local',
                            fieldLabel : 'Postal Code',
                            id : 'zipName',
                            displayField : 'name',
                            disableKeyFilter: true,
                            valueField: 'zip',
                            labelWidth : 100,
                            margin : '0 0 0 0',
                            autoSelect : true,
                            editable : true,
                            width : 250,
                            tpl: Ext.create('Ext.XTemplate', '<tpl for=".">','<div class="x-boundlist-item">{zip} - {name}</div>','</tpl>'),
                            displayTpl: Ext.create('Ext.XTemplate', '<tpl for=".">','{zip} - {name}','</tpl>'),
                            listeners : {
                                afterrender : function(combo) {
                                    var recordSelected = combo.getStore().getAt(0);
                                    combo.setValue(recordSelected);
                                },
                                select : function(combo, records, eOpts){
                                	console.log(Ext.getCmp("zipName").findRecordByValue(Ext.getCmp("zipName").getValue()).getData().name);
                                }
                            }
                        }, {
                            xtype : 'combobox',
                            store : timePeriod,
                            queryMode : 'local',
                            fieldLabel : 'Time aggregation',
                            id : 'parishAggregation',
                            displayField : 'name',
                            labelWidth : 100,
                            disabled: true,
                            margin : '10 0 10 0',
                            autoSelect : true,
                            editable : false,
                            width : 250,
                            listeners : {
                                afterrender : function(combo) {
                                    var recordSelected = combo.getStore().getAt(0);
                                    combo.setValue(recordSelected.get('name'));
                                }
                            }
                        }, viewParishTimeSeries]
                    }]
				},{
                    title : 'DEFINITIONS',
                    id : 'definition_accordion',
                    html : '',
                    scope : this,
                    autoScroll : true,
                    listeners:{
                    	beforeexpand: function(p, eOpts){
                    		openDefinitionWindow();
                    		return false;
                    	}
                    }
                },
                {
                    title : 'HELP',
                    id : 'help_accordion',
                    html : '',
                    scope : this,
                    autoScroll : true,
                    listeners:{
                    	beforeexpand: function(p, eOpts){
                    		openHelpWindow();
                    		return false;
                    	}
                    }
                }]
            },
            //FIN ADD 10-2012
            {
                //footer
                region : 'south',
                xtype : 'panel',
                bodyPadding : '10 10 0 10',
                margin : '10 10 0 10',
                id : 'south',
                html : '<div id="footer" class="stamp">designed @ <a href="http://www.brgm.fr/">BRGM</a> / <a href="http://tu-dresden.de/fgh/geo/gis">TUD</a> || <a href="#" id="impr_a">Legal notice</a>  || <a href="#" id="def_a">Definitions</a></div>'
            }],
            listeners : {
                afterlayout : function() {
                }
            }
        });

        chartWindow = Ext.create('Ext.window.Window', {
            title : 'EO2Heaven - Charts',
            closeAction : 'hide',
            id : 'chartWindow',
            modal: true,
            resizable: false,
            items : [{
                xtype : 'panel',
                id : 'chartPanel',
                height: 600,
                width: 800,
                layout : 'fit',
                html : '<div id="contentChart"></div>',
                styleHtmlContent : true
            }]
        });

        Ext.getCmp('southTEMP').setHeight(50);
        Ext.getCmp('map').setHeight(Ext.getCmp('maps').getHeight() - sliderHeight - 10);
        init('map');
        Ext.getCmp('map').body.setStyle('border', 'solid 3px #dfdfdf');
    }
});

Ext.onReady(function() {
    Ext.apply(Ext.form.field.VTypes, {
        DateRange : function(val, field) {
            var date = field.parseDate(val);

            if (!date) {
                return false;
            }
            if (field.startDateField && (!field.dateRangeMax || (date.getTime() != field.dateRangeMax.getTime()))) {
                var start = field.up(field.ownerCt.xtype).down('datefield[vfield=beginDate]');
                start.setMaxValue(date);
                start.validate();
                field.dateRangeMax = date;
            } else if (field.endDateField && (!field.dateRangeMin || (date.getTime() != field.dateRangeMin.getTime()))) {
                var end = field.up(field.ownerCt.xtype).down('datefield[vfield=endDate]');
                end.setMinValue(date);
                end.validate();
                field.dateRangeMin = date;
            }
            /*
             * Always return true since we're only using this vtype to set the
             * min/max allowed values (these are tested for after the vtype test)
             */
            return true;
        },
        DateRangeText : 'From date must be before To date'
    });
});
