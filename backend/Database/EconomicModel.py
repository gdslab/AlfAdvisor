import sys
sys.path.append('./Database')
import pandas as pd
import numpy as np
import os
from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException, Path
import requests
from fastapi.responses import JSONResponse
import WeatherForecast as wf
print(sys.path)

router = APIRouter(
    prefix='/alfalfa/EconomicModel',
    tags=['EcoModel']
)

# os.chdir('/Users/G/Desktop/Research/Alfalfa_Harvest')

############### Economic Functions ###############
def TDM_calc(DM_kgm2,area_m2):
    # input: dry matter in kg/m2 and area in m2
    # output: dry matter in tons dry matter
    TDM = DM_kgm2*area_m2*0.00110231
    return TDM


# calculate relative feed value (RFV)
def RFV_calc(ADF,NDF):  # input: ADF and NDF, output: RFV
    RFV = (88.9-(0.779*ADF))*(120/NDF)/1.29 
    return RFV

# calculate expected TDM for whole field for each day
def field_TDM_calc(YQ_data,area_m2):
    field_TDM = [0 for gap in range(7)]
    for gap in range(7):
        # Pull data from YQ Model output
        DM_kgm2 = YQ_data[str(gap)]['Yield']
        # calculate TDM for each pixel
        TDM = [TDM_calc(DM_kgm2[p], area_m2) for p in range(len(DM_kgm2))]
    
        field_TDM[gap] = sum(TDM)
        
    return field_TDM
    
    
# calculate yield weighted RFV for whole field
def field_RFV_calc(YQ_data):
    field_RFV = [0 for gap in range(7)]
    for gap in range(7):
        # Pull data from YQ Model output
        DM_kgm2 = YQ_data[str(gap)]['Yield']
        ADF = YQ_data[str(gap)]['ADF']
        NDF = YQ_data[str(gap)]['NDF']
        # pixel area determined by YQ Model (30x30m2)
        pix_area = 30*30
        TDM = [TDM_calc(DM_kgm2[p], pix_area) for p in range(len(DM_kgm2))]
        
        # calculate relative feed value
        RFV = [RFV_calc(ADF[p], NDF[p]) for p in range(len(DM_kgm2))]        
        field_RFV[gap] = sum([RFV[p]*TDM[p] for p in range(len(DM_kgm2))])/sum(TDM)
            
    return field_RFV
    

# calculate milk per ton of dry matter
def milkTDM_calc(CP,NDF,NDFD):
    # assumed values
    EE = 2.28      # ether extract
    ash = 7.9      # ash
    NDFCP = 3.8    # legume value
    BW = 1350      # cow's body weight
    pNDF = 0.3     # proportion of NDF in ration
    pG = 0         # percent grass in feed
    # calculated values
    FI = 0.0086*BW/(NDF/100) # base forage DMI
    afDMI = ((NDFD - (45 + (pG*12)))*0.374)+FI # adjusted forage DMI
    DMI = (0.0115*BW)/pNDF
    aTDMI = ((NDFD - (45+(pG*12)))*0.374)+DMI
    # Non-Fiber Carbohydrate
    NFC = 100-(NDF + CP + EE + ash - NDFCP) 
    # total digestability conversions
    tdCP = 0.93*CP           # crude protein
    tdFA = 0.97*(EE-1)       # fatty acids
    tdNDF = (NDF-NDFCP)*(NDFD/100)   # neutral detergent fiber
    tdNFC = 0.98*NFC         # non-fiber carbohydrate
    # Total Digestable nutrients
    TDN = tdCP + tdFA*2.25 + tdNDF + tdNFC - 7
    pF = afDMI/aTDMI  # percent forage in ration
    # Net Entergy of Lactation (at 3x maintenance (NRC, 1989)
    # NEL = (TDN*0.0245 - 0.12)/2.2
    NEL = (((((TDN-((NDF-NDFCP)*(NDFD/100))+((((((45+(pG*12)-NDFD)*0.374)*1.83)+NDFD)/100)*(NDF-NDFCP)))*0.044)+0.207)*0.6741)-0.5656)/2.2
    # Milk from forage
    MF = ((NEL*afDMI) - (0.08*(613.64**0.75)*pF))/0.31
    # Milk per TDM (lb/TDM)
    milkTDM = (MF/afDMI)*2000
    
    return milkTDM


