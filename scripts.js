var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('tMasterService', function($http, $q) {
	//Classifcation Name = "music", id="KZFzniwnSyZfZ7v7nJ"
	var base = 'https://app.ticketmaster.com/discovery/v2/events.json?';
	var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';

	var tMasterEvents = {};
	tMasterEvents.getData = function(query) {
		var def = $q.defer();
		$http({
			method: 'GET',
			url: base + query + apiKey
		}).then(function success(rspns) {
			console.log("This is Url used in tMasterService:");
			console.log(base+apiKey+query);
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log("(tMasterService) Failed due to " + rspns.status);
			def.reject('Error (tMasterService)');
		});
		return def.promise;
	};
	return tMasterEvents;
});

fyfApp.factory('locateService', function($window, $q) {
	var locateSvc = {};
	locateSvc.locate = function() {
		var def = $q.defer();
		if (!$window.navigator.geolocation) {
			def.reject('Geolocation not available...');
		} else {
			console.log($window.navigator.geolocation);
			$window.navigator.geolocation.getCurrentPosition(
				function(position) {
					console.log(position);
					def.resolve(position);
				}, function (error) {
					def.reject(error);
				}
			);
		}
		return def.promise;
	}
	return locateSvc;
});

fyfApp.factory('geocodeService', function($http, $q) {
	var geocodeSvc = {};
	geocodeSvc.convert = function(venueArr, index) {
		var base = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		var def = $q.defer();
		var address = venueArr[index].googleAddress;

		$http({
			method: 'GET',
			url: base + address
		}).then(function success(rspns) {
			def.resolve(rspns);
			def.promise.$$state.value.data.results[0].venueArr = venueArr;
			def.promise.$$state.value.data.results[0].index = index;
		}, function fail(rspns) {
			console.log("(geocodeService-covernt) Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	return geocodeSvc;
	// geocodeSvc.convertInLoop = function(url, festival, venue) {
	// 	var def = $q.defer();
	// 	var ctxt = [festival, venue];
	// 	$http({
	// 		method: 'GET',
	// 		url: url
	// 	}).then(function success(rspns) {
	// 		def.resolve(rspns);
	// 		def.promise.$$state.value.data.results[0].ctxt = ctxt;
	// 	}, function fail(rspns) {
	// 		console.log("(geocodeService-covertInLoop)  due to " + rspns.status);
	// 		def.reject(rspns);
	// 	});
	// 	return def.promise;
	// }
	// return geocodeSvc;
});

 //--------------CONTROLLER STARTS-------------------------------------//

fyfApp.controller('fyfCtrl', function($scope, $http, tMasterService, locateService, geocodeService) {
	
	$scope.festArr = [];
	$scope.venueArr = [];

	//For adding artist and festival names
	var keywordArr = [];
	$scope.addArtist = function() {
		console.log($scope.artist);
		keywordArr.push($scope.artist);
	};
	$scope.addFestival = function() {
		console.log($scope.festival);
		keywordArr.push($scope.festival);
	};

	//User's current location *want to use geolocation!!!
	var myLatLng = {lat: 40.00, lng: -98.00};
	// locateService.locate().then(function(position) {
	// 	console.log(position);
	// });
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: myLatLng
	});

	//Initial Url onload
	var onLoadQuery = "countryCode=US&classificationName=music&keyword=festival";
	tMasterService.getData(onLoadQuery)
	.then(function success(rspns) {
		console.log(rspns);
		var data = rspns.data._embedded.events;
		for (var i = 0; i < data.length; i++) {
			var index = i;
			var name = data[i].name;
			var id = data[i].id;
			var desc = data[i].info;
			var images = data[i].images;  //array of objects
			var start = data[i].dates.start.localDate;
			var end = "n/a";
			var link = data[i].url;
			var prices = data[i].priceRanges; 
			//array of objects: currecny, max, min, type
			var performers = data[i]._embedded.attractions;
			//array of objects
			var venue = data[i]._embedded.venues[0]; 
			$scope.venueArr.push(new VenueObj(venue));
			//array of objects
			var fest = new FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue);
			$scope.festArr.push(fest);
		}
		console.log($scope.festArr);
		console.log($scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		checkLatLng($scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		console.log('checkLatLng() done, next for geoCoding');
		console.log($scope.venueArr);
		var undefinedArr = [];
		for (var i = 0; i < $scope.venueArr.length; i++) {
			console.log(i + "th element in venueArr");
			console.log($scope.venueArr[i]);
			if ($scope.venueArr[i].location == undefined) {
				console.log(i + "th element UNDEFIND LOCATION");
				console.log($scope.venueArr[i].location);
				var obj = {
					venueObj: $scope.venueArr[i],
					origianlIndex: i
				};
				undefinedArr.push(obj);
			}	
		}
		console.log(undefinedArr);
		for (var i = 0; i < undefinedArr.length; i++) {
			var venueObj = undefinedArr[i].venueObj;
			callForGeocode(venueObj);
		}
		console.log(undefinedArr);
		for (var i = 0; i < undefinedArr.length; i++) {
			var venueObj = undefinedArr[i].venueObj;
			var index = venueObj.origianlIndex;
			console.log(venueObj);
			$scope.venueArr[index] = venueObj;
		}
		console.log($scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		console.log("stop");
		// console.log($scope.festArr);
		// console.log($scope.venueArr);
		// placeMarkers($scope.festArr, $scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	});
	
	$scope.search = function() {
		festArr = [];
		venueArr = [];

		var startDate;
		var endDate;
		var city;
		var state;
		var zip;
		var radius;

		var keywordQuery = "&keyword=festival";
		var genreQuery = "&classificationName=music";
		var startDateQuery = "";
		var endDateQuery = "";
		var cityQuery = "";
		var stateQuery = "";
		var zipQuery = "";
		var radiusQuery = "&radius=500";

		//Dates
		if ($scope.startDate) {
			startDate = $scope.startDate;
			startDate = convertDateForAPI(startDate);
			console.log("corrected? " + startDate);
			stateQuery += "&startDateTime=" + startDate;
		} 
		if ($scope.endDate) {
			endDate = $scope.endDate;
			endDate = convertDateForAPI(endDate);
			console.log("corrected? " + endDate);
			endQuery += "&endDateTime=" + endDate;
		}
		//Location
		if ($scope.locCity) {
			city = $scope.locCity;
			cityQuery += "&city=" + city;
		}
		if ($scope.locState) {
			state = $scope.locState;
			stateQuery += "&stateCode=" + state;
		}
		if ($scope.locZip) {
			zip = $scope.locZip;
			zipQuery += "&postalCode=" + zip;
		}
		if ($scope.radius) {
			radius = $scope.radius;
			radiusQuery = "&radius=" + radius;
		}
		//Genres
		var additionalGenreQuery = "";
		console.log($scope.genre);
		if ($scope.genre) {
			for (var i = 0; i < $scope.genre.length; i++) {
				if ($scope.genre[i] === "all") {
					additionalGenreQuery = "";
				} else {
					additionalGenreQuery += ", " + $scope.genre[i];
				}
			}
		}
		genreQuery = genreQuery + additionalGenreQuery;
		console.log(genreQuery);
		//classificationName= %2C+
		
		//artist and festival names
		console.log(keywordArr);
		for (var i = 0; i < keywordArr.lenght; i++) {
			keywordQuery += ", " + keywordArr[i];
		};

		var query = keywordQuery + startDateQuery + endDateQuery + cityQuery + stateQuery + zipQuery + radiusQuery;
		var url = base + "countryCode=US" + query + apiKey;
		console.log(url);
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			var data = rspns.data;
			if (data.hasOwnProperty('_embedded')) {
				var data = rspns.data._embedded.events;
				for (var i = 0; i < data.length; i++) {
					var index = i;
					var name = data[i].name;
					var id = data[i].id;
					var desc = data[i].info;
					var images = data[i].images;  //array of objects
					var start = data[i].dates.start.localDate;
					var end = "n/a";
					var link = data[i].url;
					var prices = data[i].priceRanges; 
					//array of objects: currecny, max, min, type
					var performers = data[i]._embedded.attractions;
					//array of objects
					var venue = data[i]._embedded.venues[0]; 
					var venueObj = new VenueObj(venue);
					//array of objects
					var fest = new FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue);
				}
				$scope.festArr = festArr;
				$scope.venueArr = venueArr;
				console.log($scope.festArr);
				console.log($scope.venueArr);
			} else {
				console.log("0 Result Returned.");
			}
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
		});
	};

	//----------functions----------------------------------//

	function convertDateForAPI(inputDate) {
		var tempYr = inputDate.getFullYear().toString();
		var tempMo = (inputDate.getMonth() + 1).toString();
		var mo = "0";
		var tempDt = (inputDate.getDate()).toString();
		var dt = "0";
		if (tempMo.length === 1) {
			tempMo = mo + tempMo;
		}
		if (tempDt.length === 1) {
			tempDt = dt + tempDt;
		}
		inputDate = tempYr + "-" + tempMo + "-" + tempDt + "T00:00:00Z";
		console.log(inputDate);
		return inputDate; 
	}

	function checkLatLng(venueArr) {
		for (var i = 0; i < venueArr.length; i++) {
			console.log(venueArr[i].location);
			if (venueArr[i].location == undefined) {
				var address = venueArr[i].address;
				console.log(i + "the object below doesn't have latlng. Formatting address for Google.");
				console.dir(venueArr[i]);
				address += ", " + venueArr[i].city + ", " + venueArr[i].state.stateCode;
				address += ", " +venueArr[i].zipCode;
				address = address.replace(/\s/g, "+");
				venueArr[i].googleAddress = address;
				console.log("this will be sent: " + venueArr[i].googleAddress);
			} else {
				console.log(i + " is good, has latlng");
			}
		}
	}

	function callForGeocode(venueObj) {
		var venue = venueObj;
		var url = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		url += venue.googleAddress; 
		console.log(url);
		$http.get(url).success(function(rspns) {
			console.log(rspns);
			venue.location = rspns.results[0].geometry.location;
		}).error(function(rspns) { console.log("callForGeocode failed");});
	}

	function placeMarkers(festArr, venueArr) {
		var infoWindow = new google.maps.InfoWindow({});
		for (var i = 0; i < venueArr.length; i++) {
			var venue = $scope.venueArr[i];
			var festival = $scope.festArr[i];
			console.log(venue);
			var contentStr = festival.name + "<br/>" + venue.name;
			var latLng = {
				lat: Number(venue.location.latitude), 
				lng: Number(venue.location.longitude)
			};
			var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';
			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				title: venue.name,
				icon: icon
			});
			marker.addListener('click', function() {
				infoWindow.setContent(contentStr);
				infoWindow.open(map, marker);
			})

		}	
	} 
	// END of placeMarkers

});
// END of CONTROLLER

// var festArr = [];
function FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue, highlight) {
	this.index = index;
	this.name = name;
	this.id = id;
	this.desc = desc;
	this.images = images;
	this.start = start;
	this.end = end;
	this.link = link;
	this.prices = prices;
	this.performers = performers;
	this.venue = venue;
	this.highlight = false;
}

// var venueArr = [];
function VenueObj(item) {
	this.name = item.name;
	this.location = item.location; //object
	this.address = item.address.line1; 
	this.city = item.city.name;
	this.state = item.state; //object
	this.zipCode = item.postalCode;
	this.googleAddress = "";
	this.country = item.country; //object
	this.link = item.url;
}
