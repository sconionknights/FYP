
var atm = [];
var axs = [];
var branch = [];
var other = [];
var deal = [];
var map;
var markerClusterATM;
var markerClusterAXS;
var markerClusterBranch;


var watchID;
var infoWind;
var geocoder = new BMap.Geocoder();
var country = 'cn';
var countryDefault = country;
var firstInitialize = true;
var userPosition;

var sliceDefault = 50;
var sliceStepDefault = 50;

var channelContent = [];
var dealContent = [];
var channelInfo = new BMap.InfoWindow();
var currentMarker;
var markerMap = {};
var currentAddress = "";


var geolocation;
var latitude;
var longitude;
var defaultQuery;
var defaultZoomLevel;
var appointmentAvailable;


var directionsDisplay;
var directionsService;
var directionMarker = [];
var directionLine;
var startPoint;
var endPoint;


// Setup the different icons and shadows
var iconURLPrefix = 'http://maps.google.com/mapfiles/ms/icons/';

var atmIcon = 'resources/img/pin/pin-atm-wb.png';
var axsIcon = 'resources/img/pin/pin-axs-wb.png';
var branchIcon = 'resources/img/pin/pin-branch-wb.png';
var dealIcon = 'resources/img/pin/pin-deal-wb.png';
var deal2Icon = iconURLPrefix + 'red-dot.png';
var defaultIcon = iconURLPrefix + 'blue-dot.png';
var prevIcon = '';

var infowindow = new BMap.InfoWindow("");

App = Ember.Application.create();

App.Router.map(function() {
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
    customEvents: {
        findDirectionsFromMarker: function(channelAddress) {
            this.get("controller").send("findDirections", channelAddress);
        }
    },
    model: function() {
        return this.store.find('channelDetail');
    },
    afterModel: function(model, transition) {
        //$('.loading-overlay').fadeOut();  
    },
    actions: {
        click: function() {
            this.sendAction();
        },
        refreshRoute: function() {
            this.refresh();
        }
    }
});

