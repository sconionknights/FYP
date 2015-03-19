var production = true;
var hostIP = "localhost";

var atm = [];
var axs = [];
var branch = [];
var other = [];
var deal = [];
var map;
var markerClusterATM;
var markerClusterAXS;
var markerClusterBranch;
var service = serviceManager.retrieveService();

var watchID = "";
var infoWind;
var geocoder;
var country = service.defaultCountry;
var countryDefault = country;
var firstInitialize = true;
var userPosition;

var language = service.defaultLanguage; // zh-Hans or en

var sliceDefault = 20;
var sliceStepDefault = 20;

var channelContent = [];
var dealContent = [];
var dealMobileContent = [];

var channelInfo = service.createInfoWindow();
var currentMarker;
var markerMap = {};
var currentPosition = {lat: 0, lng: 0};
var currentAddress = "";
var userKeyedAddress = "";

var distanceSort = false;
var geolocation;
var latitude;
var longitude;
var defaultQuery;
var defaultZoomLevel;
var appointmentAvailable;
var pano=null;


var directionsDisplay;
var directionsService;
var directionMarker = [];
var destLat;
var destLng;
var geoService;


// Setup the different icons and shadows
var iconURLPrefix = 'http://maps.google.com/mapfiles/ms/icons/';

var atmIcon = 'resources/img/pin/pin-atm-wb.png';
var axsIcon = 'resources/img/pin/pin-axs-wb.png';
var branchIcon = 'resources/img/pin/pin-branch-wb.png';
var dealIcon = 'resources/img/pin/pin-deal-wb.png';
var deal2Icon = iconURLPrefix + 'red-dot.png';
var defaultIcon = iconURLPrefix + 'blue-dot.png';
//var defaultIcon = 'resources/img/pin/pin-deal-wb.png';
var prevIcon = '';

var infowindow = service.createInfoWindow();

App = Ember.Application.create({
    //customEvents: {touchend: "click"}
});

App.Router.map(function () {
    /* put your routes here
     * something like the web.xml we have with Java
     * the path, '/' means that on the index page the application will render the 
     * channelDetail template, channelDetailRoute, channelDetailController (automatically inferred)
     */

    this.route("channelDetail", {path: "/"});  //overriding IndexRoute
    //this.resource('channelDetail', function(){
    //will retrieve models from the ChannelDetailRoute

    //});

});

App.ChannelDetailRoute = Ember.Route.extend({
    init: function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                distanceSort = true;
            });
        }


    },
    customEvents: {
        findDirectionsFromMarker: function (channelAddress) {
            this.get("controller").send("findDirections", channelAddress);
        }
    },
    model: function () {
        return this.store.find('channelDetail');
    }, /*
     afterModel: function (model, transition) {
     $('.loading-overlay').fadeOut();  
     },*/
    actions: {
        click: function () {
            this.sendAction();
        },
        refreshRoute: function () {
            this.refresh();
        }
    },
    setupController: function (controller, model) {
        this.controllerFor('application').set('model', model);
        this.controllerFor('channelDetail').set('model', model);
    }
});

