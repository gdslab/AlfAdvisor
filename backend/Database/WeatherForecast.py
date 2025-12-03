import requests
import json
      
# Input data
# Function to calculate drying rate
def get_weather_data(time_zone, Lat, Lng):    
    forcast_days = 14 # Number days to forecast
    
    # Pulling soil moisture data from NOAA
    response_sm = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=soil_moisture_0_to_10cm&forecast_days={forcast_days}&timezone={time_zone}")
    soil_moisture_data = response_sm.text
    soil_moisture_data = json.loads(soil_moisture_data)
    soil_moisture = soil_moisture_data["hourly"]["soil_moisture_0_to_10cm"]
    
    #Pulling solar_radiation data
    response_sr = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=direct_radiation&forecast_days={forcast_days}&timezone={time_zone}")
    solar_radiation_data = response_sr.text
    solar_radiation_data = json.loads(solar_radiation_data)
    solar_radiation = solar_radiation_data["hourly"]["direct_radiation"]
    
    # Pulling temperature data from NOAA
    response_tm = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=temperature_2m&temperature_unit=celsius&forecast_days={forcast_days}&timezone={time_zone}")
    temperature_data = response_tm.text
    temperature_data = json.loads(temperature_data)
    temperature_2m = temperature_data["hourly"]["temperature_2m"]
    
    # Pulling Rain Expectation data from NOAA
    response_rain = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=precipitation&forecast_days={forcast_days}&timezone={time_zone}")
    rain_data = response_rain.text
    rain_data = json.loads(rain_data)
    hourly_rain = rain_data["hourly"]["precipitation"]
    
    # Pulling Rain Probability data from NOAA
    response_prob = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=precipitation_probability&forecast_days={forcast_days}&timezone={time_zone}")
    prob_data = response_prob.text
    prob_data = json.loads(prob_data)
    hourly_prob = prob_data["hourly"]["precipitation_probability"]
        
    
    # Prepare data for saving
    weather_data = {
        "time": soil_moisture_data["hourly"]["time"],
        "temperature": temperature_2m,
        "soil_moisture": soil_moisture,
        "solar_radiation": solar_radiation,
        "precip": hourly_rain,
        "prob": hourly_prob,
    }
    return weather_data