App.ApplicationRoute = Ember.Route.extend({
    actions: {
        openModal: function(modalName, model) {
            this.controllerFor(modalName).set('model', model);
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },
        closeModal: function() {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }
});


App.ModalController = Ember.ObjectController.extend({
    actions: {
        close: function() {
            return this.send('closeModal');
        }
    }
});

App.ModalDialogComponent = Ember.Component.extend({
    actions: {
        close: function() {
            return this.sendAction();
        }
    }
});

App.ApplicationController = Ember.Controller.extend({
    countryToggle: country,
    actions: {
        toggleCountry: function(country) {
            //var countryToggle = this.get('countryToggle');
            this.set('countryToggle', country);

        }
    }
});
App.ApplicationAdapter = DS.RESTAdapter.extend({
    host: function() {
        return 'http://localhost:8084/ATMLocatorWebService/branchs?country=' + country + '&lang=en&channelType=ATM,AXS,Branch,McDonald%27s%20ATM%27s,In-Branch%20Priority%20Banking,SME%20Banking%20Desk,Priority%20Banking%20Centre';

        // return 'http://atm-onionknights.rhcloud.com/ATMLocatorWebService/branchs?country=' + country + '&lang=en&channelType=ATM,AXS,Branch,McDonald%27s%20ATM%27s,In-Branch%20Priority%20Banking,SME%20Banking%20Desk,Priority%20Banking%20Centre';
    }.property().volatile()
});


App.ChannelDetailSerializer = DS.RESTSerializer.extend({
    normalizeHash: {
        channelDetail: function(hash) {
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
var isAXSToggled = true;
var isBranchToggled = true;
var isDealToggled = false;

App.ChannelDetailController = Ember.ArrayController.extend({
    needs: ['application'],
    countryToggle: Ember.computed.alias('controllers.application.countryToggle'),
    //instantiating controller variables
    atmToggle: true,
    axsToggle: true,
    branchToggle: true,
    dealToggle: false,
    listViewToggle: false,
    searchFilter: [],
    //channelDirectionsToggle: false,
    directionsResult: false,
    transportMode: 'DRIVING',
    drivingToggle: true,
    transitToggle: false,
    bicyclingToggle: false,
    walkingToggle: false,
    selectedMarker: '',
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
    onFilterTextChange: function() {
        // wait 1 second before applying the filter
        Ember.run.debounce(this, this.applySearchFilter, 350);
        showResults();
    }.observes('searchTerm'),
    applySearchFilter: function() {
        this.set('search', this.get('searchTerm'));
    },
    searchFilter: function() {
        var con = this;
        var search = this.get('search');
        if (search !== '') {
            this.send('closeDirection');
            /*BAIDU: translation*/
            var searchValue = "";
            var translateUrl = "http://localhost:5000/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + search + "&from=zh&to=en";
            //var translateUrl="http://onionknights.herokuapp.com/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + search + "&from=zh&to=en";
            
            //initial url: http://openapi.baidu.com/public/2.0/bmt/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=shanghai&from=en&to=zh

            var data = $.ajax({
                dataType: "json",
                url: translateUrl,
                async: false
            });
            if (data !== undefined) {
                var jsonObj = jQuery.parseJSON(data.responseText).trans_result;
                var i;
                for (i = 0; i < jsonObj.length; i++) {
                    var translation = jsonObj[i].dst;
                    if (translation !== undefined) {
                        var searchValue = translation;
                        //this.set('sliceNo', sliceDefault);
                        var regex = new RegExp(searchValue, 'i');
                        var atmToggle = this.get('atmToggle');
                        var axsToggle = this.get('axsToggle');
                        var branchToggle = this.get('branchToggle');
                        var searchResults = this.get('model').filter(function(channel) {
                            return ((channel.get('channelName').match(regex) ||
                                    channel.get('ownDesc').match(regex) ||
                                    channel.get('channelType').match(regex)) && (channel.get('channelType') === "ATM" && atmToggle))
                                    + ((channel.get('channelName').match(regex) ||
                                    channel.get('ownDesc').match(regex) ||
                                    channel.get('channelType').match(regex)) && (channel.get('channelType') === "AXS" && axsToggle))
                                    + ((channel.get('channelName').match(regex) ||
                                    channel.get('ownDesc').match(regex) ||
                                    channel.get('channelType').match(regex)) && (channel.get('channelType') === "Branch" && branchToggle));
                        }).toArray();
                        this.set('searchNo', searchResults.length);
                        console.log(this.get('searchNo'));

                        var sliceNo = this.get('sliceNo');
                        var searchNo = this.get('searchNo');
                        //console.log('searchNo:' + searchNo + ', sliceNo:' + sliceNo);
                        if (searchNo < sliceNo) {
                            this.set('searchHasMore', false);
                        } else {
                            this.set('searchHasMore', true);
                        }

                        return searchResults.slice(0, this.get('sliceNo'));
                    }
                }
            }

        }
        /*End of translation*/
    }.property('model', 'search', 'atmToggle', 'axsToggle', 'branchToggle', 'sliceNo', 'searchNo', 'searchHasMore'),
            channelFilter: function() {

        var search = this.get('search');
        if (search === '') {
            //this.set('sliceNo', sliceDefault);
            closeResults();
            var atmToggle = this.get('atmToggle');
            var axsToggle = this.get('axsToggle');
            var branchToggle = this.get('branchToggle');

            var channelResults = this.get('model').filter(function(channel) {
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

    }.property('model', 'search', 'atmToggle', 'axsToggle', 'branchToggle', 'sliceNo', 'channelNo', 'channelHasMore'),
    distanceFilter: function() {
        var search = this.get('search');
        if (search === '') {
            //this.set('sliceNo', sliceDefault);
            closeResults();
            var atmToggle = this.get('atmToggle');
            var axsToggle = this.get('axsToggle');
            var branchToggle = this.get('branchToggle');

            var distanceSortResults = this.get('model').filter(function(channel) {
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
            return distanceSortResults;
        }
    }.property('model', 'search', 'atmToggle', 'axsToggle', 'branchToggle', 'sliceNo', 'channelNo', 'channelHasMore'),
    mapPan: function() {

        var search = this.get('search');
        if (!isNullOrWhitespace(search)) {
            /*BAIDU: Translation */
            var searchValue = "";
            var translateUrl = "http://localhost:5000/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + search + "&from=en&to=zh";
            var translateUrl="http://onionknights.herokuapp.com/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + search + "&from=en&to=zh";
            //initial url: http://openapi.baidu.com/public/2.0/bmt/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=shanghai&from=en&to=zh

            $.getJSON(translateUrl).done(function(data) {
                if (data !== undefined) {
                    var jsonObj = data.trans_result;
                    var i;
                    for (i = 0; i < jsonObj.length; i++) {
                        var translation = jsonObj[i].dst;
                        if (translation !== undefined) {
                            searchValue = translation;
                            if (country !== "") {
                                geocoder.getPoint(searchValue, function(point) {
                                    if (point) {
                                        map.centerAndZoom(point, 12);
                                    }
                                }, country);
                            }
                        }
                    }

                    return;
                }
            });

            /*End of translation*/
        } else {
            map.setCenter(userPosition);
        }

    }.observes('search'),
    actions: {
        toggleCountry: function(country2) {
            //var countryToggle = this.get('countryToggle');
            this.set('countryToggle', country2);
            country = country2;

            //this.store.
            //this.store.find('channelDetail');
            this.send('refreshRoute');

        },
        toggleATM: function() {
            var atmToggle = this.get('atmToggle');
            if (atmToggle) {
                //isATMToggled = false;

                /*for (var i=0;i<atm.length;i++){
                 atm[i].setMap(null);
                 }*/
                markerClusterATM.clearMarkers();
                this.set('atmToggle', false);
            } else {
                /*for (var i=0;i<atm.length;i++){
                 atm[i].setMap(map);
                 }*/
                markerClusterATM.addMarkers(atm);
                this.set('atmToggle', true);
            }
        },
        toggleAXS: function() {
            var axsToggle = this.get('axsToggle');
            if (axsToggle) {
                //isAXSToggled = false;
                /*for (var i=0;i<axs.length;i++){
                 axs[i].setMap(null);
                 }*/
                markerClusterAXS.clearMarkers();
                this.set('axsToggle', false);
            } else {
                /*for (var i=0;i<axs.length;i++){
                 axs[i].setMap(map);
                 }*/
                markerClusterAXS.addMarkers(axs);
                this.set('axsToggle', true);
            }
        },
        toggleBranch: function() {
            var branchToggle = this.get('branchToggle');
            if (branchToggle) {
                //isBranchToggled = false;
                /*for (var i=0;i<branch.length;i++){
                 branch[i].setMap(null);
                 }*/
                markerClusterBranch.clearMarkers();
                this.set('branchToggle', false);
            } else {
                /*for (var i=0;i<branch.length;i++){
                 branch[i].setMap(map);
                 }*/
                markerClusterBranch.addMarkers(branch);
                this.set('branchToggle', true);
            }
        },
        toggleDeal: function() {
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
        toggleChannelDirections: function() {
            var channelDirectionsToggle = this.get('channelDirectionsToggle');

            if (channelDirectionsToggle) {
                this.set('channelDirectionsToggle', false);
            } else {
                this.set('channelDirectionsToggle', true);
            }
        },
        toggleDriving: function() {
            var drivingToggle = this.get('drivingToggle');
            if (!drivingToggle) {
                this.set('transportMode', 'DRIVING');
                this.set('drivingToggle', true);
                this.set('transitToggle', false);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', false);
                this.send('renderDirections');

            }
        },
        toggleTransit: function() {
            var transitToggle = this.get('transitToggle');
            if (!transitToggle) {
                this.set('transportMode', 'TRANSIT');
                this.set('drivingToggle', false);
                this.set('transitToggle', true);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', false);
                this.send('renderDirections');
            }
        },
        toggleBicycling: function() {
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
        }, toggleWalking: function() {
            var walkingToggle = this.get('walkingToggle');
            if (!walkingToggle) {
                this.set('transportMode', 'WALKING');
                this.set('drivingToggle', false);
                this.set('transitToggle', false);
                this.set('bicyclingToggle', false);
                this.set('walkingToggle', true);
                this.send('renderDirections');
            }
        },
        showToggleBar: function() {
            $("#toggleBar").slideToggle('fast');
        },
        closeDirection: function() {
            this.send("clearDirectionMarkers");
            hideDirections();
        },
        showDirection: function() {
            if ($("#directions").css('display') != 'none') {
                this.send("closeDirection");
            }

            $("#directions").show();
        },
        toggleListView: function() {
            /* var listViewToggle = this.get('listViewToggle');
             if (listViewToggle) {
             this.set('listViewToggle',false);
             } else {
             this.set('listViewToggle',true);
             }
             */

            $("#channelList").slideToggle();
        },
        selectMarker: function(item) {
            console.log(item);
            this.set('selectedMarker', item.id);
            this.set('listViewToggle', false);
            console.log(this.get('selectedMarker'));
            markerMap[this.get('selectedMarker')].dispatchEvent("click");

        },
        isSelectedMarker: function(id) {
            return id === this.get('selectedMarker');
        },
        toUserLocation: function() {
            map.panTo(latitude, longitude);
        },
        findDirections: function(lat, lng, channelAddress) {
            //sorry whoever is doing this , can help me change tabs using ember? for now im just going to call a class to change the tabs

            this.send("showDirection");
            //this.send('toggleChannelDirections');

            //if there's no current address, it will be set automatically
            if (currentAddress !== '') {
                this.set('locationA', currentAddress);
                //To be done - point of current address
                //startPoint = new BMap.Point(long,lat);
            } else {
                this.set('locationA', '北京市东城区东长安街');
                startPoint = new BMap.Point(116.403875, 39.915168);
            }

            endPoint = new BMap.Point(lng - (-0.0065853333), lat - (-0.0060823333));
            this.set('locationB', channelAddress);
            this.send('renderDirections');

        },
        renderDirections: function() {
            this.send("clearDirectionMarkers");
            //directionsDisplay.setMap(map);

            //$("#directionsSearch").slideUp();
            var transportMode = this.get('transportMode');
            console.log("here1");
            var transport;
            var haveRoute = false;

            if (transportMode === 'DRIVING') {
                //BAIDU: Driving Navigation
                transport = new BMap.DrivingRoute(map);
            } else if (transportMode === 'TRANSIT') {
                //BAIDU: Transit Navigation
                transport = new BMap.TransitRoute(map);
            } else if (transportMode === 'WALKING') {
                //BAIDU: Walking Navigation
                transport = new BMap.WalkingRoute(map);
            }

            transport.search(startPoint, endPoint);
            console.log("here: " + transport);
            transport.setSearchCompleteCallback(function() {
                //get route
                var plan = transport.getResults().getPlan(0);
                if (plan !== undefined) {
                    route = plan.getRoute(0);
                    //Get all the point route
                    var travelPoints = route.getPath();
                    if (route !== undefined) {
                        haveRoute = true;
                        //Connect all the dots
                        directionLine = new BMap.Polyline(travelPoints, {strokeColor: "#FD128C", strokeWeight: 3, strokeOpacity: 1});
                        map.addOverlay(directionLine);
                        for (var i = 0; i < route.getNumSteps(); i++) {
                            $('#directionsList').append("<a class='directions-item' href='#' onClick='panToDirectionMarker(" + i + ")'><li class='list-group-item directions-item'>" + route.getStep(i).getDescription(false) + "</li></a>");

                            //to implement the start and end point marker
                            if (i === 0 || i === route.getNumSteps() - 1) {
                                var icon = new BMap.Icon(defaultIcon, new BMap.Size(34, 40), {
                                    anchor: new BMap.Size(10, 30),
                                    infoWindowAnchor: new BMap.Size(10, 0)
                                });
                                var marker = new BMap.Marker(route.getStep(i).getPosition(), {
                                    map: map,
                                    icon: icon
                                });
                                directionMarker.push(marker);
                                map.addOverlay(marker);
                            } else {
                                controller.send("populateDirectionSteps", route.getStep(i));
                            }

                        }
                    }
                }
                if (!haveRoute) {
                    $('#directionsList').append("No possible direction available");

                }
            });
            /*End of navigation*/
            
            var controller = this;
        },
        showAdvancedSearch: function() {
            $("#directionsSearch").slideToggle('fast');
        },
        populateDirectionSteps: function(start_location) {
            var marker = new BMap.Marker(start_location.getPosition(), {
                map: map
            });
            directionMarker.push(marker);
            map.addOverlay(marker);

            marker.addEventListener('click', function() {
                infowindow.setContent(start_location.getDescription(false));
                infowindow.setWidth(250);
                this.openInfoWindow(infowindow);
            });
        },
        clearDirectionMarkers: function() {
            for (var i = 0; i < directionMarker.length; i++) {
                map.removeOverlay(directionMarker[i]);
            }
            map.removeOverlay(directionLine);
            directionMarker = [];
            $('#directionsList').empty();
        },
        showMore: function() {
            var sliceNo = this.get('sliceNo');
            var sliceStep = this.get('sliceStep');

            this.set('sliceNo', sliceNo + sliceStep);
        },
        /*
         * function on hold. if user is moving, computation for every branch might be intensive. 
         * performed on load perhaps
         */
        _usersLocationObserver: function() {
            var usersLocation = Utilities.currentUserPosition;

            var locationLat = this.get('latitude');
            var locationLong = this.get('longitude');
            var modelPos = new google.maps.LatLng(locationLat, locationLong);
            var distance = google.maps.geometry.spherical.computeDistanceBetween(userPos, modelPos);

            console.log(this.get('name'), distance);

            //this.set('distanceFromUser', distance);
        }.property('latitude', 'longitude')//.observes('Utilities.currentUserPosition')

    }

});
/*
 App.ChannelDetailView = Ember.View.extend({
 
 didInsertElement: function(){
 // we want to make sure 'this' inside `didScroll` refers
 // to the IndexView, so we use jquery's `proxy` method to bind it
 $(window).on('scroll', $.proxy(this.didScroll, this));
 },
 willDestroyElement: function(){
 // have to use the same argument to `off` that we did to `on`
 $(window).off('scroll', $.proxy(this.didScroll, this));
 },
 // this is called every time we scroll
 didScroll: function(){
 if (this.isScrolledToBottom()) {
 this.get('controller').send('showMore');
 console.log('showMore');
 }
 console.log('scrolling');
 },
 isScrolledToBottom: function(){
 var distanceToViewportTop = (
 $(document).height() - $(window).height());
 var viewPortTop = $(document).scrollTop();
 
 console.log(distanceToViewportTop + ' ' + viewPortTop);
 
 console.log((viewPortTop - distanceToViewportTop === 0));
 return (viewPortTop - distanceToViewportTop === 0);
 }
 
 });*/

App.ChannelDetailView = Ember.View.extend({
    didInsertElement: function() {

        var controller = this.get('controller');
        $(window).on('scroll', function() {
            if ($(window).scrollTop() > $(document).height() - ($(window).height() * 2)) {
                controller.send('showmore');
                console.log('showMore');
            }
        });
    },
    willDestroyElement: function() {
        $(window).off('scroll');
    }

});
Ember.Handlebars.registerHelper('ifeq', function(a, b, options) {
    //handlebars helper for us to use ifeq for comparisons within the {{ }} for our html
    return Ember.Handlebars.bind.call(options.contexts[0], a, options, true, function(result) {
        return result === b;
    });
});

//handlebars group-helper
var get = Ember.get, set = Ember.set, EmberHandlebars = Ember.Handlebars;
EmberHandlebars.registerHelper('group', function(options) {
    var data = options.data,
            fn = options.fn,
            view = data.view,
            childView;

    childView = view.createChildView(Ember._MetamorphView, {
        context: get(view, 'context'),
        template: function(context, options) {
            options.data.insideGroup = true;
            return fn(context, options);
        }
    });

    view.appendChild(childView);
});
//defining the ChannelDetail Model. 
App.ChannelDetail = DS.Model.extend({
    channelID: DS.attr('string'),
    channelName: DS.attr('string'),
    channelType: DS.attr('string'),
    latitude: DS.attr('string'),
    longitude: DS.attr('string'),
    opHours: DS.attr('string'),
    ownDesc: DS.attr('string'),
    services: DS.attr('string'),
    telephone: DS.attr('string'),
    channelDetails: DS.attr('string'),
    distanceFromUser: DS.attr('number') //new attribute created. to be determined when rendering list
});


App.inject('component', 'store', 'store:main');
App.inject('view', 'store', 'store:main');


App.GoogleMapsComponent = Ember.Component.extend({
    countryToggle: null,
    insertMap: function() {

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

        /*Not implemented into Baidu yet
         var GeoMarker;
         directionsService = new google.maps.DirectionsService();
         directionsDisplay = new google.maps.DirectionsRenderer({polylineOptions: polylineOptionsActual});
         directionsDisplay.setOptions()
         
         appDefault(this.get('countryToggle'));
         geoAttempt();
         
         var options = {
         center: new google.maps.LatLng(latitude, longitude),
         panControl: true,
         panControlOptions: {
         position: google.maps.ControlPosition.RIGHT_TOP
         },
         streetViewControl: true,
         streetViewControlOptions: {
         position: google.maps.ControlPosition.RIGHT_TOP
         },
         mapTypeId: google.maps.MapTypeId.ROADMAP,
         zoom: defaultZoomLevel,
         zoomControl: true,
         zoomControlOptions: {
         style: google.maps.ZoomControlStyle.DEFAULT,
         position: google.maps.ControlPosition.RIGHT_TOP
         },
         mapTypeControl: true,
         mapTypeControlOptions: {
         style: google.maps.MapTypeControlStyle.DEFAULT,
         position: google.maps.ControlPosition.RIGHT_BOTTOM
         },
         maxZoom: 18
         };*/

        //BAIDU: Map creation
        map = new BMap.Map(container[0]);
        map.centerAndZoom(new BMap.Point(116.4595416667, 39.91506944444), 8);
        map.enableScrollWheelZoom();

        //BAIDU: Markerclusterer
        markerClusterATM = new BMapLib.MarkerClusterer(map, {markers: atm});
        markerClusterAXS = new BMapLib.MarkerClusterer(map, {markers: axs});
        markerClusterBranch = new BMapLib.MarkerClusterer(map, {markers: branch});

        markerClusterATM.setMaxZoom(15);
        markerClusterAXS.setMaxZoom(15);
        markerClusterBranch.setMaxZoom(15);
        //End of baidu markerclusterer

        /*Not implemented into Baidu yet
         //location control
         var userLocationControlDiv = document.createElement('div');
         var userLocationControl = new UserLocationControl(userLocationControlDiv, map);
         userLocationControlDiv.index = 1;
         map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(userLocationControlDiv);
         
         //for directions
         directionsDisplay.setMap(map);
         directionsDisplay.setPanel(document.getElementById('directionsPanel'));
         */

        if (getParameter("channelID") != undefined) {
            //filter to the appropriate channel ID
        }
        else {
            if (this.get('countryToggle') === countryDefault && firstInitialize) {
                // retrieve locations (ChannelDetail Models) from Local Store (database)
                locations = this.store.all('channelDetail');

                //iterating every Channel Model in store, and inserting them to the maps.
                locations.forEach(function(location) {

                    //points are needed for marker creation in baidu
                    var baiduLong = location.get('longitude') - (-0.0065853333);
                    var baiduLat = location.get('latitude') - (-0.0060823333);

                    //arguments to be passed into the createMarker(latlng, channelName, channelAdd, channelHrs, type, markerId) method
                    createMarker(
                            new BMap.Point(baiduLong, baiduLat),
                            location.get('channelName'),
                            location.get('ownDesc'),
                            location.get('opHours').trim(),
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
                // retrieve locations (ChannelDetail Models) from API, refreshing Store (database)
                this.store.find('channelDetail').then(function(locations) {

                    atm = [];
                    axs = [];
                    branch = [];

                    //iterating every Channel Model in store, and inserting them to the maps.
                    locations.forEach(function(location) {

                        //arguments to be passed into the createMarker(latlng, channelName, channelAdd, channelHrs, type, markerId) method
                        createMarker(
                                new BMap.Point(location.get('longitude'), location.get('latitude')),
                                location.get('channelName'),
                                location.get('ownDesc'),
                                location.get('opHours').trim(),
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
        }
        //retrieving Deals API, iterating every Deal and inserting them to the maps.
        getAllDeals();


        function createMarker(latlng, channelName, channelAdd, channelHrs, type, markerId) {
            //var contentString = '<div id="infoWindow" class=""><strong>' + channelName + '</strong></br>' + channelAdd + "</div>";

            // content string for map InfoWindow
            var content = '<div id="baiduInfoWindow"><strong>' + channelName + '</strong></br><div class="mobile-hidden">' + channelAdd + "";
            // content string for mobile popup
            var mContent = '<div id="mInfoWindow" class=""><strong>' + channelName + '</strong></br>' + channelAdd;

            if (!isNullOrWhitespace(channelHrs)) {
                content = content + '</div></br>' + 'Operating Hours:</br>' + channelHrs;
                mContent = mContent + '</br>' + 'Operating Hours:</br>' + channelHrs;
            }

            content = content + '</br><a onclick="findDirectionsFromMarker(\'' + channelAdd + '\')"><button class=\'btn btn-xs btn-primary\'>Get Directions</button></a></div></div>';
            mContent = mContent + '</br><a href="http://maps.google.com/maps?q=' + latlng.lat + ',' + latlng.lng + '"><button class=\'btn btn-xs btn-primary\' >Get Directions</button></a></div>';

            //console.log(channelName);

            //icon is needed before creating the marker
            var icon = new BMap.Icon(getMarkerImage(type), new BMap.Size(34, 40), {
                anchor: new BMap.Size(10, 30),
                infoWindowAnchor: new BMap.Size(10, 0)
            });

            var marker = new BMap.Marker(latlng, {
                icon: icon,
                //zIndex: Math.round(latlng.lat() * -100000) << 5,
                title: channelName
            });

            marker.addEventListener('click', function() {
                // map.centerAndZoom(marker.getPosition(), 11);
                map.setCenter(marker.getPosition());
                infowindow.setContent(content);
                openInfo(mContent);
                this.openInfoWindow(infowindow);
            });

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

        /*Not implemented into Baidu yet
         window.addEventListener('resize', resizeToScreen(container));
         */

        //close mWindow when not clicking on markers
        map.addEventListener(map, 'click', closeInfo);
        map.addEventListener(map, 'click', function() {
            if (channelInfo) {
                channelInfo.close(map, this);
            }
            closeResults();
        });
        /*
         $('.gmap-trigger-item').each(function(){
         $(this).on('click', function(){
         var id = parseInt($(this).attr('src'));
         console.log(id);
         google.maps.event.trigger(markerMap[id], 'click');
         });
         });
         */
        /*Not implemented into Baidu yet
         google.maps.event.addDomListener(window, "resize", resizeToScreen(container));
         */

    }.observes('countryToggle'), //.on('didInsertElement')


    init: function() {
        var view = this;

        var resizeHandler = function() {
            resizeToScreen(view.$(".map-canvas"));
        };

        this.set('resizeHandler', resizeHandler);
        $(window).bind('resize', this.get('resizeHandler'));


    },
    didInsertElement: function() {
        this.insertMap();
        /*App.addObserver('countryToggle', this.insertMap(), function() {
         console.log('countryToggle changed');
         });
         */
    },
    willDestroy: function() {
        $(window).unbind('resize', this.get('resizeHandler'));
    },
});

function geoAttempt() {

    var geoService = navigator.geolocation;
    if (geoService) {
        watchID = geoService.watchPosition(updateLocation, undefined, {timeout: 30000});
        geocoder = new google.maps.Geocoder();
        geoService.getCurrentPosition(function(position) {
            userPosition = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);
            geocoder.geocode({'latLng': userPosition}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    country = getCountry(results);
                    currentAddress = results[0].formatted_address;
                }

            });
            geolocation = true;

            //blue circle around user's location
            GeoMarker = new GeolocationMarker();
            GeoMarker.setCircleOptions({
                fillColor: '#808080'});
            GeoMarker.setMap(map);
            map.panTo(userPosition);

        }, errorHandler, {enableHighAccuracy: true, timeout: 10000});
    } else {
        alert("Your Browser does not support GeoLocation.");
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

function resizeToScreen(container) {
    if (container) {
        var currentPos = map.getCenter();
        var width = window.innerWidth * 0.84;
        var height = window.innerHeight * 0.85;
        container.css({'width': width, 'height': height});

        google.maps.event.trigger(map, 'resize');
        map.setCenter(currentPos);
        map.panTo(currentPos);
    }
}

function map_recenter(latlng, offsetx, offsety) {
    var point1 = map.getProjection().fromLatLngToPoint(
            (latlng instanceof google.maps.LatLng) ? latlng : map.getCenter()
            );
    var point2 = new google.maps.Point(
            ((typeof(offsetx) == 'number' ? offsetx : 0) / Math.pow(2, map.getZoom())) || 0,
            ((typeof(offsety) == 'number' ? offsety : 0) / Math.pow(2, map.getZoom())) || 0
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
    google.maps.event.addDomListener(controlUI, 'click', function() {
        if (userPosition) {
            map.panTo(userPosition);
        } else {
            //attempt geolocation
            geoAttempt();
        }

    });

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
    var url = "http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getAllDeals";
    //var url = "http://localhost:8084/ATMLocatorWebService/getAllDeals";

    //option to parse in query strings using offerdetails? + queryString. 
    //var url="http://localhost:8084/ATMLocatorWebService/offerdetails?country=SG&lang=en&deviceId=0&offerVersion=0&couponVersion=0&categoryVersion=0";
    //var url="http://atm-onionknights.rhcloud.com/ATMLocatorWebService/offerdetails?country=SG&lang=en&deviceId=0&offerVersion=0&couponVersion=0&categoryVersion=0";


    $.getJSON(url).done(function(data) {
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


                    dealContent.push(content);
                    google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                            if (channelInfo) {
                                closeInfo();
                                closeResults();
                                channelInfo.close();
                                //marker.setIcon(prevIcon);
                            }
                            //prevIcon = marker.getIcon();
                            //marker.setIcon('https://www.google.com/mapfiles/marker_black.png');
                            openInfo('<div id="mInfoWindow">' + dealContent[i] + '</div>');
                            channelInfo.setContent('<div id="infoWindow" class="">' + dealContent[i]);
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
    if ((!(pos <= 0 | pos >= directionMarker.length)) && (directionMarker[pos] != null)) {
        directionMarker[pos].setIcon(defaultIcon);
        map.centerAndZoom(directionMarker[pos].getPosition(), 11);
        directionMarker[pos].dispatchEvent("click");
    }

}
function findDirectionsFromMarker(channelAddress) {
    //$.event.trigger("findDirections",channelAddress);
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

function appDefault(region) {

    switch (region) {
        case 'hk' :
            /*defaultQuery = "22.330585943758745,114.17784512042911";
             lat = 22.330585943758745;
             lng = 114.17784512042911;*/
            defaultQuery = "22.390313478471715,114.11998477734369";
            latitude = 22.390313478471715;
            longitude = 114.11998477734369;
            defaultZoomLevel = 11;

            appointmentAvailable = true;

            var ne = new google.maps.LatLng(22.516364, 114.403381);
            var sw = new google.maps.LatLng(22.168966, 113.820419);
            bounds = new google.maps.LatLngBounds(sw, ne);


            break;
        case 'sg' :
            defaultQuery = "114 Windsor Park Road";
            latitude = 1.355255;
            longitude = 103.82313899999997;
            defaultZoomLevel = 14;

            appointmentAvailable = true;

            var ne = new google.maps.LatLng(1.483676, 104.096146);
            var sw = new google.maps.LatLng(1.185753, 103.593521);
            bounds = new google.maps.LatLngBounds(sw, ne);


            break;
        case 'my' :
            defaultQuery = "3.643487486358246,102.0933491406249";
            latitude = 3.643487486358246;
            longitude = 102.0933491406249;
            defaultZoomLevel = 7;
            isSVAavailable = false;

            appointmentAvailable = true;

            /* Bounds for MY */
            var ne = new google.maps.LatLng(7.112477, 119.630814);
            var sw = new google.maps.LatLng(1.511132, 100.326462);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 15;

            break;
        case 'in' :
            defaultQuery = "22.129057919979036,79.20249906250001";
            latitude = 22.129057919979036;
            longitude = 79.20249906250001;
            defaultZoomLevel = 5;
            isSVAavailable = false;

            /* Bounds for IN */
            var ne = new google.maps.LatLng(37.100647, 97.198105);
            var sw = new google.maps.LatLng(7.540849, 67.030334);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 15;

            break;
        case 'uae' :
            defaultQuery = "24.92857630275063,54.89571697187498";
            latitude = 24.92857630275063;
            longitude = 54.89571697187498;
            defaultZoomLevel = 9;
            isSVAavailable = false;

            /* Bounds for UAE */
            var ne = new google.maps.LatLng(26.088239, 56.504745);
            var sw = new google.maps.LatLng(22.577243, 51.605530);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;
        case 'cn' :

            defaultQuery = "32.91287165677423,111.85867238125002";
            latitude = 32.91287165677423;
            longitude = 111.85867238125002;
            defaultZoomLevel = 5;
            isSVAavailable = false;

            /* Bounds for CN */
            var ne = new google.maps.LatLng(21.002879252870027, 101.74585896874999);
            var sw = new google.maps.LatLng(43.61253334547215, 124.68531209374999);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;
        case 'tw' :
            defaultQuery = "24.755184131278263,121.41662213457039";
            latitude = 24.755184131278263;
            longitude = 121.41662213457039;
            defaultZoomLevel = 9;

            /* Bounds for TW */
            var ne = new google.maps.LatLng(25.284470155147858, 122.00894331210941);
            var sw = new google.maps.LatLng(22.43772006130058, 119.85150312656253);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;


            break;
        case 'id' :


            defaultQuery = "0.9461731,104.29779182";
            latitude = 0.9461731;
            longitude = 104.29779182;
            defaultZoomLevel = 5;
            isSVAavailable = false;


            /* Bounds for ID */
            var ne = new google.maps.LatLng(5.573806730048983, 115.91120887500006);
            var sw = new google.maps.LatLng(-9.143941615454509, 98.68464637500006);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;
        case 'pk' :

            defaultQuery = "24.865638123578705,67.10233962802725";
            latitude = 24.865638123578705;
            longitude = 67.10233962802725;
            defaultZoomLevel = 12;
            isSVAavailable = false;

            appointmentAvailable = true;

            /* Bounds for PK */
            var ne = new google.maps.LatLng(24.68188809014598, 66.86656683683395);
            var sw = new google.maps.LatLng(25.002788281718168, 67.19547003507614);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;
        case 'th' :
            defaultQuery = "16.332309993224936,101.00907451679689 ";
            latitude = 16.332309993224936;
            longitude = 101.00907451679689;
            defaultZoomLevel = 6;

            //appointmentAvailable = true;		

            /* Bounds for TH */
            var ne = new google.maps.LatLng(19.992741625470114, 101.59909223789066);
            var sw = new google.maps.LatLng(12.596149249510297, 97.99557661289066);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;

        case 'bn' :
            defaultQuery = "Brunei";
            latitude = 4.8;
            longitude = 114.9;
            defaultZoomLevel = 10;

            appointmentAvailable = false;

            /* Bounds for BN */
            var ne = new google.maps.LatLng(5, 115);
            var sw = new google.maps.LatLng(4, 113);
            bounds = new google.maps.LatLngBounds(sw, ne);

            poiZoomLevel = 14;

            break;
            /*		
             case 'zw' :
             defaultQuery = "Harare";
             lat = -18.803677;
             lng = 29.817187;
             defaultZoomLevel = 7;
             isSVAavailable = false;
             
             var ne = new google.maps.LatLng(-16, 33);
             var sw = new google.maps.LatLng(-25, 23);
             bounds = new google.maps.LatLngBounds(sw, ne);
             break;		
             */
        default:
            break;
    }

}