# calculate $/ac by cutting day for hay sold on market
def market_value(RFV,TDM,p_hay):
    # get revenue from sale
    if RFV > 150:
        rev = p_hay[1]*TDM
    elif RFV > 124:
        rev = p_hay[2]*TDM
    else:
        rev = p_hay[3]*TDM
        
    prof = rev # - cost[storage == hay]
    return prof

# calculate $/ac by day for hay fed to dairy cattle
def feed_value(CP,NDF,NDFD,TDM,p_milk):
    milkTDM = milkTDM_calc(CP,NDF,NDFD) # milk lb/TDM
    milk = milkTDM*TDM/100              # milk production (cwt)
    rev = milk*p_milk                   # revenue from milk
    
    prof = rev # - cost[storage == hay] # partial budget profits from milk
    
    return prof

# calculate total milk value from feeding hay to dairy cows (1350 lb)
def total_milk_value_calc(YQ_data,p_milk):
    # initialize total revenue for all days
    total_milk_value = [0 for gap in range(7)]
    
    for gap in range(7):
        # Pull data from YQ Model output
        DM_kgm2 = YQ_data[str(gap)]['Yield']
        CP = YQ_data[str(gap)]['CP']
        NDF = YQ_data[str(gap)]['NDF']
        NDFD = YQ_data[str(gap)]['NDFD']
        
        print("this is DM_kgm2: ", DM_kgm2)
        # pixel area determined by YQ Model (30x30m2)
        pix_area = 30*30
        
        TDM = [TDM_calc(DM_kgm2[p], pix_area) for p in range(len(DM_kgm2))]
        
        revenue = [0 for p in range(len(DM_kgm2))]
        # calculate value from each pixel
        for p in range(len(DM_kgm2)):
            # calculate profits from milk
            revenue[p] = feed_value(CP[p],NDF[p],NDFD[p],TDM[p],p_milk)
        
        total_milk_value[gap] = sum(revenue)
        
    return total_milk_value

# calculate total value from selling hay on market
def total_market_value_calc(YQ_data,p_hay):
    # initialize total revenue for all days
    total_market_value = [0 for gap in range(7)]
    
    for gap in range(7):
        # Pull data from YQ Model output
        DM_kgm2 = YQ_data[str(gap)]['Yield']
        ADF = YQ_data[str(gap)]['ADF']
        NDF = YQ_data[str(gap)]['NDF']
        
        # pixel area determined by YQ Model (30x30m2)
        pix_area = 30*30
        
        TDM = [TDM_calc(DM_kgm2[p], pix_area) for p in range(len(DM_kgm2))]
        
        # calculate relative feed value
        RFV = [RFV_calc(ADF[p], NDF[p]) for p in range(len(DM_kgm2))]
        
        # calculate revenue from each pixel
        revenue = [market_value(RFV[p],TDM[p],p_hay) for p in range(len(DM_kgm2))]
        
        # calculate market value for whole field
        total_market_value[gap] = sum(revenue)
        
    return total_market_value

# calculate drying rate starting at hour t_start
def drying_rate_calc(soil_moisture,solar_radiation,temperature,TED,DM_yield,t_start):
    # assume swath density (SD) is equal to DM yield if tedded and 2x DM yield if not tedded
    if TED:
        SD = DM_yield*1000
    else:
        SD = DM_yield*1000*3
        
    drm_values = []
    
    for i in range(t_start, len(soil_moisture)):
        if i - t_start < 25:
            day = 1
        else:
            day = 0
            
        # Rotz and Chen (1985) equation [4] with AR = 0
        drm_value = (solar_radiation[i] + 5.42 * temperature[i]) / (66.4 * 100 * soil_moisture[i] + SD * (2.06 - 0.97 * day) * 1.55 + 3037)
        
        
        drm_values.append(drm_value)
        
    return drm_values

        
# calculate model drydown for one hour
# factor in probability of precip (PP)
def hour_drydown_calc(M0,DR,PP):
    # moisture after one hour of drying at rate DR
    M = M0*((1-PP)*(2.7182818284590452353602874**(-DR)) + PP)
    return M


# calculate nubmer of hours until target moisture is reached
# This function needs to be updated to consider the scenario when 
# the hay does not reach the target moisture in the data horizon.
def drying_window_calc(M0,DR,PP,Tcut,target_moisture):
    # drying start time (when cut)
    T = 0
    # convert moisture to dry basis
    M0db = M0/(100-M0)
    tmdb = target_moisture/(100-target_moisture)
    # dry until moisture drops below target moisture
    while M0db > tmdb and T < len(DR):
        # get hourly drying rate
        DRh = DR[T]
        # get hourly prob of precip
        PPh = PP[T+Tcut]/100
        # final moisture after 1 hour
        M = hour_drydown_calc(M0db,DRh,PPh)
        # set new moisture
        M0db = M
        # set new time
        T += 1
    # return time when dry
    # if T > len(DR):
    #     return -99
    # else:
    return T + Tcut # time since day one time 0
    
