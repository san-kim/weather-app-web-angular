import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SearchInputs } from './forminputs';
import { trigger, transition, query, style, animate, group } from '@angular/animations';
import { Options } from 'ngx-google-places-autocomplete/objects/options/options';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';

interface dailyTableEntry{
  date: string;
  image: string;
  status: string;
  temphigh: number;
  templow: number;
  windspeed: number;
}

interface dayInfo{
  date: string;
  status: string;
  temphigh: number;
  templow: number;
  tempapparent: number;
  sunrise: string;
  sunset: string;
  humidity:number;
  windspeed: number;
  visibility: number;
  moonphase: number;
  cloudcover: number;
}

interface favoriteEntry{
  key: string;
  val: string;
  city: string;
  state: string;
  lat: number;
  long: number;
}

//javascript function declaration
declare function populateHourlyWeatherChart(data:any): any;
declare function populateTempRangeChart(data:any): any;

//animations 
const left = [
  query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
  group([
    query(':enter', [style({ transform: 'translateX(-100%)' }), animate('.3s ease-out', style({ transform: 'translateX(0%)' }))], {
      optional: true,
    }),
    query(':leave', [style({ transform: 'translateX(0%)' }), animate('.3s ease-out', style({ transform: 'translateX(100%)' }))], {
      optional: true,
    }),
  ]),
];

const right = [
  query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
  group([
    query(':enter', [style({ transform: 'translateX(100%)' }), animate('.3s ease-out', style({ transform: 'translateX(0%)' }))], {
      optional: true,
    }),
    query(':leave', [style({ transform: 'translateX(0%)' }), animate('.3s ease-out', style({ transform: 'translateX(-100%)' }))], {
      optional: true,
    }),
  ]),
];

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('animSlider', [
      transition(':increment', right),
      transition(':decrement', left),
    ]),
  ],
})

export class AppComponent {
  searchModel = new SearchInputs('','','',false);
  searchResultModel = {} as JSON;
  lat:number = 0;
  long:number = 0;
  address = '';
  twitteraddress = '';
  twitterdate = '';
  twitterstatus = '';
  twitterurl = '';
  active = 1;
  activetop = 1;
  weathermap = new Map();
  weatherimages = new Map();
  dailydetailsrowdata:dailyTableEntry[] = [];
  datastring = "";
  currentcity = "";
  currentstate = "";
  resultsExist = true;

  ipinfokey = '';
  googlemapskey = '';
  autocompletekey = '';
  showResults = false;

