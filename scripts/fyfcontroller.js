fyfApp.controller('fyfCtrl', function($scope, $http, tMasterService, locateService, geocodeService) {
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

	//CHANGE!!! make the initial pop-up to trigger this (by clicking 'yes'?)
	var onLoadQuery = "&countryCode=US&size=15&keyword=festival&classificationId=KZFzniwnSyZfZ7v7nJ";
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
		var addressObjArr = [];
		for (var i = 0; i < $scope.venueArr.length; i++) {
			$scope.venueArr[i].coords = {
				lat: "",
				lng: ""
			};
			if ($scope.venueArr[i].location) {
				console.log($scope.venueArr[i].location);
				$scope.venueArr[i].coords = {
					lat: Number($scope.venueArr[i].location.latitude), 
					lng: Number($scope.venueArr[i].location.longitude)
				};
			} else {
				var address = "";
				var target = $scope.venueArr[i];
				if (target.address) {
					address += target.address.line1 + ", ";
				} else {
					address = "";		
				}
				address += target.city.name + ", " + target.state.stateCode + " ";
				address += target.postalCode; 
				target.googleAddress = address;
				target.index = i;
				addressObjArr.push(target);
			}
		}
		console.log(addressObjArr);
		geocodeService.getCoords(addressObjArr)
		.then(function success(rspns) {
			console.log(rspns);
			var arr = rspns[rspns.length - 1];
			console.log(arr);
			for (var i = 0; i < arr.length; i++) {
				arr[i].coords = {
					lat: rspns[i].data.results[0].geometry.location.lat,
					lng: rspns[i].data.results[0].geometry.location.lng
				};
				$scope.venueArr[i] = arr[i];
			}
			console.log($scope.venueArr);
		}, function fail(rspns) {
			console.log("Failed");
		})
		.then(function success(rspns) {
			resetMarkers();
			for (var i = 0; i < $scope.venueArr.length; i++) {
				placeMarkers($scope.venueArr[i], $scope.festArr[i]);
			}
		console.log("THE END");
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
		});
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	});
	
	//--------------MAIN -----------------------
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

	$scope.getState = function() {
		console.log($scope.locState);
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

	$scope.search = function() {

		//Base Info
		var classQeury = "&classificationId=KZFzniwnSyZfZ7v7nJ";
		var keywordQuery = "&keyword=festival";
		var startDateQuery = "";
		var endDateQuery = "";
		var latLngQuery = "&latlong=40.00,-98.00"; // main use
		var radiusQuery = "&radius=2000";
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

		//Genres
		console.log($scope.genre);
		if ($scope.genre) {
			for (var i = 0; i < $scope.genre.length; i++) {
				if ($scope.genre[i] === "all") {
					genreQuery = "";
				} else {
					genreQuery = "&classificationName=" + $scope.genre.join(",");	
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
		//Radius
		var radius = $scope.radius;
		if (radius !== "2000") {
			radiusQuery = "&radius=" + radius;
			console.log(radius);
		}
		//Location
		//Collect Location Info for Geocode
		var locObj = {
			city: "",
			state: "",
			postalCode: "",
			currentLocation: "",
			radius: "",
			latLng: {lat: 40.0000, lng: -98.0000}
		};
		var city = $scope.locCity;
		var state = $scope.locState;
		var zip = $scope.locZip;
		var current = $scope.locCurrent;
		
		var addressArr = [];
		console.log(city);
		if (city) {
			locObj.city = city;
		}
		if (state) {
			locObj.state = state;
		}
		if (zip) {
			locObj.postalCode = zip;
		}
		console.log(locObj);
		//Get coordinates for the location input collected
		var coords; 
		var arr = [];
		for (var prop in locObj) {
			if (locObj[prop] !== "") {
				console.log("locRequest rcvd, calling for geocoding");
				arr.push(locObj[prop]);
			}
			console.log(arr);
		}
		var address = arr.join(", ");
		console.log(address);
		geocodeService.getOneCoords(address)
		.then(function success(rspns) {
			console.log(rspns);
			var coords = rspns.data.results[0].geometry.location;
			latLngQuery = "&latlong=" + coords.lat + "," + coords.lng;
			console.log("latLngQuery: " + latLngQuery);
			//prepare the query and request for API
			var baseQuery = "&countryCode=US&size=20" + keywordQuery + classQeury;
			var query = baseQuery + startDateQuery + endDateQuery + latLngQuery + radiusQuery + genreQuery;
			tMasterService.getData(query)
			.then(function success(rspns) {
				console.log(rspns);
				$scope.festArr = [];
			$scope.venueArr = [];
				var data = rspns.data._embedded.events;
				for (var i = 0; i < data.length; i++) {
					var obj = data[i];
					var target = createObjs(obj, i);
					$scope.festArr.push(target);
					$scope.venueArr.push(target.venueObj);
				}
				var addressObjArr = [];
				for (var i = 0; i < $scope.venueArr.length; i++) {
					$scope.venueArr[i].coords = {
						lat: "",
						lng: ""
					};
					if ($scope.venueArr[i].location) {
						console.log($scope.venueArr[i].location);
						$scope.venueArr[i].coords = {
							lat: Number($scope.venueArr[i].location.latitude), 
							lng: Number($scope.venueArr[i].location.longitude)
						};
					} else {
						var address = "";
						var target = $scope.venueArr[i];
						if (target.address) {
							address += target.address.line1 + ", ";
						} else {
							address = "";		
						}
						address += target.city.name + ", " + target.state.stateCode + " ";
						address += target.postalCode; 
						target.googleAddress = address;
						target.index = i;
						addressObjArr.push(target);
					}
					console.log(addressObjArr);
				}
				geocodeService.getCoords(addressObjArr)
				.then(function success(rspns) {
					console.log(rspns);
					var arr = rspns[rspns.length - 1];
					console.log(arr);
					for (var i = 0; i < arr.length; i++) {
						arr[i].coords = {
							lat: rspns[i].data.results[0].geometry.location.lat,
							lng: rspns[i].data.results[0].geometry.location.lng
						};
						$scope.venueArr[i] = arr[i];
					}
					console.log($scope.venueArr);
				}, function fail(rspns) {
					console.log("Failed");
				})
				.then(function success(rspns) {
					resetMarkers();
					for (var i = 0; i < $scope.venueArr.length; i++) {
						placeMarkers($scope.venueArr[i], $scope.festArr[i]);
					}
				}, function fail(rspns) {
					console.log("Failed due to " + rspns.status);
				});
			}, function fail(rspns) {
				console.log("fail");
			});
		}, function fail(rspns) {
			console.log("Failed");
		});
	};

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

	// function geocoding(target, type) {
	// 	console.log(target);
	// 	console.log(type);
	// 	var geocoder = new google.maps.Geocoder();
	// 	var value = "";
	// 	var comma = false;
	// 	if (type == "address") {
	// 		if (target.address) {
	// 			value += target.address.line1 + ", ";
	// 		}
	// 		if (target.city) {
	// 			if (target.city.name) {
	// 				value += target.city.name;
	// 			} else {
	// 				value += target.city;
	// 			}
	// 			comma = true;
	// 		}
	// 		if ((target.state) && (comma)) {
	// 			if (target.state.stateCode) {
	// 				value += ", " + target.state.stateCode;
	// 			} else {
	// 				value += ", " + target.state;
	// 			}
	// 		} else if (target.state) {
	// 			if (target.state.stateCode) {
	// 				value += target.state.stateCode;
	// 			} else {
	// 				value += target.state;
	// 			}
	// 		}
	// 		if (target.postalCode) {
	// 			value += " " + target.postalCode;
	// 		}
	// 	} else if (type == "location") {
	// 		value = target;
	// 	}
	// 	console.log(value);
	// 	geocodeService.getCoords(value, target).
	// 	then(function success(rspns) {
	// 		console.log(rspns);
	// 	}, function fail() {
	// 		console.log("failed");
	// 	});
	// }

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
		var icon = 'img/location-pin.png';
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
