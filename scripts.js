var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('tMasterService', function($http, $q) {
	var base = 'https://app.ticketmaster.com/discovery/v2/events.json?apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
	var tMasterEvents = {};
	tMasterEvents.getData = function(query) {
		var def = $q.defer();
		$http({
			method: 'GET',
			url: base + query
		}).then(function success(rspns) {
			console.log("Url used for TicketMaster: " + base + query);
			def.resolve(rspns);
		}, function fail(rspns) {
			def.reject("tMasterService FAIL");
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
			$window.navigator.geolocation.getCurrentPosition(
				function(position) {
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


 // controller -----------------------------------------------------

fyfApp.controller('fyfCtrl', function($scope, $http, tMasterService, locateService) {
	$scope.festArr = [];
	$scope.venueArr = [];
	
	var map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.0000, lng: -98.0000},
		zoom: 4
	});

	// var mapOptions = { zoom: "", center: {} };
	// locateService.locate().then(function success(position) {
	// 	console.log(position);
	// 	mapOptions.center = {
	// 		lat: position.coords.latitude,
	// 		lng: position.coords.longitude
	// 	};
	// 	mapOptions.zoom = 6;
	// }, function fail(rspns) {
	// 	console.log("locateService Failed");
	// })
	// .then(function success(rspns) {
	// 	map = new google.maps.Map(document.getElementById('map'), mapOptions);
	// })
	
	$scope.selected = false;
	$scope.currentLocation = "";
	$scope.radius = "";

	var query = "&countryCode=US&size=30&keyword=festival&classificationId=KZFzniwnSyZfZ7v7nJ";
	
	//Add Artist and Festival
	var keywordArr = [];
	$scope.artistAdded = [];
	$scope.addArtist = function() {
		console.log($scope.artist);
		keywordArr.push($scope.artist);
		$scope.artistAdded.push($scope.artist);
		$scope.artist = "";
	};
	$scope.festivalAdded = [];
	$scope.addFestival = function() {
		console.log($scope.festival);
		keywordArr.push($scope.festival);
		$scope.festivalAdded.push($scope.festival);
		$scope.festival = "";
	};
	
	//Auto-update radius
	if ($scope.stateSeleted) {
		$scope.radius = "0";
	}
	if ($scope.citySeleted) {
		$scope.radius = "200";
	}
	$scope.getState = function() {
		console.log($scope.locState);
		query += '&stateCode=' + $scope.locState;
		$scope.radius = "0";
	}

	$scope.getCurrentLocation = function() {
		locateService.locate().then(function success(position) {
			console.log(position);
			var latLng = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			//NOT WORKING - FIX!!!	
			geocoding(latLng, 'location');
			$scope.currentLocation = "(should be updated)";
			$scope.radius = "500";
		}, function fail(rspns) {
			console.log("locateService failed");
		})
	};
	$scope.updateRadius = function() {
		query += "&radius=" + $scope.radius;
		console.log($scope.radius);
		// $scope.radius = "";
	}

	console.log(query);


	//CHANGE!!! make the initial pop-up to trigger this (by clicking 'yes'?)

	var onLoadQuery = "&countryCode=US&size=30&keyword=festival&classificationId=KZFzniwnSyZfZ7v7nJ";
	tMasterService.getData(onLoadQuery)
	.then(function success(rspns) {
		console.log(rspns);
		var data = rspns.data._embedded.events;
		for (var i = 0; i < data.length; i++) {
			var obj = data[i];
			var target = createObjs(obj, i);
			$scope.festArr.push(target);
			$scope.venueArr.push(target.venueObj);
		}
		console.log($scope.festArr);
		console.log($scope.venueArr);
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		for (var i = 0; i < $scope.venueArr.length; i++) {
			$scope.venueArr[i].coords = {};
			if ($scope.venueArr[i].location) {
				$scope.venueArr[i].coords = {
					lat: Number($scope.venueArr[i].location.latitude), 
					lng: Number($scope.venueArr[i].location.longitude)
				};
			} else {
				// var coords = geocoding($scope.venueArr[i], 'address');
				$scope.venueArr[i].coords = {lat: 40.00, lng: -98.00};
			}
			console.log($scope.venueArr[i].coords);
		}
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	})
	.then(function success(rspns) {
		resetMarkers();
		for (var i = 0; i < $scope.venueArr.length; i++) {
			placeMarkers($scope.venueArr[i], $scope.festArr[i]);
		}
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	});
	

	$scope.search = function() {
		// $scope.festArr = [];
		// $scope.venueArr = [];
		console.log("!!!!!!!!!!!!!#############%^^^^^^^^^^^^^******************************************search start!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		var startDate = "";
		var endDate = "";
		var city = "";
		var state = "";
		var zip = "";
		var radius = "";

		var keywordQuery = "keyword=";
		var genreQuery = "&classificationName=music";
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
			cityQuery += "&city=" + city;
		}
		if ($scope.locState) {
			state = $scope.locState;
			console.log(state);
			googleAddress += state;
			stateQuery += "&stateCode=" + state;
		}
		if ($scope.locZip) {
			zip = $scope.locZip;
			console.log(zip);
			googleAddress += zip;
			zipQuery += "&postalCode=" + zip;
		}
		if ($scope.radius) {
			radius = $scope.radius;
			console.log(radius);
			radiusQuery = "&radius=" + radius;
		}
		//keywords
		if (keywordArr.length !== 0) {
			for (var i = 0; i < keywordArr.length; i++) {
				keywordQuery += keywordArr[i];
			}
		}

		
		var baseUrl = 'https://app.ticketmaster.com/discovery/v2/events.json?';
		var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
		var finalQuery = baseUrl + keywordQuery + genreQuery + startDateQuery + endDateQuery +
						 cityQuery + stateQuery + zipQuery + radiusQuery + apiKey;
			$http({
			method: 'GET',
			url: finalQuery
		}).then(function success(queryResult) {
			console.log("FINAL QUERY = " + finalQuery);
			console.log(queryResult);
		}, function fail(queryResult) {
			console.log("Query failed");
		});




	}; //end search

	//----------functions----------------------------------//

	function createObjs(obj, index) {
		var target = {};
		for (prop in obj) {
			console.log("Object"); //rem to remove
			console.log(obj);
			if (prop == "name") {
				target.name = obj.name;
			} 
			if (prop == "id") {
				target.id = obj.id;
			}
			if (prop == "info") {
				target.desc = obj.info;
			}
			if (prop == "dates") {
				target.dates = obj.dates;
			} 
			if (prop == "images") {
				target.images = obj.images;
			}
			if (prop == "priceRanges") {
				target.prices = obj.priceRanges;
			}
			if (prop == "url") {
				target.link = obj.url;
			}
			if (prop == "pleaseNote") {
				target.note = obj.pleaseNote;
			}
			if (prop == "_embedded") {
				target.venueObj = obj._embedded.venues[0];
				console.log(target.venueObj);
			}
			target.index = index;
		}
		return target;
	}

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

	function geocoding(target, type) {
		console.log(target);
		console.log(type);
		var geocoder = new google.maps.Geocoder();
		var geocodeType = type;
		var value;
		var result;
		if (type == "address") {
			value = target.address.line1 + ", " + target.city.name + ", " + target.state.stateCode + " " + target.postalCode;
		} else if (type == "location") {
			value = target;
		}
		console.log(value);
		geocoder.geocode({ geocodeType: value }, function(results, status) {
			if (status == 'OK') {
				console.log(results);
				result = target;
				return result;
			} else {
				console.log("Geocoder failed due to " + status);
			}
		});
		
	}

	var markers = [];
	function resetMarkers() {
		if (markers.length !== 0) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
		}
		markers = [];
	}

	var infoWindow = new google.maps.InfoWindow({});
	function placeMarkers(venue, fest) {
		var content = '<h6>' + fest.name + '<br/><small>' + venue.name + '</small>';
		var lat = venue.coords.lat;
		var lng = venue.coords.lng;
		console.log(lat + ", " + lng);
		var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';
		var marker = new google.maps.Marker({
			position: {lat: lat, lng: lng},
			map: map,
			title: venue.name,
			icon: icon,
			animation: google.maps.Animation.DROP,
		});
		
		marker.addListener('click', function() {
			infoWindow.setContent(content);
			infoWindow.open(map, marker);
			map.setZoom(12);
			map.setCenter(marker.getPosition());
		});
		markers.push(marker);
	} 

});