  constructor(
    private httpClient : HttpClient
  ){
    //populate instance of favorites list with existing 
    this.favoritesList = [];
    for(var i = 0; i<this.localStorage.length; i++){
      //get key
      var key = this.localStorage.key(i) + "";
      var val = this.localStorage.getItem(key)+"";
      var loc = key.split("...");
      var latlng = val.split(" ");
      var fentry = {
        key: key,
        val: val,
        city: loc[0],
        state: loc[1],
        lat: Number(latlng[0]),
        long: Number(latlng[1])
      };
      this.favoritesList.push(fentry);
    }
    this.favoritesExist = false;
    if(this.favoritesList.length > 0)
      this.favoritesExist = true;

    var url = 'https://csci-571-homework-8-apis.wl.r.appspot.com/';
    this.httpClient.get<any>(url + 'getipinfokey').subscribe(
      response => {
        this.ipinfokey = response;
      }
    );
    this.httpClient.get<any>(url + 'getgooglemapskey').subscribe(
      response => {
        this.googlemapskey = response;
      }
    );
    this.httpClient.get<any>(url + 'getplacesautocompletekey').subscribe(
      response => {
        this.autocompletekey = response;
      }
    );
    
    this.weathermap.set(1000, 'Clear');
    this.weathermap.set(1100, 'Mostly Clear');
    this.weathermap.set(1101, 'Partly Cloudy');
    this.weathermap.set(1102, 'Mostly Cloudy');
    this.weathermap.set(1001, 'Cloudy');
    this.weathermap.set(2000, 'Fog');
    this.weathermap.set(2100, 'Light Fog');
    this.weathermap.set(8000, 'Thunderstorm');
    this.weathermap.set(5001, 'Flurries');
    this.weathermap.set(5100, 'Light Snow');
    this.weathermap.set(5000, 'Snow');
    this.weathermap.set(5101, 'Heavy Snow');
    this.weathermap.set(7102, 'Light Ice Pellets');
    this.weathermap.set(7000, 'Ice Pellets');
    this.weathermap.set(7101, 'Heavy Ice Pellets');
    this.weathermap.set(4000, 'Drizzle');
    this.weathermap.set(6000, 'Freezing Drizzle');
    this.weathermap.set(6200, 'Light Freezing Rain');
    this.weathermap.set(6001, 'Freezing Rain');
    this.weathermap.set(6201, 'Heavy Freezing Rain');
    this.weathermap.set(4200, 'Light Rain');
    this.weathermap.set(4001, 'Rain');
    this.weathermap.set(4201, 'Heavy Rain');
    this.weathermap.set(3000, 'Light Wind');
    this.weathermap.set(3001, 'Wind');
    this.weathermap.set(3002, 'Strong Wind');

    this.weatherimages.set(1000, ['assets/images/clear_day.svg', 'assets/images/clear_night.svg']);
    this.weatherimages.set(1100, ['assets/images/mostly_clear_day.svg','assets/images/mostly_clear_night.svg']);
    this.weatherimages.set(1101, ['assets/images/partly_cloudy_day.svg','assets/images/partly_cloudy_night.svg']);
    this.weatherimages.set(1102, ['assets/images/mostly_cloudy.svg']);
    this.weatherimages.set(1001, ['assets/images/cloudy.svg']); 
    this.weatherimages.set(2000, ['assets/images/fog.svg']);
    this.weatherimages.set(2100, ['assets/images/fog_light.svg']);
    this.weatherimages.set(8000, ['assets/images/tstorm.svg']);
    this.weatherimages.set(5001, ['assets/images/flurries.svg']);
    this.weatherimages.set(5100, ['assets/images/snow_light.svg']);
    this.weatherimages.set(5000, ['assets/images/snow.svg']);
    this.weatherimages.set(5101, ['assets/images/snow_heavy.svg']);
    this.weatherimages.set(7102, ['assets/images/ice_pellets_light.svg']);
    this.weatherimages.set(7000, ['assets/images/ice_pellets.svg']);
    this.weatherimages.set(7101, ['assets/images/ice_pellets_heavy.svg']);
    this.weatherimages.set(4000, ['assets/images/drizzle.svg']);
    this.weatherimages.set(6000, ['assets/images/freezing_drizzle.svg']);
    this.weatherimages.set(6200, ['assets/images/freezing_rain_light.svg']);
    this.weatherimages.set(6001, ['assets/images/freezing_rain.svg']);
    this.weatherimages.set(6201, ['assets/images/freezing_rain_heavy.svg']);
    this.weatherimages.set(4200, ['assets/images/rain_light.svg']);
    this.weatherimages.set(4001, ['assets/images/rain.svg']);
    this.weatherimages.set(4201, ['assets/images/rain_heavy.svg']);
    this.weatherimages.set(3000, ['assets/images/light_wind.svg']);
    this.weatherimages.set(3001, ['assets/images/wind.svg']);
    this.weatherimages.set(3002, ['assets/images/strong_wind.svg']);
  }
  

  autodetectChecked()
  {
    this.searchModel.autodetect = true;
  }

  clearInputs()
  {
    this.searchModel.street = '';
    this.searchModel.city = '';
    this.searchModel.state = '';
    this.searchModel.autodetect = false;
    this.showResults = false;
    this.activetop = 1;
  }

  trimStreet(){
    this.searchModel.street = this.searchModel.street.trim();
  }

  trimCity(){
    this.searchModel.city = this.searchModel.city.trim();
  }