App.ApplicationRoute = Ember.Route.extend({
    actions: {
        openModal: function (modalName, model) {
            this.controllerFor(modalName).set('model', model);
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },
        closeModal: function () {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }
});


App.ModalController = Ember.ObjectController.extend({
    actions: {
        close: function () {
            return this.send('closeModal');
        }
    }
});

App.ModalDialogComponent = Ember.Component.extend({
    actions: {
        close: function () {
            return this.sendAction();
        }
    }
});

App.ApplicationController = Ember.Controller.extend({
    needs: ['channelDetail'],
    countryToggle: country,
    selectedMarker: null,
    selectedItem: null,
    isLoaded: Ember.computed.alias('controllers.channelDetail.model.isLoaded'),
    actions: {
        toggleCountry: function (country) {
            //var countryToggle = this.get('countryToggle');
            this.set('countryToggle', country);
            this.set('selectedMarker', null);
            this.set('selectedItem', null);
            
        },
        selectMarker: function (id) {
            console.log(id);
			$("#searchBox").blur();
            if (this.get('selectedMarker') !== id) {

                this.set('selectedMarker', id);
                var item = this.store.find('channelDetail', id);
                this.set('selectedItem', item);

                this.set('listViewToggle', false);
                currentMarker = id;
			
                service.selectMarker(markerMap[this.get('selectedMarker')]);

            }

            if ($(window).width() >= 376) {
                toggleBarToggle(true);
                channelListToggle(true);
                resultListToggle(true);
                //$("#channelList").show();
                //$("#toggleBar").show();
            } else {
                //mobile version, hide resultList
                toggleBarToggle(false);
                channelListToggle(false);
                resultListToggle(false);
                //$("#toggleBar").hide();
                //$("#channelList").hide();
            }
        },
        lookupDirections: function (id) {
            var item = this.get('selectedItem');
            var channelDetailCtrl = this.get('controllers.channelDetail');

            Ember.debug('channelDetailCtrl: ' + channelDetailCtrl);
            channelDetailCtrl.send('findDirections', item.get('latitude'), item.get('longitude'), item.get('ownDesc'));
        }
    }
});
App.ApplicationAdapter = DS.RESTAdapter.extend({
    host: function () {
        if (production) {
            return 'http://onionknights.herokuapp.com/branchs?country=' + country + '&lang=' + language + '&channelType=ATM,AXS,Branch,McDonald%27s%20ATM%27s,In-Branch%20Priority%20Banking,SME%20Banking%20Desk,Priority%20Banking%20Centre';
        } else {
            return 'http://' + hostIP + ':5000/branchs?country=' + country + '&lang=' + language + '&channelType=ATM,AXS,Branch,McDonald%27s%20ATM%27s,In-Branch%20Priority%20Banking,SME%20Banking%20Desk,Priority%20Banking%20Centre';
        }

    }.property().volatile()
});


App.ChannelDetailSerializer = DS.RESTSerializer.extend({
    normalizeHash: {
        channelDetail: function (hash) {
            //id would be referenced with channelID of Json element
            //Ember Models will require a unique id
            hash.id = hash.channelID;
            hash.channelDetails = hash.channelDetail;
            delete hash.channelDetail;

            return hash;
        }
    }
});

var isATMToggled = true;
var isAXSToggled = false;
var isBranchToggled = true;
var isDealToggled = false;

App.ChannelDetailController = Ember.ArrayController.extend({
    needs: ['application'],
    service: service,
    countryToggle: Ember.computed.alias('controllers.application.countryToggle'),
    distanceSort: distanceSort,
    //distanceSort: false,
    sortProperties: ['distanceFromUser'],
    sortAscending: true,
    //instantiating controller variables
    atmToggle: true,
    axsToggle: true,
    branchToggle: true,
    dealToggle: false,
    listViewToggle: false,
    //channelDirectionsToggle: false,
    directionsResult: false,
    transportMode: 'DRIVING',
    drivingToggle: true,
    transitToggle: false,
    bicyclingToggle: false,
    walkingToggle: false,
    selectedMarker: Ember.computed.alias('controllers.application.selectedMarker'),
    selectedItem: Ember.computed.alias('controllers.application.selectedItem'),
    selectedLat: '',
    selectedLng: '',
    searchTerm: '',
    search: '',
    sliceNo: sliceDefault,
    sliceStep: sliceStepDefault,
    searchHasMore: false,
    channelHasMore: false,
    searchNo: 0,
    channelNo: 0,
    //user location
    //userLat: 0,
    //userLng: 0,
    modelLat: 0,
    modelLng: 0,
    locationA: '',
    locationB: '',
    userPosition: userPosition,
    onFilterTextChange: function () {
        // wait 1 second before applying the filter
        Ember.run.debounce(this, this.applySearchFilter, 400);
        //showResults();
    }.observes('searchTerm'),
    applySearchFilter: function () {
        this.set('search', this.get('searchTerm'));
    },
    searchFilter: function () {
        var array;
        if (distanceSort) {
            array = this.get('arrangedContent');
        } else {
            array = this.get('model');
        }

        var search = this.get('search');
        if (search !== '') {
            this.send('closeDirection');
            $("#channelList").show();
            //this.set('sliceNo', sliceDefault);
            var regex = new RegExp(search, 'i');
            var atmToggle = this.get('atmToggle');
            var axsToggle = this.get('axsToggle');
            var branchToggle = this.get('branchToggle');
            var searchResults = array.filter(function (channel) {
                return ((channel.get('channelName').match(regex) ||
                        channel.get('ownDesc').match(regex) ||
                        channel.get('channelType').match(regex)) && (channel.get('channelType') === "ATM" && atmToggle))
                        + ((channel.get('channelName').match(regex) ||
                                channel.get('ownDesc').match(regex) ||
                                channel.get('channelType').match(regex)) && (channel.get('channelType') === "AXS" && axsToggle))
                        + ((channel.get('channelName').match(regex) ||
                                channel.get('ownDesc').match(regex) ||
                                channel.get('channelType').match(regex)) && (channel.get('channelType') === "Branch" && branchToggle));
            }).toArray().sort(function (a, b) {
                return a.get('distanceFromUser') - b.get('distanceFromUser');
            });
            this.set('searchNo', searchResults.length);
            //console.log(this.get('searchNo'));
            //showResults();
            var sliceNo = this.get('sliceNo');
            var searchNo = this.get('searchNo');
            //console.log('searchNo:' + searchNo + ', sliceNo:' + sliceNo);
            if (searchNo < sliceNo) {
                this.set('searchHasMore', false);
            } else {
                this.set('searchHasMore', true);
            }

            return searchResults.slice(0, this.get('sliceNo'));
            
        } else {
            //this.set('sliceNo', sliceDefault);
            //closeResults();
            //$("#channelList").hide();
            var atmToggle = this.get('atmToggle');
            var axsToggle = this.get('axsToggle');
            var branchToggle = this.get('branchToggle');

            var channelResults = array.filter(function (channel) {
                var type = channel.get('channelType');

                if (type === 'ATM') {
                    //console.log(atmToggle);
                    return type === "ATM" && atmToggle;
                } else if (type === 'AXS') {
                    return type === "AXS" && axsToggle;
                } else if (type === 'Branch') {
                    return type === "Branch" && branchToggle;
                } else {
                    return false;
                }
            }).toArray();
            this.set('channelNo', channelResults.length);

            var sliceNo = this.get('sliceNo');
            var channelNo = this.get('channelNo');
            //console.log('channeNo:' + channelNo + ', sliceNo:' + sliceNo);
            if (channelNo < sliceNo) {
                this.set('channelHasMore', false);
            } else {
                this.set('channelHasMore', true);
            }

            return channelResults.slice(0, this.get('sliceNo'));


        }

    }.property('model', 'arrangedContent', 'search', 'atmToggle', 'axsToggle', 'branchToggle', 'sliceNo', 'searchNo', 'searchHasMore', 'channelNo', 'channelHasMore', 'isLoaded'),
    channelFilter: function () {
        var array;
        if (distanceSort) {
            array = this.get('arrangedContent');
        } else {
            array = this.get('model');
        }

        var search = this.get('search');

    }.property('model', 'arrangedContent', 'search', 'atmToggle', 'axsToggle', 'branchToggle', 'sliceNo', 'channelNo', 'channelHasMore', 'isLoaded'),
    mapPan: function () {
        
        var search = this.get('search');
        if (!isNullOrWhitespace(search)) {
            if (country !== "" && country !== 'cn') {
                service.mapPan(map, {'address': search + "," + country});
            } else {
                service.mapPan(map, {'address': search});
            }
        } else {
            map.setCenter(userPosition);
        }

    }.observes('search'),
    actions: {
        toggleCountry: function (country2) {
            if (country2 === "none") {
                alert("Sorry, only China is available in Baidu Maps.");
            } else {
                //var countryToggle = this.get('countryToggle');
                this.set('countryToggle', country2);
                country = country2;

                //this.store.
                //this.store.find('channelDetail');
                this.send('refreshRoute');
            }

        },
        toggleATM: function () {
            var atmToggle = this.get('atmToggle');
            if (atmToggle) {
                //isATMToggled = false;

                /*for (var i=0;i<atm.length;i++){
                 atm[i].setMap(null);
                 }*/
                $("#atmToggle").attr("src", "./resources/img/pin/pin-atm-blackwhite.png");
                markerClusterATM.clearMarkers();
                this.set('atmToggle', false);
            } else {
                /*for (var i=0;i<atm.length;i++){
                 atm[i].setMap(map);
                 }*/
                $("#atmToggle").attr("src", "./resources/img/pin/pin-atm-tick.png");
                markerClusterATM.addMarkers(atm);
                this.set('atmToggle', true);
            }
        },
        toggleAXS: function () {
            var axsToggle = this.get('axsToggle');
            if (axsToggle) {
                //isAXSToggled = false;
                /*for (var i=0;i<axs.length;i++){
                 axs[i].setMap(null);
                 }*/
                $("#axsToggle").attr("src", "./resources/img/pin/pin-axs-blackwhite.png");
                markerClusterAXS.clearMarkers();
                this.set('axsToggle', false);
            } else {
                /*for (var i=0;i<axs.length;i++){
                 axs[i].setMap(map);
                 }*/
                $("#axsToggle").attr("src", "./resources/img/pin/pin-axs-tick.png");
                markerClusterAXS.addMarkers(axs);
                this.set('axsToggle', true);
            }
        },
        toggleBranch: function () {
            var branchToggle = this.get('branchToggle');
            if (branchToggle) {
                //isBranchToggled = false;
                /*for (var i=0;i<branch.length;i++){
                 branch[i].setMap(null);
                 }*/
                $("#branchToggle").attr("src", "./resources/img/pin/pin-branch-blackwhite.png");
                markerClusterBranch.clearMarkers();
                this.set('branchToggle', false);
            } else {
                /*for (var i=0;i<branch.length;i++){
                 branch[i].setMap(map);
                 }*/
                $("#branchToggle").attr("src", "./resources/img/pin/pin-branch-tick.png");
                markerClusterBranch.addMarkers(branch);
                this.set('branchToggle', true);
            }
        },
        toggleDeal: function () {
            var dealToggle = this.get('dealToggle');
            if (dealToggle) {

                for (var i = 0; i < deal.length; i++) {
                    deal[i].setMap(null);
                }
                this.set('dealToggle', false);
            } else {
                for (var i = 0; i < deal.length; i++) {
                    deal[i].setMap(map);
                }

                this.set('dealToggle', true);
            }
        },
        toggleChannelDirections: function () {
            var channelDirectionsToggle = this.get('channelDirectionsToggle');

            if (channelDirectionsToggle) {
                this.set('channelDirectionsToggle', false);
            } else {
                this.set('channelDirectionsToggle', true);
            }
        },
        toggleDriving: function () {
            var drivingToggle = this.get('drivingToggle');
            if (!drivingToggle) {
                this.set('transportMode', 'DRIVING');
                this.set('drivingToggle', true);
                this.set('transitToggle', false);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', false);
                if (currentAddress !== '' || country === "cn") {
                    this.send('renderDirections');
                }
            }
        },
        toggleTransit: function () {
            var transitToggle = this.get('transitToggle');
            if (!transitToggle) {
                this.set('transportMode', 'TRANSIT');
                this.set('drivingToggle', false);
                this.set('transitToggle', true);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', false);
                if (currentAddress !== '' || country === "cn") {
                    this.send('renderDirections');
                }
            }
        },
        toggleBicycling: function () {
            var bicyclingToggle = this.get('bicyclingToggle');
            if (!bicyclingToggle) {
                this.set('transportMode', 'BICYCLING');
                this.set('drivingToggle', false);
                this.set('transitToggle', false);
                this.set('bicyclingToggle', true);
                this.set('walkingToggle', false);
                if (currentAddress !== '') {
                    this.send('renderDirections');
                }
            }
        }, toggleWalking: function () {
            var walkingToggle = this.get('walkingToggle');
            if (!walkingToggle) {
                this.set('transportMode', 'WALKING');
                this.set('drivingToggle', false);
                this.set('transitToggle', false);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', true);
                if (currentAddress !== '' || country === "cn") {
                    this.send('renderDirections');
                }
            }
        },
        showToggleBar: function () {
            $("#resultList").hide();
            $("#channelList").hide();
            $("#toggleBar").slideToggle('fast');
        },
        toggleListView: function () {
            /* var listViewToggle = this.get('listViewToggle');
             if (listViewToggle) {
             this.set('listViewToggle',false);
             } else {
             this.set('listViewToggle',true);
             }
             */
            //$("#toggleBar").hide();

            $("#channelList").slideToggle();
        },
        selectMarker: function (item) {
            //this.controllerFor('application').selectMarker(id);
            //$("#resultList").slideToggle();
            var appCtrl = this.get('controllers.application');
            this.set('selectedItem', item);
            appCtrl.send('selectMarker', item.id);

        },
        isSelectedMarker: function (id) {
            return id === this.get('selectedMarker');
        },
        toUserLocation: function () {
            map.panTo(latitude, longitude);
        },
        findDirections: function (destLat, destLng, channelAddress) {
            this.send("showDirection");
            //this.send('toggleChannelDirections');
            if (userKeyedAddress !== '') {
                this.set('locationA', userKeyedAddress);
            } else {
                this.set('locationA', currentAddress);
            }
            this.set('locationB', channelAddress);
            //$("#locationA").val(currentAddress);
            //$("#locationB").val(channelAddress);
            this.destLat = destLat;
            this.destLng = destLng;
            //if (currentAddress !== '') {
            this.send('renderDirections');
            //}
        },
        renderDirections: function () {
            this.send("clearDirectionMarkers");
			$("#searchBox").blur();
            //service.directionsDisplay.setMap(map);
            var start = this.get('locationA');
            if (start !== currentAddress) {
                userKeyedAddress = this.get('locationA');
            }
            var end = this.get('locationB');
            //var start=$("#locationA").val();
            //var end=$("#locationB").val();

            //$("#directionsSearch").slideUp();
            if (start == "") {
                start = $("#locationA").val();
            }

            if (end == "") {
                end = $("#locationB").val();
            }
            var transportMode = this.get('transportMode');
            service.renderDirections(map, transportMode, start, end, this.destLat, this.destLng, $('#directionsPanel'));
        },
        closeDirection: function () {
			if($("searchBox").val()!=""){
				showResults();
			}
            this.send("clearDirectionMarkers");

            hideDirections();
        },
        showDirection: function () {
            if ($("#directions").css('display') != 'none') {
                this.send("closeDirection");
            }

            $("#directions").show();
        },
        clearDirectionMarkers: function () {
            service.clearDirections(map, directionMarker);
        },
        showAdvancedSearch: function () {
            $("#directionsSearch").slideToggle('fast');
        },
        populateDirectionSteps: function (start_location) {
            service.populateDirectionSteps(map, start_location, directionMarker, undefined)
        },
        showMore: function () {
            var sliceNo = this.get('sliceNo');
            var sliceStep = this.get('sliceStep');
            var channelHasMore = this.get('channelHasMore');
            if (channelHasMore) {
                this.set('sliceNo', sliceNo + sliceStep);
            }
        },
        sortBy: function (property) {
            this.set('sortProperties', [property]);
            this.set('sortAscending', !this.get('sortAscending'));
        },
        sortDistance: function () {
            this.set('sortProperties', 'distanceFromUser');
            this.set('sortAScending', true);
        }

    }

});

App.ChannelDetailView = Ember.View.extend({
    didInsertElement: function () {
        // we want to make sure 'this' inside `didScroll` refers
        // to the IndexView, so we use jquery's `proxy` method to bind it
        $("#channelList").on('scroll', $.proxy(this.didScroll, this));
        console.log('binded');
    },
    willDestroyElement: function () {
        // have to use the same argument to `off` that we did to `on`
        $("#channelList").off('scroll', $.proxy(this.didScroll, this));
        console.log('unbinded');
    },
    // this is called every time we scroll
    didScroll: function () {
        //console.log('scrolling');
        if (this.isScrolledToBottom()) {
            this.get('controller').send('showMore');
        }
    },
    // we check if we are at the bottom of the page
    isScrolledToBottom: function () {
        var distanceToViewportTop =
                $("#channelList")[0].scrollHeight - $(".side-panel").height();

        var viewPortTop = $("#channelList").scrollTop();

        if (viewPortTop === 0) {
            // if we are at the top of the page, don't do
            // the infinite scroll thing
            return false;
        }

        //console.log(viewPortTop - distanceToViewportTop);
        return (viewPortTop - distanceToViewportTop === 102);
    }
});

Ember.Handlebars.registerHelper('ifeq', function (a, b, options) {
    //handlebars helper for us to use ifeq for comparisons within the {{ }} for our html
    return Ember.Handlebars.bind.call(options.contexts[0], a, options, true, function (result) {
        return result === b;
    });
});

Ember.Handlebars.registerBoundHelper('highlight', function (value, options) {
    var filter = options.hash.filter;
    var regex = new RegExp(filter, "gi");
    formattedTag = value.replace(regex, "<span class='highlight'>$&</span>");
    return new Handlebars.SafeString(formattedTag);
});

//handlebars group-helper
var get = Ember.get, set = Ember.set, EmberHandlebars = Ember.Handlebars;
EmberHandlebars.registerHelper('group', function (options) {
    var data = options.data,
            fn = options.fn,
            view = data.view,
            childView;

    childView = view.createChildView(Ember._MetamorphView, {
        context: get(view, 'context'),
        template: function (context, options) {
            options.data.insideGroup = true;
            return fn(context, options);
        }
    });

    view.appendChild(childView);
});

Handlebars.registerHelper('convert', function (descriptionFunction) {
    text = descriptionFunction;
    text = Handlebars.Utils.escapeExpression(text);
    text = text.toString();
    text = text.replace('?', '-');
    return new Handlebars.SafeString(text);
});
//defining the ChannelDetail Model. 
App.ChannelDetail = DS.Model.extend({
    channelID: DS.attr('string'),
    channelName: DS.attr('string'),
    channelType: DS.attr('string'),
    latitude: DS.attr('number'),
    longitude: DS.attr('number'),
    opHours: DS.attr('string'),
    formattedOpHours: function() {
        return this.get('opHours').replace(/\?/g,'-');
    }.property('opHours'),
    ownDesc: DS.attr('string'),
    services: DS.attr('string'),
    telephone: DS.attr('string'),
    channelDetails: DS.attr('string'),
    distanceFromUser: function () {

        var userLat = currentPosition.lat;
        var userLng = currentPosition.lng;


        var locationLat = this.get('latitude');
        var locationLng = this.get('longitude');
        //this.set('distanceFromUser', distance);

//		var modelPos = new google.maps.LatLng(locationLat, locationLng);
//		var userPos = new google.maps.LatLng(userLat,userLng);
        //var distance = google.maps.geometry.spherical.computeDistanceBetween(userPos, modelPos);
        var distance = getDistanceFromLatLonInKm(userLat, userLng, locationLat, locationLng);

        return parseFloat(distance.toFixed(2));
        ////new attribute created. to be determined when rendering list
    }.property('latitude', 'longitude')
});


App.inject('component', 'store', 'store:main');
App.inject('view', 'store', 'store:main');


App.GoogleMapsComponent = Ember.Component.extend({
    customEvents: {touchend: "click"},
    countryToggle: null,
    sMarker: null,
    insertMap: function () {
        mapsView = this;
        console.log("MAP INSERT");
        var sidePanelToggle = getParameter("showPanel");

        if (sidePanelToggle === "false") {
            $(".side-panel").hide();
        }



        //this.store.fetch();
        //this.store.unloadAll('channelDetail');
        //this.store.findAll('channelDetail');

        closeInfo(); //hide MobileInfoBox onload
        closeResults();
        var container = this.$(".map-canvas");

        var directionsList = this.$(".directionsPanel");



        service.appDefault(this.get('countryToggle'));
        map = service.initializeMap(container[0], latitude, longitude, document.getElementById('directionsPanel'));


        markerClusterATM = service.getMarkerClusterer(map, atm);
        markerClusterAXS = service.getMarkerClusterer(map, axs);
        markerClusterBranch = service.getMarkerClusterer(map, branch);

        markerClusterATM.setMaxZoom(13);
        markerClusterAXS.setMaxZoom(15);
        markerClusterBranch.setMaxZoom(7);

        //markerClusterATM.setMap(map);
        //markerClusterAXS.setMap(map);
        //markerClusterBranch.setMap(map);

        //location control
        var userLocationControlDiv = document.createElement('div');
        service.addLocationControl(userLocationControlDiv, map);

        var GeoMarker;
        service.geoAttempt(map);
        /*
        if (country == service.defaultCountry) {
            console.log("Country: " + country);
            console.log("Default Country:" + service.defaultCountry);
            service.geoAttempt(map);
        }*/
        /*directionsService = service.initializeDirectionsService();
         directionsDisplay = service.initializeDirectionsDisplay(map,document.getElementById('directionsPanel'));
         */

        window.addEventListener('resize', resizeToScreen(container));
        //this.afterModelLoad();
    }, //.on('didInsertElement')

    afterModelLoad: function () {

        if (getParameter("channelID") != undefined) {
            //filter to the appropriate channel ID
        } else {
            if (this.get('countryToggle') === countryDefault && firstInitialize) {
                // retrieve locations (ChannelDetail Models) from Local Store (database)
                locations = this.store.all('channelDetail');

                //iterating every Channel Model in store, and inserting them to the maps.
                locations.forEach(function (location) {
                    //arguments to be passed into the createMarker(latlng, channelName, channelAdd, channelHrs, type, markerId) method
                    createMarker(
                            location.get('latitude'), location.get('longitude'),
                            location.get('channelName'),
                            location.get('ownDesc'),
                            location.get('formattedOpHours').trim(),
                            location.get('channelType'),
                            location.get('channelID'));

                }, this);

                markerClusterATM.addMarkers(atm);
                markerClusterAXS.addMarkers(axs);
                markerClusterBranch.addMarkers(branch);

                firstInitialize = false;


            } else {
                //unloading Local Store, remove channelDetails of "old" country

                this.store.unloadAll('channelDetail');
                //            TO BE CONTINUED
                //            if (countryDefault === 'cn' && this.get('countryToggle') !== 'cn'){
                //			$("#channelList").hide();
                //            } else{
                if (countryDefault !== 'cn' || (countryDefault === 'cn' && this.get('countryToggle') === 'cn')) {
                    // retrieve locations (ChannelDetail Models) from API, refreshing Store (database)
                    this.store.find('channelDetail').then(function (locations) {

                        atm = [];
                        axs = [];
                        branch = [];

                        //iterating every Channel Model in store, and inserting them to the maps.
                        locations.forEach(function (location) {

                            //arguments to be passed into the createMarker(latlng, channelName, channelAdd, channelHrs, type, markerId) method
                            createMarker(
                                    location.get('latitude'), location.get('longitude'),
                                    location.get('channelName'),
                                    location.get('ownDesc'),
                                    location.get('formattedOpHours').trim(),
                                    location.get('channelType'),
                                    location.get('channelID'));

                        }, this);

                        markerClusterATM.clearMarkers();
                        markerClusterAXS.clearMarkers();
                        markerClusterBranch.clearMarkers();

                        markerClusterATM.addMarkers(atm);
                        markerClusterAXS.addMarkers(axs);
                        markerClusterBranch.addMarkers(branch);

                    });
                }
                
                if (country == service.defaultCountry) {
                    service.geoAttempt(map);
                    console.log('attempt');
                }

            }
        }
        //retrieving Deals API, iterating every Deal and inserting them to the maps.
        getAllDeals();

        function createMarker(lat, lng, channelName, channelAdd, channelHrs, type, markerId) {
            var marker = service.createMarker(lat, lng, map, channelName, channelAdd, channelHrs, type, markerId, infowindow, getMarkerImage(type));
            if (type === 'ATM') {
                atm.push(marker);
            } else if (type === 'AXS') {
                axs.push(marker);
            } else if (type === 'Branch') {
                branch.push(marker);
            } else {
                other.push(marker);
            }

            markerMap[markerId] = marker;
            //markerArray.push(marker); //push local var marker into global array
        }
        function getMarkerImage(type) {
            if (type === 'ATM') {
                return atmIcon;
            } else if (type === 'AXS') {
                return axsIcon;
            } else if (type === 'Branch') {
                return branchIcon;
            } else {
                return defaultIcon;
            }

        }

        service.panToRegion(map, country);
        



    }.observes('countryToggle', 'isLoaded'),
    init: function () {
        var view = this;

        var resizeHandler = function () {
            resizeToScreen(view.$(".map-canvas"));

        };

        this.set('resizeHandler', resizeHandler);
        $(window).bind('resize', this.get('resizeHandler'));


    },
    didInsertElement: function () {
        this.insertMap();
        /*App.addObserver('countryToggle', this.insertMap(), function() {
         console.log('countryToggle changed');
         });
         */


    },
    willDestroy: function () {
        $(window).unbind('resize', this.get('resizeHandler'));
    },
});

App.InfoWindowComponent = Ember.Component.extend({
    customEvents: {touchend: "click"},
    selectedMarker: null,
    item: null,
    detailRefresh: function () {


    }.observes('selectedMarker'), //.on('didInsertElement')
    actions: {
        mobileDirections: function (selectedMarker) {
            console.log(selectedMarker);
            this.sendAction('action', 'param');
        }
    },
    didInsertElement: function () {
        this.detailRefresh();
        /*App.addObserver('countryToggle', this.insertMap(), function() {
         console.log('countryToggle changed');
         });
         */
    },
    willDestroy: function () {

    }
});

function toggleBarToggle(show) {
    if (show) {
        $("#toggleBar").slideDown();
    } else {
        $("#toggleBar").slideUp();
    }
}
function channelListToggle(show) {
    if (show) {
        $("#channelList").slideDown();
    } else {
        $("#channelList").slideUp();
    }
}
function resultListToggle(show) {
    if (show) {
        $("#resultList").slideDown();
    } else {
        $("#resultList").slideUp();
    }
}
function errorHandler(error) {
    //alert("Please turn on your GPS before using this feature");
    //should default by prompting the GPS?
    geolocation = false;
}

function scrollTo(channelId) {
    $(".side-panel#channelList").scrollTo("#15915");
}

function closeInfo() {
    $(".info-panel").hide();

}

function closeResults() {
    $("#resultList").hide();
}

function showResults() {
    $("#resultList").show();
}

function openInfo(content) {
    $(".info-panel").html('');
    $(".info-panel").html(content);
    $(".info-panel").show();
}

$(window).scroll(function () {
    if ($(this).scrollTop() > 0) {
        // apply effects and animations
        console.log($(window).height());
    }
});

function resizeToScreen(container) {
    if (container && map) {
        var currentPos = map.getCenter();
        var width = window.innerWidth * 0.84;
        var height = window.innerHeight * 0.85;
        /*if(container){
         console.log(container);
         container.css({'width':width,'height':height});
         }*/
        //google.maps.event.trigger(map,'resize');
        service.mapResize();
        console.log($(window).width());
        if ($(window).width() >= 376) {
            $("#channelList").show();
            $("#toggleBar").show();
        } else {
            $("#toggleBar").hide();
            $("#channelList").hide();
        }
        map.setCenter(currentPos);
        map.panTo(currentPos);
    }
}


function map_recenter(latlng, offsetx, offsety) {
    var point1 = map.getProjection().fromLatLngToPoint(
            (latlng instanceof google.maps.LatLng) ? latlng : map.getCenter()
            );
    var point2 = new google.maps.Point(
            ((typeof (offsetx) == 'number' ? offsetx : 0) / Math.pow(2, map.getZoom())) || 0,
            ((typeof (offsety) == 'number' ? offsety : 0) / Math.pow(2, map.getZoom())) || 0
            );
    map.panTo(map.getProjection().fromPointToLatLng(new google.maps.Point(
            point1.x - point2.x,
            point1.y + point2.y
            )));
}

function UserLocationControl(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map
    controlDiv.style.padding = '10px';

    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';

    controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.298039) 0px 1px 4px -1px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.style.borderBottomLeftRadius = '2px';
    controlUI.style.borderTopLeftRadius = '2px';

    controlUI.style.border = '1px solid rgb(113, 123, 135)';

    controlUI.title = 'Show my location';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.fontFamily = 'Roboto, Arial, sans-serif';
    controlText.style.fontSize = '11px';
    controlText.style.padding = '1px 1px';
    controlText.innerHTML = '<b><img class="location-icon" src="resources/img/web/location.png"></img></b>';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to user position

    service.addLocationControlAction(map, userPosition, controlUI);


}

function updateLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var myLatlng = new google.maps.LatLng(latitude, longitude);
    //infoWind.close();
    //addInfoWindow(myLatlng);
    //map.setCenter(myLatlng);
    //map.panTo(myLatlng);
    userPosition = myLatlng;

}

function getCountry(results) {

    for (var i = 0; i < results[0].address_components.length; i++)
    {
        var shortname = results[0].address_components[i].short_name;
        var longname = results[0].address_components[i].long_name;
        var type = results[0].address_components[i].types;
        if (type.indexOf("country") !== -1)
        {
            if (!isNullOrWhitespace(shortname))
            {
                return shortname;
            }
            else
            {
                return longname;
            }
        }
    }
}

function isNullOrWhitespace(text) {
    if (text === null) {
        return true;
    }
    return text.replace(/\s/gi, '').length < 1;
}

//Deals
function getAllDeals() {
    //var url="http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getAllDeals";
    var url = "http://" + hostIP + ":8084/ATMLocatorWebService/getAllDeals";
    if (production) {
        url = "http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getAllDeals";
    }
    //option to parse in query strings using offerdetails? + queryString. 
    //var url="http://localhost:8084/ATMLocatorWebService/offerdetails?country=SG&lang=en&deviceId=0&offerVersion=0&couponVersion=0&categoryVersion=0";
    //var url="http://atm-onionknights.rhcloud.com/ATMLocatorWebService/offerdetails?country=SG&lang=en&deviceId=0&offerVersion=0&couponVersion=0&categoryVersion=0";


    $.getJSON(url).done(function (data) {
        populateDeals(data);
        return;
    });
}

