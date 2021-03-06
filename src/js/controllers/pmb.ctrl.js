pmb_im.controllers.controller('PMBCtrl',
['$scope',
'$state',
'leafletData',
'PMBService',
'ContainerService',
'locationAPI',
'MapService',
'_',
'Loader',
'LocationsService',
function($scope,
  $state,
  leafletData,
  PMBService,
  ContainerService,
  locationAPI,
  MapService,
  _,
  Loader,
  LocationsService) {
  $scope.reportButton = {
    text: "Reportar",
    state: "unConfirmed"
  };

  //$scope.$on('$ionicView.afterEnter', function(){ //This is fired twice in a row
  $scope.$on("$ionicView.afterEnter", function() {
    var map = leafletData.getMap();
    if(LocationsService.initial_lat!=""){
      MapService.centerMapOnCoords(LocationsService.initial_lat, LocationsService.initial_lng, 16);
    }else{
      MapService.centerMapOnCoords(-34.901113, -56.164531, 16);
    }
  });


  /**/

  $scope.searchMode = "calle.lugar";
  $scope.location ={calle:null,esquina:null,lugar:null};


  //Auto complete


  var locationGeomParams ={tipo:null,pathParams:[]};
  $scope.$on("$stateChangeSuccess", function() {
    $scope.ionAutocompleteElement = angular.element(document.getElementsByClassName("ion-autocomplete"));
    //console.log(JSON.stringify($scope.ionAutocompleteElement));
    $scope.ionAutocompleteElement.bind('touchend click focus', $scope.onClick);
  });


  $scope.initReport = function() {

    var _pin, _pinIcon = L.icon({
      iconUrl: 'img/pin@x2.png',
      iconSize: [70, 110], // size of the icon
      iconAnchor: [-18, 55], // point of the icon which will correspond to marker's location
    });

    if ($scope.reportButton.state == "unConfirmed") {

      $scope.reportButton.text = "Confirmar";
      $scope.reportButton.state = "about2Confirm";


      leafletData.getMap().then(function(map) {
        _pin = new L.marker(map.getCenter(), {
          icon: _pinIcon,
          clickable: false
        }).addTo(map);

        ReportService._new();
        ReportService.current.setLatLng(map.getCenter());
        //console.log(JSON.stringify($scope.currentReport));

        $scope.ionAutocompleteElement = angular.element(document.getElementsByClassName("ion-autocomplete"));
        $scope.ionAutocompleteElement.bind('touchend click focus', $scope.onClick);


      });
    } else {
      //console.log("currentReport =" + JSON.stringify($scope.currentReport));
    }

  };

  $scope.isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  $scope.searchLocation = function(query) {
    //console.log("Se ejecuto: " + query);
    var promiseSearch;
    if (query && query.length>=2) {
      //console.log("Y entró: " + query);


      if ($scope.searchMode == "calle.lugar") {
        promiseSearch = locationAPI.searchLocationByStr(query);

      } else {
        //console.log("buscando calle/"+$scope.selectedItem.codigo+"esquina = " + query);
        if($scope.isNumeric(query.trim())){
          var items = [];
          var item = {"descTipo":"NUMERO","nombre":query,"codigo":query};
          items[0] = item;
          return items;
        }else{
          promiseSearch = locationAPI.searchEsquinaByStr({
            calle: $scope.selectedItem.codigo,
            esquina: query
          });
        }
      }
      return promiseSearch;
    }else{
          return [];
    }
  };

  $scope.onClick = function() {

    $scope.ionAutocompleteElement.controller('ionAutocomplete').showModal();

  };

  $scope.itemsRemoved = function(callback){
    $scope.searchMode = "calle.lugar";
    $scope.ionAutocompleteElementSearch.attr("placeholder", "Buscar calle");
  }

  $scope.itemsClicked = function(callback) {

    $scope.clickedValueModel = callback;
    //$scope.selectedItem = callback.selectedItems[0];
    $scope.selectedItem = callback.item;
    $scope.ionAutocompleteElementSearch = angular.element(document.getElementsByClassName("ion-autocomplete-search"));
    if ($scope.searchMode == "esquina.numero") {
      locationGeomParams.pathParams = [];
      $scope.location.esquina= $scope.selectedItem;
      locationGeomParams.pathParams.push($scope.location.calle.codigo);
      locationGeomParams.pathParams.push($scope.location.esquina.codigo);
      var str_tipo = "";
      if($scope.isNumeric($scope.selectedItem.nombre)){
        //Seleccionó un número de puerta
        locationGeomParams.tipo="DIRECCION";
      }else{
        //selecciono una esquina
        locationGeomParams.tipo="ESQUINA";//$scope.selectedItem.descTipo;
        str_tipo = "esquina";
      }
      locationAPI.getLocationGeom(locationGeomParams).then(function(result){
        //console.log(result.geoJSON);
        MapService.goToPlace(angular.extend({nombre: $scope.location.calle.nombre + " " + str_tipo + " " + $scope.selectedItem.nombre, geom: result.geoJSON},result),$scope);
        $scope.searchMode = "calle.lugar";
        $scope.ionAutocompleteElementSearch.attr("placeholder", "Buscar calle");
        $scope.externalModel = [];
      });
    } else {
      $scope.location.calle= $scope.selectedItem;
      $scope.searchMode = "esquina.numero";
      $scope.ionAutocompleteElementSearch.attr("placeholder", "Esquina o número");
      $scope.ionAutocompleteElement.controller('ionAutocomplete').showModal();
      $scope.preselectedSearchItems = [];
    }
    //callback.searchItems = [];

  };

  $scope.itemsCanceled= function(_item){
    var numPuerta = parseInt(_item.searchQuery);
    if(Number.isInteger(numPuerta)){
      //console.log("IS number");
      locationGeomParams.tipo="DIRECCION";//$scope.selectedItem.descTipo;
      locationGeomParams.pathParams.push($scope.location.calle.codigo);
      locationGeomParams.pathParams.push(numPuerta);
      locationAPI.getLocationGeom(locationGeomParams).then(function(result){
      MapService.goToPlace(angular.extend({nombre:$scope.selectedItem.nombre + " " + numPuerta },result),$scope);
      $scope.searchMode = "calle.lugar";

    },function(error){
      //console.log("Error obteniendo la direccion "+ JSON.stringify(error));
      Loader.showAlert("Error","No existe esa direccion").then(function(res){
          $scope.ionAutocompleteElement.controller('ionAutocomplete').showModal();
        });
    });
  }

  };
}]);
