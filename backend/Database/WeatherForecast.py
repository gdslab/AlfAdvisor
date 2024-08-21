import requests
# from datetime import datetime
import json
# import csv
# import os

# os.chdir('/Users/G/Desktop/Research/Alfalfa_Harvest')
      
# Input data
# Function to calculate drying rate
def get_weather_data(time_zone, Lat, Lng):
    # Choose one the time zones. 1)"America%2FNew_York", 2)"America%2FChicago", 3)"America%2FDenver" 4) "America%2FLos_Angeles",
    # destination_json_file = "/Users/lena/Downloads/WI_20240124.json"
    # destination_csv_file = "WI_DryRate_20240124.csv"
    
    forcast_days = 14 # Number days to forecast
    
    
    # Pulling soil moisture data from NOAA
    response_sm = requests.get(f"https://api.open-meteo.com/v1/gfs?latitude={Lat}&longitude={Lng}&hourly=soil_moisture_0_to_10cm&forecast_days={forcast_days}&timezone={time_zone}")
    soil_moisture_data = response_sm.text
    soil_moisture_data = json.loads(soil_moisture_data)
    soil_moisture = soil_moisture_data["hourly"]["soil_moisture_0_to_10cm"]
    # print(soil_moisture_data)
    
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


# Save to JSON file
# result_json = json.dumps(result_data, indent=2)
# with open(destination_json_file, "w") as file:
#     file.write(result_json)
    
    
# Save to CSV file
# csv_data = []
# for i in range(len(soil_moisture)):
#     csv_data.append({
#         "time": soil_moisture_data["hourly"]["time"][i],
#         "temperature": temperature_2m[i],
#         "soil_moisture": soil_moisture[i],
#         "solar_radiation": solar_radiation[i],
#         "Drying_rate": drm_values[i]
#     })
    
# csv_columns = ["time", "temperature", "soil_moisture", "solar_radiation", "Drying_rate"]

# with open(destination_csv_file, "w", newline="") as csv_file:
#     writer = csv.DictWriter(csv_file, fieldnames=csv_columns)
#     writer.writeheader()
#     for data in csv_data:
#         writer.writerow(data)

