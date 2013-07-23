var isiPad = navigator.userAgent.match(/iPad/i) != null;
if(isiPad)
    successAlert("Pota iPad");
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

    eventArray.length = 0;
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
                case "Lavori in corso": return dir+"Work.png";
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

function pota(){

    console.log("Pota");

    var neighborhoods = [
        new google.maps.LatLng(44.49135859,11.34219969),
        new google.maps.LatLng(44.50300786,11.33804672),
        new google.maps.LatLng(44.50322234,11.339373),
        new google.maps.LatLng(44.49737275,11.3522399),
        new google.maps.LatLng(44.48866486,11.34070698),
        new google.maps.LatLng(44.49723771,11.33117178),
        new google.maps.LatLng(44.49738738,11.34238576),
        new google.maps.LatLng(44.48853485,11.34769821),
        new google.maps.LatLng(44.49289991,11.34843432),
        new google.maps.LatLng(44.48990598,11.34622796),
        new google.maps.LatLng(44.49039208,11.33469032),
        new google.maps.LatLng(44.49835701,11.33494832),
        new google.maps.LatLng(44.49661274,11.33032613),
        new google.maps.LatLng(44.49265783,11.35337754),
        new google.maps.LatLng(44.49482487,11.33384004),
        new google.maps.LatLng(44.49500345,11.34652997),
        new google.maps.LatLng(44.50103518,11.34151843),
        new google.maps.LatLng(44.50225189,11.34333112),
        new google.maps.LatLng(44.49303933,11.34410333),
        new google.maps.LatLng(44.49722529,11.33587922),
        new google.maps.LatLng(44.49484644,11.34419177),
        new google.maps.LatLng(44.49085208,11.33218296),
        new google.maps.LatLng(44.49816623,11.34318598),
        new google.maps.LatLng(44.49201761,11.35229346),
        new google.maps.LatLng(44.49515236,11.33969307),
        new google.maps.LatLng(44.49521531,11.35349787),
        new google.maps.LatLng(44.49626805,11.33723894),
        new google.maps.LatLng(44.50165246,11.34290352),
        new google.maps.LatLng(44.49889587,11.34415764),
        new google.maps.LatLng(44.49001331,11.33479965),
        new google.maps.LatLng(44.49839878,11.34045182),
        new google.maps.LatLng(44.48713344,11.34699329),
        new google.maps.LatLng(44.49404917,11.35368203),
        new google.maps.LatLng(44.49436391,11.33986618),
        new google.maps.LatLng(44.48890048,11.34530459),
        new google.maps.LatLng(44.49168584,11.34634708),
        new google.maps.LatLng(44.48923997,11.33840919),
        new google.maps.LatLng(44.49219988,11.34144883),
        new google.maps.LatLng(44.49893646,11.35083597),
        new google.maps.LatLng(44.48935787,11.34467668),
        new google.maps.LatLng(44.48779549,11.33981539),
        new google.maps.LatLng(44.4998317,11.34716354),
        new google.maps.LatLng(44.49318094,11.34999),
        new google.maps.LatLng(44.49113569,11.3391712),
        new google.maps.LatLng(44.49010884,11.33686264),
        new google.maps.LatLng(44.49698044,11.34303158),
        new google.maps.LatLng(44.49797944,11.33097867),
        new google.maps.LatLng(44.49454978,11.33517657),
        new google.maps.LatLng(44.49669756,11.34406568),
        new google.maps.LatLng(44.5021851,11.3428642),
        new google.maps.LatLng(44.4882063,11.33501141),
        new google.maps.LatLng(44.49479526,11.34994887),
        new google.maps.LatLng(44.50235877,11.34798265),
        new google.maps.LatLng(44.4935809,11.34393255),
        new google.maps.LatLng(44.50180068,11.34870586),
        new google.maps.LatLng(44.49009875,11.35121575),
        new google.maps.LatLng(44.50081764,11.34130384),
        new google.maps.LatLng(44.4880824,11.3485777),
        new google.maps.LatLng(44.49584283,11.35471486),
        new google.maps.LatLng(44.49651052,11.33592606),
        new google.maps.LatLng(44.49929112,11.33180345),
        new google.maps.LatLng(44.5031143,11.34522469),
        new google.maps.LatLng(44.49055315,11.34177163),
        new google.maps.LatLng(44.4949805,11.35394083),
        new google.maps.LatLng(44.4921347,11.34697719),
        new google.maps.LatLng(44.4972551,11.33555862),
        new google.maps.LatLng(44.48713255,11.33724421),
        new google.maps.LatLng(44.49811206,11.33495906),
        new google.maps.LatLng(44.49775723,11.33486585),
        new google.maps.LatLng(44.49993482,11.34997188),
        new google.maps.LatLng(44.48933942,11.33868434),
        new google.maps.LatLng(44.49245966,11.34257978),
        new google.maps.LatLng(44.50133773,11.3368392),
        new google.maps.LatLng(44.49502732,11.33302501),
        new google.maps.LatLng(44.4983681,11.33631794),
        new google.maps.LatLng(44.49133651,11.33792093),
        new google.maps.LatLng(44.48749138,11.3426582),
        new google.maps.LatLng(44.49810661,11.3328214),
        new google.maps.LatLng(44.49930348,11.34169219),
        new google.maps.LatLng(44.49671654,11.35049275),
        new google.maps.LatLng(44.49726525,11.34305084),
        new google.maps.LatLng(44.49844262,11.35208199),
        new google.maps.LatLng(44.49688937,11.34246742),
        new google.maps.LatLng(44.49144011,11.33314125),
        new google.maps.LatLng(44.4971946,11.33712408),
        new google.maps.LatLng(44.49026615,11.34136978),
        new google.maps.LatLng(44.49568526,11.34540968),
        new google.maps.LatLng(44.50320931,11.34561342),
        new google.maps.LatLng(44.49324007,11.33597655),
        new google.maps.LatLng(44.49002515,11.3412939),
        new google.maps.LatLng(44.49154482,11.34433134),
        new google.maps.LatLng(44.48913298,11.35130881),
        new google.maps.LatLng(44.49637345,11.35104169),
        new google.maps.LatLng(44.48921915,11.34719959),
        new google.maps.LatLng(44.49900976,11.34303985),
        new google.maps.LatLng(44.50188821,11.34766901),
        new google.maps.LatLng(44.495787,11.35149528),
        new google.maps.LatLng(44.48970855,11.34429471),
        new google.maps.LatLng(44.49257917,11.35043357),
        new google.maps.LatLng(44.48880917,11.33973939)
    ];

    var markers = [];
    var iterator = 0;

    for (var i = 0; i < neighborhoods.length; i++) {
        setTimeout(function() {
          markers.push(new google.maps.Marker({
        position: neighborhoods[iterator],
        map: map,
        icon: 'sites/all/libraries/bootstrap/img/pins/pin1.png',
        draggable: false,
        animation: google.maps.Animation.DROP
      }));
      iterator++;
        }, i * 200);
      }
}


