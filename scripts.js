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
	// if ($scope.stateSeleted) {
	// 	$scope.radius = "0";
	// }
	// if ($scope.citySeleted) {
	// 	$scope.radius = "200";
	// }
	// if ($scope.zipSelected) {
	// 	$scope.radius = "500";
	// }
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
			$scope.venueArr[i].coords = {
				lat: "",
				lng: ""
			};
			console.log($scope.venueArr[i].coords);
			if ($scope.venueArr[i].location) {
				$scope.venueArr[i].coords = {
					lat: Number($scope.venueArr[i].location.latitude), 
					lng: Number($scope.venueArr[i].location.longitude)
				};
			} else {
				var coords = geocoding($scope.venueArr[i], 'address');
				// $scope.venueArr[i].coords = {lat: 40.00, lng: -98.00};
				$scope.venueArr[i].coords = coords;
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
	
	//Search Function -----------------------------

	$scope.search = function() {
		// $scope.festArr = [];
		// $scope.venueArr = [];
		console.log("!!!!!!!!!!!!!#############%^^^^^^^^^^^^^******************************************search start!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

		//Base Info
		var classQeury = "&classificationId=KZFzniwnSyZfZ7v7nJ";
		var keywordQuery = "&keyword=festival";
		var startDateQuery = "";
		var endDateQuery = "";
		var latLngQuery = ""; // main use
		var radiusQuery = "&radius=2000"; // with raidus, default: 600
		var genreQuery = "";

		//Dates
		var starteDate = "";
		var endDate = "";
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
		
		//Location
		//Collect Location Info for Geocode
		var locObj = {
			city: "",
			state: "",
			postalCode: "",
			currentLocation: "",
			radius: "",
			latLng: ""
		};
		var city = $scope.locCity;
		var state = $scope.locState;
		var zip = $scope.locZip;
		var current = $scope.locCurrent;
		var addressArr = [];

		if (city) {
			locObj.city = city;
		}
		if (state) {
			locObj.state = state;
		}
		if (zip) {
			locObj.postalCode = zip;
		}
		//Get coordinates for the location input collected
		var coords = geocoding(locObj, "address");
		if (coords) {
			console.log(coords);
			// latLngQuery = "&latlong=" + coords.lat + "," coords.lng;
			// console.log("latLngQuery: " + latLngQuery);
		}

		//Genres
		console.log($scope.genre);
		if ($scope.genre) {
			for (var i = 0; i < $scope.genre.length; i++) {
				if ($scope.genre[i] === "all") {
					genreQuery = "";
				} else {
					genreQuery = $scope.genre.join(",");	
				}
			}
		}
		console.log(genreQuery);

		//keywords
		if (keywordArr.length !== 0) {
			keywordQuery = "&keyword=";
			for (var i = 0; i < keywordArr.length; i++) {
				keywordQuery += keywordArr[i];
			}
		}
		console.log(keywordQuery);

		//prepare the query and request for API
		var baseQuery = "&countryCode=US&size=60" + keywordQuery + classQeury;
		var query = baseQuery + startDateQuery + endDateQuery + latLngQuery + radiusQuery + genreQuery;
		tMasterService.getData(query)
		.then(function success(rspns) {
			console.log(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
		});

	}; //end search

	//----------functions----------------------------------//

	function createObjs(obj, index) {
		var target = {};
		for (prop in obj) {
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
		var value = "";
		var comma = false;
		if (type == "address") {
			if (target.address) {
				value += target.address.line1 + ", ";
			}
			if (target.city) {
				if (target.city.name) {
					value += target.city.name;
				} else {
					value += targt.city;
				}
				comma = true;
			}
			if ((target.state) && (comma)) {
				if (target.state.stateCode) {
					value += ", " + target.state.stateCode;
				} else {
					value += ", " + targt.state;
				}
			} else if (target.state) {
				if (target.state.stateCode) {
					value += target.state.stateCode;
				} else {
					value += targt.state;
				}
			}
			if (target.postalCode) {
				value += " " + target.postalCode;
			}
		} else if (type == "location") {
			value = target;
		}
		console.log(value);
		if (type == "address") {
			geocoder.geocode({ "address": value }, function(results, status) {
				if (status == 'OK') {
					console.log(results);
					var result = results.geometry.location;
					return result;
				} else {
					console.log("Geocoder failed due to " + status);
				}
			});
		} else if (type == "location") {
			geocoder.geocode({ "location": value }, function(results, status) {
				if (status == 'OK') {
					console.log(results);
					return results;
				} else {
					console.log("Geocoder failed due to " + status);
				}
			});
		}
		
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
