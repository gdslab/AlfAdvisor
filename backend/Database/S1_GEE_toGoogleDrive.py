import ee
import os
from geetools import batch
# For first time use, authenticate the GEE account with commend "earthengine authenticate" (https://developers.google.com/earth-engine/guides/command_line)
ee.Initialize()
geometry = ee.Geometry.Rectangle([-89.37, 43.303, -89.313, 43.341]) # field range
polygons = ee.FeatureCollection(geometry)

start_date = ee.Date('2022-05-01')
finish_date = ee.Date('2022-08-31')

collectionS1 = (ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filterDate(start_date, finish_date)
    .filterBounds(polygons))

collectionVV = collectionS1.select('VV')
collectionVH = collectionS1.select('VH')
collectionAngle = collectionS1.select('angle')
# It is better to use the exising folder on Google Drive
folder = 'GEE_EXPORT'

def imageCollectionToDrive(collection,folder,scale,region,variable,field):
    taskList = []
    imageList = collection.toList(collection.size())

    for n in range(0,collection.size().getInfo()):
        image = ee.Image(imageList.get(n))
        name = variable+'_'+field+'_'+image.get("system:index").getInfo()
        task = ee.batch.Export.image.toDrive(image=image,description=name,folder=folder,maxPixels=int(1e13),scale=scale,region=region) # default type: double
        task.start()
        print("exporting {} to folder '{}' in Google Drive".format(name, folder))
        taskList.append(task)

    return taskList

imageCollectionToDrive(collectionVV,folder,10, geometry,'VV', 'WI')
imageCollectionToDrive(collectionVH,folder,10, geometry,'VH', 'WI')
imageCollectionToDrive(collectionAngle,folder,10, geometry,'Angle', 'WI')



