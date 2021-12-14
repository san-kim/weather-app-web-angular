
'use strict';

const fetch = require('node-fetch');

const cors = require('cors');
const express = require('express');
const app = express();
app.use(express.static('myapp/src'));

// extra key: LY3PVz8RNKhG6OYZPA1egLojE5cCyu1f
const tomorrow_api_keys = ["LY3PVz8RNKhG6OYZPA1egLojE5cCyu1f", "MQUe5ZB9nVi80IBzkHdFGj8wXkXxhwZr", "E1qqu3DnFnt0a7OmeOB1iOUCGkftXO8p", "Bm9ZLNOGqlWTBjY4aQrfZzoIZw89WR1A", "lAKe2f3PL2cT8MxfL9LuI96PX0FtTZMv"]
var tomorrow_api_key = 'Bm9ZLNOGqlWTBjY4aQrfZzoIZw89WR1A';
const ipinfo_api_key = '783eff35ae9e6e';
const google_maps_api_key = 'AIzaSyAx1HYH0ghk-Ni90dclEO9cyDxUOA17P1w';
const places_autocomplete_key = 'AIzaSyDfjCnUu3cRM5bJAos7Xrxc49BmQtxLwDo';

app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/weather.html');
});

app.get('/getweather', async (req, res) => {
    var tomorrowindex = Math.floor(Math.random() * tomorrow_api_keys.length);
    tomorrow_api_key = tomorrow_api_keys[tomorrowindex];
    var lat = req.query.lat;
    var long = req.query.long;
    var location = 'location=' + lat + ',' + long;
    var fields = '&fields=' + 'temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,uvIndex,weatherCode,precipitationProbability,precipitationType,sunriseTime,sunsetTime,visibility,moonPhase,cloudCover';
    var timesteps = '&timesteps=' + '1h,1d';
    var units = '&units=' + 'imperial';
    var timezone = '&timezone=' + 'America/Los_Angeles';
    var apikey = '&apikey=' + tomorrow_api_key;
    
    var url = 'https://api.tomorrow.io/v4/timelines?' + location + fields + timesteps + units + timezone + apikey;
    
    var response = await fetch(url);
    var json_data = await response.json();
        
    res.json(json_data);
});

app.get('/getweatherbycity', async (req, res) => {
    var tomorrowindex = Math.floor(Math.random() * tomorrow_api_keys.length);
    tomorrow_api_key = tomorrow_api_keys[tomorrowindex];
    var city = req.query.city;
    var mapsurl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + city + "&key=" + google_maps_api_key;
    
    const getData = async () => {
        const result = await fetch(mapsurl);
        const myJSON = await result.text();
        return myJSON;
    }
    getData().then(function (result) {
        const data = JSON.parse(result);
        var lat = data['results'][0]['geometry']['location']['lat'];
        var long = data['results'][0]['geometry']['location']['lng'];
        
        var location = 'location=' + lat + ',' + long;
        var fields = '&fields=' + 'temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,uvIndex,weatherCode,precipitationProbability,precipitationType,sunriseTime,sunsetTime,visibility,moonPhase,cloudCover';
        var timesteps = '&timesteps=' + '1h,1d';
        var units = '&units=' + 'imperial';
        var timezone = '&timezone=' + 'America/Los_Angeles';
        var apikey = '&apikey=' + tomorrow_api_key;

        var url = 'https://api.tomorrow.io/v4/timelines?' + location + fields + timesteps + units + timezone + apikey;
        
        console.log(lat)
        console.log(long)
        console.log(url);
        
        const getJSON = async() => {
            const results = await fetch(url);
            const myJSON = await results.json();
            return myJSON;
        }
        getJSON().then(function (response) {
            res.json(response);
        }).catch(error => {
            console.log('Error:', error);
        })
        
    }).catch(error => {
        console.log('Error:', error)
    })
});

app.get('/getautocompleteresults', async (req, res) => {
    var input = req.query.searchstring;
    var placeskey = "AIzaSyDHUEkEctY1V5X4JIHdhjE8NuQVZ8-vjU0";
    var url = encodeURI("https://maps.googleapis.com/maps/api/place/autocomplete/json?input=" + input + "&components=country:us&types=(cities)&key=" + placeskey);
    
    
    const getData = async () => {
        const res = await fetch(url);
        const myJSON = await res.text();
        return myJSON;
    }
    getData().then(function (result) {
        const results = [];
        const data = JSON.parse(result)["predictions"];
        for(var i = 0; i < data.length; i++){
            results.push(data[i]["structured_formatting"]["main_text"]);
        }
        res.json(results);
    }).catch(error => {
        console.log('Error:', error)
    })
});

app.get('/getcity', async (req, res) => {
    var lat = req.query.lat;
    var long = req.query.long;
    
    var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + long + "&result_type=locality&key=AIzaSyDfjCnUu3cRM5bJAos7Xrxc49BmQtxLwDo"

    var url = encodeURI(url);

    const getData = async () => {
        const res = await fetch(url);
        const myJSON = await res.text();
        return myJSON;
    }
    getData().then(function (result) {
        const data = JSON.parse(result)["results"];
        res.json(data[0]["address_components"][0]["long_name"]);
    }).catch(error => {
        console.log('Error:', error)
    })
});



app.get('/getipinfokey', async (req, res) => {
    res.json(ipinfo_api_key);
});

app.get('/getgooglemapskey', async (req, res) => {
    res.json(google_maps_api_key);
});

app.get('/getplacesautocompletekey', async (req, res) => {
    res.json(places_autocomplete_key);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]

module.exports = app;
