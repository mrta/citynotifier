/**
 * Create query from parameters 
 * @param url Server url
 * @param parameters Array of parameters
 */
function buildUrl(url, parameters) {
    var qs = "";
    for (var key in parameters) {
        var value = parameters[key];
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    }
    if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + "?" + qs;
    }
    return url;
}

/**
 * Parse a date in yyyy-mm-dd format
 * @param input Date
 */
function parseDate(input) {
  var parts = input.split('/');
  return ""+parts[1]+"/"+parts[0]+"/"+parts[2];
}

/**
 * Convert Date string to timeStamp
 * @param strDate Date
 */
function toTimestamp(strDate){
 var datum = Date.parse(strDate);
 return datum/1000;
}

/**
 * Check if array contains null or "" values
 * @param my_arr Array
 */
function checkArray(my_arr){
   for(var i=0;i<my_arr.length;i++){
       if(my_arr[i] != "")   
          return true;
   }
   return false;
}

/**
 * Clear objects from map
 */
function clearOverlays() {
    // Remove all markers
    for (var i = 0; i < markersArray.length; i++ )
        markersArray[i].setMap(null);
    markersArray.length = 0;

    // Remove all heatmap Queue
    for(var i=0; i<heatmapArray.length;i++)
        heatmapArray[i].setMap(heatmapArray[i].getMap() ? null : map);
    heatmapArray.length = 0;
}


/**
 * Get Event InfoWindow icon
 * @param type Event type
 * @param subtype Event subtype
 */
function getIcon(type, subtype){
    var dir = "sites/all/libraries/bootstrap/img/symbols/48/";
    switch (type){
        case"Problemi stradali" :
            switch(subtype){
                case "Incidente": return dir+"CarAccident.png";
                case "Buca": return dir+"Hole.png";
                case "Coda": return dir+"Queue.png";
                case "Lavori in corso": return dir+"Works.png";
                case "Strada impraticabile": return dir+"StopRoad.png";
            }
            break;
        
        case "Emergenze sanitarie" :
            switch(subtype){
                case "Incidente": return dir+"Incidente.png";
                case "Malore": return dir+"Malore.png";
                case "Ferito": return dir+"Ferito.png";
                }
            break;
        
        case "Reati" :
            switch(subtype){
                case "Furto": return dir+"Furto.png";
                case "Attentato": return dir+"Shooting.png";
            }
            break;
            
        case "Problemi ambientali" :
            switch(subtype){
                case "Incendio" : return dir+"Fire.png";
                case "Tornado" : return dir+"Tornado.png";
                case "Neve" : return dir+"Snow.png";
                case "Alluvione" : return dir+"Rainy.png";
            }
            break;
        case "Eventi pubblici" :
            switch(subtype){
                case "Partita" : return dir+"Football.png";
                case "Manifestazione" : return dir+"Manifestazione.png";
                case "Concerto" : return dir+"Live-Music.png";
                }
            break;
        break;
        }
}

/**
 * Get Event map icon
 * @param type Event type
 * @param subtype Event subtype
 */
function getPin(type, subtype){
    var dir = "sites/all/libraries/bootstrap/img/pins/";
    switch (type){
        case"Problemi stradali" :
            switch(subtype){
                case "Incidente": return dir+"car_accident.png";
                case "Buca": return dir+"buca.png";
                case "Coda": return dir+"coda.png";
                case "Lavori in corso": return dir+"lavoriincorso.png";
                case "Strada impraticabile": return dir+"stradanonpercorribile.png";
            }
            break;
        
        case "Emergenze sanitarie" :
            switch(subtype){
                case "Incidente": return dir+"incidente.png";
                case "Malore": return dir+"malore.png";
                case "Ferito": return dir+"ferito.png";
                }
            break;
        
        case "Reati" :
            switch(subtype){
                case "Furto": return dir+"thief.png";
                case "Attentato": return dir+"shooting.png";
            }
            break;
            
        case "Problemi ambientali" :
            switch(subtype){
                case "Incendio" : return dir+"fire.png";
                case "Tornado" : return dir+"tornado.png";
                case "Neve" : return dir+"snow.png";
                case "Alluvione" : return dir+"rain.png";
            }
            break;
        case "Eventi pubblici" :
            switch(subtype){
                case "Partita" : return dir+"football.png";
                case "Manifestazione" : return dir+"manifestazione.png";
                case "Concerto" : return dir+"livemusic.png";
                }
            break;
        break;
        }
}       