  showProgressBar = false;
  progressValue = 0;
  formSubmit()
  {
    //show progress bar
    this.active = 1;
    this.activetop = 1;

    this.showProgressBar = true;
    this.progressValue = 10;

    this.cardCounter = 0;
    
    //get lat and long
    if (this.searchModel.autodetect == true){
      this.httpClient.get<any>('https://ipinfo.io/json?token='+this.ipinfokey).subscribe(
        response => {
          this.progressValue = 20;
          var res = JSON.parse(JSON.stringify(response));
          this.progressValue = 30;
          var latlngstr = res['loc'].split(',');
          this.lat = Number(latlngstr[0]);
          this.long = Number(latlngstr[1]);
          this.progressValue = 40;
          this.address = res['city'] + ', ' + res['region'];
          
          this.currentcity = res['city'];
          this.currentstate = res['region'];
          // if current city and state are in favorites, this should be favorited in the star icon
          if(this.localStorage.getItem(this.currentcity + "..." + this.currentstate)){
            this.isFavorite = true;
          }
          else{
            this.isFavorite = false;
          }

          //make twitter adderss
          var addr = this.address;
          this.twitteraddress = addr.replace(' ', '%20');
          this.progressValue = 50;
          
        }
      );
    }
    else {
      var googlemapsurl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
      var streetarr = this.searchModel.street.trim().split(' ');
      var street = streetarr[0];

      this.progressValue = 10;

      for(var i = 1; i<streetarr.length; i++) { street += "+" + streetarr[i].trim(); }
      var cityarr = this.searchModel.city.trim().split(' ');
      var city = ",+" + cityarr[0];
      for(var i = 1; i<cityarr.length; i++) { city += "+" + cityarr[i].trim(); }
      var statearr = this.searchModel.state.trim().split(' ');
      var state = ",+" + statearr[0];
      for(var i = 1; i<statearr.length; i++) { state += "+" + statearr[i].trim(); }

      googlemapsurl += street + city + state + "&key=" + this.googlemapskey;

      this.progressValue = 20;

      this.httpClient.get<any>(googlemapsurl).subscribe(
        response => {
          var res = JSON.parse(JSON.stringify(response))['results'];
          if(res.length == 0){
            //TODO
          }
          else{
            this.lat = Number(res[0]['geometry']['location']['lat']);
            this.long = Number(res[0]['geometry']['location']['lng']);
            this.progressValue = 30;
            this.address = res[0]['formatted_address'];

            //find  "locality" and "administrative_area_level_1" tags
            var addresscomponents = res[0]['address_components'];
            for(var k = 0; k<addresscomponents.length; k++)
            {
              if(addresscomponents[k]['types'][0] == "locality"){
                this.currentcity = addresscomponents[k]['long_name'];
              }
              if(addresscomponents[k]['types'][0] == "administrative_area_level_1"){
                this.currentstate = addresscomponents[k]['long_name'];
              }
            }
            // if current city and state are in favorites, this should be favorited in the star icon
            if(this.localStorage.getItem(this.currentcity + "..." + this.currentstate)){
              this.isFavorite = true;
            }
            else{
              this.isFavorite = false;
            }

            this.progressValue = 40;
            var addr = this.address;
            this.twitteraddress = addr.replace(' ', '%20');
            this.progressValue = 50;
          }
        }
      );


    }


    //get json
    var getdataurl = 'https://csci-571-homework-8-apis.wl.r.appspot.com/getweather?lat='+ this.lat + '&long=' + this.long;
    this.httpClient.get<any>(getdataurl).subscribe(
      async response => {
        this.progressValue = 60;
        var data = JSON.parse(JSON.stringify(response));
        this.datastring = JSON.stringify(response);
        if(!data['data']){
          this.resultsExist = false;
          this.progressValue = 100;
          this.showProgressBar = false;
          return;
        }
        this.resultsExist = true;
        //populate daily info table
        var dayinfo = data['data']['timelines'][1]['intervals'];
        var daysofweek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var abbrmonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        this.progressValue = 70;
        var ddrd_temp:dailyTableEntry[] = [];
        for(var i = 0; i<dayinfo.length; i++){
          var datestring = dayinfo[i]['startTime'];
          var dateojb_cd = new Date(datestring);
          var date_cd = daysofweek[dateojb_cd.getDay()] + ", " + dateojb_cd.getDate() + " " + abbrmonths[dateojb_cd.getMonth()] + " " + dateojb_cd.getFullYear();

          var currentdayinfo = dayinfo[i]['values'];
          var dayweathercode = currentdayinfo['weatherCode'];
          var statusimg = this.weatherimages.get(dayweathercode)[0];

          var status = this.weathermap.get(dayweathercode);
          var temphigh = currentdayinfo['temperatureMax'];
          var templow = currentdayinfo['temperatureMin'];
          var daywindspeed = currentdayinfo['windSpeed'];
          ddrd_temp.push({
            date: date_cd,
            image: statusimg,
            status: status,
            temphigh: temphigh,
            templow: templow,
            windspeed: daywindspeed
          })
        }
        this.dailydetailsrowdata = ddrd_temp;
        this.progressValue = 80;

        var myScriptElement: HTMLScriptElement  = document.createElement("script");
        myScriptElement.src = "assets/script.js";
        document.body.appendChild(myScriptElement);

        //populate temp range charts 
        var CONTROL_INTERVAL1 = setInterval(function(){
          // Check if element exist
          if(document.getElementById('temperaturerangechartdiv') != null){
            populateTempRangeChart(data);
            clearInterval(CONTROL_INTERVAL1);
          }
        }, 100);
        
        var CONTROL_INTERVAL2 = setInterval(function(){
          // Check if element exist
          if(document.getElementById('hourlyweatherchartdiv') != null){
            populateHourlyWeatherChart(data);
            clearInterval(CONTROL_INTERVAL2);
          }
        }, 100);

        this.progressValue = 90;
        //just to show progress bar
        this.progressValue = 100;
        await new Promise(f => setTimeout(f, 400));
        // show results
        this.showProgressBar = false;
        this.showResults = true;
        //make nav visible
            
      }
    );

    
  }

