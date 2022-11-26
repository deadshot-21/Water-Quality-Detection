const ee = require('@google/earthengine');
const express = require('express');
const privateKey = require('../.private-key.json');
const wv = require('../wv_aw_bw.json');
const wv_data = JSON.parse(wv);
// Define endpoint at /mapid.
// const app = express().get('/mapid', (_, response) => {
//   const srtm = ee.Image('CGIAR/SRTM90_V4');
//   const slope = ee.Terrain.slope(srtm);
//   slope.getMap({min: 0, max: 60}, ({mapid}) => response.send(mapid));
// });

const rrs = (R) => {
  return R/(0.52+(1.7*R))
}

const u = (rrs) => {
  let g0=0.089;
  let g1=0.1245;
  return (-g0 + ((Math.pow((Math.pow(g0,2) + 4*g1*rrs),0.5)))) / (2*g1);
}

const bbp = (W, bbp_B0, R443, R550) => {
  let B0 = 550;
  let e=Math.exp(-0.9*rrs(R443)/rrs(R550));
  let g=2.0*(1-1.2*e);
  console.log('w',W);
  return bbp_B0*Math.pow((B0/W),g);
}

const a = (W, Rrs, bbp_B0, R443, R550) => {
  console.log('bb', W, bw(W)+bbp(W, bbp_B0, R443, R550));
  console.log('bw', W, bw(W));
  console.log('a', W, (1-u(rrs(Rrs)))*(bw(W)+bbp(W, bbp_B0, R443, R550))/u(rrs(Rrs)));
  return (1-u(rrs(Rrs)))*(bw(W)+bbp(W, bbp_B0, R443, R550))/u(rrs(Rrs));
}

const aw = (W) => {
  if(W == 443){
    W = 440;
  }
  if(W == 412){
    W = 410;
  }
  if(W == 443){
    W = 440;
  }
  if(W == 645){
    W = 640;
  }
  return wv_data[W]['aw'];
}

const bw = (W) => {
  if(W == 443){
    W = 440;
  }
  if(W == 412){
    W = 410;
  }
  if(W == 443){
    W = 440;
  }
  if(W == 645){
    W = 640;
  }
  return wv_data[W]['bw'];
}



const calculate = (R412,R443,R488,R550,R667) => {
  // console.log(R412,R443,R488,R550,R667)
  let a_550 = 0;;
   if(R667<0.0015){
    let p1 = rrs(R443) + rrs(R488);
    let p2 = rrs(R550) + (5*(rrs(R667)/rrs(R488))*rrs(R667));
    let x = Math.log10(p1/p2);
    let h0 = -1.146;
    let h1 = -1.366;
    let h2 = -0.469;
     a_550 = aw(550)+(Math.pow(10,(h0+(h1*x)+(h2*(Math.pow(x,2))))));
   }
   else{
     a_550=aw(550) + 0.39*Math.pow((R550/(R443+R488)),1.14);
   }
   console.log('a0', '550', a_550);
   let bbp_B0 = u(rrs(R550))*a_550/(1-a_550) - bw(550);
   
  //  let bbp=bbp_B0*Math.pow((B0/W),g);
   let S0 = 0.015;
   let W = 443;
   let R = R443;
   let Zeta=0.74+0.2/(0.8+(rrs(R443)/rrs(R550)));
   
   let S=S0+0.002/(0.6+rrs(R443)/rrs(R550));
   let Xi=Math.exp(S*(443-411));
   let adg443=((a(412,R412, bbp_B0, R443, R550)-Zeta*a(443,R443, bbp_B0, R443, R550))-(aw(412)-Zeta*aw(443)))/(Xi-Zeta);
   let adg=adg443*Math.exp((-S*(W-443)));
   let aph=a(W,R, bbp_B0, R443, R550)-adg-aw(W);
   console.log(Zeta, S, Xi, adg443, adg, aph);
   console.log(aph);
   return aph
}

const runCalculate = async (req, res) => {
  // console.log(req.body);
  const result = await calculate(parseFloat(req.body.b8)*0.0001, parseFloat(req.body.b9)*0.0001, parseFloat(req.body.b10)*0.0001, parseFloat(req.body.b12)*0.0001, parseFloat(req.body.b13)*0.0001);
  res.json({
    status: true,
    message: "Welcome to Tirtham",
    errors: [],
    data: {
        result: result
    },
  })
}

const index = async (req, res) => {
    res.json({
        status: true,
        message: "Welcome to Ecolyf",
        errors: [],
        data: {},
      });
}
var convert = function (o) {
    if (o instanceof ee.ComputedObject) {
      o = o.getInfo();
    }
    return o;
  };

const mapid = async (req, res) => {
    const srtm = ee.ImageCollection("MODIS/006/MCD43A4");
    const slope = ee.Terrain.slope(srtm);
    slope.getMap({min: 0, max: 60}, ({mapid}) => 
    res.json({
        status: true,
        message: "Welcome to Tirtham",
        errors: [],
        data: {
            mapid: mapid
        },
      })
      );
}

