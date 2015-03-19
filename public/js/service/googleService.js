var mapsView;
var GoogleService = {
    defaultCountry: 'sg',
    inEnglish: true,
    defaultLanguage: 'en',
    allowableCountries: [
        {name: 'Hong Kong', code: 'hk'},
        {name: 'Singapore', code: 'sg'},
        {name: 'Malaysia', code: 'my'},
        {name: 'India', code: 'in'},
        {name: 'United Arab Emirates', code: 'uae'},
        {name: "China", code: 'cn'},
        {name: 'Taiwan', code: 'tw'},
        {name: 'Indonesia', code: 'id'},
        {name: 'Pakistan', code: 'pk'},
        {name: 'Thailand', code: 'th'}],
    directionsService: "",
    directionsDisplay: "",
    moreCountries: true,
    geocoder: "",
    checkLoaded: function () {
        try {
            if (google && google.maps) {
                return true;
            }
        } catch (err) {
            return false;
        }
    }
    ,
    //Initialize the map
    initializeMap: function (container, lat, long, directionsPanel) {
        //Specify Map Options
        var options = {
            center: new google.maps.LatLng(lat, long),
            panControl: false,
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
        };

        //Create map with options
        var map = new google.maps.Map(container, options);

        //initialize the Directions Service and Display
        this.initializeDirections(map, directionsPanel);

        //close mWindow when not clicking on markers
        google.maps.event.addListener(map, 'click', closeInfo);
        google.maps.event.addListener(map, 'click', function () {
            $("#searchBox").blur();
            if (channelInfo) {
                channelInfo.close(map, this);
                console.log('closing');
            }
            closeResults();

            mapsView.sendAction("selectedMarker", null);

            // toggleBarToggle(false);
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
        google.maps.event.addDomListener(window, "resize", resizeToScreen(container));
        return map;
    },
    //returns a new GMap MarkerCluster
    getMarkerClusterer: function (map, markerArray) {
        return new MarkerClusterer(map);
    },
    //Pans the map
    mapPan: function (map, searchObject) {
        if ((!this.geocoder) || this.geocoder == "") {
            this.geocoder = new google.maps.Geocoder();
        }
        this.geocoder.geocode(searchObject, function (results, status) {
            console.log(status);
            if (status === google.maps.GeocoderStatus.OK) {

                map.setCenter(results[0].geometry.location);
            }
        });
    },
    addLocationControl: function (userLocationControlDiv, map) {
        var userLocationControl = new UserLocationControl(userLocationControlDiv, map);
        userLocationControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(userLocationControlDiv);
    },
    initializeDirections: function (map, container) {
        /*
         var polylineOptionsActual = new google.maps.Polyline({
         strokeColor: '#FD128C',
         strokeOpacity: 1.0,
         strokeWeight: 3
         });*/

        this.initializeDirectionsService();


        if (!this.directionsDisplay || this.directionsDisplay == "") {
            this.directionsDisplay = new google.maps.DirectionsRenderer({}); //polylineOptions: polylineOptionsActual
        }
        this.directionsDisplay.setOptions();

        //for directions
        this.directionsDisplay.setMap(map);
        this.directionsDisplay.setPanel(container);

    },
    initializeDirectionsService: function () {
        this.directionsService = new google.maps.DirectionsService();
    },
    createMarker: function (lat, lng, map, channelName, channelAdd, channelHrs, type, markerId, infowindow, markerImage) {

        var latlng = new google.maps.LatLng(lat, lng);
        // content string for map InfoWindow
        var content = '<div id="infoWindow"><strong>' + channelName + '</strong></br><div class="mobile-hidden">' + channelAdd + "";
        // content string for mobile popup
        var mContent = '<div id="mInfoWindow" class=""><strong>' + channelName + '</strong></br>' + channelAdd;

        if (!isNullOrWhitespace(channelHrs)) {
            content = content + '</br>' + 'Operating Hours:</br>' + channelHrs;
            mContent = mContent + '</br>' + 'Operating Hours:</br>' + channelHrs;
        }

        content = content + '</br><a onclick="findDirectionsFromMarker(\'' + latlng.lat + '\',\'' + latlng.lng + '\',\'' + channelAdd + '\')"><button id= \'get-dir-btn\' class=\'btn btn-xs btn-primary\'>Get Directions</button></a></div></div>';
        // mContent = mContent + '</br><a href="http://maps.google.com/maps?q=' + latlng.lat() + ',' + latlng.lng() + '"><button class=\'btn btn-xs btn-primary\' >Get Directions</button></a></div>';

        mContent = mContent + '</br><a onclick="findDirectionsFromMarker(\'' + latlng.lat + '\',\'' + latlng.lng + '\',\'' + channelAdd + '\')"><button class=\'btn btn-xs btn-primary\'>Get Directions</button></a></div></div>'

        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: markerImage,
            title: channelName
        });
		
        google.maps.event.addListener(marker, 'click', function () {
		
				
				
            mapsView.set('sMarker', marker);
            var sMarker1 = mapsView.get('sMarker');
            console.log(sMarker1.title);
            mapsView.sendAction("selectedMarker", markerId);
            console.log('opening');
            infowindow.setContent(content);
            openInfo(mContent);
			
		
				
            infowindow.open(map, marker);
			
				google.maps.event.addListener(infowindow, 'domready', function () {
					
                    if (pano != null) {
                        pano.unbind("position");
                        pano.setVisible(false);
						
                    }
					
                    pano = new google.maps.StreetViewPanorama($("#infoWindow").get(0), {
                        navigationControl: true,
                        navigationControlOptions: { style: google.maps.NavigationControlStyle.ANDROID },
                        enableCloseButton: false,
                        addressControl: false,
                        linksControl: false
                    });
                    pano.bindTo("position", marker);
                    pano.setVisible(true);
                });

                google.maps.event.addListener(infowindow, 'closeclick', function () {
                    pano.unbind("position");
                    pano.setVisible(false);
                    pano = null;
                });
            map.setZoom(20);
            map.panTo(marker.getPosition());
		
 
        });
		
        return marker;
    },
    //get Current Location
    geoAttempt: function (map) {
        var con = this;
        if (!userPosition || userPosition == "" || watchID == "") {
            geoService = navigator.geolocation;
            if (geoService) {

                distanceSort = true;
                watchID = geoService.watchPosition(con.updateLocation, function (error) {
                    console.log(error);
                });

                if ((!con.geocoder) || con.geocoder == "") {
                    con.geocoder = new google.maps.Geocoder();
                }
                geoService.getCurrentPosition(function (position) {
                    userPosition = new google.maps.LatLng(position.coords.latitude,
                            position.coords.longitude);

                    con.geocoder.geocode({'latLng': userPosition}, function (results, status) {

                        if (status === google.maps.GeocoderStatus.OK) {
                            country = getCountry(results);
                            this.defaultCountry = getCountry(results);
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

                }, function (error) {
                    console.log(error);
                    alert("Please enable location services to use this");
                }, {enableHighAccuracy: true, timeout: 20000});
            } else {
                alert("Your Browser does not support GeoLocation.");
            }
        } else {
            map.panTo(userPosition);
            
            GeoMarker = new GeolocationMarker();
            GeoMarker.setCircleOptions({
                fillColor: '#808080'});
            GeoMarker.setMap(map);

            con.geocoder.geocode({'latLng': userPosition}, function (results, status) {

                if (status === google.maps.GeocoderStatus.OK) {
                    country = getCountry(results);
                    this.defaultCountry = getCountry(results);
                    currentAddress = results[0].formatted_address;
                }

            });
        }
        
    },
    updateLocation: function (position) {
        userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    },
    //returns a Google maps InfoWindow

    createInfoWindow: function () {

        var infoWindow = new google.maps.InfoWindow();
        google.maps.event.addListener(infoWindow, 'closeclick', function () {
            $(".info-panel").hide();
        });
		
		              

        return infoWindow;
    },
    //render Directions into the map
    renderDirections: function (map, transportMode, start, end, lat, lng, container) {
        this.initializeDirections(map, container.get(0));
        var request = {
            origin: start,
            destination: end,
            travelMode: transportMode,
            provideRouteAlternatives: true,
        };


        var con = this;

        container.empty();

        con.directionsDisplay.setMap(null);

        this.directionsService.route(request, function (response, status) {

            if (status == google.maps.DirectionsStatus.OK) {
                container.empty();

                con.directionsDisplay.setMap(map);

                con.directionsDisplay.setDirections(response);
            } else {
                con.directionsDisplay.setMap(null);
                container.empty();
                container.append("No Directions for this Travel Mode");
            }
        });
    },
    //populate steps in the direction
    populateDirectionSteps: function (map, start_location, directionMarker, icon) {
        var marker = new google.maps.Marker({
            position: start_location,
            animation: google.maps.Animation.DROP,
        });
        directionMarker.push(marker);
    },
    //clear Directional markers
    clearDirections: function (map, directionMarker) {
        for (var i = 0; i < directionMarker.length; i++) {
            directionMarker[i].setMap(null);
        }
        this.directionsDisplay.setMap(null);
        directionMarker = [];
    },
    panToDirectionMarker: function (map, pos, directionMarker) {
        for (var i = 0; i < directionMarker.length; ++i) {
            directionMarker[i].setMap(null);
        }
        directionMarker[pos].setIcon(defaultIcon);
        directionMarker[pos].setMap(map);
        map.setCenter(directionMarker[pos].position);
        map.setZoom(17);
    },
    selectMarker: function (marker, map) {
        google.maps.event.trigger(marker, 'click');

    },
    mapResize: function () {
        google.maps.event.trigger(map, 'resize');
    },
    addLocationControlAction: function (map, userPosition, controlUI) {
        var con = this;
        google.maps.event.addDomListener(controlUI, 'click', function () {
            if (userPosition) {
                map.panTo(userPosition);
            } else {
                //attempt geolocation
                con.geoAttempt(map);
            }
        });
    },
    panToRegion: function (map, region) {
        var mapOptions = this.appDefault(region);

        if (mapOptions) {
            map.setCenter(new google.maps.LatLng(mapOptions.latitude, mapOptions.longitude));
            console.log(mapOptions.defaultZoomLevel)
            map.setZoom(mapOptions.defaultZoomLevel);
            map.fitBounds(mapOptions.bounds);
        }

    },
    appDefault: function (region) {
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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: defaultZoomLevel,
                    bounds: bounds
                };
                return obj;
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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: defaultZoomLevel,
                    bounds: bounds
                };
                return obj;
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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;
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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;
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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;

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

                var obj = {
                    defaultQuery: defaultQuery,
                    latitude: latitude,
                    longitude: longitude,
                    defaultZoomLevel: poiZoomLevel,
                    bounds: bounds
                };
                return obj;
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
                return;
                break;
        }
    }

}