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
			console.log("URL to ticketmaster: " + base + query + apiKey);
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject('Error!');
		});
		return def.promise;
	};
	return tMasterEvents;
});

// fyfApp.factory('locateService', function($window, $q) {
// 	var locateSvc = {};
// 	locateSvc.locate = function() {
// 		var def = $q.defer();
// 		if (!$window.navigator.geolocation) {
// 			def.reject('Geolocation not available...');
// 		} else {
// 			console.log($window.navigator.geolocation);
// 			$window.navigator.geolocation.getCurrentPosition(
// 				function(position) {
// 					console.log(position);
// 					def.resolve(position);
// 				}, function (error) {
// 					def.reject(error);
// 				}
// 			);
// 		}
// 		return def.promise;
// 	}
// 	return locateSvc;
// });

fyfApp.factory('geocodeService', function($http, $q) {
	var geocodeSvc = {};
	geocodeSvc.convert = function(url) {
		var def = $q.defer();
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	geocodeSvc.convertInLoop = function(url, festival, venue) {
		var def = $q.defer();
		var ctxt = [festival, venue];
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			def.resolve(rspns);
			def.promise.$$state.value.data.results[0].ctxt = ctxt;
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	return geocodeSvc;
});


fyfApp.controller('fyfCtrl', function($scope, $http, $timeout, tMasterService, geocodeService) {
	$scope.festArr = [];
	$scope.venueArr = [];

	var keywordArr = [];
	$scope.addArtist = function() {
		console.log($scope.artist);
		keywordArr.push($scope.artist);
	};
	$scope.addFestival = function() {
		console.log($scope.festival);
		keywordArr.push($scope.festival);
	};

	//User's current location
	var myLatLng = {lat: 40.00, lng: -98.00};
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: myLatLng
	});

	var onLoadQuery = "keyword=festival&classificationName=music&countryCode=US";
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
			$scope.festArr.push(new FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue));
		}
		console.log($scope.festArr);
		console.log($scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		checkLatLng();
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		var undefinedArr = [];
		for (var i = 0; i < $scope.venueArr.length; i++) {
			if ($scope.venueArr[i].location === undefined) {
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
			// $timeout(function() {
				callForGeocode(undefinedArr[i]);
			// }, 5000);
		}
		// var i = 0;
		// var j = 0;
		// while(undefinedArr[i]) {
		// 	var url = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		// 	if (i === j) {
		// 		j++;
		// 		var address = undefinedArr[i].venueObj.googleAddress;
		// 		url += address;
		// 		console.log(url);
		// 		$http.get(url).success(function(rspns) {
		// 			console.log(rspns);
		// 			i++;
		// 		}).error(function(rspns) {
		// 			console.log("callForGeocode failed.");
		// 			i++;
		// 		})
		// 	} 
		// }
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
		$timeout(function() {
			console.log("Gonna call placeMarkers with 10 sec delay");
			placeMarkers()
		}, 5000);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	});
	

	$scope.search = function() {
		// $scope.festArr = [];
		// $scope.venueArr = [];
		console.log("!!!!!!!!!!!!!#############%^^^^^^^^^^^^^******************************************search start!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		var startDate;
		var endDate;
		var city;
		var state;
		var zip;
		var radius;

		var keywordQuery = "&keyword=";
		var genreQuery = "classificationName=music";
		var startDateQuery = "";
		var endDateQuery = "";
		var cityQuery = "";
		var stateQuery = "";
		var zipQuery = "";
		var radiusQuery = "&radius=1000";

		//Dates
		if ($scope.startDate) {
			startDate = $scope.startDate;
			startDate = convertDateForAPI(startDate);
			console.log("corrected? " + startDate);
			startDateQuery += "&startDateTime=" + startDate;
		} 
		if ($scope.endDate) {
			endDate = $scope.endDate;
			endDate = convertDateForAPI(endDate);
			console.log("corrected? " + endDate);
			endDateQuery += "&endDateTime=" + endDate;
		}
		//Genres
		var additionalGenreQuery = "";
		console.log($scope.genre);
		if ($scope.genre) {
			for (var i = 0; i < $scope.genre.length; i++) {
				if ($scope.genre[i] === "all") {
					additionalGenreQuery = "";
				} else {
					additionalGenreQuery += "%2C" + $scope.genre[i];
				}
			}
		}
		genreQuery = genreQuery + additionalGenreQuery;
		console.log(genreQuery);
		//classificationName= %2C+
		//Location
		var googleAddress = "";

		if ($scope.locCity) {
			city = $scope.locCity;
			console.log(city);
			googleAddress += city;
			// cityQuery += "&city=" + city;
		}
		if ($scope.locState) {
			state = $scope.locState;
			console.log(state);
			googleAddress += state;
			// stateQuery += "&stateCode=" + state;
		}
		if ($scope.locZip) {
			zip = $scope.locZip;
			console.log(zip);
			googleAddress += zip;
			// zipQuery += "&postalCode=" + zip;
		}
		if ($scope.radius) {
			radius = $scope.radius;
			console.log(radius);
			radiusQuery = "&radius=" + radius;
		}
		//keywords
		if (keywordArr.length !== 0) {
			for (var i = 0; i < keywordArr.length; i++) {
				keywordQuery += "%2C" + keywordArr[i];
			}
		}
		//request for google Geocoding to get coordinates 
		var searchLatLng;
		var url = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		url += googleAddress; 
		console.log(url);
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			searchLatLng = rspns.data.results[0].geometry.location.lat + ",";
			searchLatLng += rspns.data.results[0].geometry.location.lng;
			console.log(searchLatLng);
		}, function fail(rspns) { console.log("callForGeocode failed");})
		.then(function success(rspns) {
			// var base = 'https://app.ticketmaster.com/discovery/v2/events.json?size=100';
			// var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
			var query = genreQuery + "&latlong=" + searchLatLng + radiusQuery;
			tMasterService.getData(query)
			.then(function success(rspns) {
				console.log(rspns);
				var data = rspns.data;
				if (data.hasOwnProperty('_embedded')) {
					var data = rspns.data._embedded.events;
					$scope.festArr = [];
					$scope.venueArr = [];
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
						$scope.festArr.push(new FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue));
					}
				} else {
					console.log("0 Result Returned.");
				}
				console.log($scope.festArr);
				console.log($scope.venueArr);
			}, function fail(rspns) {
				console.log("Failed due to " + rspns.status);
			})	
			.then(function success(rspns) {
				checkLatLng();
			}, function fail(rspns) {
				console.log("Failed due to " + rspns.status);
			})
			.then(function success(rspns) {
				var undefinedArr = [];
				for (var i = 0; i < $scope.venueArr.length; i++) {
					if ($scope.venueArr[i].location === undefined) {
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
					callForGeocode(undefinedArr[i]);
				}

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
				$timeout(function() {
					console.log("Gonna call placeMarkers with 10 sec delay");
					placeMarkers()
				}, 5000);
			}, function fail(rspns) {
				console.log("Failed due to " + rspns.status);
			});
		}, function fail(rspns) {
			console.log("failed due to " + rspns.status);
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

	function checkLatLng() {
		var venueArr = $scope.venueArr;
		for (var i = 0; i < venueArr.length; i++) {
			console.log("In checkLatLng(), checking each element and its location");
			console.log(venueArr[i]);
			console.log(venueArr[i].location);
			if (venueArr[i].location === undefined) {
				// var address = venueArr[i].address;
				var address = "";
				console.log(i + "'s location undefined, formatting address for Google:");
				console.dir(venueArr[i]);
				address += ", " + venueArr[i].city + ", " + venueArr[i].state.stateCode;
				address += ", " +venueArr[i].zipCode;
				address = address.replace(/\s/g, "+");
				venueArr[i].googleAddress = address;
				console.log("googleAddress: " + venueArr[i].googleAddress);
			} else {
				console.log(i + " is good, has latlng");
			}
		}
	}

	function callForGeocode(venueObj) {
		var venue = venueObj.venueObj;
		var url = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		url += venue.googleAddress; 
		console.log(url);
		$http.get(url).success(function(rspns) {
			console.log(rspns);
			venue.result = rspns.results[0];
		}).error(function(rspns) { console.log("callForGeocode failed");});
	}

	var markers = [];
	function placeMarkers() {
		if (markers.length !== 0) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
		}
		markers = [];

		var infoWindow = new google.maps.InfoWindow({});
		for (var i = 0; i < $scope.venueArr.length; i++) {
			var venue = $scope.venueArr[i];
			var festival = $scope.festArr[i];
			var contentStr = festival.name + "<br/>" + venue.name;
			var lat;
			var lng;
			if (venue.location === undefined) {
				console.dir($scope.venueArr[i]);
				console.dir($scope.venueArr[i].result);
				lat = venue.result.geometry.location.lat;
				lng = venue.result.geometry.location.lng;
			} else {
				lat = Number(venue.location.latitude);
				lng = Number(venue.location.longitude);
			}
			var position = {
				lat: lat, 
				lng: lng
			};
			var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';

			var marker = new google.maps.Marker({
				position: position,
				map: map,
				title: venue.name,
				icon: icon
			});
			markers.push(marker);
		}
		
		for (var i = 0; i < markers.length; i++) {
			marker.addListener('click', function() {
				infoWindow.setContent(contentStr);
				infoWindow.open(map, marker);
			})
		}
		

	} 


});

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
}

function VenueObj(item) {
	this.name = item.name;
	this.location = item.location; //object
	// this.address = item.address.line1; 
	this.city = item.city.name;
	this.state = item.state; //object
	this.zipCode = item.postalCode;
	this.country = item.country; //object
	this.link = item.url;
	this.googleAddress = "";
}