# calculate total precipitation durning trying period   
def expected_precip_calc(Tcut, Tcollect, precip_all):
    # total precip (inches) expected in drying window
    precip = round(sum(precip_all[Tcut:Tcollect]),2)
    return precip

# calculate drying window and expected precip in drying window for each cutting day
def daily_drying_window_calc(M0,SM,SI,T,yields,precip,PP,target_moisture,TED):
    # inouts are vectors
    # drying window in hours
    dry_window = [0 for p in range(14)]
    # expected precip in drying window
    exp_precip = [0 for p in range(14)]
    for p in range(14):
        # assume 8am and 12pm cut times
        # get cut time
        if p%2: # afternoon cuts
            Tcut = 12*p
        else:     # morning cuts
            Tcut = 12*p + 8
        
        day = p//2 # day in 7-day horizon
        # get drying rates
        DR = drying_rate_calc(SM,SI,T,TED,yields[day],Tcut)
        # get earliest collection time
        Tcollect = drying_window_calc(M0,DR,PP,Tcut,target_moisture)
        # get drying window (hours)
        dry_window[p] = Tcollect - Tcut
        # get precip in drying window
        exp_precip[p] = expected_precip_calc(Tcut, Tcollect, precip)
    return dry_window, exp_precip

################ Example Run #################
@router.post('/EconomicModel/')
async def EcoModel (request: Request):
    data = await request.json()
    time_zone = data['time_zone']
    latitude = data['latitude']
    longitude = data['longitude']
    initial_moisture = float(data['initial_moisture'])
    target_moisture  = float(data['target_moisture'])
    market = data['market']
    tedding = data['tedding']
    milk_price = float(data['milk_price'])
    YQdata = data['YQ_data']
    
    pixels = len(next(iter(YQdata.values()))['Yield'])
    print ('this is yield data',YQdata)
    print ('this is number of pixels', pixels)
    p_hay = np.array([200, 180, 150]) # hay price ($/ton) for [premium, grade 1, grade 2]

    weather_data = wf.get_weather_data(time_zone, latitude, longitude)
    SM = weather_data["soil_moisture"]
    SI = weather_data["solar_radiation"]
    T = weather_data["temperature"]
    Pcp = weather_data["precip"]
    PoP = weather_data["prob"]

    # optional cut times are 8am and 12pm for each day in 7-day horizon
    cut_times = [8,12, 32,36, 56,60, 80,84, 104,108, 128,132, 162,166]

    DM_yield = [sum(YQdata[str(i)]['Yield'])/pixels for i in np.repeat(range(7), 2)]
    total_yield = [sum(YQdata[str(i)]['Yield']) for i in range(7)]  # Calculate total yield for each gap
    
    if tedding == "yes":
        dry_data, exp_precip = daily_drying_window_calc(initial_moisture,SM,SI,T,DM_yield,Pcp,PoP,target_moisture,TED=True)
    elif tedding == "no":
        dry_data, exp_precip = daily_drying_window_calc(initial_moisture,SM,SI,T,DM_yield,Pcp,PoP,target_moisture,TED=False)
    
    # Run Economic Model:
    field_TDM = field_TDM_calc(YQdata, 900)  # calculate field TDM for each day
    field_RFV = field_RFV_calc(YQdata)       # calculate field RFV for each day

    # calculate field revenues for each day
    if market == 'feed':
        tot_rev = np.repeat(total_milk_value_calc(YQdata,milk_price),2)
        # get net revenue after losses from rain
        net_rev = [tot_rev[i] * 0.94 * (1 - exp_precip[i] * 0.007) for i in range(14)]
    elif market =='sell':
        tot_rev = np.repeat(total_market_value_calc(YQdata, p_hay), 2)
        net_rev = [tot_rev[i] * 0.94 * (1 - exp_precip[i] * 0.007) for i in range(14)]
    
    print ('net revenue is:', net_rev)
    return JSONResponse(content={
        "dryData": dry_data,
        "total_dry_matter": field_TDM,
        "relative_feed_value" : field_RFV,
        "expPrecip": exp_precip, 
        "netRev": net_rev
    })
################################