  showDailyTemp()
  {
    var data = JSON.parse(this.datastring);
    var CONTROL_INTERVAL1 = setInterval(function(){
      // Check if element exist
      if(document.getElementById('temperaturerangechartdiv') != null){
        populateTempRangeChart(data);
        clearInterval(CONTROL_INTERVAL1);
      }
    }, 100);
  }

  showMeteogram()
  {
    var data = JSON.parse(this.datastring);
    var CONTROL_INTERVAL2 = setInterval(function(){
      // Check if element exist
      if(document.getElementById('hourlyweatherchartdiv') != null){
        populateHourlyWeatherChart(data);
        clearInterval(CONTROL_INTERVAL2);
      }
    }, 100);
  }

  cardCounter: number = 0;
  indexList: Array<number> = [0, 1];
  
  goToDetailsCard(){
    this.cardCounter = 1;
  }
  goToMainCard(){
    this.cardCounter = 0;
    this.active = 1;
  }

  //populate day details card on details
  currentDayIndex = 0;
  currentDayInfo:dayInfo = {
    date: '',
    status: '',
    temphigh: 0,
    templow: 0,
    tempapparent: 0,
    sunrise: '',
    sunset: '',
    humidity:0,
    windspeed: 0,
    visibility: 0,
    moonphase: 0,
    cloudcover: 0
  };

  setToDetails()
  {
    this.active = 1;
  }

