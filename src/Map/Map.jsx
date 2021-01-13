import React, { useState, useEffect } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Annotation
  } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { csv } from "d3-fetch";
import allStates from "./states.json";
import { geoCentroid } from "d3-geo";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const offsets = {
    VT: [50, -8],
    NH: [34, 2],
    MA: [30, -1],
    RI: [28, 2],
    CT: [35, 10],
    NJ: [34, 1],
    DE: [33, 0],
    MD: [47, 10],
    DC: [49, 21]
  };
  

const colorScale = scaleQuantize()
  .domain([1, 30])
  .range([
    "#ffedea",
    "#ffcec5",
    "#ffad9f",
    "#ff8a75",
    "#ff5533",
    "#e2492d",
    "#be3d26",
    "#9a311f",
    "#782618"
  ]);

const Map = (props) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // https://www.bls.gov/lau/
    csv("/counties.csv").then(counties => {
      setData(counties);
    });
  }, []);

  console.log(props.data);

  function filterLatest(){
    let latest = [];
    props.data.forEach(field => {
        let newData = [];
        field.data.forEach(row => {
            newData.push({...row, data: row.data.slice(row.data.length - 1)});
        });
        latest.push({...field, data: newData});
    });
    return latest;
  }

  function filterField(allData, title){
    let filtered = [];
    allData.forEach(field => {
    let onlyData = field.data.filter(row => row.title === title)[0].data;
    let parsed = [];
        if (onlyData){
            parsed = onlyData.map(val => {
                return {"date" : val[0], "count" : parseInt(val[2])};
            });
        }
        filtered.push({...field, data: parsed});
      });
      return filtered;
  }

  console.log(filterField(filterLatest(), "people_total"));

  return (
    <>
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
        {({ geographies }) => (
          <>
            {geographies.map(geo => {
              //const cur = data.find(s => s.id === geo.id);
              const cur = allStates.find(s => s.val === geo.id);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(cur ? cur.s : "#EEE")}
                />
              );
            })}
            {geographies.map(geo => {
              const centroid = geoCentroid(geo);
              const cur = allStates.find(s => s.val === geo.id);
              return (
                <g key={geo.rsmKey + "-name"}>
                  {cur &&
                    centroid[0] > -160 &&
                    centroid[0] < -67 &&
                    (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                      <Marker coordinates={centroid}>
                        <text y="2" fontSize={14} textAnchor="middle">
                          {cur.id}
                        </text>
                      </Marker>
                    ) : (
                      <Annotation
                        subject={centroid}
                        dx={offsets[cur.id][0]}
                        dy={offsets[cur.id][1]}
                      >
                        <text x={4} fontSize={14} alignmentBaseline="middle">
                          {cur.id}
                        </text>
                      </Annotation>
                    ))}
                </g>
              );
            })}
          </>
        )}
      </Geographies>
      </ComposableMap>
    </>
  );
};

export default Map;
