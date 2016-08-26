var fyfApp = angular.module('fyfApp', ['ngRoute']);

fyfApp.config(function($routeProvider){
	$routeProvider.when('/',{ 
		templateUrl: "../intro.html",
		controller: "mainController"
	});
	$routeProvider.when('/main',{ 
		templateUrl: "../home.html",
		controller: "fyfCtrl"
	});
	$routeProvider.when('/aboutus',{ 
		templateUrl: "../aboutus.html",
		controller: "mainController"
	});
	$routeProvider.when('/contactus',{ 
		templateUrl: "../contactus.html",
		controller: "mainController"
	});
	$routeProvider.otherwise('/'); //default
});

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

fyfApp.factory('geocodeService', function($http, $q) {
	var geocodeSvc = {};
	geocodeSvc.getCoords = function(addressObjArr) {
		var def = $q.defer();
		var base = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		var requestArr = [];
		angular.forEach(addressObjArr, function(value) {
			console.log(value);
			requestArr.push($http.get(base + value.googleAddress));
		});
		console.log(requestArr);
		$q.all(requestArr)
		.then(function(rspns) {
			console.log(rspns);
			rspns.push(addressObjArr);
			// def.promise.$$state.value. = addressObjArr;
			def.resolve(rspns);
		}, function(rspns) {
			def.reject(rspns);
		});
		return def.promise;
	}
	geocodeSvc.getOneCoords = function(address) {
		var def = $q.defer();
		var base = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		console.log(base + address);
		$http({
			method: 'GET',
			url: base + address
		}).then(function success(rspns) {
			console.log(rspns);
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log('failed');
			def.reject(rspns);
		});
		return def.promise;
	}
	return geocodeSvc;
});

 // controller -----------------------------------------------------