  detailsDay(index:number)
  {
    this.currentDayIndex = index;
    var data = JSON.parse(this.datastring);

    var daysofweek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var abbrmonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    var dayinfo = data['data']['timelines'][1]['intervals'];
    var datestring = dayinfo[index]['startTime'];
    var dateojb_cd = new Date(datestring);
    this.currentDayInfo.date = daysofweek[dateojb_cd.getDay()] + ", " + dateojb_cd.getDate() + " " + abbrmonths[dateojb_cd.getMonth()] + " " + dateojb_cd.getFullYear();

    var datetemp = this.currentDayInfo.date;
    this.twitterdate = datetemp.replace(' ','%20');

    var currentdayinfo = dayinfo[index]['values'];
    var dayweathercode = currentdayinfo['weatherCode'];

    this.currentDayInfo.status = this.weathermap.get(dayweathercode);

    this.currentDayInfo.temphigh = currentdayinfo['temperatureMax'];
    this.currentDayInfo.templow = currentdayinfo['temperatureMin'];
    this.currentDayInfo.tempapparent = currentdayinfo['temperatureApparent'];
    var sunrisestring = new Date(currentdayinfo['sunriseTime']);
    var srhours = sunrisestring.getHours() + "";
    if(srhours.length == 1)
      srhours = "0" + srhours;
    var srmins = sunrisestring.getMinutes() + "";
    if(srmins.length == 1)
      srmins = "0" + srmins;
    var srsecs = sunrisestring.getSeconds() + "";
    if(srsecs.length == 1)
      srsecs = "0" + srsecs;
    this.currentDayInfo.sunrise = srhours + ":" + srmins + ":" + srsecs;

    var sunsetstring = new Date(currentdayinfo['sunsetTime']);
    var sshours = sunsetstring.getHours() + "";
    if(sshours.length == 1)
      sshours = "0" + sshours;
    var ssmins = sunsetstring.getMinutes() + "";
    if(ssmins.length == 1)
      ssmins = "0" + ssmins;
    var sssecs = sunsetstring.getSeconds() + "";
    if(sssecs.length == 1)
      sssecs = "0" + sssecs;
    this.currentDayInfo.sunset = sshours + ":" + ssmins + ":" + sssecs;

    this.currentDayInfo.humidity = currentdayinfo['humidity'];
    this.currentDayInfo.windspeed = currentdayinfo['windSpeed'];
    this.currentDayInfo.visibility = currentdayinfo['visibility'];
    this.currentDayInfo.moonphase = currentdayinfo['moonPhase'];
    this.currentDayInfo.cloudcover = currentdayinfo['cloudCover'];

    var statustemp = this.currentDayInfo.status;
    this.twitterstatus = statustemp.replace(' ', '%20');

    this.twitterurl = "https://twitter.com/intent/tweet?text=The%20temperature%20in%20" + this.currentcity + ",%20" + this.currentstate + "%20on%20" + this.twitterdate + "%20is%20" + this.currentDayInfo.tempapparent + "%20°F.%20The%20weather%20conditions%20are%20" + this.twitterstatus + "%20%23CSCI571WeatherForecast";
    this.goToDetailsCard();
  }

  //form autocomplete
  options = {
    types: ['(cities)'],
    componentRestrictions: {country: "us"}
  } as unknown as Options;
    
  //favorites
  //Save the the City State and lat/long in format key = '(City)...(State)' value = "(lat) (long)"
  localStorage = window.localStorage;
  favoritesList:Array<favoriteEntry>;
  favoritesExist: Boolean;

  isFavorite = false;

  favoriteIconClicked()
  {
    this.isFavorite = !this.isFavorite;
    // if it is a favorite
    if(this.isFavorite == true)
      this.addToFavorites();
    // if it is no longer a favorite
    else
      this.removeFromFavorites();
  }

  addToFavorites()
  {
    this.localStorage.setItem(this.currentcity + "..." + this.currentstate, this.lat + " " + this.long);
    //check if it is already in favorites
    for(var i = 0; i<this.favoritesList.length; i++){
      if(this.favoritesList[i].key == this.currentcity + "..." + this.currentstate)
        return;
    }
    //if not, then add to the local list
    var entry = {
      key: this.currentcity + "..." + this.currentstate,
      val: this.lat + " " + this.long,
      city: this.currentcity,
      state: this.currentstate,
      lat: this.lat,
      long: this.long
    };
    this.favoritesList.push(entry);
    this.favoritesExist = true;
  }

  removeFromFavorites()
  {
    this.localStorage.removeItem(this.currentcity + "..." + this.currentstate);
    //check if it is already in favorites, then delete if it is 
    for(var i = 0; i<this.favoritesList.length; i++){
      if(this.favoritesList[i].key == this.currentcity + "..." + this.currentstate){
        this.favoritesList.splice(i,1);
        break;
      }
    }

    if(this.favoritesList.length == 0)
      this.favoritesExist = false;
  }

  removeFromFavoritesWithKey(key:string)
  {
    this.localStorage.removeItem(key);
    //check if it is already in favorites, then delete if it is 
    for(var i = 0; i<this.favoritesList.length; i++){
      if(this.favoritesList[i].key == key){
        this.favoritesList.splice(i,1);
        break;
      }
    }

    var keystring = key.split("...");
    var keycity = keystring[0];
    var keystate = keystring[1];
    if (this.currentcity == keycity && this.currentstate == keystate){
      this.isFavorite = false;
    }

    if(this.favoritesList.length == 0)
      this.favoritesExist = false;
  }

