var serviceManager = {
    serviceList:[GoogleService,BaiduService],
    //serviceList: [BaiduService],
    retrieveService: function() {

        var json = $.ajax({
            dataType: "json",
            url: "http://www.telize.com/geoip",
            async: false,
			timeout:500
        },function(error){console.log(error)});
        var country = "";

        try {
            country = json.responseJSON.country;
        } catch (error) {
            console.log("Error" + error);
            country = "";
        }
        if (country == 'China') {
            return this.serviceList[1];
        }
        else {
            for (var i = 0; i < this.serviceList.length; i++) {
                if (this.serviceList[i].checkLoaded()) {
                    return this.serviceList[i];
                }
            }
        }
    }
}