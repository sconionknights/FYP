var mapsView;
var geoMarker;
var BaiduService = {
    defaultCountry: 'cn',
    inEnglish: false,
    defaultLanguage: 'zh-Hans',
    allowableCountries: [{name: "China", code: 'cn'}],
//    allowableCountries: [
//        {name: 'Hong Kong', code: 'hk'},
//        {name: 'Singapore', code: 'sg'},
//        {name: 'Malaysia', code: 'my'},
//        {name: 'India', code: 'in'},
//        {name: 'United Arab Emirates', code: 'uae'},
//        {name: "China", code: 'cn'},
//        {name: 'Taiwan', code: 'tw'},
//        {name: 'Indonesia', code: 'id'},
//        {name: 'Pakistan', code: 'pk'},
//        {name: 'Thailand', code: 'th'}],
    directionsDisplay: "",
    directionsService: "",
    directionLine: [],
    moreCountries: false,
    //webServiceURL: "http://localhost:8084/ATMLocatorWebService/getTranslate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=",
     webServiceURL: "http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getTranslate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=",
    geocoder: "",
    checkLoaded: function() {
        try {
            if (BMap) {
                return true;
            }
        } catch (err) {
            return false;
        }
    }
    ,
    //Initialize the map
    initializeMap: function(container, lat, long, directionsPanel) {
        var map = new BMap.Map(container);
        //  map.centerAndZoom(new BMap.Point(116.4595416667, 39.91506944444), 8);
        map.centerAndZoom(new BMap.Point(long, lat), 8);
        this.geocoder = new BMap.Geocoder();
        map.enableScrollWheelZoom();
        var navigationControl = new BMap.NavigationControl({
            // 靠左上角位置
            anchor: BMAP_ANCHOR_TOP_RIGHT,
            // LARGE类型
            type: BMAP_NAVIGATION_CONTROL_LARGE,
            // 启用显示定位
            enableGeolocation: true
        });
        map.addControl(navigationControl);
        // 添加定位控件
        var geolocationControl = new BMap.GeolocationControl();
        geolocationControl.addEventListener("locationSuccess", function(e) {
            // 定位成功事件
            var address = '';
            address += e.addressComponent.province;
            address += e.addressComponent.city;
            address += e.addressComponent.district;
            address += e.addressComponent.street;
            address += e.addressComponent.streetNumber;
            map.removeOverlay(geoMarker);
        });
        map.addControl(geolocationControl);
        return map;
    },
    //returns a new BMAP MarkerCluster
    getMarkerClusterer: function(map, markerArray) {
        return new BMapLib.MarkerClusterer(map, {marker: markerArray});
    },
    panToRegion: function(map, container) {

    },
    //Pans the map
    mapPan: function(map, searchObject) {
        /*BAIDU: Translation */
        var searchValue = "";
        var translateUrl = this.webServiceURL + searchObject.address + "&from=en&to=zh";
        // var translateUrl="http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getTranslate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + searchObject.address + "&from=en&to=zh";
        //initial url: http://openapi.baidu.com/public/2.0/bmt/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=shanghai&from=en&to=zh

        var json = $.ajax({
            dataType: "json",
            url: translateUrl,
            async: false
        });
        json = json.responseJSON;
        if (json !== undefined) {
            var jsonObj = json.trans_result;
            var i;
            for (i = 0; i < jsonObj.length; i++) {
                var translation = jsonObj[i].dst;
                if (translation !== undefined) {
                    searchValue = translation;
                    if (country !== "") {
                        this.geocoder.getPoint(searchValue, function(point) {
                            if (point) {
                                map.centerAndZoom(point, 12);
                            }
                        }, searchValue);
                    }
                }
            }

            return;
        }

        /*End of translation*/
    },
    //initializes InfoWindows
    initializeInfoWindow: function(map, container, infoWindow) {

    },
    geoAttempt: function(map) {
        //if true, add distanceSort = true;
        //In Construction

        distanceSort = true;
//        var geoService = new BMap.Geolocation();
//        var geoStatus = geoService.getStatus();
//        console.log("status: " + geoStatus);
//        geoService.getCurrentPosition(function(loc) {
//
//            if (loc && geoStatus === '0') {
//                    userPosition = loc;
//                   console.log("userPosition: " + userPosition.lng + " " + userPosition.lat);
//                    geolocation = true;
//
//                    //blue circle around user's location
////                    GeoMarker = new GeolocationMarker();
////                    GeoMarker.setCircleOptions({
////                        fillColor: '#808080'});
////                    GeoMarker.setMap(map);
//                    map.panTo(userPosition);
//            } else {
//                alert("Your Browser does not support GeoLocation.");
//            }
//        });

        var geoService = new BMap.Geolocation();
        geoService.getCurrentPosition(function(r) {
            if (this.getStatus() === BMAP_STATUS_SUCCESS) {
                  var icon = new BMap.Icon("resources/img/pin/current-loc.png", new BMap.Size(34, 40));
        geoMarker = new BMap.Marker(r.point, {
            icon: icon
        });

                
               // var mk = new BMap.Marker();
                map.addOverlay(geoMarker);
                map.panTo(r.point);

                var current = new BMap.Geocoder();
                current.getLocation(r.point, function(s) {
                    if (s) {
                        var address = "";
                        address += s.addressComponents.province;
                        address += s.addressComponents.city;
                        address += s.addressComponents.district;
                        address += s.addressComponents.street;
                        address += s.addressComponents.streetNumber;
                        console.log("ADDRESS: " + address);
                        if (address !== '' && address !== undefined) {
                            currentAddress = address;
                        } else {
                            currentAddress = "北京市东城区东长安街";
                        }
                        console.log("address: " + currentAddress);
                    }
                });
            }
            else {
                alert("Your Browser does not support GeoLocation.");
            }
        }, {enableHighAccuracy: true})


    },
    addLocationControl: function(userLocationControlDiv, map) {
    },
    createMarker: function(lat, lng, map, channelName, channelAdd, channelHrs, type, markerId, infowindow, markerImage) {
        var baiduLong = lng - (-0.0065853333);
        var baiduLat = lat - (-0.0060823333);
        var latlng = new BMap.Point(baiduLong, baiduLat);

        var content = '<div id="baiduInfoWindow"><strong>' + channelName + '</strong></br><div class="mobile-hidden">' + channelAdd + "";
        // content string for mobile popup
        var mContent = '<div id="mInfoWindow" class=""><strong>' + channelName + '</strong></br>' + channelAdd;

        if (!isNullOrWhitespace(channelHrs)) {
            content = content + '</div></br>' + 'Operating Hours:</br>' + channelHrs;
            mContent = mContent + '</br>' + 'Operating Hours:</br>' + channelHrs;
        }
        content = content + '</br><a onclick="findDirectionsFromMarker(\'' + latlng.lat + '\',\'' + latlng.lng + '\',\'' + channelAdd + '\')"><button class=\'btn btn-xs btn-primary\'>Get Directions</button></a></div></div>';
        mContent = mContent + '</br><a href="http://maps.google.com/maps?q=' + latlng.lat + ',' + latlng.lng + '"><button class=\'btn btn-xs btn-primary\' >Get Directions</button></a></div>';


        var icon = new BMap.Icon(markerImage, new BMap.Size(34, 40), {
            anchor: new BMap.Size(10, 30),
            infoWindowAnchor: new BMap.Size(10, 0)
        });
        var marker = new BMap.Marker(latlng, {
            icon: icon,
            //zIndex: Math.round(latlng.lat() * -100000) << 5,
            title: channelName
        });

        marker.addEventListener('click', function() {
            mapsView.set('sMarker', this);
            var sMarker1 = mapsView.get('sMarker');
            console.log(sMarker1.getTitle());
            mapsView.sendAction("selectedMarker", markerId);

            // map.setCenter(marker.getPosition());
            map.centerAndZoom(marker.getPosition(), 20);
            infowindow.setContent(content);
            openInfo(mContent);
            this.openInfoWindow(infowindow);



        });
        return marker;
    },
    createInfoWindow: function() {
        return new BMap.InfoWindow();
    },
    //render the Directions into the map
    renderDirections: function(map, transportMode, start, end, lat, lng, container) {
        container.empty();
        console.log(container.attr('id'));
        var transport;
        var haveRoute = false;
        var gotError = true;
        switch (transportMode) {
            case 'DRIVING':
                console.log("DRIVE");
                transport = new BMap.DrivingRoute(map);
                break;
            case 'TRANSIT':
                console.log("TRANSIT");
                transport = new BMap.TransitRoute(map);//, {renderOptions: {map: map}});
                break;
            case 'WALKING':
                console.log("WALK");
                transport = new BMap.WalkingRoute(map);
                break;
        }
        var con = this;
        var translationUrl = this.webServiceURL;
        var startCoder = new BMap.Geocoder();
        startCoder.getPoint(start, function(point) {
            if (point) {
                start = point;
                end = new BMap.Point(lng - (-0.0065853333), lat - (-0.0060823333));

                transport.setSearchCompleteCallback(function(result) {
                    gotError = false;
                    //get route

                    var plan = result.getPlan(0);
                    if (plan !== undefined) {
                        if (transportMode === 'TRANSIT') {

                            if (transport.getStatus() === BMAP_STATUS_SUCCESS) {
                                for (var i = 0; i < plan.getNumRoutes(); i++) {
                                    var walk = plan.getRoute(i);
                                    if (walk.getDistance(false) > 0) {

                                        // 步行线路有可能为0
                                        var walkPt = walk.getPath();
                                        var dirLine = new BMap.Polyline(walkPt, {strokeStyle: "dashed"});//, strokeColor: "#FD128C", strokeWeight: 3, strokeOpacity: 1}));//, {lineColor: "green"}));
                                        con.directionLine.push(dirLine);
                                        map.addOverlay(dirLine);
                                    }
                                }
                                // 绘制公交线路
                                for (i = 0; i < plan.getNumLines(); i++) {
                                    var line = plan.getLine(i);
                                    var boarding = line.getGetOnStop();
                                    if (boarding !== undefined) {
                                        var transportType = line.type;

                                        var icon = new BMap.Icon('resources/img/pin/transport-train-board.png', new BMap.Size(36, 36), {
                                            // anchor: new BMap.Size(10, 45),
                                            infoWindowAnchor: new BMap.Size(10, 18)
                                        });
                                        if (transportType === 'BMAP_LINE_TYPE_BUS') {
                                            icon = new BMap.Icon('resources/img/pin/transport-bus-board.png', new BMap.Size(36, 36), {
                                                // anchor: new BMap.Size(10, 45),
                                                infoWindowAnchor: new BMap.Size(10, 18)
                                            });
                                        }
                                        var marker = new BMap.Marker(boarding.point, {
                                            map: map,
                                            icon: icon
                                        });

                                        directionMarker.push(marker);
                                        map.addOverlay(marker);

                                        marker.addEventListener('click', function() {

                                            var lineTitle = line.title;
                                            var translateUrl = translationUrl + lineTitle + "&from=zh&to=en";

                                            var json = $.ajax({
                                                dataType: "json",
                                                url: translateUrl,
                                                async: false
                                            });
                                            json = json.responseJSON;
                                            if (json !== undefined) {
                                                var jsonObj = json.trans_result;
                                                var i;
                                                for (i = 0; i < jsonObj.length; i++) {
                                                    var translation = jsonObj[i].dst;
                                                    if (translation !== undefined) {
                                                        infowindow.setContent("Board at: " + translation);
                                                        infowindow.setWidth(250);
                                                        this.openInfoWindow(infowindow);
                                                    }
                                                }
                                                return;
                                            }
                                        });
                                    }
                                    var alighting = line.getGetOffStop();
                                    if (alighting !== undefined) {
                                        var transportType = line.type;

                                        var icon = new BMap.Icon('resources/img/pin/transport-train-alight.png', new BMap.Size(36, 36), {
                                            // anchor: new BMap.Size(10, 45),
                                            infoWindowAnchor: new BMap.Size(10, 18)
                                        });
                                        if (transportType === 'BMAP_LINE_TYPE_BUS') {
                                            icon = new BMap.Icon('resources/img/pin/transport-bus-alight.png', new BMap.Size(36, 36), {
                                                // anchor: new BMap.Size(10, 45),
                                                infoWindowAnchor: new BMap.Size(10, 18)
                                            });
                                        }
                                        var marker = new BMap.Marker(alighting.point, {
                                            map: map,
                                            icon: icon
                                        });

                                        directionMarker.push(marker);
                                        map.addOverlay(marker);
                                        marker.addEventListener('click', function() {

                                            var lineTitle = line.title;
                                            var translateUrl = translationUrl + lineTitle + "&from=zh&to=en";

                                            var json = $.ajax({
                                                dataType: "json",
                                                url: translateUrl,
                                                async: false
                                            });
                                            json = json.responseJSON;
                                            if (json !== undefined) {
                                                var jsonObj = json.trans_result;
                                                var i;
                                                for (i = 0; i < jsonObj.length; i++) {
                                                    var translation = jsonObj[i].dst;
                                                    if (translation !== undefined) {
                                                        infowindow.setContent("Alight at: " + translation);
                                                        infowindow.setWidth(250);
                                                        this.openInfoWindow(infowindow);
                                                    }
                                                }
                                                return;
                                            }



                                        });
                                    }

                                    var dirLine = new BMap.Polyline(line.getPath());//, {strokeColor: "#FD128C", strokeWeight: 3, strokeOpacity: 1}));//strokeColor: "#FD128C", strokeWeight: 3, strokeOpacity: 1}));
                                    con.directionLine.push(dirLine);
                                    map.addOverlay(dirLine);
                                }
                                var desc = plan.getDescription(false);
                                console.log("desc: " + desc);
                                var translateUrl = translationUrl + desc + "&from=zh&to=en";
                                var json = $.ajax({
                                    dataType: "json",
                                    url: translateUrl,
                                    async: false
                                });
                                json = json.responseJSON;
                                if (json !== undefined) {
                                    var jsonObj = json.trans_result;

                                    var i;
                                    for (i = 0; i < jsonObj.length; i++) {
                                        var translation = jsonObj[i].dst;
                                        if (translation !== undefined) {
                                            var stepDescTrans = translation;
                                            var stepDescArr = stepDescTrans.split(',');

                                            for (var a = 0; a < stepDescArr.length; a++) {
                                                var stepDesc = stepDescArr[a].trim();
                                                stepDesc = stepDesc.charAt(0).toUpperCase() + stepDesc.slice(1);
                                                //stepDesc = stepDescArr[a].capitalize();

                                                container.append("<li class='list-group-item directions-item'>" + (a + 1) + ". " + stepDesc + "</li>");

                                            }

                                        }
                                    }
                                }
                                haveRoute = true;
                            }
                        } else {

                            var route = plan.getRoute(0);
                            //Get all the point route
                            var travelPoints = route.getPath();
                            if (route !== undefined) {
                                haveRoute = true;
                                //Connect all the dots
                                var dirLine = new BMap.Polyline(travelPoints);//, {strokeColor: "#FD128C", strokeWeight: 3, strokeOpacity: 1});
                                con.directionLine.push(dirLine);
                                map.addOverlay(dirLine);


                                var steps1 = "";
                                var steps2 = "";
                                var steps3 = "";
                                var steps4 = "";
                                var steps5 = "";
                                var steps6 = "";
                                var steps7 = "";
                                console.log("steps: " + route.getNumSteps());
                                for (var i = 0; i < route.getNumSteps(); i++) {
                                    if (i <= 30) {
                                        steps1 = steps1 + route.getStep(i).getDescription(false) + "%0A";
                                    } else if (i <= 60) {
                                        steps2 = steps2 + route.getStep(i).getDescription(false) + "%0A";
                                    } else if (i <= 90) {
                                        steps3 = steps3 + route.getStep(i).getDescription(false) + "%0A";
                                    } else if (i <= 120) {
                                        steps4 = steps4 + route.getStep(i).getDescription(false) + "%0A";
                                    } else if (i <= 150) {
                                        steps5 = steps5 + route.getStep(i).getDescription(false) + "%0A";
                                    } else if (i <= 180) {
                                        steps6 = steps6 + route.getStep(i).getDescription(false) + "%0A";
                                    } else {
                                        steps7 = steps7 + route.getStep(i).getDescription(false) + "%0A";
                                    }

                                    //to implement the start and end point marker
                                    if (i === 0 || i === route.getNumSteps() - 1) {
                                        if (i === 0) {
                                            var icon = new BMap.Icon('resources/img/pin/pin-start.png', new BMap.Size(34, 45), {
                                                anchor: new BMap.Size(10, 45),
                                                infoWindowAnchor: new BMap.Size(10, 18)
                                            });
                                            con.populateDirectionSteps(map, route.getStep(i), directionMarker, icon);
                                        } else {
                                            var icon = new BMap.Icon('resources/img/pin/pin-end.png', new BMap.Size(34, 45), {
                                                anchor: new BMap.Size(10, 45),
                                                infoWindowAnchor: new BMap.Size(10, 18)
                                            });
                                            con.populateDirectionSteps(map, route.getStep(i), directionMarker, icon);
                                        }
                                    } else {
                                        con.populateDirectionSteps(map, route.getStep(i), directionMarker, undefined);
                                    }
                                    if (con.defaultLanguage === 'zh-Hans') {
                                        container.append("<a class='directions-item' href='#' onClick='panToDirectionMarker(" + i + ")'><li class='list-group-item directions-item'>" + route.getStep(i).getDescription(false) + "</li></a>");

                                    }
                                }
                                if (con.defaultLanguage === 'en') {
                                    var steps = [steps1, steps2, steps3, steps4, steps5, steps6, steps7];
                                    for (var a = 0; a < steps.length; a++) {
                                        if (steps[a] !== "") {
                                            var translateUrl = translationUrl + steps[a] + "&from=zh&to=en";
                                            var json = $.ajax({
                                                dataType: "json",
                                                url: translateUrl,
                                                async: false
                                            });
                                            json = json.responseJSON;
                                            if (json !== undefined) {
                                                var jsonObj = json.trans_result;
                                                var i;
                                                for (i = 0; i < jsonObj.length; i++) {
                                                    var translation = jsonObj[i].dst;
                                                    if (translation !== undefined) {
                                                        var stepDesc = translation;
                                                        var position;
                                                        if (a === 0) {
                                                            position = i;
                                                        } else if (a === 1) {
                                                            position = i + 31;
                                                        } else if (a === 2) {
                                                            position = i + 61;
                                                        } else if (a === 3) {
                                                            position = i + 91;
                                                        } else if (a === 4) {
                                                            position = i + 121;
                                                        } else if (a === 5) {
                                                            position = i + 151;
                                                        } else {
                                                            position = i + 181;
                                                        }
                                                        container.append("<a class='directions-item' href='#' onClick='panToDirectionMarker(" + position + ")'><li class='list-group-item directions-item'>" + stepDesc + "</li></a>");

                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    }
                    if (!haveRoute) {
                        container.empty();
                        if (con.defaultLanguage === 'zh-Hans') {
                            container.append("无法找到适合的路线");
                        } else {
                            container.append("No possible direction available");
                        }
                    }
                });

                transport.search(start, end);
                setTimeout(function() {
                    if (gotError && transportMode === 'TRANSIT') {
                        container.empty();
                        if (con.defaultLanguage === 'zh-Hans') {
                            container.append("无法找到适合的路线");
                        } else {
                            container.append("No possible direction available");
                        }
                    }

                }, 8000);


            }

        }, start);
    },
    //populate steps in directions
    populateDirectionSteps: function(map, start_location, directionMarker, icon) {
        var marker;
        if (icon !== undefined) {
            marker = new BMap.Marker(start_location.getPosition(), {
                map: map,
                icon: icon
            });
        } else {
            marker = new BMap.Marker(start_location.getPosition(), {
                map: map
            });
        }
        directionMarker.push(marker);
        map.addOverlay(marker);

        var translationUrl = this.webServiceURL;
        var con = this;
        marker.addEventListener('click', function() {

            var stepDescEng = start_location.getDescription(false);
            infowindow.setWidth(250);
            if (con.defaultLanguage === 'zh-Hans') {
                infowindow.setContent(stepDescEng);
                this.openInfoWindow(infowindow);
            } else if (con.defaultLanguage === 'en') {
                var translateUrl = translationUrl + stepDescEng + "&from=zh&to=en";
                // var translateUrl="http://atm-onionknights.rhcloud.com/ATMLocatorWebService/getTranslate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=" + searchObject.address + "&from=en&to=zh";
                //initial url: http://openapi.baidu.com/public/2.0/bmt/translate?client_id=2uOs5IUwv9AQsfRWFvj8xVLj&q=shanghai&from=en&to=zh

                var json = $.ajax({
                    dataType: "json",
                    url: translateUrl,
                    async: false
                });
                json = json.responseJSON;
                if (json !== undefined) {
                    var jsonObj = json.trans_result;
                    var i;
                    for (i = 0; i < jsonObj.length; i++) {
                        var translation = jsonObj[i].dst;
                        if (translation !== undefined) {
                            infowindow.setContent(translation);
                            this.openInfoWindow(infowindow);
                        }
                    }
                    return;
                }
            }



        });
    },
    //pan to directions
    panToDirectionMarker: function(map, pos, directionMarker) {
        console.log("position: " + pos);
        map.centerAndZoom(directionMarker[pos].getPosition(), 11);
        directionMarker[pos].dispatchEvent("click");
    },
    clearDirections: function(map, markerArray) {
        for (var i = 0; i < markerArray.length; i++) {
            map.removeOverlay(markerArray[i]);
        }
        for (var i = 0; i < this.directionLine.length; i++) {
            map.removeOverlay(this.directionLine[i]);
        }
        this.directionLine = [];
        markerArray = [];
        $('#directionsList').empty();
    },
    selectMarker: function(marker) {
        marker.dispatchEvent("click");
    },
    mapResize: function() {
        //not implemented
    },
//    appDefault: function(region) {
//        defaultQuery = "32.91287165677423,111.85867238125002";
//        latitude = 32.91287165677423;
//        longitude = 111.85867238125002;
//        defaultZoomLevel = 5;
//        isSVAavailable = false;
//
//        /* Bounds for CN */
//        var ne = new BMap.Point(101.74585896874999, 21.002879252870027);
//        var sw = new BMap.Point(124.68531209374999, 43.61253334547215)
//
//        //bounds = new google.maps.LatLngBounds(sw, ne);
//
//        poiZoomLevel = 14;
//    }

    appDefault: function(region) {
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

                var ne = new BMap.Point(114.403381, 22.516364);
                var sw = new BMap.Point(113.820419, 22.168966);


                break;
            case 'sg' :
                defaultQuery = "114 Windsor Park Road";
                latitude = 1.355255;
                longitude = 103.82313899999997;
                defaultZoomLevel = 14;

                appointmentAvailable = true;

                var ne = new BMap.Point(104.096146, 1.483676);
                var sw = new BMap.Point(103.593521, 1.185753);


                break;
            case 'my' :
                defaultQuery = "3.643487486358246,102.0933491406249";
                latitude = 3.643487486358246;
                longitude = 102.0933491406249;
                defaultZoomLevel = 7;
                isSVAavailable = false;

                appointmentAvailable = true;

                /* Bounds for MY */
                var ne = new BMap.Point(119.630814, 7.112477);
                var sw = new BMap.Point(100.326462, 1.511132);

                poiZoomLevel = 15;

                break;
            case 'in' :
                defaultQuery = "22.129057919979036,79.20249906250001";
                latitude = 22.129057919979036;
                longitude = 79.20249906250001;
                defaultZoomLevel = 5;
                isSVAavailable = false;

                /* Bounds for IN */
                var ne = new BMap.Point(97.198105, 37.100647);
                var sw = new BMap.Point(67.030334, 7.540849);
                poiZoomLevel = 15;

                break;
            case 'uae' :
                defaultQuery = "24.92857630275063,54.89571697187498";
                latitude = 24.92857630275063;
                longitude = 54.89571697187498;
                defaultZoomLevel = 9;
                isSVAavailable = false;

                /* Bounds for UAE */
                var ne = new BMap.Point(56.504745, 26.088239);
                var sw = new BMap.Point(51.605530, 22.577243);
                poiZoomLevel = 14;

                break;
            case 'cn' :

                defaultQuery = "32.91287165677423,111.85867238125002";
                latitude = 32.91287165677423;
                longitude = 111.85867238125002;
                defaultZoomLevel = 5;
                isSVAavailable = false;

                /* Bounds for CN */
                var ne = new BMap.Point(101.74585896874999, 21.002879252870027);
                var sw = new BMap.Point(124.68531209374999, 43.61253334547215)

                poiZoomLevel = 14;

                break;
            case 'tw' :
                defaultQuery = "24.755184131278263,121.41662213457039";
                latitude = 24.755184131278263;
                longitude = 121.41662213457039;
                defaultZoomLevel = 9;

                /* Bounds for TW */
                var ne = new BMap.Point(122.00894331210941, 25.284470155147858);
                var sw = new BMap.Point(85150312656253, 22.43772006130058);
                poiZoomLevel = 14;


                break;
            case 'id' :


                defaultQuery = "0.9461731,104.29779182";
                latitude = 0.9461731;
                longitude = 104.29779182;
                defaultZoomLevel = 5;
                isSVAavailable = false;


                /* Bounds for ID */
                var ne = new BMap.Point(115.91120887500006, 5.573806730048983);
                var sw = new BMap.Point(98.68464637500006, -9.143941615454509);

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
                var ne = new BMap.Point(66.86656683683395, 24.68188809014598);
                var sw = new BMap.Point(67.19547003507614, 25.002788281718168);
                poiZoomLevel = 14;

                break;
            case 'th' :
                defaultQuery = "16.332309993224936,101.00907451679689 ";
                latitude = 16.332309993224936;
                longitude = 101.00907451679689;
                defaultZoomLevel = 6;

                //appointmentAvailable = true;		

                /* Bounds for TH */
                var ne = new BMap.Point(101.59909223789066, 19.992741625470114);
                var sw = new BMap.Point(97.99557661289066, 12.596149249510297);

                poiZoomLevel = 14;

                break;

            case 'bn' :
                defaultQuery = "Brunei";
                latitude = 4.8;
                longitude = 114.9;
                defaultZoomLevel = 10;

                appointmentAvailable = false;

                /* Bounds for BN */
                var ne = new BMap.Point(115, 5);
                var sw = new BMap.Point(113, 4);
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
}