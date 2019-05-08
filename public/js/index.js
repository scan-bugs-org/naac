const wikiMediaAttrib = "<a href=\"https://foundation.wikimedia.org/wiki/Maps_Terms_of_Use\">Wikimedia Maps</a> | Map data © <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap</a> contributors";
const hillShadingTilesURL = "https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png";
const wikimediaTilesURL = "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png";
const collectionsGeojsonURL = "api/collections?geojson=true&columns=collectionId";

// Style for the geojson points
const pointMarkerStyle = {
  fillColor: "red",
  stroke: false,
  opacity: 0.8,
  radius: 3,
  riseOnHover: true
};

/**
 * Loads open street map tiles into the map container
 * @return L.map
 */
function loadMap() {
  const map = L.map("map");
  const wikiTiles = new L.TileLayer(
    wikimediaTilesURL,
    { minZoom: 3, maxZoom: 12, attribution: wikiMediaAttrib }
  );

  const hillTiles = new L.TileLayer(
    hillShadingTilesURL,
    { minZoom: 10, maxZoom: 12 }
  );

  map.addLayer(wikiTiles);
  map.addLayer(hillTiles);

  return map;
}

/**
 * Returns the collection name for the given collection ID
 * @param  {integer} collectionId Collection Id to return the name for
 * @return {Promise<string>} Promise to return the collection name
 */
function getCollectionName(collectionId) {
  return new Promise((resolve, reject) => {
    try {
      fetch("api/collections/" + collectionId + "?columns=collectionName")
        .then((response) => {
          return response.json();
        })
        .then((collectionJson) => {
          let name = collectionJson.collectionName;
          if (name == null) {
            name = "Unnamed Collection";
          }
          resolve(name);
        })
        .catch((err) => {
          reject(err);
        });
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * Return the institution name for the given institutionId
 * @param  {integer} institutionId Institution Id to return the name for
 * @return {Promise<string>} Promise to return the institution name
 */
function getInstitutionName(institutionId) {
  return new Promise((resolve, reject) => {
    try {
      fetch("api/institutions/" + institutionId + "?columns=institutionName")
        .then((response) => {
          return response.json();
        })
        .then((institutionJson) => {
          resolve(institutionJson.institutionName);
        })
        .catch((err) => {
          reject(err);
        });
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * Returns the institution name for the given collection ID
 * @param  {integer} collectionId Collection Id to return the institution for
 * @return {Promise<string>} Promise to return the institution name
 */
function getInstitutionForCollection(collectionId) {
  return new Promise((resolve, reject) => {
    try {
      fetch("api/collections/" + collectionId + "?columns=institutionId")
        .then((response) => {
          return response.json();
        })
        .then((collectionJson) => {
          return getInstitutionName(collectionJson.institutionId);
        })
        .then((institutionName) => {
          if (institutionName == null) {
            resolve("Unnamed Institution");
          } else {
            resolve(institutionName);
          }
        })
        .catch((err) => {
          reject(err);
        });
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * Populates the map collection data
 * @param  {L.map}  map         Leaflet map object
 * @param  {url}    geojsonUrl  Location of the GeoJSON data
 */
function populateData(map, geojsonUrl) {
  fetch(geojsonUrl)
    .then((geojsonData) => {
      return geojsonData.json();
    })
    .then((geojson) => {
      const pointLayer = L.geoJSON(
        geojson,
        {
          pointToLayer: doTooltip
        }
      ).addTo(map);

      map.on("zoomend", () => {
        resizeMarkers(map, pointLayer);
      });
    });
}

/**
 * Called on zoomend to resize the geojson markers
 */
function resizeMarkers(map, pointLayer) {
  const currentZoom = map.getZoom();
  console.log(currentZoom);
  if (currentZoom > 4) {
    pointLayer.eachLayer((layer) => {
      layer.setRadius(4);
    });
  } else if (currentZoom > 6) {
    pointLayer.eachLayer((layer) => {
      layer.setRadius(8);
    });
  } else{
    pointLayer.eachLayer((layer) => {
      layer.setRadius(3);
    });
  }
}

/**
 * Populate the markers & corresponding tooltips for each geojson collection
 * @param  {Object} feature GeoJSON feature representing the collection
 * @param  {Array<float>} latLng  [lat, lon]
 * @return {L.circleMarker}       Leaflet circle marker for the geojson point
 */
function doTooltip(feature, latLng) {
  const marker = L.circleMarker(latLng, pointMarkerStyle);
  marker.on("mouseover", () => { marker.selected = true; });
  marker.on("mouseout", () => { marker.selected = false; });
  marker.once(
    "mouseover",
    () => {
      const propertiesPopulated = [];

      if (!("collectionName" in feature.properties)) {
        propertiesPopulated.push(
          getCollectionName(feature.properties.collectionId)
            .then((name) => {
              return feature.properties.collectionName = name;
            })
          );
      }

      if (!("institutionName" in feature.properties)) {
        propertiesPopulated.push(
          getInstitutionForCollection(feature.properties.collectionId)
            .then((institutionName) => {
              return feature.properties.institutionName = institutionName;
          })
        );
      }

      Promise.all(propertiesPopulated).then(() => {
        marker.unbindTooltip();
        marker.bindTooltip(
          "<h3>" + feature.properties.institutionName + "</h3>" +
          "<h4>" + feature.properties.collectionName + "</h4>"
        );

        if (marker.selected) {
          marker.openTooltip();
        }
      });
    }
  );
  return marker;
}

/**
 * Page's main function
 */
function main() {
  const map = loadMap();
  map.setView([39.8, -98.6], 4);
  populateData(map, collectionsGeojsonURL);
}

window.onload = main;