  async favoritesDetailsClicked(latitude:number, longitude:number, cityname:string, statename:string)
  {
    // do the same call as form submit with these inputs
    //show progress bar
    this.active = 1;
    this.activetop = 1;

    this.showProgressBar = true;
    this.progressValue = 10;

    this.cardCounter = 0;
    this.lat = latitude;
    this.long = longitude;
    this.progressValue = 20;
    this.currentcity = cityname;
    this.currentstate = statename;
    this.address = cityname + ", " + statename;
    this.progressValue = 30;
    if(this.localStorage.getItem(this.currentcity + "..." + this.currentstate)){
      this.isFavorite = true;
    }
    else{
      this.isFavorite = false;
    }
    this.progressValue = 40;

    //make twitter adderss
    var addr = this.address;
    this.twitteraddress = addr.replace(' ', '%20');
    this.progressValue = 50;
    //just to show progress bar
    

    //get json
    var getdataurl = 'https://csci-571-homework-8-apis.wl.r.appspot.com/getweather?lat='+ this.lat + '&long=' + this.long;
    this.httpClient.get<any>(getdataurl).subscribe(
      async response => {
        var data = JSON.parse(JSON.stringify(response));
        this.datastring = JSON.stringify(response);
        if(!data['data']){
          this.resultsExist = false;
          this.progressValue = 100;
          this.showProgressBar = false;
          return;
        }
        this.progressValue = 60;

        this.resultsExist = true;
        //populate daily info table
        var dayinfo = data['data']['timelines'][1]['intervals'];
        var daysofweek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var abbrmonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        this.progressValue = 70;

        var ddrd_temp:dailyTableEntry[] = [];
        for(var i = 0; i<dayinfo.length; i++){
          var datestring = dayinfo[i]['startTime'];
          var dateojb_cd = new Date(datestring);
          var date_cd = daysofweek[dateojb_cd.getDay()] + ", " + dateojb_cd.getDate() + " " + abbrmonths[dateojb_cd.getMonth()] + " " + dateojb_cd.getFullYear();

          var currentdayinfo = dayinfo[i]['values'];
          var dayweathercode = currentdayinfo['weatherCode'];
          var statusimg = this.weatherimages.get(dayweathercode)[0];

          var status = this.weathermap.get(dayweathercode);
          var temphigh = currentdayinfo['temperatureMax'];
          var templow = currentdayinfo['temperatureMin'];
          var daywindspeed = currentdayinfo['windSpeed'];
          ddrd_temp.push({
            date: date_cd,
            image: statusimg,
            status: status,
            temphigh: temphigh,
            templow: templow,
            windspeed: daywindspeed
          })
        }
        this.dailydetailsrowdata = ddrd_temp;
        this.progressValue = 80;

        var myScriptElement: HTMLScriptElement  = document.createElement("script");
        myScriptElement.src = "assets/script.js";
        document.body.appendChild(myScriptElement);
        this.progressValue = 90;
        //populate temp range charts 
        var CONTROL_INTERVAL1 = setInterval(function(){
          // Check if element exist
          if(document.getElementById('temperaturerangechartdiv') != null){
            populateTempRangeChart(data);
            clearInterval(CONTROL_INTERVAL1);
          }
        }, 100);
        
        var CONTROL_INTERVAL2 = setInterval(function(){
          // Check if element exist
          if(document.getElementById('hourlyweatherchartdiv') != null){
            populateHourlyWeatherChart(data);
            clearInterval(CONTROL_INTERVAL2);
          }
        }, 100);
        this.progressValue = 100;
        await new Promise(f => setTimeout(f, 400));
        // show results
        this.showProgressBar = false;
        this.showResults = true;
      }
    );
    
    
  }

  handleAddressChange(addresscomponent: Address)
  {
    for(let i = 0; i<addresscomponent.address_components.length; i++){
      if(addresscomponent.address_components[i].long_name != ''){
        if(addresscomponent.address_components[i].types[0] == "locality"){
          this.searchModel.city = addresscomponent.address_components[i].long_name;
          break;
        }
      }
    }
  }
  

  //TODO
  // favorites
  // no results

}