function populateDeals(response) {

    if (response !== undefined) {
        var jsonObj = response.offer.added.list;
        var i;
        var outletcount = 0;
        for (i = 0; i < jsonObj.length; i++) {
            var outlets = jsonObj[i].outletList;
            if (outlets !== undefined) {
                for (var e = 0; e < outlets.length; e++) {
                    outletcount++;
                    var myLatlng = new google.maps.LatLng(outlets[e].latitude, outlets[e].longitude);

                    var marker = new google.maps.Marker({
                        position: myLatlng,
                        icon: dealIcon,
                        title: outlets[e].outletName,
                        clickable: true
                    });
                    deal.push(marker);
                    //info establish

                    var content = '<h5><b>'
                            + jsonObj[i].merchantName
                            + '</b></h5><b>Deal:</b><br/>'
                            + jsonObj[i].promoDesc
                            + '<br/><a href="https://www.sc.com/sg/thegoodlife/#offer?offerid=' + jsonObj[i].offerID
                            + '" target=_blank><i>Click here for more information</i></a><br/><br/></div>';

                    var mContent = '<h5><b>'
                            + jsonObj[i].merchantName
                            + '</b></h5><div class="mobile-hidden"><b>Deal:</b><br/>'
                            + jsonObj[i].promoDesc
                            + '<br/><a href="https://www.sc.com/sg/thegoodlife/#offer?offerid=' + jsonObj[i].offerID
                            + '" target=_blank><i>Click here for more information</i></a><br/><br/></div></div>';

                    dealContent.push(content);
                    dealMobileContent.push(mContent);
                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                        return function () {
                            if (channelInfo) {
                                closeInfo();
                                closeResults();
                                channelInfo.close();
                                //marker.setIcon(prevIcon);
                            }
                            //prevIcon = marker.getIcon();
                            //marker.setIcon('https://www.google.com/mapfiles/marker_black.png');
                            openInfo('<div id="mInfoWindow">' + dealContent[i] + '</div>');
                            channelInfo.setContent('<div id="infoWindow" class="">' + dealMobileContent[i]);
                            //map_recenter(marker.getPosition(),150,-50); //offset 150 to the right, and 50px upwards (due to side panel)
                            map.panTo(marker.getPosition());
                            channelInfo.open(map, marker);

                        };
                    })(marker, i));


                }

            }
        }
    }
}

function panToDirectionMarker(pos) {
    if ((!(pos < 0 | pos >= directionMarker.length)) && (directionMarker[pos] != null)) {
        service.panToDirectionMarker(map, pos, directionMarker);
    }

}

function resetDirectionMarker() {
    for (var i = 0; i < directionMarker.length; ++i) {
        directionMarker[i].setMap(null);
    }
}

function findDirectionsFromMarker(lat, lng, channelAddress) {
    //$.event.trigger("findDirections",channelAddress);

    service.renderDirections(map, "DRIVING", currentAddress, channelAddress, lat, lng, $('#directionsPanel'));

    $("#directions").show();
    $("#locationA").val(currentAddress);
    $("#locationB").val(channelAddress);
}

function hideDirections() {
    $("#directions").hide();
}

function getParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}

//Haversine formula to calculate the distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function tog(v) {
    return v ? 'addClass' : 'removeClass';
}
$(document).on('input', '.clearable', function () {
    $(this)[tog(this.value)]('x');
}).on('mousemove', '.x', function (e) {
    $(this)[tog(this.offsetWidth - 30 < e.clientX - this.getBoundingClientRect().left)]('onX');
}).on('click', '.onX', function () {
    $(this).removeClass('x onX').val('').change();
});

