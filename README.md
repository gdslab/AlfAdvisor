
# Alfalfa Harvest Decision Support Tool

This tool predicts the optimal harvest time for alfalfa fields by analyzing yield and quality based on multispectral Harmonized Landsat and Sentinel-2 (HLS) and SAR (Sentinel-1) satellite imagery. An economic model recommends the best harvest time, considering the predicted yield, quality, weather forecast data, and user-defined parameters. This web platform, developed by the GDSL group at Purdue University, efficiently delivers crop information and serves as a reference for informed harvest decisions.

## Full Stack Application

- **Frontend**: React
- **Backend**: FastAPI
- **Database**: SQLite3

## Overview

This project is a full-stack web application designed to facilitate complex data interactions between a frontend built with React, a backend API developed with FastAPI, and a SQLite3 database. The application integrates with external services such as Google Earth Engine (GEE), NASA's Earthdata, and Google Maps to provide advanced visualization and data processing capabilities.

## Features

- **Frontend**: 
  - Developed with React for a responsive, dynamic user interface.
  
- **Backend**: 
  - Built using FastAPI, delivering a robust, high-performance API.
  
- **Database**: 
  - SQLite3, offering lightweight and efficient data storage.
  
- **External Integrations**:
  - **Google Earth Engine (GEE)**: For downloading and processing Sentinel-1 data.
  - **NASA Earthdata**: Accessing Harmonized Landsat and Sentinel-2 (HLS) satellite data.
  - **Google Maps API**: Providing map visualization.

## Installation

### Backend Setup (FastAPI)

1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Run the backend server:
   ```bash
   uvicorn backend.main:app --reload
   ```

### Frontend Setup (React)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```

### Environment Variables (SQLite3)

Configure the following environment variables:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EARTHDATA_API_TOKEN=your_nasa_earthdata_token
GEE_CREDENTIALS=path_to_your_gee_credentials_file
```