const getReflectance = async (req, res) => {

    console.log(req.body.lat);
    console.log(req.body.long);
    function bufferPoints(radius, bounds) {
        return function(pt) {
          pt = ee.Feature(pt);
          return bounds ? pt.buffer(radius).bounds() : pt.buffer(radius);
        };
      }
      
      const zonalStats = async (ic, fc, params) => {
        // Initialize internal params dictionary.
        var _params = {
          reducer: ee.Reducer.mean(),
          scale: null,
          crs: null,
          bands: null,
          bandsRename: null,
          imgProps: null,
          imgPropsRename: null,
          datetimeName: 'datetime',
          datetimeFormat: 'YYYY-MM-dd HH:mm:ss'
        };
      
        // Replace initialized params with provided params.
        if (params) {
          for (var param in params) {
            _params[param] = params[param] || _params[param];
          }
        }
      
        // Set default parameters based on an image representative.
        var imgRep = ic.first();
        // console.log(convert(imgRep));
        var nonSystemImgProps = ee.Feature(null)
          .copyProperties(imgRep).propertyNames();
        if (!_params.bands) _params.bands = imgRep.bandNames();
        if (!_params.bandsRename) _params.bandsRename = _params.bands;
        if (!_params.imgProps) _params.imgProps = nonSystemImgProps;
        if (!_params.imgPropsRename) _params.imgPropsRename = _params.imgProps;
      
        // Map the reduceRegions function over the image collection.
        var results = await ic.map(function(img) {
          // Select bands (optionally rename), set a datetime & timestamp property.
          img = ee.Image(img.select(_params.bands, _params.bandsRename).divide(3.6e6))
            .set(_params.datetimeName, img.date().format(_params.datetimeFormat))
            .set('timestamp', img.get('system:time_start'));
      
          // Define final image property dictionary to set in output features.
          var propsFrom = ee.List(_params.imgProps)
            .cat(ee.List([_params.datetimeName, 'timestamp']));
          var propsTo = ee.List(_params.imgPropsRename)
            .cat(ee.List([_params.datetimeName, 'timestamp']));
          // var imgProps = img.toDictionary(propsFrom).rename(propsFrom, propsTo);
          var imgProps = img.toDictionary(propsFrom);
      
          // Subset points that intersect the given image.
          var fcSub = fc.filterBounds(img.geometry());
      
          // Reduce the image by regions.
          return img.reduceRegions({
            collection: fcSub,
            reducer: _params.reducer,
            scale: _params.scale,
            crs: _params.crs
          })
          // Add metadata to each feature.
          .map(function(f) {
            return f.set(imgProps);
          });
        }).flatten().filter(ee.Filter.notNull(_params.bandsRename));
        
        // console.log(results);
        return results;
      }
      
      var pts = ee.FeatureCollection([
        ee.Feature(ee.Geometry.Point([req.body.lat, req.body.long]), {plot_id: 1}),
        // ee.Feature(ee.Geometry.Point([-118.5896, 37.0778]), {plot_id: 2}),
        // ee.Feature(ee.Geometry.Point([-118.5842, 37.0805]), {plot_id: 3}),
        // ee.Feature(ee.Geometry.Point([-118.5994, 37.0936]), {plot_id: 4}),
        // ee.Feature(ee.Geometry.Point([-118.5861, 37.0567]), {plot_id: 5})
      ]);
      
      function fmask(img) {
        var cloudShadowBitMask = 1 << 3;
        var cloudsBitMask = 1 << 5;
        var qa = img.select('QA_PIXEL');
        var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
          .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
        return img.updateMask(mask);
      }
      
      function renameOli(img) {
        return img.select(
          ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
          ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']);
      }
      
      // Selects and renames bands of interest for TM/ETM+.
      function renameEtm(img) {
        return img.select(
          ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'],
          ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']);
      }
      
      // Prepares (cloud masks and renames) OLI images.
      function prepOli(img) {
        // img = fmask(img);
        // img = renameOli(img);
        return img;
      }
      
      // Prepares (cloud masks and renames) TM/ETM+ images.
      function prepEtm(img) {
        // img = fmask(img);
        // img = renameEtm(img);
        return img;
      }
      
      var ptsLandsat = pts.map(bufferPoints(15, true));
      
      var oliCol = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
        .filterBounds(ptsLandsat);
        // .map(prepOli);
      // console.log(convert(oliCol));
      // var etmCol = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
      //   .filterBounds(ptsLandsat)
      //   .map(prepEtm);
      
      // var tmCol = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
      //   .filterBounds(ptsLandsat)
      //   .map(prepEtm);
        
      // var landsatCol = oliCol.merge(etmCol).merge(tmCol);
      
      var params = {
        reducer: ee.Reducer.mean(),
        scale: 30,
        crs: 'EPSG:5070',
        // bands: ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2'],
        bands: ['SR_B2', 'SR_B3', 'SR_B4'],
        bandsRename: ['ls_blue', 'ls_green', 'ls_red'],
        // imgProps: ['LANDSAT_ID', 'SATELLITE'],
        // imgPropsRename: ['img_id', 'satellite'],
        datetimeName: 'date',
        datetimeFormat: 'YYYY-MM-dd'
      };
      
      // Extract zonal statistics per point per image.
      var ptsLandsatStats = zonalStats(oliCol, ptsLandsat, params).then((result) => {
        console.log(convert(result.limit(1)).features[0].properties);
        res.json({
            status: true,
            message: "Welcome to Tirtham",
            errors: [],
            data: {
                data: convert(result.limit(1))
            },
          });
      });
      
      
    //   Map.centerObject(geometry,20)
    
}

module.exports = {
    index,
    mapid,
    getReflectance,
    runCalculate
  };